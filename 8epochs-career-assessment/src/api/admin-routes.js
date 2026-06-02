import { supabaseAdmin } from '../lib/supabase.js';
import { authenticateAdmin } from '../lib/auth.js';

// ---- Helper ----

async function requireAdmin(request, env) {
  const { user, dbUser, error } = await authenticateAdmin(request, env);
  if (error) {
    return { response: Response.json({ error }, { status: 403 }), user: null, dbUser: null };
  }
  return { response: null, user, dbUser };
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * GET /api/admin/users
 * List all allowlisted users with their credit balances.
 */
export async function handleAdminGetUsers(request, env) {
  const { response, user } = await requireAdmin(request, env);
  if (response) return response;

  const sb = supabaseAdmin(env);

  const { data: users, error } = await sb
    .from('users')
    .select('id, email, is_admin, is_allowlisted, allowlisted_at, created_at')
    .eq('is_allowlisted', true)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'Failed to load users' }, { status: 500 });
  }

  // Get credit counts for each user
  const { data: credits } = await sb
    .from('credits')
    .select('user_id, phase, status');

  // Build credit summary per user
  const creditMap = {};
  for (const c of (credits || [])) {
    if (!creditMap[c.user_id]) {
      creditMap[c.user_id] = { phase1_available: 0, phase1_consumed: 0, phase2_available: 0, phase2_consumed: 0 };
    }
    const key = `phase${c.phase}_${c.status === 'available' ? 'available' : c.status === 'consumed' ? 'consumed' : 'other'}`;
    if (creditMap[c.user_id][key] !== undefined) {
      creditMap[c.user_id][key]++;
    }
  }

  // Get assessment counts per user
  const { data: assessments } = await sb
    .from('assessments')
    .select('user_id, status');

  const assessmentMap = {};
  for (const a of (assessments || [])) {
    if (!assessmentMap[a.user_id]) assessmentMap[a.user_id] = 0;
    assessmentMap[a.user_id]++;
  }

  const enrichedUsers = users.map(u => ({
    ...u,
    credits: creditMap[u.id] || { phase1_available: 0, phase1_consumed: 0, phase2_available: 0, phase2_consumed: 0 },
    assessment_count: assessmentMap[u.id] || 0,
  }));

  return Response.json({ users: enrichedUsers });
}

/**
 * POST /api/admin/users
 * Body: { emails: ["email1@example.com", "email2@example.com"] }
 * Adds emails to the allowlist. Creates auth users if they don't exist.
 */
export async function handleAdminAddUsers(request, env) {
  const { response, dbUser } = await requireAdmin(request, env);
  if (response) return response;

  const body = await request.json();
  let { emails } = body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    // Support single email too
    if (body.email) {
      emails = [body.email];
    } else {
      return Response.json({ error: 'emails array is required' }, { status: 400 });
    }
  }

  const sb = supabaseAdmin(env);
  const results = [];

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      results.push({ email: rawEmail, status: 'skipped', reason: 'Invalid email' });
      continue;
    }

    try {
      // Check if user already exists in public.users
      const { data: existing } = await sb
        .from('users')
        .select('id, is_allowlisted')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        if (existing.is_allowlisted) {
          results.push({ email, status: 'skipped', reason: 'Already allowlisted' });
          continue;
        }
        // User exists but isn't allowlisted — update them
        await sb.from('users').eq('id', existing.id).update({
          is_allowlisted: true,
          allowlisted_by: dbUser.id,
          allowlisted_at: new Date().toISOString(),
        });

        results.push({ email, status: 'allowlisted', reason: 'Existing user allowlisted' });
        continue;
      }

      // User doesn't exist — create them in Supabase Auth
      // This creates an auth.users row, which triggers our handle_new_user function
      // to create the public.users row
      const createRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          // Generate a random password — they'll use magic links, not passwords
          password: crypto.randomUUID() + crypto.randomUUID(),
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        results.push({ email, status: 'error', reason: err.msg || err.message || 'Failed to create user' });
        continue;
      }

      const newAuthUser = await createRes.json();

      // Now allowlist them in public.users
      // Small delay to let the trigger fire
      await new Promise(r => setTimeout(r, 500));

      await sb.from('users').eq('id', newAuthUser.id).update({
        is_allowlisted: true,
        allowlisted_by: dbUser.id,
        allowlisted_at: new Date().toISOString(),
      });

      results.push({ email, status: 'created', reason: 'User created and allowlisted' });

    } catch (err) {
      console.error(`Error adding user ${email}:`, err);
      results.push({ email, status: 'error', reason: 'Unexpected error' });
    }
  }

  return Response.json({ results });
}

/**
 * DELETE /api/admin/users/:id
 * Removes a user from the allowlist (doesn't delete the account).
 */
export async function handleAdminDeleteUser(request, env, userId) {
  const { response } = await requireAdmin(request, env);
  if (response) return response;

  const sb = supabaseAdmin(env);

  const { data, error } = await sb
    .from('users')
    .eq('id', userId)
    .update({ is_allowlisted: false });

  if (error) {
    return Response.json({ error: 'Failed to remove user' }, { status: 500 });
  }

  return Response.json({ success: true });
}

