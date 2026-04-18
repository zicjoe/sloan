Sloan Quest Arena patch

What changed
- Quest Arena now has a real mission flow instead of a static board.
- Users can join quests, submit proof, and see quest-specific progress.
- Quest detail panel now shows mission brief, proof type, deadline, status, and progress.
- Added a local leaderboard derived from quest submissions.
- Added recent receipt history for the current user.
- Quest cards now show difficulty, participants, joined state, and mission brief.
- No Supabase migration is required for this patch. Quest participation and proof storage are local-first.

What this means
- You can demo the full loop right away:
  join quest -> submit proof -> earn XP -> appear on leaderboard
- This is a safer hackathon implementation because it avoids adding new database tables during active iteration.
- The structure is ready for future Supabase persistence later if needed.
