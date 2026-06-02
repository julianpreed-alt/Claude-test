/**
 * Verifies a Cloudflare Turnstile CAPTCHA token server-side.
 * Returns { success: boolean, error?: string }.
 */
export async function verifyTurnstile(token, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    // If Turnstile isn't configured yet, skip verification (dev mode)
    console.warn('TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification');
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'CAPTCHA token is required' };
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    return { success: false, error: 'CAPTCHA verification failed' };
  }

  return { success: true };
}