// ============================================================
// CREDIT MANAGEMENT
// ============================================================

/**
 * POST /api/admin/credits
 * Body: { user_id, phase, count }
 * Grants credits to a user.
 */
export async function handleAdminGrantCredits(request, env) {
  const { response, dbUser } = await requireAdmin(request, env);
  if (response) return response;

  const body = await request.json();
  const { user_id, phase, count = 1 } = body;

  if (!user_id || !phase || ![1, 2].includes(phase)) {
    return Response.json({ error: 'user_id and phase (1 or 2) are required' }, { status: 400 });
  }

  if (count < 1 || count > 10) {
    return Response.json({ error: 'count must be between 1 and 10' }, { status: 400 });
  }

  const sb = supabaseAdmin(env);

  // Verify the target user exists
  const { data: targetUser } = await sb
    .from('users')
    .select('id')
    .eq('id', user_id)
    .maybeSingle();

  if (!targetUser) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Create the credits
  const credits = Array.from({ length: count }, () => ({
    user_id,
    phase,
    status: 'available',
    granted_by: dbUser.id,
    granted_at: new Date().toISOString(),
  }));

  const { data, error } = await sb.from('credits').insert(credits);

  if (error) {
    console.error('Grant credits error:', error);
    return Response.json({ error: 'Failed to grant credits' }, { status: 500 });
  }

  return Response.json({ success: true, count, phase });
}

/**
 * DELETE /api/admin/credits/:id
 * Revokes an unused credit.
 */
export async function handleAdminRevokeCredit(request, env, creditId) {
  const { response } = await requireAdmin(request, env);
  if (response) return response;

  const sb = supabaseAdmin(env);

  // Only revoke available credits
  const { data, error } = await sb
    .from('credits')
    .eq('id', creditId)
    .eq('status', 'available')
    .update({ status: 'revoked' });

  if (error) {
    return Response.json({ error: 'Failed to revoke credit' }, { status: 500 });
  }

  return Response.json({ success: true });
}

// ============================================================
// ASSESSMENTS & STATS
// ============================================================

/**
 * GET /api/admin/assessments
 * List all assessments with status and user info.
 */
export async function handleAdminGetAssessments(request, env) {
  const { response } = await requireAdmin(request, env);
  if (response) return response;

  const sb = supabaseAdmin(env);

  const { data: assessments, error } = await sb
    .from('assessments')
    .select('id, user_id, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'Failed to load assessments' }, { status: 500 });
  }

  // Get user emails for display
  const userIds = [...new Set(assessments.map(a => a.user_id))];
  const { data: users } = await sb
    .from('users')
    .select('id, email');

  const emailMap = {};
  for (const u of (users || [])) {
    emailMap[u.id] = u.email;
  }

  // Get message counts per assessment
  const { data: messages } = await sb
    .from('messages')
    .select('assessment_id');

  const msgCountMap = {};
  for (const m of (messages || [])) {
    msgCountMap[m.assessment_id] = (msgCountMap[m.assessment_id] || 0) + 1;
  }

  const enriched = assessments.map(a => ({
    ...a,
    email: emailMap[a.user_id] || 'unknown',
    message_count: msgCountMap[a.id] || 0,
  }));

  return Response.json({ assessments: enriched });
}

/**
 * GET /api/admin/stats
 * Dashboard overview statistics.
 */
export async function handleAdminGetStats(request, env) {
  const { response } = await requireAdmin(request, env);
  if (response) return response;

  const sb = supabaseAdmin(env);

  // Users
  const { data: users } = await sb
    .from('users')
    .select('id, is_allowlisted');
  const totalUsers = (users || []).filter(u => u.is_allowlisted).length;

  // Credits
  const { data: credits } = await sb
    .from('credits')
    .select('phase, status');

  const creditStats = {
    total_granted: (credits || []).length,
    total_available: (credits || []).filter(c => c.status === 'available').length,
    total_consumed: (credits || []).filter(c => c.status === 'consumed').length,
    phase1_consumed: (credits || []).filter(c => c.phase === 1 && c.status === 'consumed').length,
    phase2_consumed: (credits || []).filter(c => c.phase === 2 && c.status === 'consumed').length,
  };

  // Assessments
  const { data: assessments } = await sb
    .from('assessments')
    .select('status');

  const assessmentStats = {
    total: (assessments || []).length,
    in_progress: (assessments || []).filter(a =>
      ['intake', 'questionnaire', 'phase1_active', 'phase2_active'].includes(a.status)
    ).length,
    phase1_complete: (assessments || []).filter(a => a.status === 'phase1_complete').length,
    phase2_complete: (assessments || []).filter(a => a.status === 'phase2_complete').length,
  };

  // Estimated cost (per spec: ~$2.21 per full assessment)
  const estimatedCost = (creditStats.phase1_consumed * 1.25) + (creditStats.phase2_consumed * 0.96);

  return Response.json({
    users: { total_allowlisted: totalUsers },
    credits: creditStats,
    assessments: assessmentStats,
    estimated_api_cost: `$${estimatedCost.toFixed(2)}`,
  });
}
