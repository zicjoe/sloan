# Sloan live Four.meme sync

This project can pull live token data from Four.meme, cache it into Supabase, and then let the Sloan frontend read that data through the existing Supabase-backed API layer.

## What it does
- fetches live rankings from Four.meme
- optionally fetches additional list data from Four.meme search
- enriches tokens with detail data when available
- upserts tokens into `public.tokens`
- upserts conviction summaries into `public.token_convictions`
- refreshes lore entries in `public.token_lore`
- logs the sync in `public.fourmeme_sync_runs`

## Required setup
Run the migration first in Supabase SQL Editor:

- `supabase/migrations/20260415_fourmeme_live_sync.sql`

Then set these values in your local `.env` file.

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FOURMEME_API_BASE_URL=https://four.meme/meme-api/v1
FOURMEME_SYNC_PAGE_SIZE=20
FOURMEME_SYNC_LIMIT=60
FOURMEME_RANKING_TYPES=HOT,NEW,VOL_DAY_1,DEX
FOURMEME_SEARCH_ENABLED=true
FOURMEME_SEARCH_TYPE=HOT
FOURMEME_SEARCH_LIST_TYPE=NOR
FOURMEME_SEARCH_STATUS=ALL
OPENAI_API_KEY=
FOURMEME_ANALYSIS_MODEL=gpt-4.1-mini
FOURMEME_AI_ANALYSIS_LIMIT=8
```

## Run the live sync
Open **Windows PowerShell** in the **project root folder** and run:

```powershell
npm run sync:fourmeme
```

## Then start Sloan
Open **Windows PowerShell** in the **project root folder** and run:

```powershell
npm run dev
```

If the sync worked, Sloan home and token pages will now read live tokens that came from Four.meme instead of the old seeded demo set.
