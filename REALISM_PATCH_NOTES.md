Sloan realism patch

What changed
- Removed fake dashboard summary metrics from the command center.
- Filtered known demo usernames and token slugs out of live API reads.
- Token cards now derive a cleaner symbol when Four.meme returns a generic chain ticker like BNB.
- Command Center now shows honest empty states for prophets, quests, and predictions when no real live data exists yet.
- sync-fourmeme now maps symbols more defensively and links to the English token page.
- schema.sql no longer seeds demo tokens, prophets, quests, predictions, or user profiles.

What you still need to do
- Redeploy the updated sync-fourmeme function in Supabase.
- Run a fresh sync so token rows get improved ticker mapping.
- Hard refresh Sloan after restarting the dev server.
