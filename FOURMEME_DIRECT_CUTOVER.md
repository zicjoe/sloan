# Four.meme direct cutover for Sloan

## Why this cutover exists
Bitquery returned HTTP 402 during live sync attempts, which means Sloan should not depend on Bitquery as the core live data source for the hackathon.

## New source of truth
Use Four.meme directly for:
- token discovery
- ranking snapshots
- token detail hydration

Use Supabase for:
- caching synced tokens
- token sync run history
- Sloan app reads
- AI-generated overlays like conviction, swarm heuristics, and lore

## Commands
In **Windows PowerShell** inside the **project root**:

```powershell
npm run sync:fourmeme
npm run dev
```

## Required env keys
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Optional env key
- `FOURMEME_API_BASE_URL`

Default:

```text
https://four.meme/meme-api/v1
```
