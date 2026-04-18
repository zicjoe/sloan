# Quest Arena Patch V2

This patch makes Quest Arena auto-populate from live Four.meme token data.

What changed:
- generates a starter quest set from live synced tokens
- creates posting, prediction, meme, rivalry, and recovery quests automatically
- keeps the existing join, submit proof, XP, and leaderboard flow
- avoids the empty-state problem when no quests table rows exist yet

No database migration is required.
No Supabase function redeploy is required.

After applying this patch:
1. Run `npm run dev`
2. Open `/quests`
3. You should see live token-driven quests immediately
