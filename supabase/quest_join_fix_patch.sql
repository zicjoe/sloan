-- Allow authenticated users to upsert quest definitions that back live-generated Quest Arena cards.
-- This is required because Quest Arena currently derives quests from live token data in the app,
-- then needs a matching row in public.quests before participants/submissions can reference it.

alter table public.quests enable row level security;

drop policy if exists "authenticated insert quests" on public.quests;
create policy "authenticated insert quests"
  on public.quests for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated update quests" on public.quests;
create policy "authenticated update quests"
  on public.quests for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
