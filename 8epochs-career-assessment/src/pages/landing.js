import { sharedStyles, navHTML, footerHTML, supabaseAuthScript } from './serve.js';

// ============================================================
// Page 1: /career-assessment — the punchy landing
//
// Goal: make the reader want this.
// Email capture happens via the access form near the bottom.
// On submit -> POST /api/auth/check-email -> magic link sent.
// Magic link lands on /career-assessment/prepare.
// ============================================================

export function landingPage(env) {
  const turnstileSiteKey = env?.TURNSTILE_SITE_KEY || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>8epochs — A career assessment for the AI decade</title>
  <meta name="description" content="The career assessment built for the decade after AI. Map the specific intersection of who you are, what drives you, and what genuinely interests you — and where your human edge becomes more valuable, not less.">
  <meta property="og:title" content="8epochs — A career assessment for the AI decade">
  <meta property="og:description" content="Most personality tests tell you what you're like. 8epochs tells you where you win.">
  <meta property="og:type" content="website">
  <style>${sharedStyles()}

    /* ============================================================
       Hero
       ============================================================ */
    .hero {
      padding: 96px 0 120px;
      position: relative;
    }

    .hero-eyebrow {
      display: inline-block;
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      padding: 6px 14px;
      border: 1px solid var(--accent);
      border-radius: 100px;
      margin-bottom: 32px;
    }

    .hero h1 {
      max-width: 900px;
      margin-bottom: 32px;
    }

    .hero h1 .accent-word {
      font-style: italic;
      font-weight: 300;
      color: var(--accent);
    }

    .hero-lede {
      max-width: 680px;
      font-family: var(--font-display);
      font-size: clamp(1.25rem, 2vw, 1.5rem);
      font-weight: 300;
      line-height: 1.5;
      color: var(--text);
      letter-spacing: -0.01em;
      margin-bottom: 48px;
    }

    .hero-cta {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .hero-cta-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* ============================================================
       Trust band — between hero and content
       ============================================================ */
    .trust-band {
      background: var(--bg-tint);
      border-top: 1px solid var(--border-light);
      border-bottom: 1px solid var(--border-light);
      padding: 32px 0;
    }

    .trust-band-inner {
      max-width: var(--content-wide);
      margin: 0 auto;
      padding: 0 32px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px 48px;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .trust-item {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-style: italic;
      font-family: var(--font-display);
      font-weight: 300;
    }

    .trust-item strong {
      font-style: normal;
      font-weight: 500;
      color: var(--text);
    }

    /* ============================================================
       Standard prose section
       ============================================================ */
    .prose-section h2 {
      max-width: 680px;
      margin-bottom: 32px;
    }

    .prose-section h2 .accent-word {
      font-style: italic;
      font-weight: 300;
      color: var(--accent);
    }

    .prose-section .prose {
      max-width: 600px;
      font-size: 1.0625rem;
      line-height: 1.7;
    }

    .prose-section .prose p {
      margin-bottom: 1.5em;
    }

    .prose-section .prose-pull {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 300;
      line-height: 1.5;
      color: var(--text);
      margin: 32px 0;
      padding-left: 24px;
      border-left: 2px solid var(--accent);
    }

    /* ============================================================
       Three-column lenses
       ============================================================ */
    .lenses {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 48px;
      margin-top: 64px;
    }

    .lens-item {
      position: relative;
    }

    .lens-number {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 16px;
      display: block;
    }

    .lens-title {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      margin-bottom: 12px;
      color: var(--text);
    }

    .lens-body {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .lenses {
        grid-template-columns: 1fr;
        gap: 36px;
        margin-top: 48px;
      }
    }

    /* ============================================================
       Sweet spot callout
       ============================================================ */
    .sweet-spot {
      margin-top: 96px;
      padding: 56px 48px;
      background: var(--accent-soft);
      border-radius: var(--radius-lg);
      max-width: 720px;
    }

    .sweet-spot h3 {
      font-size: 1.875rem;
      font-weight: 400;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
      line-height: 1.2;
    }

    .sweet-spot h3 em {
      font-weight: 500;
      color: var(--accent);
    }

    .sweet-spot p {
      font-size: 1.0625rem;
      line-height: 1.7;
      margin-bottom: 0;
    }

    @media (max-width: 768px) {
      .sweet-spot { padding: 36px 28px; margin-top: 64px; }
    }

    /* ============================================================
       AI edge — screenshot moment
       ============================================================ */
    .ai-edge {
      text-align: center;
      max-width: 720px;
      margin: 0 auto;
    }

    .ai-edge h2 {
      margin: 0 auto 32px;
      text-align: center;
    }

    .ai-edge .prose {
      font-size: 1.125rem;
      line-height: 1.7;
      margin: 0 auto;
    }

    .ai-edge .footnote {
      margin-top: 40px;
      font-style: italic;
      font-family: var(--font-display);
      font-weight: 300;
      color: var(--accent);
      font-size: 1rem;
    }

    /* ============================================================
       The method — two column with specs
       ============================================================ */
    .method-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 80px;
      align-items: start;
    }

    .method-prose .prose {
      max-width: none;
    }

    .specs {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      line-height: 1.9;
    }

    .specs-row {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-light);
    }

    .specs-row:last-child { border-bottom: none; }

    .specs-label {
      color: var(--text-muted);
      font-size: 0.7rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding-top: 2px;
    }

    .specs-value {
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .specs-value .multi {
      display: block;
    }

    @media (max-width: 900px) {
      .method-grid {
        grid-template-columns: 1fr;
        gap: 48px;
      }
    }

    /* ============================================================
       Fit — for / not for
       ============================================================ */
    .fit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      margin-top: 56px;
    }

    .fit-col h4 {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 24px;
      color: var(--text);
    }

    .fit-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .fit-col li {
      padding: 14px 0;
      border-top: 1px solid var(--border-light);
      color: var(--text-secondary);
      line-height: 1.55;
      font-size: 1rem;
    }

    .fit-col li:last-child {
      border-bottom: 1px solid var(--border-light);
    }

    .fit-col li strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.95rem;
    }

    .fit-col-yes h4::before {
      content: '— ';
      color: var(--accent);
    }

    .fit-col-no h4::before {
      content: '— ';
      color: var(--text-light);
    }

    .fit-col-no h4 {
      color: var(--text-secondary);
    }

    .fit-col-no li {
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .fit-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }
    }

    /* ============================================================
       Process steps
       ============================================================ */
    .steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      margin-top: 56px;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .step {
      padding: 32px 24px;
      border-right: 1px solid var(--border-light);
    }

    .step:last-child { border-right: none; }

    .step-number {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 16px;
      display: block;
    }

    .step-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text);
      line-height: 1.3;
    }

    .step-time {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      font-style: italic;
    }

    .step-body {
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }

    .steps-note {
      margin-top: 32px;
      font-size: 0.95rem;
      color: var(--text-muted);
      font-style: italic;
      font-family: var(--font-display);
      font-weight: 300;
      text-align: center;
    }

    @media (max-width: 900px) {
      .steps {
        grid-template-columns: 1fr 1fr;
      }
      .step:nth-child(2) { border-right: none; }
      .step:nth-child(1), .step:nth-child(2) {
        border-bottom: 1px solid var(--border-light);
      }
    }

    @media (max-width: 560px) {
      .steps {
        grid-template-columns: 1fr;
      }
      .step {
        border-right: none;
        border-bottom: 1px solid var(--border-light);
      }
      .step:last-child { border-bottom: none; }
    }

    /* ============================================================
       Privacy section
       ============================================================ */
    .privacy-list {
      list-style: none;
      padding: 0;
      margin: 40px 0 0;
    }

    .privacy-list li {
      padding: 18px 0;
      border-top: 1px solid var(--border-light);
      color: var(--text);
      line-height: 1.6;
      font-size: 1.0625rem;
    }

    .privacy-list li:last-child {
      border-bottom: 1px solid var(--border-light);
    }

    .privacy-list li::before {
      content: '— ';
      color: var(--accent);
      margin-right: 4px;
    }

    /* ============================================================
       Access (final CTA + form)
       ============================================================ */
    .access {
      padding: 128px 0;
      text-align: center;
      background: var(--bg-tint);
    }

    .access h2 {
      max-width: 720px;
      margin: 0 auto 16px;
    }

    .access h2 .accent-word {
      font-style: italic;
      font-weight: 300;
      color: var(--accent);
    }

    .access-sub {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 300;
      color: var(--text-secondary);
      max-width: 540px;
      margin: 0 auto 48px;
      line-height: 1.5;
    }

    .access-form {
      max-width: 460px;
      margin: 0 auto;
      text-align: left;
    }

    .access-form .field {
      margin-bottom: 16px;
    }

    .access-form .btn {
      width: 100%;
      justify-content: center;
      padding: 16px 28px;
    }

    .access-form-note {
      margin-top: 16px;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .access-status {
      margin-top: 24px;
      padding: 16px 20px;
      border-radius: var(--radius);
      font-size: 0.9375rem;
      text-align: center;
      display: none;
    }

    .access-status.show { display: block; }

    .access-status.success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid var(--accent);
    }

    .access-status.error {
      background: var(--error-bg);
      color: var(--error);
      border: 1px solid var(--error);
    }

    .turnstile-wrap {
      display: flex;
      justify-content: center;
      margin: 16px 0;
      min-height: 65px;
    }

    @media (max-width: 768px) {
      .access { padding: 80px 0; }
    }

  </style>
  ${turnstileSiteKey ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ''}
