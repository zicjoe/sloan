export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').trim(),
  useMockApi: (import.meta.env.VITE_USE_MOCK_API || 'false').toLowerCase() === 'true',
  currentUser: import.meta.env.VITE_CURRENT_USER || 'guest',
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  supabaseFunctionsBaseUrl: (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '').trim(),
  supabaseRedirectUrl: (import.meta.env.VITE_SUPABASE_REDIRECT_URL || '').trim(),
  appUrl: (import.meta.env.VITE_APP_URL || window.location.origin || '').trim(),
};

export const hasApiBaseBackend = Boolean(env.apiBaseUrl) && !env.useMockApi;
export const hasSupabaseBackend = Boolean(env.supabaseUrl && env.supabaseAnonKey) && !env.useMockApi;
export const hasBackend = hasApiBaseBackend || hasSupabaseBackend;

export function getSupabaseFunctionsBaseUrl() {
  if (env.supabaseFunctionsBaseUrl) return env.supabaseFunctionsBaseUrl;
  if (!env.supabaseUrl) return '';

  try {
    const url = new URL(env.supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    return `https://${projectRef}.functions.supabase.co`;
  } catch {
    return '';
  }
}
