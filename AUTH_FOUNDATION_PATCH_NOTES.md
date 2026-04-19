# Sloan auth foundation patch

This patch is the first production-hardening step:
- Supabase Auth foundation
- real profile rows
- RLS-safe profile and settings tables
- app-level auth context
- auth page
- top-nav and settings integration

## What you need to do

1. In the **project root** in **Windows PowerShell**:

```powershell
npm install
```

2. In **Supabase SQL Editor**, run:

```text
supabase/auth_foundation_patch.sql
```

3. In your Supabase dashboard:
- enable Email auth
- optionally enable Google auth
- set the site URL to your local app URL during development
- add `http://localhost:5173/auth` as a redirect URL if you want Google sign-in to work locally

4. In the **project root** in **Windows PowerShell**:

```powershell
npm run dev
```

5. Visit:
- `/auth`
- `/dashboard/settings`

## What is real now
- real session handling
- real user profile row in Supabase
- top nav follows the authenticated user
- settings page saves real profile data
- Passport link uses the authenticated username

## What is still next
- move quest participation to backend ownership
- move Prophet League writes to authenticated persistence
- derive Passport from backend XP and prediction events
- move Mirror Feed off local-only logic
