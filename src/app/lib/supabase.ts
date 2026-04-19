import { env, getSupabaseFunctionsBaseUrl, hasSupabaseBackend } from './env';
import { getSupabaseBrowserClient } from './supabaseClient';

type QueryValue = string | number | boolean | null | undefined;

interface SelectOptions {
  columns?: string;
  filters?: Record<string, QueryValue>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  single?: boolean;
}

function buildUrl(table: string, options: SelectOptions = {}) {
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', options.columns || '*');

  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, `eq.${value}`);
    }
  }

  if (options.orderBy) {
    url.searchParams.set('order', `${options.orderBy.column}.${options.orderBy.ascending === false ? 'desc' : 'asc'}`);
  }

  if (typeof options.limit === 'number') {
    url.searchParams.set('limit', String(options.limit));
  }

  return url.toString();
}

async function headers(extra: Record<string, string> = {}) {
  let bearer = env.supabaseAnonKey;

  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        bearer = data.session.access_token;
      }
    }
  } catch {
    // Fall back to anon key when no browser session is available.
  }

  return {
    apikey: env.supabaseAnonKey,
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function handleResponse<T>(response: Response, fallback?: T): Promise<T> {
  if (!response.ok) {
    if (fallback !== undefined) return fallback;
    const message = await response.text();
    throw new Error(message || `Supabase request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return (fallback ?? null) as T;
  }

  return (await response.json()) as T;
}

export async function selectRows<T>(table: string, options: SelectOptions = {}, fallback?: T): Promise<T> {
  if (!hasSupabaseBackend) {
    if (fallback !== undefined) return fallback;
    throw new Error('Supabase is not configured');
  }

  const response = await fetch(buildUrl(table, options), {
    method: 'GET',
    headers: await headers(options.single ? { Accept: 'application/vnd.pgrst.object+json' } : {}),
  });

  return handleResponse<T>(response, fallback);
}

export async function insertRow<T>(table: string, payload: object, fallback?: T): Promise<T> {
  if (!hasSupabaseBackend) {
    if (fallback !== undefined) return fallback;
    throw new Error('Supabase is not configured');
  }

  const response = await fetch(`${env.supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: await headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<any[]>(response);
  return (Array.isArray(data) ? data[0] : data) as T;
}

export async function updateRows<T>(table: string, filters: Record<string, QueryValue>, payload: object, fallback?: T): Promise<T> {
  if (!hasSupabaseBackend) {
    if (fallback !== undefined) return fallback;
    throw new Error('Supabase is not configured');
  }

  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, `eq.${value}`);
  }

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: await headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<any[]>(response);
  return (Array.isArray(data) ? data[0] : data) as T;
}

export async function invokeFunction<T>(name: string, body: object, fallback?: T): Promise<T> {
  const baseUrl = getSupabaseFunctionsBaseUrl();
  if (!hasSupabaseBackend || !baseUrl) {
    if (fallback !== undefined) return fallback;
    throw new Error('Supabase functions are not configured');
  }

  const response = await fetch(`${baseUrl}/${name}`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response, fallback);
}

export async function upsertRows<T>(table: string, payload: object | object[], options: { onConflict?: string } = {}, fallback?: T): Promise<T> {
  if (!hasSupabaseBackend) {
    if (fallback !== undefined) return fallback;
    throw new Error('Supabase is not configured');
  }

  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  if (options.onConflict) {
    url.searchParams.set('on_conflict', options.onConflict);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: await headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<any[]>(response);
  return (Array.isArray(data) && !Array.isArray(payload) ? data[0] : (data as any)) as T;
}
