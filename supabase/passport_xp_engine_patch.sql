create extension if not exists pgcrypto;

create table if not exists public.xp_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  source_type text not null check (source_type in ('quest_submission','quest_join','prediction','prediction_resolution','forge_generation','raid_generation')),
  source_id text not null,
  action text not null,
  xp_delta integer not null default 0,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_type, source_id, action)
);

create table if not exists public.passport_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  badge_key text not null,
  badge_label text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

alter table public.xp_events enable row level security;
alter table public.passport_badges enable row level security;

drop policy if exists "users read own xp events" on public.xp_events;
create policy "users read own xp events"
  on public.xp_events for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own xp events" on public.xp_events;
create policy "users insert own xp events"
  on public.xp_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own xp events" on public.xp_events;
create policy "users update own xp events"
  on public.xp_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users read own passport badges" on public.passport_badges;
create policy "users read own passport badges"
  on public.passport_badges for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own passport badges" on public.passport_badges;
create policy "users insert own passport badges"
  on public.passport_badges for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own passport badges" on public.passport_badges;
create policy "users update own passport badges"
  on public.passport_badges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_xp_events_user_created_at
  on public.xp_events(user_id, created_at desc);
create index if not exists idx_xp_events_username_created_at
  on public.xp_events(username, created_at desc);
create index if not exists idx_passport_badges_user_id
  on public.passport_badges(user_id, created_at desc);
create index if not exists idx_passport_badges_username
  on public.passport_badges(username, created_at desc);
