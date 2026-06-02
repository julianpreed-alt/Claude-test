import { supabaseAdmin } from '../lib/supabase.js';
import { getFullUser } from '../lib/auth.js';

// Current policy versions — update these when you publish new versions
const CURRENT_TERMS_VERSION = '1.0';
const CURRENT_PRIVACY_VERSION = '1.0';

/**
 * POST /api/consent
 * Records user consent for T&Cs, privacy policy, and data processing.
 */
export async function handleRecordConsent(request, env) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const body = await request.json();
  const { terms_version, privacy_version, consents } = body;

  if (!terms_version || !privacy_version || !consents || !Array.isArray(consents)) {
    return Response.json({ error: 'Invalid consent data' }, { status: 400 });
  }

  const sb = supabaseAdmin(env);
  const now = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  const userAgent = request.headers.get('User-Agent') || '';

  // Record each consent type
  for (const consentType of consents) {
    const version = consentType === 'terms' ? terms_version
      : consentType === 'privacy' ? privacy_version
      : privacy_version; // data_processing and special_category use privacy version

    await sb.from('consents').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      consent_type: consentType,
      policy_version: version,
      given_at: now,
      ip_address: ip,
      user_agent: userAgent,
      created_at: now,
    });
  }

  // Update user record with accepted versions
  await sb.from('users').eq('id', user.id).update({
    accepted_terms_version: terms_version,
    accepted_privacy_version: privacy_version,
    consent_given_at: now,
  });

  // Audit log
  await sb.from('audit_log').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: dbUser.email,
    action: 'consent_given',
    details: {
      terms_version,
      privacy_version,
      consent_types: consents,
    },
    ip_address: ip,
    created_at: now,
  });

  return Response.json({ success: true });
}

/**
 * GET /api/consent/status
 * Returns whether the user has valid consent for the current policy versions.
 */
export async function handleConsentStatus(request, env) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const hasValidConsent =
    dbUser.accepted_terms_version === CURRENT_TERMS_VERSION &&
    dbUser.accepted_privacy_version === CURRENT_PRIVACY_VERSION;

  return Response.json({
    has_valid_consent: hasValidConsent,
    accepted_terms_version: dbUser.accepted_terms_version || null,
    accepted_privacy_version: dbUser.accepted_privacy_version || null,
    current_terms_version: CURRENT_TERMS_VERSION,
    current_privacy_version: CURRENT_PRIVACY_VERSION,
    needs_update: !hasValidConsent && (dbUser.accepted_terms_version || dbUser.accepted_privacy_version),
    consent_given_at: dbUser.consent_given_at || null,
  });
}

/**
 * POST /api/account/delete-data
 * Deletes all assessment data but keeps the account.
 */
export async function handleDeleteData(request, env) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const sb = supabaseAdmin(env);
  const now = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Get assessment IDs for this user
  const { data: assessments } = await sb
    .from('assessments')
    .select('id')
    .eq('user_id', user.id);

  const assessmentIds = (assessments || []).map(a => a.id);

  // Delete messages for all assessments
  for (const aId of assessmentIds) {
    await sb.from('messages').eq('assessment_id', aId).delete();
  }

  // Delete assessments
  await sb.from('assessments').eq('user_id', user.id).delete();

  // Audit log (retained after deletion)
  await sb.from('audit_log').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: dbUser.email,
    action: 'data_deleted',
    details: {
      assessments_deleted: assessmentIds.length,
      assessment_ids: assessmentIds,
    },
    ip_address: ip,
    created_at: now,
  });

  return Response.json({ success: true, assessments_deleted: assessmentIds.length });
}

/**
 * POST /api/account/delete
 * Deletes the entire account, all data, and the auth user.
 */
export async function handleDeleteAccount(request, env) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) return Response.json({ error }, { status: 401 });

  const sb = supabaseAdmin(env);
  const now = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // Get assessment IDs
  const { data: assessments } = await sb
    .from('assessments')
    .select('id')
    .eq('user_id', user.id);

  const assessmentIds = (assessments || []).map(a => a.id);

  // Get credit info for audit
  const { data: credits } = await sb
    .from('credits')
    .select('id, phase, status')
    .eq('user_id', user.id);

  const availableCredits = (credits || []).filter(c => c.status === 'available');

  // Delete messages
  for (const aId of assessmentIds) {
    await sb.from('messages').eq('assessment_id', aId).delete();
  }

  // Unlink credits from assessments before deleting assessments
  for (const c of (credits || [])) {
    if (c.status === 'consumed') {
      await sb.from('credits').eq('id', c.id).update({ assessment_id: null });
    }
  }

  // Delete assessments
  await sb.from('assessments').eq('user_id', user.id).delete();

  // Delete credits
  await sb.from('credits').eq('user_id', user.id).delete();

  // Delete rate limits
  await sb.from('rate_limits').eq('identifier', user.id).delete();

  // Note: consents are NOT deleted — retained for 6 years per legal requirement

  // Audit log (retained — includes email for identification since user record will be deleted)
  await sb.from('audit_log').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    user_email: dbUser.email,
    action: 'account_deleted',
    details: {
      assessments_deleted: assessmentIds.length,
      credits_forfeited: availableCredits.length,
      credits_forfeited_detail: availableCredits.map(c => ({ phase: c.phase })),
    },
    ip_address: ip,
    created_at: now,
  });

  // Delete the users table row
  await sb.from('users').eq('id', user.id).delete();

  // Delete the Supabase auth user
  try {
    await sb.deleteAuthUser(user.id);
  } catch (err) {
    console.error('Auth user deletion error:', err);
    // Account data is already deleted — auth user deletion failure is non-critical
  }

  return Response.json({ success: true });
}
