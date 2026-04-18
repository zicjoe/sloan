Prophet League patch

What changed
- turned Prophet League into a structured prediction demo backed by live Four.meme tokens already synced into Sloan
- added four prediction types: momentum, relative strength, volume, survival
- added confidence, short windows, compare-token flow, and opportunity cards
- added local prediction metadata so structured calls work without a DB migration
- added deterministic resolution logic using baseline token snapshots vs current token metrics
- derived prophet leaderboard from resolved predictions so the board can move without waiting for backend ranking jobs
- seeded believable live prediction examples from current tokens when the board is empty so the demo does not look blank
- upgraded cards to show call type, confidence, resolution note, and score impact

What you need to do
- replace the project files with this patch
- run npm run dev
- open /dashboard/prophets

Notes
- no SQL migration needed
- no Supabase function redeploy needed
- existing predictions table stays compatible because richer Prophet League fields are stored locally and merged into live rows at runtime
