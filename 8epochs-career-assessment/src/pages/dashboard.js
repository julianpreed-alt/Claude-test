import { sharedStyles, navHTML, footerHTML, supabaseAuthScript } from './serve.js';

// ============================================================
// /career-assessment/dashboard
//
// The authenticated user's home. Treated as a quiet "study," not a CRM.
// States:
//   1. Active assessment in progress (intake / questionnaire / phase1_active / phase2_active)
//   2. Completed Phase 1 report(s), maybe Phase 2 too
//   3. No assessments yet but has a Phase 1 credit
//   4. No credits, no assessments
// ============================================================

export function dashboardPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your account — 8epochs</title>
  <meta name="robots" content="noindex">
  <style>${sharedStyles()}

    .dash-wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 64px 32px 96px;
    }

    .dash-greeting {
      margin-bottom: 56px;
    }

    .dash-greeting .eyebrow {
      color: var(--accent);
    }

    .dash-greeting h1 {
      font-size: clamp(2.25rem, 4vw, 2.75rem);
      font-weight: 400;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
      line-height: 1.1;
    }

    .dash-greeting .dash-sub {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 300;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Continue card — active assessment */
    .continue-card {
      background: var(--accent-soft);
      border: 1px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: 36px 40px;
      margin-bottom: 56px;
    }

    .continue-card .eyebrow {
      color: var(--accent);
      margin-bottom: 12px;
    }

    .continue-card h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      margin-bottom: 12px;
      color: var(--text);
    }

    .continue-card p {
      color: var(--text-secondary);
      margin-bottom: 24px;
      font-size: 1rem;
      line-height: 1.6;
    }

    .continue-card .btn {
      background: var(--accent);
    }

    /* Section header */
    .dash-section {
      margin-bottom: 64px;
    }

    .dash-section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .dash-section-header h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      color: var(--text);
      margin: 0;
    }

    .dash-section-header .meta {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Reports list */
    .reports-list {
      border-top: 1px solid var(--border);
    }

    .report-row {
      padding: 24px 0;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      transition: padding-left 0.15s ease;
    }

    .report-row:hover {
      padding-left: 8px;
    }

    .report-info {
      flex: 1;
      min-width: 240px;
    }

    .report-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 4px;
      letter-spacing: -0.01em;
    }

    .report-meta {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .report-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .report-actions a {
      font-size: 0.875rem;
      padding: 8px 14px;
      color: var(--text-secondary);
      border: 1px solid transparent;
      border-radius: var(--radius);
      transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
    }

    .report-actions a:hover {
      color: var(--accent);
      border-color: var(--border);
      background: var(--bg-card);
    }

    /* Start new assessment card */
    .start-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 40px 44px;
      text-align: center;
      margin-bottom: 56px;
    }

    .start-card h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      margin-bottom: 12px;
    }

    .start-card p {
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0 auto 28px;
      line-height: 1.6;
    }

    /* No more credits — quiet, custodial */
    .quiet-card {
      background: var(--bg-tint);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 32px 36px;
      margin-bottom: 56px;
    }

    .quiet-card h3 {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }

    .quiet-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 16px;
      font-size: 0.9375rem;
    }

    .quiet-card p:last-child { margin-bottom: 0; }

    /* Phase 2 invitation */
    .phase2-invite {
      background: var(--accent-soft);
      border: 1px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: 32px 36px;
      margin-bottom: 56px;
    }

    .phase2-invite h3 {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--text);
    }

    .phase2-invite p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
      font-size: 0.9375rem;
    }

    /* Credits panel — quiet, monospace */
    .credits-panel {
      display: flex;
      gap: 32px;
      padding: 20px 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      margin-bottom: 56px;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }

    .credits-panel .credit-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .credits-panel .credit-label {
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .credits-panel .credit-value {
      color: var(--text);
      font-weight: 500;
      font-size: 1rem;
      font-family: var(--font-display);
      letter-spacing: -0.01em;
    }

    /* Loading state */
    .dash-loading {
      text-align: center;
      padding: 120px 32px;
      color: var(--text-muted);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 32px 0;
      color: var(--text-muted);
      font-style: italic;
      font-family: var(--font-display);
      font-weight: 300;
    }

    @media (max-width: 640px) {
      .dash-wrap { padding: 48px 24px 80px; }
      .continue-card, .start-card, .quiet-card, .phase2-invite { padding: 28px 24px; }
      .credits-panel { flex-direction: column; gap: 12px; }
    }

  </style>
</head>
<body>
  ${navHTML({ authenticated: true, current: 'dashboard' })}

  <main class="dash-wrap" id="dash-content">
    <div class="dash-loading">
      <div class="spinner"></div>
      <p style="margin-top:16px;">Loading your account…</p>
    </div>
  </main>

  ${footerHTML()}

  ${supabaseAuthScript(env)}
  <script>
    (async function() {
      const token = await window.ensureValidToken();
      if (!token) return;

      let state = null;
      try {
        const res = await window.apiFetch('/api/dashboard');
        if (res && res.ok) state = await res.json();
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }

      if (!state) {
        document.getElementById('dash-content').innerHTML = \`
          <div class="dash-loading">
            <p>We couldn't load your account. Please refresh the page.</p>
          </div>
        \`;
        return;
      }

      render(state);
    })();

    function render(state) {
      const user = state.user || {};
      const credits = state.credits || { phase1_available: 0, phase2_available: 0 };
      const active = state.active_assessment;
      const assessments = state.assessments || [];

      // Greeting
      const displayName = getDisplayName(user);

      let html = \`
        <section class="dash-greeting">
          <span class="eyebrow">Your account</span>
          <h1>Hello, \${displayName}.</h1>
          <p class="dash-sub">\${greetingMessage(state)}</p>
        </section>
      \`;

      // Active assessment — continue
      if (active) {
        html += renderContinueCard(active);
      }

      // Completed reports
      const completedAssessments = assessments.filter(a => a.status === 'phase1_complete' || a.status === 'phase2_complete');
      if (completedAssessments.length > 0) {
        html += renderReports(completedAssessments);
      }

      // Phase 2 invitation — if eligible
      const lastPhase1Complete = completedAssessments.find(a => a.status === 'phase1_complete');
      if (lastPhase1Complete && credits.phase2_available > 0 && !active) {
        html += renderPhase2Invite(lastPhase1Complete);
      }

      // Start new assessment
      if (!active && credits.phase1_available > 0) {
        html += renderStartCard(completedAssessments.length > 0);
      }

      // No credits, no active assessment
      if (!active && credits.phase1_available === 0 && credits.phase2_available === 0) {
        if (completedAssessments.length > 0) {
          html += renderCustodialCard();
        } else {
          html += renderNoCreditsCard();
        }
      }

      // Credits panel (only show if there are completed assessments — first-timers don't need it)
      if (completedAssessments.length > 0 || active) {
        html += renderCreditsPanel(credits);
      }

      document.getElementById('dash-content').innerHTML = html;

      // Wire up the start-new button
      const startBtn = document.getElementById('start-new-btn');
      if (startBtn) {
        startBtn.addEventListener('click', startNewAssessment);
      }
      const phase2Btn = document.getElementById('start-phase2-btn');
      if (phase2Btn) {
        phase2Btn.addEventListener('click', () => startPhase2(phase2Btn.dataset.assessmentId));
      }
    }

    // ============================================================
    // Sub-renderers
    // ============================================================

    function getDisplayName(user) {
      if (user.name) return escapeHtml(user.name);
      if (user.email) return escapeHtml(user.email.split('@')[0]);
      return 'there';
    }

    function greetingMessage(state) {
      if (state.active_assessment) {
        return 'Your conversation is waiting where you left it.';
      }
      const completed = (state.assessments || []).filter(a => a.status === 'phase1_complete' || a.status === 'phase2_complete');
      if (completed.length > 0) {
        return 'Your reports are below. They remain here for you to revisit anytime.';
      }
      if (state.credits && state.credits.phase1_available > 0) {
        return 'Whenever you\\'re ready, begin below.';
      }
      return 'Welcome.';
    }

    function renderContinueCard(active) {
      const phase = active.status === 'phase2_active' ? 'Career interest conversation' : 'Personality conversation';
      const statusLabel = statusLabelFor(active.status);
      const continueUrl = continueUrlFor(active);

      return \`
        <section class="continue-card">
          <span class="eyebrow">In progress</span>
          <h2>\${phase}</h2>
          <p>\${statusLabel} Your conversation is saved exactly where you left it — pick it up whenever you have a quiet moment.</p>
          <a href="\${continueUrl}" class="btn">Continue →</a>
        </section>
      \`;
    }

    function statusLabelFor(status) {
      switch (status) {
        case 'intake': return 'You\\'re partway through the intake form.';
        case 'questionnaire': return 'You\\'re partway through the questionnaire.';
        case 'phase1_active': return 'You\\'re in the middle of the personality conversation.';
        case 'phase2_active': return 'You\\'re in the middle of the career interest conversation.';
        default: return 'You have an assessment in progress.';
      }
    }

    function continueUrlFor(active) {
      switch (active.status) {
        case 'intake': return '/career-assessment/intake?id=' + active.id;
        case 'questionnaire': return '/career-assessment/questionnaire?id=' + active.id;
        case 'phase1_active':
        case 'phase2_active':
          return '/career-assessment/chat?id=' + active.id;
        default: return '/career-assessment/dashboard';
      }
    }

    function renderReports(assessments) {
      const rows = assessments.map(a => {
        const phase1Url = '/career-assessment/report?id=' + a.id + '&phase=1';
        const phase2Url = '/career-assessment/report?id=' + a.id + '&phase=2';
        const date = a.completed_at ? formatDate(a.completed_at) : formatDate(a.updated_at);
        const hasPhase2 = a.status === 'phase2_complete';

        return \`
          <div class="report-row">
            <div class="report-info">
              <div class="report-title">\${hasPhase2 ? 'Unified Career Profile' : 'Personality Profile'}</div>
              <div class="report-meta">Completed \${date}</div>
            </div>
            <div class="report-actions">
              <a href="\${phase1Url}">Personality report</a>
              \${hasPhase2 ? \`<a href="\${phase2Url}">Career profile</a>\` : ''}
            </div>
          </div>
        \`;
      }).join('');

      return \`
        <section class="dash-section">
          <div class="dash-section-header">
            <h2>Your reports</h2>
            <span class="meta">\${assessments.length} \${assessments.length === 1 ? 'report' : 'reports'}</span>
          </div>
          <div class="reports-list">
            \${rows}
          </div>
        </section>
      \`;
    }

    function renderStartCard(hasPriorAssessments) {
      const heading = hasPriorAssessments ? 'Begin a new assessment.' : 'Begin your assessment.';
      const body = hasPriorAssessments
        ? 'Profiles can shift over time. If something has changed — a new role, a new chapter — running through it again can be worth doing.'
        : 'You have a Phase 1 credit available. Allow yourself an hour of quiet thinking and begin when you\\'re ready.';

      return \`
        <section class="start-card">
          <h2>\${heading}</h2>
          <p>\${body}</p>
          <button class="btn btn-lg" id="start-new-btn">
            <span class="btn-label">\${hasPriorAssessments ? 'Start a new assessment →' : 'Begin →'}</span>
          </button>
        </section>
      \`;
    }

    function renderPhase2Invite(assessment) {
      return \`
        <section class="phase2-invite">
          <span class="eyebrow" style="color:var(--accent);">Next step</span>
          <h3>Ready to go deeper?</h3>
          <p>Your personality profile is the foundation. The career interest conversation takes it further — mapping vocational interests onto your personality and values, and synthesising the three into a unified career profile.</p>
          <button class="btn" id="start-phase2-btn" data-assessment-id="\${assessment.id}">
            <span class="btn-label">Start career interest assessment →</span>
          </button>
        </section>
      \`;
    }

    function renderCustodialCard() {
      return \`
        <section class="quiet-card">
          <h3>Your assessments are complete.</h3>
          <p>Your reports remain here for you to revisit anytime.</p>
          <p>If you'd like to revisit your profile after life shifts — a new role, a new chapter — get in touch. We grant additional assessment credits on request.</p>
          <p><a href="/contact">Contact us →</a></p>
        </section>
      \`;
    }

    function renderNoCreditsCard() {
      return \`
        <section class="quiet-card">
          <h3>You don't have any assessment credits yet.</h3>
          <p>This usually means your access has been provisioned but credits haven't been allocated. We grant credits manually as we onboard each new user.</p>
          <p>If you've been waiting longer than 48 hours, please <a href="/contact">get in touch</a> — we'd like to know.</p>
        </section>
      \`;
    }

    function renderCreditsPanel(credits) {
      return \`
        <section class="credits-panel">
          <div class="credit-item">
            <span class="credit-label">Phase 1 credits</span>
            <span class="credit-value">\${credits.phase1_available}</span>
          </div>
          <div class="credit-item">
            <span class="credit-label">Phase 2 credits</span>
            <span class="credit-value">\${credits.phase2_available}</span>
          </div>
        </section>
      \`;
    }

    // ============================================================
    // Actions
    // ============================================================

    async function startNewAssessment() {
      const btn = document.getElementById('start-new-btn');
      const label = btn.querySelector('.btn-label');
      btn.disabled = true;
      label.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:white;"></span>&nbsp;&nbsp;Starting…';

      try {
        const res = await window.apiFetch('/api/assessment/create', {
          method: 'POST',
          body: JSON.stringify({})
        });
        if (!res) return;

        const data = await res.json();
        if (res.ok && data.assessment) {
          window.location.href = '/career-assessment/intake?id=' + data.assessment.id;
        } else {
          alert(data.error || 'We couldn\\'t start your assessment. Please refresh and try again.');
          btn.disabled = false;
          label.textContent = 'Begin →';
        }
      } catch (err) {
        console.error('Start new error:', err);
        alert('Connection problem. Please try again.');
        btn.disabled = false;
        label.textContent = 'Begin →';
      }
    }

    async function startPhase2(assessmentId) {
      // Navigate to CV upload page; the credit is consumed there after the user
      // chooses whether to upload a CV or skip.
      window.location.href = '/career-assessment/cv-upload?id=' + assessmentId;
    }

    // ============================================================
    // Utilities
    // ============================================================

    function formatDate(iso) {
      try {
        const d = new Date(iso);
        const opts = { year: 'numeric', month: 'long', day: 'numeric' };
        return d.toLocaleDateString('en-GB', opts);
      } catch (e) {
        return '';
      }
    }

    function escapeHtml(s) {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>`;
}
