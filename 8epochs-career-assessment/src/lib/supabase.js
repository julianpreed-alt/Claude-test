/**
 * Creates a Supabase client using the service role key (admin access, bypasses RLS).
 * Use this for admin operations and server-side logic.
 */
export function supabaseAdmin(env) {
  return new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Creates a Supabase client scoped to a user's JWT (respects RLS).
 * Use this when acting on behalf of a logged-in user.
 */
export function supabaseUser(env, accessToken) {
  return new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, accessToken);
}

/**
 * Minimal Supabase client for Cloudflare Workers.
 * We don't use the full @supabase/supabase-js SDK to keep the Worker lean.
 * This covers what we need: auth, database queries, and RLS-scoped requests.
 */
class SupabaseClient {
  constructor(url, apiKey, accessToken = null) {
    this.url = url;
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  get headers() {
    const h = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
    };
    // If we have an access token, use it for RLS. Otherwise use the apiKey as auth.
    h['Authorization'] = `Bearer ${this.accessToken || this.apiKey}`;
    return h;
  }

  // ---- Auth ----

  async getUser(accessToken) {
    const res = await fetch(`${this.url}/auth/v1/user`, {
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return { data: null, error: await res.json() };
    const user = await res.json();
    return { data: user, error: null };
  }

  async adminGetUserByEmail(email) {
    // Uses the admin API to look up a user by email
    const res = await fetch(`${this.url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    if (!res.ok) return { data: null, error: await res.json() };
    const data = await res.json();
    const users = data.users || data;
    const user = users.find(u => u.email === email);
    return { data: user || null, error: null };
  }

  async sendMagicLink(email, redirectTo) {
    const res = await fetch(`${this.url}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        create_user: false, // Don't auto-create — we control user creation
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      return { error };
    }
    return { error: null };
  }

  async signInWithOtp(email) {
    const res = await fetch(`${this.url}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        create_user: true,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      return { error };
    }
    return { error: null };
  }

  // ---- Database (PostgREST) ----

  from(table) {
    return new QueryBuilder(this.url, this.headers, table);
  }

  // ---- Admin Auth ----

  async deleteAuthUser(userId) {
    const res = await fetch(`${this.url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken || this.apiKey}`,
        'apikey': this.apiKey,
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || 'Failed to delete auth user');
    }
    return { success: true };
  }

  // ---- RPC (stored procedures) ----

  async rpc(fnName, params = {}) {
    const res = await fetch(`${this.url}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) return { data: null, error: await res.json() };
    const data = await res.json();
    return { data, error: null };
  }
}

/**
 * Simple PostgREST query builder.
 */
class QueryBuilder {
  constructor(url, headers, table) {
    this.url = url;
    this._headers = headers;
    this.table = table;
    this.filters = [];
    this._select = '*';
    this._order = null;
    this._limit = null;
    this._single = false;
    this._count = null;
  }

  select(columns = '*', { count } = {}) {
    this._select = columns;
    if (count) this._count = count;
    return this;
  }

  eq(column, value) {
    this.filters.push(`${column}=eq.${value}`);
    return this;
  }

  neq(column, value) {
    this.filters.push(`${column}=neq.${value}`);
    return this;
  }

  in(column, values) {
    this.filters.push(`${column}=in.(${values.join(',')})`);
    return this;
  }

  is(column, value) {
    this.filters.push(`${column}=is.${value}`);
    return this;
  }

  gt(column, value) {
    this.filters.push(`${column}=gt.${value}`);
    return this;
  }

  gte(column, value) {
    this.filters.push(`${column}=gte.${value}`);
    return this;
  }

  lt(column, value) {
    this.filters.push(`${column}=lt.${value}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this._order = `${column}.${ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    this._limit = 1;
    return this;
  }

  maybeSingle() {
    this._single = true;
    this._limit = 1;
    this._maybeSingle = true;
    return this;
  }

  async _execute(method = 'GET', body = null) {
    const params = new URLSearchParams();
    params.set('select', this._select);
    for (const f of this.filters) {
      const [key, ...rest] = f.split('=');
      params.append(key, rest.join('='));
    }
    if (this._order) params.set('order', this._order);
    if (this._limit) params.set('limit', this._limit);

    const headers = { ...this._headers };
    if (this._single) {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
    }
    if (this._count) {
      headers['Prefer'] = `count=${this._count}`;
    }

    const fetchOpts = { method, headers };
    if (body) fetchOpts.body = JSON.stringify(body);

    const url = `${this.url}/rest/v1/${this.table}?${params.toString()}`;
    const res = await fetch(url, fetchOpts);

    if (!res.ok) {
      // 406 with maybeSingle means no rows found — that's ok
      if (res.status === 406 && this._maybeSingle) {
        return { data: null, error: null };
      }
      const error = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error };
    }

    const data = await res.json();
    return { data, error: null };
  }

  // Read
  async then(resolve, reject) {
    try {
      const result = await this._execute('GET');
      resolve(result);
    } catch (e) {
      reject ? reject(e) : resolve({ data: null, error: e });
    }
  }

  // Insert
  async insert(rows, { onConflict } = {}) {
    const headers = { ...this._headers, 'Prefer': 'return=representation' };
    if (onConflict) {
      headers['Prefer'] += `, resolution=merge-duplicates`;
    }

    const url = `${this.url}/rest/v1/${this.table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error };
    }

    const data = await res.json();
    return { data: Array.isArray(rows) ? data : data[0], error: null };
  }

  // Update
  async update(values) {
    const headers = { ...this._headers, 'Prefer': 'return=representation' };
    const params = new URLSearchParams();
    for (const f of this.filters) {
      const [key, ...rest] = f.split('=');
      params.append(key, rest.join('='));
    }

    const url = `${this.url}/rest/v1/${this.table}?${params.toString()}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error };
    }

    const data = await res.json();
    return { data, error: null };
  }

  // Delete
  async delete() {
    const headers = { ...this._headers, 'Prefer': 'return=representation' };
    const params = new URLSearchParams();
    for (const f of this.filters) {
      const [key, ...rest] = f.split('=');
      params.append(key, rest.join('='));
    }

    const url = `${this.url}/rest/v1/${this.table}?${params.toString()}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error };
    }

    const data = await res.json();
    return { data, error: null };
  }
}
