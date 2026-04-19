Quest Forge owner patch

What changed
- adds a new owner/operator page at /dashboard/quests/forge
- Sloan AI now suggests quest drafts from the live token state
- owner-published quests are stored in public.quests and appear first in Quest Arena
- Quest Arena now positions owner-created quests as the primary model

What to do
1. Run supabase/quest_forge_owner_patch.sql in Supabase SQL Editor
2. Start the app with npm run dev
3. Open /dashboard/quests/forge
4. Pick a token, generate suggestions, edit one, and publish it
5. Open /dashboard/quests and confirm the published quest appears in the queue
