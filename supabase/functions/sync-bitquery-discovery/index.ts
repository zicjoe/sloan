import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({
    ok: true,
    message: 'Use the node worker scripts in scripts/bitquery for the first Bitquery sync pass. This function is a placeholder to keep the Supabase workflow explicit.',
    next_steps: [
      'Run supabase/bitquery_foundation.sql',
      'Set BITQUERY_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env',
      'Run npm run sync:bitquery:discovery',
    ],
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
