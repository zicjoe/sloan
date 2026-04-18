Fix 4

Patched Supabase batch upsert normalization so rows that inherit created_at or updated_at keys from existing records no longer send null into NOT NULL timestamp columns. Missing created_at/updated_at values are now filled from refreshed_at or the current ISO timestamp before bulk upsert.
