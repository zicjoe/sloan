# Sloan Launch Forge patch

What changed:
- richer Forge brief inputs: meme category, launch goal, enemy/contrast, reference style
- stronger AI output shape with project summary, hero line, community hooks, ritual ideas, enemy framing, and launch checklist
- improved Launch Forge UI with copy buttons, JSON export, and recent generation history
- local storage now preserves the full latest identity pack even when the database only stores the core fields
- updated Supabase `forge-generate` edge function prompt so OpenAI returns the richer pack

What to do:
1. Replace the project files with this patch.
2. Redeploy the `forge-generate` Supabase Edge Function using the updated file in `supabase/functions/forge-generate/index.ts`.
3. Run the app and open Launch Forge.

No database migration is required for this patch.
