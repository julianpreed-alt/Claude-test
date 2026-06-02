import { supabaseAdmin } from './supabase.js';

/**
 * Extracts and validates the user from the Authorization header.
 * Returns { user, error }.
 */
export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const sb = supabaseAdmin(env);
  const { data: user, error } = await sb.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}

/**
 * Authenticates and verifies the user is an admin.
 * Returns { user, dbUser, error }.
 */
export async function authenticateAdmin(request, env) {
  const { user, error } = await authenticateRequest(request, env);
  if (error) return { user: null, dbUser: null, error };

  const sb = supabaseAdmin(env);
  const { data: dbUser, error: dbError } = await sb
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbError || !dbUser) {
    return { user: null, dbUser: null, error: 'User not found' };
  }

  if (!dbUser.is_admin) {
    return { user: null, dbUser: null, error: 'Admin access required' };
  }

  return { user, dbUser, error: null };
}

/**
 * Gets the full user profile (auth + public.users row).
 * Returns { user, dbUser, error }.
 */
export async function getFullUser(request, env) {
  const { user, error } = await authenticateRequest(request, env);
  if (error) return { user: null, dbUser: null, error };

  const sb = supabaseAdmin(env);
  const { data: dbUser, error: dbError } = await sb
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbError || !dbUser) {
    return { user: null, dbUser: null, error: 'User profile not found' };
  }

  return { user, dbUser, error: null };
}
