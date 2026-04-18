Sloan Four.meme Fix 3

What this fixes
- Resolves Supabase PGRST102 bulk upsert error: "All object keys must match"

Root cause
- Supabase/PostgREST bulk upsert requires every object in the JSON array to have the exact same set of keys.
- Sloan was merging existing rows with fresh rows, which created arrays where some objects had extra keys and others did not.

Fix
- The upsert helper now normalizes every batch before sending it to Supabase.
- It builds the union of all keys across the batch and fills missing keys with null so every row matches.

What to do
- Extract this zip over your current Sloan project
- Run: npm run sync:fourmeme
