Sloan Forge + Raid backend ownership patch

What changed
- Launch Forge generations now persist richer structured output to Supabase.
- Launch Forge history now reads from Supabase by signed-in user.
- Raid Studio generations now persist to a new raid_generations table in Supabase.
- Raid Studio now reloads your last generated pack and shows recent pack history.

How to apply
1. Extract this patch over your Sloan project.
2. Run supabase/forge_raid_backend_patch.sql in Supabase SQL Editor.
3. Restart the app with npm run dev.
4. Test /dashboard/forge and /dashboard/raid-studio while signed in.
