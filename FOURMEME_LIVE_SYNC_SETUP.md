# Sloan live Four.meme sync setup

This update makes Four.meme the primary live token source for Sloan.

## What changed

Sloan now supports **two ways** to sync live Four.meme tokens:
- a Supabase Edge Function named `sync-fourmeme`
- a local Node command named `npm run sync:fourmeme`

That means you are no longer blocked on Bitquery for core token discovery.

## What you need to do

### 1. Run the SQL patch
Open your Supabase dashboard.
Go to **SQL Editor**.
Open this file from the project:

`supabase/fourmeme_live_sync.sql`

Copy everything inside and run it.

### 2. Choose your sync path

## Option A: easiest local path
Use the local Node sync command.

Make sure your `.env` contains:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FOURMEME_API_BASE_URL=https://four.meme/meme-api/v1`

Then in **Windows PowerShell** inside the **project root** run:

```powershell
npm run sync:fourmeme
```

This will:
- fetch live token candidates from Four.meme search and ranking routes
- fetch token details when addresses are available
- upsert those tokens into Supabase
- write a token sync run record

## Option B: in-app sync button
Create a new Supabase Edge Function named:

`sync-fourmeme`

Then paste the code from:

`supabase/functions/sync-fourmeme/index.ts`

After that, Sloan can trigger syncs from the dashboard button.

### 3. Run Sloan locally
In **Windows PowerShell** inside the **project root**:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

### 4. Confirm your live feed
After the sync runs, Sloan should show live tokens sourced from Four.meme.

## Recommended hackathon workflow
For the hackathon, I recommend this order:
1. run `npm run sync:fourmeme`
2. confirm live tokens appear in Sloan
3. then optionally deploy `sync-fourmeme` as a Supabase Edge Function for one-click in-app refresh

## Notes
Four.meme has official integration direction through its Protocol Integration materials and community tooling that references public token search, ranking, config, and detail routes. Sloan uses those live token discovery patterns as the primary source instead of depending on Bitquery for the hackathon. ([four-meme.gitbook.io](https://four-meme.gitbook.io/four.meme/brand/protocol-integration?utm_source=chatgpt.com)) ([github.com](https://github.com/four-meme-community/four-meme-ai/blob/main/skills/four-meme-integration/SKILL.md))
