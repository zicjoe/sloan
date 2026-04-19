Mirror Feed intelligence patch

What changed
- Added a real user-owned `mirror_entries` table with RLS so Mirror Feed can stop depending only on generic public counterfactual examples.
- Mirror entries now derive from the signed-in user's real Sloan activity:
  - Prophet calls that aged well or poorly
  - Quest joins without follow-through
  - Rejected quest proof
  - Raid packs that never turned into scoreable conviction calls
  - Live watch misses on active tokens you never acted on
- Mirror Feed UI now shows:
  - source labels on entries
  - confidence labels
  - a `What Sloan used` sidebar based on your signed-in activity counts and recent actions

What this does not do yet
- It does not add admin moderation for mirror entries.
- It does not turn Mirror Feed into a server-side cron job or background worker.
- It does not yet derive forge-specific mirror entries because Forge history does not carry a token slug reliably enough for a safe token-linked mirror record.

What to test
1. Sign in
2. Open `/dashboard/mirror`
3. Confirm entries load
4. Refresh and confirm they still load
5. Make one new Prophet or Quest action
6. Refresh Mirror Feed and confirm the behavior map updates or the entry mix changes
7. Confirm the `What Sloan used` card shows real counts from your signed-in activity
