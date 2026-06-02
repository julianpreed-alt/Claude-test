import { sharedStyles, navHTML, footerHTML, supabaseAuthScript } from './serve.js';

// ============================================================
// Page 2: /career-assessment/prepare
//
// Lands here from magic link (first-time users only).
// Goal: prepare the reader to do it well.
// "Begin" CTA consumes the Phase 1 credit and creates the assessment.
// ============================================================

export function preparePage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Before you begin — 8epochs</title>
  <meta name="robots" content="noindex">
  <style>${sharedStyles()}

    /* ============================================================
       Letter-like presentation. Narrow column, serif throughout.
       ============================================================ */

    body {
      background: var(--bg);
    }

    .prep-wrap {
      max-width: 600px;
      margin: 0 auto;
      padding: 64px 32px 96px;
    }

    .prep-opening {
      margin-bottom: 64px;
    }

    .prep-opening .eyebrow {
      color: var(--accent);
      margin-bottom: 24px;
    }

    .prep-opening h1 {
      font-size: clamp(2.25rem, 4vw, 3rem);
      font-weight: 400;
      letter-spacing: -0.025em;
      margin-bottom: 28px;
      line-height: 1.1;
    }

    .prep-opening h1 em {
      font-weight: 300;
      color: var(--accent);
      font-style: italic;
    }

    .prep-opening .lede {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 300;
      line-height: 1.55;
      color: var(--text);
      letter-spacing: -0.005em;
    }

    .prep-section {
      margin-bottom: 56px;
    }

    .prep-section h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      margin-bottom: 20px;
      color: var(--text);
      line-height: 1.25;
    }

    .prep-section p {
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 1.25em;
    }

    .prep-section p strong {
      color: var(--text);
      font-weight: 500;
    }

    /* "Set yourself up well" bullet list */
    .prep-tips {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .prep-tips li {
      padding: 24px 0;
      border-top: 1px solid var(--border-light);
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      line-height: 1.65;
      color: var(--text-secondary);
    }

    .prep-tips li:last-child {
      border-bottom: 1px solid var(--border-light);
    }

    .prep-tips li strong {
      display: block;
      font-family: var(--font-display);
      font-size: 1.0625rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 6px;
      letter-spacing: -0.005em;
    }

    /* The "No pressure" callout — emotional release before final CTA */
    .no-pressure {
      margin: 80px 0 64px;
      padding: 48px 40px;
      background: var(--accent-soft);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .no-pressure h3 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 20px;
      letter-spacing: -0.015em;
    }

    .no-pressure h3 em {
      font-style: italic;
      font-weight: 400;
      color: var(--accent);
    }

    .no-pressure p {
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      line-height: 1.65;
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0 auto;
    }

    /* Final CTA */
    .prep-cta {
      margin-top: 80px;
      text-align: center;
    }

    .prep-cta-signature {
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 300;
      font-size: 1.0625rem;
      color: var(--text-muted);
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .prep-cta .btn {
      font-size: 1.0625rem;
      padding: 18px 40px;
    }

    .prep-cta-note {
      margin-top: 20px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }

    .prep-cta-error {
      margin-top: 20px;
      padding: 12px 16px;
      background: var(--error-bg);
      color: var(--error);
      border-radius: var(--radius);
      font-size: 0.9375rem;
      display: none;
    }

    .prep-cta-error.show { display: block; }

    /* Loading state */
    .prep-loading {
      text-align: center;
      padding: 120px 32px;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .prep-wrap { padding: 48px 24px 80px; }
      .no-pressure { padding: 36px 24px; }
    }

  </style>
</head>
<body>
  ${navHTML({ authenticated: true })}

  <main class="prep-wrap" id="prep-content">
    <div class="prep-loading">
      <div class="spinner"></div>
      <p style="margin-top:16px;">Just a moment…</p>
    </div>
  </main>

  ${footerHTML()}

  ${supabaseAuthScript(env)}
  <script>
    (async function() {
      // Verify the user is authenticated and has a Phase 1 credit available
      const token = await window.ensureValidToken();
      if (!token) return;

      // Check current state: do they have an active assessment? Credits?
      let state = null;
      try {
        const res = await window.apiFetch('/api/dashboard');
        if (res && res.ok) state = await res.json();
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }

      // If they have an active assessment, send them to it directly
      if (state && state.active_assessment) {
        const a = state.active_assessment;
        if (a.status === 'intake') {
          window.location.href = '/career-assessment/intake?id=' + a.id;
          return;
        }
        if (a.status === 'questionnaire') {
          window.location.href = '/career-assessment/questionnaire?id=' + a.id;
          return;
        }
        if (a.status === 'phase1_active' || a.status === 'phase2_active') {
          window.location.href = '/career-assessment/chat?id=' + a.id;
          return;
        }
      }

      // If they have no Phase 1 credit, send them to the dashboard
      const hasPhase1Credit = state && state.credits && state.credits.phase1_available > 0;
      const hasCompletedAssessment = state && state.assessments && state.assessments.length > 0;

      if (!hasPhase1Credit) {
        window.location.href = '/career-assessment/dashboard';
        return;
      }

      // If they've done one before, send them to the dashboard rather than this page
      if (hasCompletedAssessment) {
        window.location.href = '/career-assessment/dashboard';
        return;
      }

      // First-time user with an available credit — render the prep page
      renderPrepPage(state);
    })();

    function renderPrepPage(state) {
      const userName = (state && state.user && state.user.email) ? state.user.email.split('@')[0] : '';

      const html = \`
        <article class="prep-opening">
          <span class="eyebrow">You're in</span>
          <h1>A few <em>quiet</em> minutes,<br>before you begin.</h1>
          <p class="lede">
            The next page begins the assessment itself — but the quality of what you get back depends almost entirely on what happens between now and then. Take ninety seconds to read this. It matters.
          </p>
        </article>

        <section class="prep-section">
          <h2>What it actually asks of you.</h2>
          <p>This is not a quiz you can dispatch in fifteen minutes. The questionnaire takes about three minutes. The conversation that follows can take anywhere from twenty minutes to an hour and a half, depending on how deeply you engage.</p>
          <p>There is no time limit. There is no progress pressure. <strong>The richness of your profile tracks almost exactly with the depth of your answers.</strong></p>
        </section>

        <section class="prep-section">
          <h2>Set yourself up well.</h2>
          <ul class="prep-tips">
            <li>
              <strong>Find a quiet hour.</strong>
              Not because the assessment demands it, but because <em>you</em> will. The best answers come from the parts of your mind that don't surface during a commute or between meetings.
            </li>
            <li>
              <strong>Bring specifics, not summaries.</strong>
              A concrete moment — a project, a decision, a frustration — produces a sharper read than a general self-description. Stories outperform adjectives.
            </li>
            <li>
              <strong>Answer with the second thought.</strong>
              The first thought is usually the one you've rehearsed. The second is usually the truer one.
            </li>
            <li>
              <strong>Push back.</strong>
              If the AI's read of you feels slightly off, say so. Those corrections produce the most accurate parts of your profile.
            </li>
            <li>
              <strong>Pause whenever you need to.</strong>
              Close the tab, walk away, come back tomorrow — nothing is lost. The conversation picks up exactly where you left it. A thoughtful answer given on Wednesday is worth more than a rushed one given tonight.
            </li>
          </ul>
        </section>

        <section class="prep-section">
          <h2>How the conversation works.</h2>
          <p>Behind the conversation is <strong>Claude Opus</strong> — Anthropic's flagship model, at the current frontier of AI reasoning — shaped to think like a warm, perceptive career psychologist. Clinical enough to be accurate. Human enough to make you feel understood rather than analysed.</p>
          <p>The 30-question intake gives it a working hypothesis about how you think. The conversation that follows refines it, challenges it, and — when you bring depth to it — produces a profile most people couldn't articulate about themselves on their own.</p>
        </section>

        <section class="no-pressure">
          <h3><em>No pressure.</em> Really.</h3>
          <p>There's no timer. No progress shame. No "you abandoned your assessment" emails. If you start tonight and finish next weekend, that's fine — that might even be better. Come back to it when your mind is clear and you have something honest to bring.</p>
        </section>

        <div class="prep-cta">
          <p class="prep-cta-signature">
            Take your time.<br>
            The conversation is patient. So are we.
          </p>
          <button class="btn" id="begin-btn">
            <span class="btn-label">Begin the assessment →</span>
          </button>
          <p class="prep-cta-note">
            You'll start with a short intake, then 30 questions, then the conversation. You can pause at any point.
          </p>
          <div class="prep-cta-error" id="begin-error"></div>
        </div>
      \`;

      document.getElementById('prep-content').innerHTML = html;

      // Wire up the Begin button
      const beginBtn = document.getElementById('begin-btn');
      const beginError = document.getElementById('begin-error');
      const btnLabel = beginBtn.querySelector('.btn-label');

      beginBtn.addEventListener('click', async () => {
        beginBtn.disabled = true;
        btnLabel.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:white;"></span>&nbsp;&nbsp;Starting…';
        beginError.classList.remove('show');

        try {
          const res = await window.apiFetch('/api/assessment/create', {
            method: 'POST',
            body: JSON.stringify({})
          });

          if (!res) return; // apiFetch handles redirect on 401

          const data = await res.json();

          if (res.ok && data.assessment) {
            window.location.href = '/career-assessment/intake?id=' + data.assessment.id;
          } else {
            beginError.textContent = data.error || 'We couldn\\'t start your assessment. Please refresh and try again.';
            beginError.classList.add('show');
            beginBtn.disabled = false;
            btnLabel.textContent = 'Begin the assessment →';
          }
        } catch (err) {
          console.error('Begin error:', err);
          beginError.textContent = 'Connection problem. Please try again in a moment.';
          beginError.classList.add('show');
          beginBtn.disabled = false;
          btnLabel.textContent = 'Begin the assessment →';
        }
      });
    }
  </script>
</body>
</html>`;
}
