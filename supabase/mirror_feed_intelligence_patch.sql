create extension if not exists pgcrypto;

create table if not exists public.mirror_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  token_slug text not null references public.tokens(slug) on delete cascade,
  token_name text not null,
  pattern_bucket text not null check (pattern_bucket in ('hesitation','peak_chasing','late_exit','over_caution')),
  source_surface text not null check (source_surface in ('prediction','quest','raid','token_watch')),
  source_id text not null,
  source_action text not null,
  missed_action text not null,
  potential_gain numeric not null,
  insight text not null,
  next_move text,
  confidence integer not null default 60 check (confidence >= 0 and confidence <= 100),
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_surface, source_id, source_action, pattern_bucket)
);

alter table public.mirror_entries enable row level security;

drop policy if exists "users read own mirror entries" on public.mirror_entries;
create policy "users read own mirror entries"
  on public.mirror_entries for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own mirror entries" on public.mirror_entries;
create policy "users insert own mirror entries"
  on public.mirror_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own mirror entries" on public.mirror_entries;
create policy "users update own mirror entries"
  on public.mirror_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_mirror_entries_user_timestamp
  on public.mirror_entries(user_id, timestamp desc);
create index if not exists idx_mirror_entries_username_timestamp
  on public.mirror_entries(username, timestamp desc);
create index if not exists idx_mirror_entries_token_slug
  on public.mirror_entries(token_slug, timestamp desc);
