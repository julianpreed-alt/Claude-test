// ============================================================
// serve.js — shared design system for 8epochs
//
// Exports:
//   - sharedStyles()        : the base CSS for every page
//   - navHTML(opts)         : the site navigation
//   - footerHTML()          : the site footer
//   - supabaseAuthScript(env) : auth + apiFetch helpers
//   - fonts()               : <link> tags for Google Fonts
//
// Design philosophy:
//   - Editorial seriousness, not SaaS chrome
//   - Whitespace is the design
//   - One accent color (deep oxidized green)
//   - No drop shadows, no gradients, no decorative icons
//   - Typography (Fraunces + Inter) does the visual work
// ============================================================

export function fonts() {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  `;
}

export function sharedStyles() {
  return `
    /* ============================================================
       8epochs — design system
       ============================================================ */

    :root {
      /* Foundation */
      --bg: #FAF8F4;
      --bg-card: #FFFFFF;
      --bg-sunken: #F4F0E8;
      --bg-tint: #F7F3EA;

      /* Ink */
      --text: #1A1814;
      --text-secondary: #4A453C;
      --text-muted: #8A8378;
      --text-light: #B5AEA1;

      /* Borders */
      --border: #E8E2D5;
      --border-light: #F0EBE0;
      --border-dark: #D6CFC0;

      /* Accent — deep oxidized green */
      --accent: #9C7A1F;
      --accent-hover: #7A5F18;
      --accent-soft: #F5EFE0;
      --accent-tint: #F0F4F0;

      /* Sparingly used */
      --highlight: #C9A961;
      --error: #8B3A2F;
      --error-bg: #FAEDEA;
      --success: #2D4A3E;
      --success-bg: #E8EFE9;

      /* Typography */
      --font-display: 'Fraunces', 'Charter', 'Iowan Old Style', Georgia, serif;
      --font-serif: 'Fraunces', 'Charter', 'Iowan Old Style', Georgia, serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;

      /* Radii — minimal */
      --radius: 4px;
      --radius-lg: 6px;

      /* Layout */
      --content-narrow: 600px;
      --content-prose: 680px;
      --content-wide: 1120px;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html {
      -webkit-text-size-adjust: 100%;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 17px;
      line-height: 1.65;
      font-feature-settings: 'ss01', 'cv11';
    }

    /* ============================================================
       Typography
       ============================================================ */

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-display);
      font-weight: 400;
      color: var(--text);
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin: 0;
    }

    h1 {
      font-size: clamp(2.5rem, 5.5vw, 4.25rem);
      font-weight: 400;
      letter-spacing: -0.035em;
      line-height: 1.05;
    }

    h2 {
      font-size: clamp(1.875rem, 3.5vw, 2.75rem);
      font-weight: 400;
      letter-spacing: -0.025em;
      line-height: 1.1;
    }

    h3 {
      font-size: clamp(1.375rem, 2vw, 1.75rem);
      font-weight: 500;
      letter-spacing: -0.015em;
    }

    h4 {
      font-size: 1.125rem;
      font-weight: 500;
      font-family: var(--font-sans);
      letter-spacing: 0;
    }

    p {
      margin: 0 0 1.25em 0;
      color: var(--text-secondary);
    }

    p:last-child { margin-bottom: 0; }

    a {
      color: var(--accent);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s ease;
    }

    a:hover {
      border-bottom-color: var(--accent);
    }

    strong {
      color: var(--text);
      font-weight: 600;
    }

    em {
      font-style: italic;
      color: var(--text);
    }

    /* The eyebrow — small caps label above sections */
    .eyebrow {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      display: block;
    }

    /* The lede — first paragraph after a major heading */
    .lede {
      font-family: var(--font-display);
      font-size: clamp(1.25rem, 2vw, 1.5rem);
      font-weight: 300;
      line-height: 1.45;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    /* Mono labels — for specs panels */
    .mono {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      letter-spacing: 0;
      font-weight: 500;
    }

    /* ============================================================
       Layout
       ============================================================ */

    .container {
      max-width: var(--content-wide);
      margin: 0 auto;
      padding: 0 32px;
    }

    .container-prose {
      max-width: var(--content-prose);
      margin: 0 auto;
      padding: 0 32px;
    }

    .container-narrow {
      max-width: var(--content-narrow);
      margin: 0 auto;
      padding: 0 32px;
    }

    .section {
      padding: 96px 0;
    }

    .section-lg {
      padding: 128px 0;
    }

    .section-tint {
      background: var(--bg-tint);
    }

    .section-accent {
      background: var(--accent-soft);
    }

    .section-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 0;
    }

    @media (max-width: 768px) {
      .section { padding: 64px 0; }
      .section-lg { padding: 80px 0; }
      .container, .container-prose, .container-narrow { padding: 0 24px; }
    }

    /* ============================================================
       Buttons
       ============================================================ */

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: var(--accent);
      color: white;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      font-weight: 500;
      letter-spacing: 0;
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      text-decoration: none;
      line-height: 1;
    }

    .btn:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      border-bottom-color: var(--accent-hover);
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn:disabled, .btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-lg {
      padding: 18px 36px;
      font-size: 1rem;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text);
      border-color: var(--border-dark);
    }

    .btn-secondary:hover {
      background: transparent;
      color: var(--accent);
      border-color: var(--accent);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border-color: transparent;
      padding: 10px 16px;
    }

    .btn-ghost:hover {
      background: var(--bg-tint);
      color: var(--text);
      border-color: transparent;
    }

    /* ============================================================
       Forms
       ============================================================ */

    .field {
      margin-bottom: 24px;
    }

    .field label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 8px;
      letter-spacing: 0;
    }

    .field input[type="text"],
    .field input[type="email"],
    .field textarea,
    .field select {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-family: var(--font-sans);
      font-size: 1rem;
      color: var(--text);
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      outline: none;
      border-color: var(--accent);
      background: var(--bg-card);
    }

    .field-help {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.5;
    }

    /* ============================================================
       Cards
       ============================================================ */

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
    }

    .card-quiet {
      background: var(--bg-tint);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
    }

    /* ============================================================
       Navigation
       ============================================================ */

    .nav {
      border-bottom: 1px solid var(--border-light);
      background: var(--bg);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      background: rgba(250, 248, 244, 0.85);
    }

    .nav-inner {
      max-width: var(--content-wide);
      margin: 0 auto;
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 400;
      letter-spacing: -0.02em;
      color: var(--text);
      text-decoration: none;
      border: none;
    }

    .nav-brand:hover { border: none; }

    .nav-brand .brand-dot {
      color: var(--accent);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
    }

    .nav-link {
      color: var(--text-secondary);
      padding: 8px 14px;
      border-radius: var(--radius);
      border: none;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-link:hover {
      background: var(--bg-tint);
      color: var(--text);
      border: none;
    }

    .nav-cta {
      margin-left: 8px;
    }

    @media (max-width: 640px) {
      .nav-inner { padding: 14px 20px; }
      .nav-links .nav-link-secondary { display: none; }
    }

    /* ============================================================
       Footer
       ============================================================ */

    .footer {
      border-top: 1px solid var(--border-light);
      padding: 56px 0 64px;
      background: var(--bg);
    }

    .footer-inner {
      max-width: var(--content-wide);
      margin: 0 auto;
      padding: 0 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .footer-top {
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
      justify-content: space-between;
      align-items: baseline;
    }

    .footer-brand {
      font-family: var(--font-display);
      font-size: 1rem;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    .footer-tagline {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .footer-links a {
      color: var(--text-secondary);
      padding: 4px 8px;
      border: none;
    }

    .footer-links a:hover {
      color: var(--accent);
      border: none;
    }

    .footer-links .sep {
      color: var(--text-light);
      padding: 4px 0;
    }

    .footer-fineprint {
      font-size: 0.8125rem;
      color: var(--text-muted);
      padding-top: 24px;
      border-top: 1px solid var(--border-light);
    }

    /* ============================================================
       Animations
       ============================================================ */

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    .reveal {
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
      .reveal { opacity: 1; transform: none; }
    }

    /* ============================================================
       Spinner — for loading states
       ============================================================ */

    .spinner {
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============================================================
       Utility
       ============================================================ */

    .text-center { text-align: center; }
    .text-muted { color: var(--text-muted); }
    .text-light { color: var(--text-light); }
    .text-secondary { color: var(--text-secondary); }
    .text-accent { color: var(--accent); }

    .hidden { display: none !important; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
    }

    /* Tables — for reports */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 0.95rem;
    }

    table th,
    table td {
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-light);
    }

    table th {
      font-weight: 600;
      color: var(--text);
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom-color: var(--border);
    }

    table td {
      color: var(--text-secondary);
    }
  `;
}

// ============================================================
// Navigation
// ============================================================
//
// opts.authenticated : boolean — show "Sign out" instead of "Sign in"
// opts.showCTA       : boolean — show "Request access" CTA (default true)
// opts.current       : string  — highlight current page ('dashboard', etc.)
//
export function navHTML(opts = {}) {
  const authed = !!opts.authenticated;
  const showCTA = opts.showCTA !== false;
  const current = opts.current || '';

  return `
    ${fonts()}
    <nav class="nav">
      <div class="nav-inner">
        <a href="/" class="nav-brand">
          8epochs<span class="brand-dot">.</span>
        </a>
        <div class="nav-links">
          ${authed
            ? `
              <a href="/career-assessment/dashboard" class="nav-link ${current === 'dashboard' ? 'nav-link-active' : ''}">Dashboard</a>
              <a href="#" onclick="if(window.clearSession){window.clearSession().then(function(){window.location.href='/career-assessment'});}else{window.location.href='/career-assessment';};return false;" class="nav-link nav-link-secondary">Sign out</a>
            `
            : `
              <a href="/career-assessment" class="nav-link nav-link-secondary ${current === 'landing' ? 'nav-link-active' : ''}">The assessment</a>
              <a href="/career-assessment#about" class="nav-link nav-link-secondary">About</a>
              <a href="/auth/login" class="nav-link">Sign in</a>
              ${showCTA ? `<a href="/career-assessment#access" class="btn nav-cta">Request access</a>` : ''}
            `
          }
        </div>
      </div>
    </nav>
  `;
}

// ============================================================
// Footer
// ============================================================
export function footerHTML() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div>
            <div class="footer-brand">8epochs<span style="color:var(--accent);">.</span></div>
            <div class="footer-tagline">A career assessment for the AI decade.</div>
          </div>
          <div class="footer-links">
            <a href="/career-assessment/terms">Terms</a>
            <span class="sep">·</span>
            <a href="/career-assessment/privacy">Privacy</a>
            <span class="sep">·</span>
            <a href="/career-assessment/account">Account</a>
            <span class="sep">·</span>
            <a href="/admin">Admin</a>
            <span class="sep">·</span>
            <a href="/auth/login">Sign in</a>
          </div>
        </div>
        <div class="footer-fineprint">
          © ${new Date().getFullYear()} 8epochs. Built independently. Not affiliated with Anthropic.
        </div>
      </div>
    </footer>
  `;
}

// ============================================================
// Supabase auth + apiFetch helpers
// ============================================================
//
// Provides:
//   - supabase client (window.supabase)
//   - ensureValidToken() : refreshes if needed, returns access token
//   - apiFetch(path, opts) : authenticated fetch wrapper
//
export function supabaseAuthScript(env) {
  const supabaseUrl = env?.SUPABASE_URL || '';
  const supabaseAnonKey = env?.SUPABASE_ANON_KEY || '';

  return `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
      (function() {
        var _sb = window.supabase.createClient(
          ${JSON.stringify(supabaseUrl)},
          ${JSON.stringify(supabaseAnonKey)},
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            }
          }
        );

        // Store on window for direct access
        window.sb = _sb;

        window.ensureValidToken = async function() {
          var result = await _sb.auth.getSession();
          if (result.error || !result.data.session) {
            window.location.href = '/auth/login';
            return null;
          }
          return result.data.session.access_token;
        };

        window.apiFetch = async function(path, opts) {
          opts = opts || {};
          var token = await window.ensureValidToken();
          if (!token) return null;

          var headers = Object.assign({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          }, opts.headers || {});

          var res = await fetch(path, Object.assign({}, opts, { headers: headers }));

          if (res.status === 401) {
            window.location.href = '/auth/login';
            return null;
          }

          return res;
        };

        window.clearSession = async function() {
          await _sb.auth.signOut();
        };

        // Auth is ready immediately since this is synchronous
        window.waitForAuth = function() { return Promise.resolve(); };
      })();
    </script>
  `;
}
