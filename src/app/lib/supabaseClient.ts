import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabaseBackend } from './env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBackend) return null;
  if (browserClient) return browserClient;

  browserClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
