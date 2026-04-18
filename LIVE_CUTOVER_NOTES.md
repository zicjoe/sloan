Sloan live cutover notes

What changed:
- live tokens are now preferred from Supabase where source = four.meme
- homepage rails are grouped by live ranking labels instead of old mock momentum only
- Token cards show live source rank labels
- Quest Arena, Mirror Feed, and Passport now read backend data instead of direct mock imports
- Four.meme sync function now stores source_rank_label and raw_payload for richer live rails

What you need to run:
1. In Supabase SQL Editor, run supabase/fourmeme_live_sync.sql again.
2. Redeploy the sync-fourmeme Edge Function with the updated code.
3. Trigger a live sync from Sloan or from the function directly.
4. Refresh the app.
