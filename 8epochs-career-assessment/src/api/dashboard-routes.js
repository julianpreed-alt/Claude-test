import { supabaseAdmin } from '../lib/supabase.js';
import { getFullUser } from '../lib/auth.js';

/**
 * GET /api/dashboard
 * Returns the authenticated user's credit balance, active assessment, and completed assessments.
 * Shape matches what the new dashboard.js and prepare.js expect.
 */
export async function handleDashboard(request, env) {
  const { user, dbUser, error } = await getFullUser(request, env);
  if (error) {
    return Response.json({ error }, { status: 401 });
  }

  const sb = supabaseAdmin(env);

  // Get credits
  const { data: credits, error: creditsErr } = await sb
    .from('credits')
    .select('id, phase, status, granted_at, consumed_at')
    .eq('user_id', user.id);

  if (creditsErr) {
    console.error('Credits fetch error:', creditsErr);
    return Response.json({ error: 'Failed to load credits' }, { status: 500 });
  }

  // Get assessments
  const { data: assessments, error: assessmentsErr } = await sb
    .from('assessments')
    .select('id, status, created_at, updated_at, intake_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (assessmentsErr) {
    console.error('Assessments fetch error:', assessmentsErr);
    return Response.json({ error: 'Failed to load assessments' }, { status: 500 });
  }

  // Compute credit summary
  const phase1Available = credits.filter(c => c.phase === 1 && c.status === 'available').length;
  const phase2Available = credits.filter(c => c.phase === 2 && c.status === 'available').length;

  // Separate active assessment from completed ones
  const activeStatuses = ['intake', 'questionnaire', 'phase1_active', 'phase2_active'];
  const allAssessments = assessments || [];
  const activeAssessment = allAssessments.find(a => activeStatuses.includes(a.status)) || null;
  const completedAssessments = allAssessments.filter(a => !activeStatuses.includes(a.status));

  // Get display name from most recent intake data
  const nameSource = allAssessments.find(a => a.intake_data && a.intake_data.name);
  const displayName = nameSource ? nameSource.intake_data.name : null;

  return Response.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: displayName,
      is_admin: dbUser.is_admin,
    },
    credits: {
      phase1_available: phase1Available,
      phase2_available: phase2Available,
    },
    active_assessment: activeAssessment,
    assessments: completedAssessments,
  });
}