</head>
<body>
  ${navHTML({ current: 'landing' })}

  <!-- ============================================================
       HERO
       ============================================================ -->
  <section class="hero">
    <div class="container">
      <span class="hero-eyebrow">Private beta — invitation required</span>
      <h1>The career assessment built<br>for the decade <span class="accent-word">after</span> AI.</h1>
      <p class="hero-lede">
        Most personality tests tell you what you're like. 8epochs tells you where you win — the specific intersection of who you are, what drives you, and what genuinely interests you, mapped against a world where the generic strengths are about to be commoditised.
      </p>
      <div class="hero-cta" id="hero-cta">
        <a href="#access" class="btn btn-lg" id="hero-cta-button">Request access →</a>
        <span class="hero-cta-note">Currently open to a limited group. ~5 minute application.</span>
      </div>
    </div>
  </section>

  <!-- ============================================================
       TRUST BAND
       ============================================================ -->
  <div class="trust-band">
    <div class="trust-band-inner">
      <span class="trust-item">Built on <strong>Claude Opus</strong> — Anthropic's flagship model</span>
      <span class="trust-item">Grounded in the <strong>Big Five, MBTI, and Holland Code</strong> frameworks</span>
      <span class="trust-item">Your data is <strong>yours</strong> — never used for training</span>
    </div>
  </div>

  <!-- ============================================================
       SECTION 1 — THE INSIGHT
       ============================================================ -->
  <section class="section section-lg prose-section">
    <div class="container-prose">
      <span class="eyebrow">The problem</span>
      <h2>Generic strengths are about to be worth <span class="accent-word">very little</span>.</h2>
      <div class="prose">
        <p>"Analytical." "Empathetic." "Strategic." "Creative."</p>
        <p>Every assessment you've taken hands you the same vocabulary. It was vague in 2015. In an economy where Claude does analysis for $20 a month and Midjourney does creative work in twelve seconds, it's becoming dangerous.</p>
        <p>The old advice — <em>play to your strengths</em> — quietly broke around 2024. What still works is sharper: not your strengths in the abstract, but the <strong>specific configuration of traits, values, and interests only you carry</strong>. The work AI amplifies <em>because</em> you do it, not despite you doing it.</p>
        <div class="prose-pull">
          That configuration is what we map.
        </div>
      </div>
    </div>
  </section>

  <hr class="section-divider">

  <!-- ============================================================
       SECTION 2 — THE METHOD (three lenses)
       ============================================================ -->
  <section class="section section-lg">
    <div class="container">
      <div style="max-width:680px;">
        <span class="eyebrow">The approach</span>
        <h2>Three lenses. <span class="accent-word">One sweet spot.</span></h2>
      </div>

      <div class="lenses">
        <div class="lens-item">
          <span class="lens-number">01</span>
          <div class="lens-title">Who you are</div>
          <p class="lens-body">Big Five and MBTI with full cognitive function stack. A precise read on how you actually think, decide, and operate under pressure.</p>
        </div>
        <div class="lens-item">
          <span class="lens-number">02</span>
          <div class="lens-title">What drives you</div>
          <p class="lens-body">Eight work values mapped to relative priority. The reason you'd take one role over another even when the second pays more.</p>
        </div>
        <div class="lens-item">
          <span class="lens-number">03</span>
          <div class="lens-title">What genuinely interests you</div>
          <p class="lens-body">Holland Code (RIASEC) vocational profile. The kinds of problems and environments that light you up — and the ones that quietly drain you.</p>
        </div>
      </div>

      <div class="sweet-spot">
        <h3>Where all three converge: <em>your career sweet spot.</em></h3>
        <p>The intersection is small. It's also where your best work lives. We map it specifically enough to act on — three to five concrete role types where personality, values, and interests align, plus the directions to approach with caution because one of the three works against the other two.</p>
        <p style="margin-top:16px;">Optionally, you can share an <strong>anonymised version of your CV</strong> before the second conversation. Personal contact details are stripped automatically — only the substance of your career, your roles, industries, and qualifications, is used. With it, recommendations become specific to your actual position and the realistic next moves available from where you stand. Without it, the assessment still works — the recommendations are simply more general.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       SECTION 3 — THE AI EDGE (screenshot moment)
       ============================================================ -->
  <section class="section section-lg section-accent">
    <div class="container">
      <div class="ai-edge">
        <span class="eyebrow" style="color:var(--accent);">The output</span>
        <h2>And one paragraph<br>worth the rest combined.</h2>
        <div class="prose">
          <p>Every profile closes with an <strong>AI-era positioning statement</strong>: where your specific combination becomes <em>more</em> valuable as AI absorbs the routine, not less.</p>
          <p>No platitudes about "human creativity." A specific professional North Star, written for you, that you can use to orient real career decisions for the next five to ten years.</p>
        </div>
        <div class="footnote">It's the part most people screenshot.</div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       SECTION 4 — THE METHOD (with specs)
       ============================================================ -->
  <section class="section section-lg" id="about">
    <div class="container">
      <div style="max-width:720px; margin-bottom:48px;">
        <span class="eyebrow">The method</span>
        <h2>Not a chatbot. <span class="accent-word">Not a quiz engine.</span></h2>
      </div>

      <div class="method-grid">
        <div class="method-prose">
          <div class="prose">
            <p>Your conversation is with Claude Opus — Anthropic's flagship model, at the current frontier of AI reasoning — shaped by a careful system prompt to think like a warm, perceptive career psychologist.</p>
            <p>Clinical enough to be accurate. Human enough to make you feel understood rather than analysed. The methodological depth of three validated psychological frameworks sits behind every question. The warmth to follow your actual thinking — rather than march you through a script — sits in front of it.</p>
            <p>That combination is rare. It's what makes the difference between an assessment you forget by Friday and one you reference for years.</p>
          </div>
        </div>

        <div class="specs">
          <div class="specs-row">
            <span class="specs-label">Model</span>
            <span class="specs-value">Claude Opus 4.7</span>
          </div>
          <div class="specs-row">
            <span class="specs-label">Frameworks</span>
            <span class="specs-value">
              <span class="multi">Big Five (OCEAN)</span>
              <span class="multi">Myers-Briggs (MBTI)</span>
              <span class="multi">Holland Code (RIASEC)</span>
            </span>
          </div>
          <div class="specs-row">
            <span class="specs-label">Items</span>
            <span class="specs-value">
              <span class="multi">30 validated items</span>
              <span class="multi">+ open conversation</span>
              <span class="multi">+ optional anonymised CV</span>
            </span>
          </div>
          <div class="specs-row">
            <span class="specs-label">Privacy</span>
            <span class="specs-value">
              <span class="multi">Your data is yours</span>
              <span class="multi">Never used for training</span>
            </span>
          </div>
          <div class="specs-row">
            <span class="specs-label">Output</span>
            <span class="specs-value">
              <span class="multi">Personality report (PDF)</span>
              <span class="multi">Career profile (PDF)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <hr class="section-divider">

  <!-- ============================================================
       SECTION 5 — FIT
       ============================================================ -->
  <section class="section section-lg">
    <div class="container">
      <div style="max-width:720px;">
        <span class="eyebrow">Fit</span>
        <h2>Built for people who'll <span class="accent-word">do the thinking</span>.</h2>
        <p class="lede" style="margin-top:32px; max-width:640px;">
          8epochs rewards depth, candor, and patience. If you want a fast label, you'll find better tools elsewhere — and we mean that without judgement. Speed is the right tool for some questions; this isn't one of them.
        </p>
      </div>

      <div class="fit-grid">
        <div class="fit-col fit-col-yes">
          <h4>This is for you if</h4>
          <ul>
            <li>
              <strong>Mid-career and reassessing</strong>
              What worked for the last decade may not work for the next.
            </li>
            <li>
              <strong>Changing direction</strong>
              You want a defensible thesis for where to land, not a vibes-based pivot.
            </li>
            <li>
              <strong>Senior and choosing your next bet</strong>
              Narrowing from many options to the one that compounds.
            </li>
            <li>
              <strong>Early-career with real optionality</strong>
              You have more choices than your peers and want to spend them well.
            </li>
          </ul>
        </div>
        <div class="fit-col fit-col-no">
          <h4>This isn't for you if</h4>
          <ul>
            <li>You want a quick label to share on LinkedIn.</li>
            <li>You're hoping for validation rather than insight.</li>
            <li>You don't have an hour you can give to your own thinking.</li>
            <li>You want a tool to manage, not a mirror to look into.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       SECTION 6 — PROCESS
       ============================================================ -->
  <section class="section section-lg section-tint">
    <div class="container">
      <div style="max-width:720px;">
        <span class="eyebrow">The process</span>
        <h2>What the next hour <span class="accent-word">looks like</span>.</h2>
      </div>

      <div class="steps">
        <div class="step">
          <span class="step-number">01</span>
          <div class="step-title">Apply for access</div>
          <div class="step-time">~5 minutes</div>
          <p class="step-body">Enter your email. If you're approved, we'll send you a sign-in link.</p>
        </div>
        <div class="step">
          <span class="step-number">02</span>
          <div class="step-title">Set the table</div>
          <div class="step-time">~3 minutes</div>
          <p class="step-body">A short intake — name, role, and what brought you here.</p>
        </div>
        <div class="step">
          <span class="step-number">03</span>
          <div class="step-title">Answer 30 questions</div>
          <div class="step-time">~3 minutes</div>
          <p class="step-body">Validated items, drawn from established psychometric research. Quick, but not shallow.</p>
        </div>
        <div class="step">
          <span class="step-number">04</span>
          <div class="step-title">Have the conversation</div>
          <div class="step-time">20–90 minutes</div>
          <p class="step-body">The part that matters. Take as long as it deserves. Pause and return anytime — nothing is lost.</p>
        </div>
      </div>

      <p class="steps-note">Total: roughly an hour of genuine thinking, across one sitting or several. There is no time limit and no progress pressure.</p>
    </div>
  </section>

  <!-- ============================================================
       SECTION 7 — PRIVACY
       ============================================================ -->
  <section class="section section-lg prose-section">
    <div class="container-prose">
      <span class="eyebrow">Privacy</span>
      <h2>What we do — <span class="accent-word">and don't do</span> — with your data.</h2>
      <ul class="privacy-list">
        <li>Your conversation is yours. We store it so you can return to it. You can delete it at any time.</li>
        <li>We never use your conversation to train AI models. Anthropic's API terms prohibit it; we'd refuse it anyway.</li>
        <li>We don't sell data. We don't share data. There is no advertising on this site, ever.</li>
        <li>We're not interested in your data. We're interested in giving you a good profile and then getting out of your way.</li>
      </ul>
    </div>
  </section>

  <!-- ============================================================
       ACCESS — final CTA with email capture
       ============================================================ -->
  <section class="access" id="access">
    <div class="container">
      <h2>Find the work <span class="accent-word">only you</span> can do.</h2>
      <p class="access-sub">Invite-only. Enter your email to check access. We respond within 48 hours.</p>

      <form class="access-form" id="access-form" autocomplete="on">
        <div class="field">
          <label for="email" class="sr-only">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            autocomplete="email"
            autocapitalize="off"
            spellcheck="false">
        </div>

        ${turnstileSiteKey ? `
        <div class="turnstile-wrap">
          <div class="cf-turnstile"
               data-sitekey="${turnstileSiteKey}"
               data-callback="onTurnstileSuccess"
               data-theme="light"></div>
        </div>
        ` : ''}

        <button type="submit" class="btn btn-lg" id="access-submit">
          <span class="btn-label">Request access →</span>
        </button>

        <div class="access-form-note">
          We'll never share your email. No marketing, no newsletters.
        </div>

        <div class="access-status" id="access-status"></div>
      </form>
    </div>
  </section>

  ${footerHTML()}

  <script>
    // ============================================================
    // Reveal-on-scroll animation
    // ============================================================
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      document.querySelectorAll('h2, .lens-item, .sweet-spot, .step, .privacy-list li').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }

    // ============================================================
    // Access form — email check + magic link
    // ============================================================
    let turnstileToken = ${turnstileSiteKey ? 'null' : '"no-turnstile"'};

    window.onTurnstileSuccess = function(token) {
      turnstileToken = token;
    };

    const form = document.getElementById('access-form');
    const submitBtn = document.getElementById('access-submit');
    const statusEl = document.getElementById('access-status');
    const btnLabel = submitBtn.querySelector('.btn-label');

    function showStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = 'access-status show ' + type;
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      btnLabel.innerHTML = loading
        ? '<span class="spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:white;"></span>&nbsp;&nbsp;Checking…'
        : 'Request access →';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim().toLowerCase();

      if (!email || !email.includes('@')) {
        showStatus('Please enter a valid email address.', 'error');
        return;
      }

      ${turnstileSiteKey ? `
      if (!turnstileToken) {
        showStatus('Please complete the verification challenge.', 'error');
        return;
      }
      ` : ''}

      setLoading(true);
      statusEl.classList.remove('show');

      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, turnstile_token: turnstileToken })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showStatus(
            data.allowlisted
              ? 'Check your email. We\\'ve sent you a sign-in link — it works for the next ten minutes.'
              : 'Thanks. We\\'ve received your request and will respond within 48 hours.',
            'success'
          );
          form.reset();
          if (window.turnstile) {
            window.turnstile.reset();
            turnstileToken = null;
          }
        } else {
          showStatus(data.error || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Email check error:', err);
        showStatus('Connection problem. Please try again in a moment.', 'error');
      } finally {
        setLoading(false);
      }
    });
  </script>
  ${supabaseAuthScript(env)}
  <script>
    (async function() {
      var hash = window.location.hash || '';
      var isCallback = hash.indexOf('access_token') !== -1;

      if (isCallback) {
        // Magic link callback — let Supabase process the hash and redirect to prepare
        await new Promise(function(r) { setTimeout(r, 500); });
        try {
          var result = await window.sb.auth.getSession();
          if (result.data && result.data.session) {
            window.location.href = '/career-assessment/prepare';
            return;
          }
        } catch (e) {
          // Token exchange failed — fall through to normal landing page
        }
      }

      // Check whether the user already has a session — if so, hide the request-access UI
      // and replace it with links to their dashboard. They can still read about the service.
      try {
        if (window.waitForAuth) await window.waitForAuth();
        var sessionResult = await window.sb.auth.getSession();
        if (sessionResult.data && sessionResult.data.session) {
          // Logged in — hide the request-access section
          var accessSection = document.querySelector('.access');
          if (accessSection) accessSection.style.display = 'none';

          // Replace hero CTA with a link to the dashboard
          var heroBtn = document.getElementById('hero-cta-button');
          if (heroBtn) {
            heroBtn.textContent = 'Go to your dashboard →';
            heroBtn.setAttribute('href', '/career-assessment/dashboard');
          }
          var heroNote = document.querySelector('#hero-cta .hero-cta-note');
          if (heroNote) heroNote.textContent = 'You\\'re signed in.';

          // Hide the "Sign in" and "Request access" links in the nav too
          document.querySelectorAll('.nav-link, .btn.nav-cta').forEach(function(el) {
            var text = (el.textContent || '').trim().toLowerCase();
            if (text === 'sign in' || text === 'request access') {
              el.style.display = 'none';
            }
          });

          // Add a "Dashboard" link to the nav if not already authed-style
          var navLinksContainer = document.querySelector('.nav-links');
          if (navLinksContainer && !navLinksContainer.querySelector('a[href="/career-assessment/dashboard"]')) {
            var dashLink = document.createElement('a');
            dashLink.href = '/career-assessment/dashboard';
            dashLink.className = 'nav-link';
            dashLink.textContent = 'Dashboard';
            navLinksContainer.insertBefore(dashLink, navLinksContainer.firstChild);
          }
        }
      } catch (e) {
        // No session — show landing page as normal
      }
    })();
  </script>
</body>
</html>`;
}
