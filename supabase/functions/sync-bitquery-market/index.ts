import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({
    ok: true,
    message: 'Use the node worker scripts in scripts/bitquery for market enrichment. This placeholder documents the intended function boundary.',
    next_steps: [
      'Run npm run sync:bitquery:market',
      'Check bq_token_market_snapshots, bq_live_trades, and bq_top_traders',
    ],
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
