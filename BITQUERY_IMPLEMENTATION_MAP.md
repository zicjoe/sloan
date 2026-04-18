# Sloan Bitquery implementation map

This patch adds the first real Bitquery ingestion foundation for Sloan.

## What this patch gives you

- A dedicated Bitquery schema in `supabase/bitquery_foundation.sql`
- First worker scripts for:
  - discovery rails
  - token market enrichment
  - live trade streaming
- Query templates aligned to the current Bitquery Four.meme docs
- Environment variables and npm scripts for running the first real data jobs

## Files added

- `supabase/bitquery_foundation.sql`
- `scripts/bitquery/queries.mjs`
- `scripts/bitquery/shared.mjs`
- `scripts/bitquery/sync-discovery.mjs`
- `scripts/bitquery/sync-market.mjs`
- `scripts/bitquery/stream-trades.mjs`
- `scripts/bitquery/run-all.mjs`

## Environment variables

Add these to `.env`:

- `BITQUERY_ACCESS_TOKEN`
- `BITQUERY_ENDPOINT=https://streaming.bitquery.io/graphql`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BITQUERY_FRESH_LIMIT=30`
- `BITQUERY_HOT_LIMIT=30`
- `BITQUERY_VOLUME_LIMIT=30`
- `BITQUERY_LIQUIDITY_LIMIT=30`
- `BITQUERY_TRACKED_TOKEN_LIMIT=25`

## What each worker does

### `npm run sync:bitquery:discovery`
Pulls:
- new token creations
- top market cap rail
- top volume rail
- top liquidity rail

Writes:
- `bq_token_profiles`
- `bq_token_market_snapshots`
- `bq_sync_runs`
- also mirrors summary fields into `public.tokens`

### `npm run sync:bitquery:market`
For tracked tokens, pulls:
- metadata
- market cap and price
- trade metrics
- OHLCV candles
- recent buys and sells
- top traders
- liquidity
- top holders
- optional dev holding when the dev address is known

Writes:
- `bq_token_profiles`
- `bq_token_market_snapshots`
- `bq_token_ohlcv`
- `bq_live_trades`
- `bq_top_traders`
- `bq_sync_runs`
- also mirrors summary fields into `public.tokens`

### `npm run stream:bitquery:trades`
Starts a WebSocket subscription worker for:
- Four.meme trades
- Four.meme token creation events

Writes:
- `bq_live_trades`
- `bq_sync_runs`

## Important honesty note

These worker files are the first real Bitquery pass.
They are based directly on the Bitquery Four.meme docs and should be treated as the new source-of-truth direction for Sloan.

I could not run them end to end here because this environment does not have your Bitquery token or open internet access to Bitquery.
So you should test each query in the Bitquery IDE if a specific query needs field tuning for your account or dataset.

## Run order

1. Run `supabase/schema.sql` if not already done
2. Run `supabase/bitquery_foundation.sql`
3. Fill `.env`
4. Run `npm run sync:bitquery:discovery`
5. Run `npm run sync:bitquery:market`
6. Optional: run `npm run stream:bitquery:trades`

## How this maps to Sloan

- Command Center → `bq_token_profiles`, `bq_latest_market_snapshot`, `bq_live_trades`
- Token page → `bq_token_market_snapshots`, `bq_token_ohlcv`, `bq_live_trades`, `bq_top_traders`
- Trust layer → `bq_token_profiles` with dev and holder concentration fields
- Graduation watch → `bq_token_market_snapshots.curve_progress_pct`, `bq_migrations`
- Live feed → `bq_live_trades`, `bq_liquidity_events`

## Recommended next UI pass

Once the workers have written data successfully, the next frontend step is:
- replace current command center rails with `token_live_overview`
- replace fake right-side leaderboard with `bq_top_traders`
- add recent trades block from `bq_live_trades`
- add chart on token page from `bq_token_ohlcv`
