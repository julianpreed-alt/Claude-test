import { supabaseAdmin } from './supabase.js';

/**
 * Rate limit configuration per action.
 */
const LIMITS = {
  login_attempt: { max: 5, windowMinutes: 15 },
  chat_message: { max: 30, windowMinutes: 5 },
  assessment_start: { max: 3, windowMinutes: 60 },
};

/**
 * Checks and increments the rate limit for an action.
 * Returns { allowed: boolean, remaining: number }.
 */
export async function checkRateLimit(env, identifier, action) {
  const config = LIMITS[action];
  if (!config) return { allowed: true, remaining: 999 };

  const sb = supabaseAdmin(env);
  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000
  ).toISOString();

  // Count requests in the current window
  const { data: records, error } = await sb
    .from('rate_limits')
    .select('count')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart);

  if (error) {
    // If rate limit check fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.max };
  }

  const totalCount = (records || []).reduce((sum, r) => sum + r.count, 0);

  if (totalCount >= config.max) {
    return { allowed: false, remaining: 0 };
  }

  // Record this request
  const now = new Date().toISOString();
  await sb.from('rate_limits').insert({
    identifier,
    action,
    window_start: now,
    count: 1,
  });

  return { allowed: true, remaining: config.max - totalCount - 1 };
}

/**
 * Returns a 429 Too Many Requests response.
 */
export function rateLimitResponse() {
  return Response.json(
    { error: "You're sending requests too quickly. Please wait a moment and try again." },
    { status: 429 }
  );
}
