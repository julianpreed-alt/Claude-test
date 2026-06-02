import { sharedStyles, navHTML, supabaseAuthScript } from './serve.js';

export function loginPage(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log in — 8epochs</title>
  <style>${sharedStyles()}

    .login-container {
      max-width: 460px;
      margin: 80px auto 0;
      text-align: center;
      padding: 0 24px;
    }

    .login-container h1 {
      margin-bottom: 8px;
    }

    .login-container > p {
      margin-bottom: 32px;
    }

    .login-form {
      text-align: left;
      max-width: 460px;
      margin: 0 auto;
    }

    .login-form label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text);
    }

    .login-form input[type="email"] {
      width: 100%;
      padding: 14px 16px;
      font-size: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-card);
      font-family: var(--font-sans);
      color: var(--text);
      box-sizing: border-box;
    }

    .login-form input[type="email"]:focus {
      outline: none;
      border-color: var(--accent);
    }

    .login-form .btn {
      width: 100%;
      margin-top: 16px;
      justify-content: center;
      padding: 16px 28px;
    }

    .message {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: var(--radius);
      font-size: 0.9rem;
      display: none;
    }
  </style>
</head>
<body>
  ${navHTML()}

  <div class="container">
    <div class="login-container">
      <h1>Welcome back</h1>
      <p>Enter your email and we'll send you a magic link to log in.</p>

      <form class="login-form" id="login-form" onsubmit="handleLogin(event)">
        <label for="email">Email address</label>
        <input type="email" id="email" placeholder="you@example.com" required autocomplete="email" />
        <button type="submit" class="btn" id="submit-btn">Send magic link</button>
      </form>
      <div id="message" class="message"></div>
    </div>
  </div>

  ${supabaseAuthScript(env)}
  <script>
    // If already logged in, redirect to dashboard
    async function checkExisting() {
      if (window.waitForAuth) await window.waitForAuth();
      try {
        var result = await window.sb.auth.getSession();
        if (result.data && result.data.session) {
          window.location.href = '/career-assessment/dashboard';
        }
      } catch (e) { /* not logged in */ }
    }
    checkExisting();

    async function handleLogin(e) {
      e.preventDefault();

      var email = document.getElementById('email').value.trim();
      var btn = document.getElementById('submit-btn');
      var msg = document.getElementById('message');

      if (!email) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';
      msg.style.display = 'none';

      try {
        var res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, turnstile_token: null }),
        });

        var data = await res.json();

        msg.style.display = 'block';
        if (data.allowed || data.allowlisted || data.success) {
          msg.style.background = 'var(--success-bg)';
          msg.style.color = 'var(--success)';
          msg.textContent = "Check your email — we've sent you a magic link. Click it to log in.";
        } else {
          msg.style.background = 'var(--error-bg)';
          msg.style.color = 'var(--error)';
          msg.textContent = data.message || data.error || 'This email is not on the access list.';
        }
      } catch (err) {
        msg.style.display = 'block';
        msg.style.background = 'var(--error-bg)';
        msg.style.color = 'var(--error)';
        msg.textContent = 'Something went wrong. Please try again.';
      }

      btn.disabled = false;
      btn.textContent = 'Send magic link';
    }
  </script>
</body>
</html>`;
}
