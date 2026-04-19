# Sloan Quest + Prophet backend ownership patch

This patch moves the most important Quest Arena and Prophet League writes from local browser state into real Supabase ownership.

## What changed
- Quest joins now write to `public.quest_participants`
- Quest proof submissions now write to `public.quest_submissions`
- Prophet predictions now save richer metadata directly in `public.predictions`
- Supabase REST calls now use the signed-in session token when available, so RLS can enforce ownership properly
- Resolved prophet calls can persist their status, score, and resolution note back to Supabase for the signed-in user

## What you must run in Supabase
Run this file in the SQL Editor:

`supabase/quest_prophet_backend_patch.sql`

## After applying the SQL patch
Restart Sloan and test these flows while signed in:
- Join a quest
- Submit quest proof
- Answer a Prophet League yes/no card
- Refresh the page and confirm your participation still exists

## Current scope
This patch focuses on real backend ownership for Quest Arena and Prophet League.
It does not yet fully centralize Passport XP, Mirror Feed derivation, or admin review tooling.
