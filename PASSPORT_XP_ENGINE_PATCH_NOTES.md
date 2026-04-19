Sloan Passport + XP engine patch

What changed

1. Passport now derives from real activity, not mostly static profile rows.
It pulls live signal from:
- quest joins
- quest submissions
- prophet calls
- forge generations
- raid generations

2. Sloan now records XP events when a signed-in user:
- joins a quest
- submits quest proof
- opens a prophet call
- gets a prophet call resolved
- generates a Forge pack
- generates a Raid pack

3. Passport badges are now derived from real thresholds and synced for the signed-in user.

4. The Passport page now shows:
- total XP
- quests completed
- forge count
- raid count
- prediction accuracy
- recent backend-derived activity
- real badge showcase

What this does not fully do yet

- It does not move Mirror Feed onto the new XP timeline yet.
- It does not create an admin moderation panel for badge or XP overrides.
- It does not expose other users’ private Forge or Raid histories because those tables remain owner-scoped by RLS.

What to run

1. Replace your current Sloan files with this zip.
2. Open Supabase SQL Editor and run:
   supabase/passport_xp_engine_patch.sql
3. Restart Sloan.

What to test

While signed in:
1. Open your Passport page.
2. Confirm total XP is visible.
3. Confirm recent activity includes Quest, Prophet, Forge, and Raid actions you already made.
4. Confirm badges are no longer just static placeholders.
5. Create one new quest action or prophet call and confirm Passport updates after refresh.
