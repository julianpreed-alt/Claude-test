import { supabaseAdmin } from '../lib/supabase.js';
import { checkRateLimit, rateLimitResponse } from '../lib/ratelimit.js';
import { verifyTurnstile } from '../lib/turnstile.js';

/**
 * POST /api/auth/check-email
 * Body: { email, turnstileToken }
 *
 * 1. Verify Turnstile CAPTCHA
 * 2. Check rate limit
 * 3. Check if email is allowlisted
 * 4. If yes: ensure auth user exists, send magic link
 * 5. If no: return rejection message
 */
export async function handleAuthCheckEmail(request, env) {
  const body = await request.json();
  const email = body.email;
  const turnstileToken = body.turnstileToken || body.turnstile_token;

  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verify Turnstile (skip if no token provided — for dev/testing)
  if (turnstileToken && turnstileToken !== 'no-turnstile') {
    const turnstile = await verifyTurnstile(turnstileToken, env);
    if (!turnstile.success) {
      return Response.json({ error: turnstile.error }, { status: 403 });
    }
  }

  // 2. Rate limit by IP
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { allowed } = await checkRateLimit(env, ip, 'login_attempt');
  if (!allowed) return rateLimitResponse();

  // 3. Check allowlist
  const sb = supabaseAdmin(env);
  const { data: dbUser, error: lookupError } = await sb
    .from('users')
    .select('id, email, is_allowlisted')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error('Allowlist lookup error:', lookupError);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  // Not found or not allowlisted
  if (!dbUser || !dbUser.is_allowlisted) {
    return Response.json({
      success: true,
      allowed: false,
      allowlisted: false,
      message: "This assessment is currently invite-only. If you'd like access, please reach out to us.",
    });
  }

  // 4. Send magic link via Supabase Auth OTP
  const otpRes = await fetch(`${env.SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      create_user: false,
    }),
  });

  if (!otpRes.ok) {
    const err = await otpRes.json().catch(() => ({}));
    console.error('Magic link send error:', err);
  }

  return Response.json({
    success: true,
    allowed: true,
    allowlisted: true,
    message: "We've sent a magic link to your email. Check your inbox and click the link to continue.",
  });
}
