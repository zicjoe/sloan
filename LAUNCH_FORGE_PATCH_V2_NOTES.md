Sloan Launch Forge patch v2

What changed
- strengthened the forge-generate prompt so names, tickers, hero lines, and slogans are forced to stay close to the actual concept
- banned common generic filler outputs like "A Playful", "Protocol", "$MEME", and "$RAID" unless the brief explicitly supports them
- added concept-anchor extraction in the frontend fallback so Launch Forge can still produce sharper results if the AI function fails
- added output repair logic so even if the model returns weak names or generic tickers, Sloan replaces them with stronger concept-grounded options before saving

What to do
1. Replace your current project files with this patch
2. Redeploy the Supabase forge function
3. Start Sloan and test Launch Forge again

Supabase function to redeploy
- supabase/functions/forge-generate/index.ts
