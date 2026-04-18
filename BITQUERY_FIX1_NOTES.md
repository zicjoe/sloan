# Bitquery fix 1

This patch tightens the Sloan Bitquery foundation in four places:

1. Adds the unique constraint required by the `bq_token_market_snapshots` upsert path.
2. Streams token-create events into both `bq_token_profiles` and the live `tokens` table.
3. Improves market mirroring so one token is not overwritten by a weaker snapshot in the same discovery run.
4. Pushes live price change fields into Sloan token rows so the UI feels live instead of flat.

## Important database step
If you already ran the older Bitquery foundation SQL, run:

- `supabase/bitquery_patch_fix1.sql`

If you are starting fresh, the updated `supabase/bitquery_foundation.sql` already includes the fix.
