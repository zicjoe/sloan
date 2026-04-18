# Sloan Real Backend Setup

This project is now wired to use Supabase directly from the frontend and OpenAI through Supabase Edge Functions.

## What is real now
- Tokens can load from Supabase
- Conviction data can load from Supabase
- Swarm data can load from Supabase
- Lore stream can load from Supabase
- Quests can load from Supabase
- Predictions can be written to Supabase
- Passport profiles can load from Supabase
- Counterfactual feed can load from Supabase
- Raid campaigns can load from Supabase
- Launch Forge can call a real AI function
- Raid Studio can call a real AI function

## What you need to do
1. Create a Supabase project
2. Open SQL Editor in Supabase
3. Paste `supabase/schema.sql` and run it
4. In Supabase, create two Edge Functions:
   - forge-generate
   - raid-generate
5. Copy the matching files from:
   - `supabase/functions/forge-generate/index.ts`
   - `supabase/functions/raid-generate/index.ts`
6. Set your OpenAI secret in Supabase:
   - OPENAI_API_KEY=your_openai_key
7. In your local `.env` file, set:
   - VITE_USE_MOCK_API=false
   - VITE_SUPABASE_URL=your_project_url
   - VITE_SUPABASE_ANON_KEY=your_anon_key
   - VITE_CURRENT_USER=current_user

## Local run
Open Windows PowerShell in the project root and run:

```powershell
npm install
npm run dev
```

## Supabase CLI deploy commands
Run these in Windows PowerShell in the project root after installing Supabase CLI:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy forge-generate
supabase functions deploy raid-generate
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## Notes
- If Supabase is not configured, Sloan still falls back to mock data
- The frontend does not expose your OpenAI key because AI runs through Supabase functions
- This is hackathon-friendly wiring, not locked-down production security
