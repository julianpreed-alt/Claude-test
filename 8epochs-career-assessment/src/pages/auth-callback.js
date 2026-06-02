import { sharedStyles, supabaseAuthScript } from './serve.js';

export function authCallbackPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logging in... — 8epochs</title>
  <style>${sharedStyles()}

    .callback-container {
      max-width: 400px;
      margin: 120px auto 0;
      text-align: center;
    }

    .callback-container p {
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="callback-container">
    <div class="spinner" style="width:32px; height:32px; border-color: var(--border); border-top-color: var(--accent); margin: 0 auto;"></div>
    <p id="status">Logging you in...</p>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    async function handleCallback() {
      var status = document.getElementById('status');

      // Wait for the Supabase client to initialize
      if (window.waitForAuth) await window.waitForAuth();

      // The Supabase JS client with detectSessionInUrl: true
      // automatically exchanges the hash fragment tokens for a session.
      // We just need to check if it succeeded.
      var maxWait = 5000;
      var start = Date.now();

      async function checkSession() {
        try {
          var result = await window.sb.auth.getSession();
          if (result.data && result.data.session) {
            status.textContent = 'Success! Redirecting...';
            window.location.href = '/career-assessment/prepare';
            return;
          }
        } catch (e) {
          console.error('Session check error:', e);
        }

        if (Date.now() - start < maxWait) {
          setTimeout(checkSession, 300);
        } else {
          status.textContent = 'Login failed. Please try again.';
          status.style.color = 'var(--error)';
          setTimeout(function() { window.location.href = '/career-assessment'; }, 2000);
        }
      }

      checkSession();
    }

    handleCallback();
  </script>
</body>
</html>`;
}
