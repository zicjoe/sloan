create extension if not exists pgcrypto;

create table if not exists public.quest_participants (
  id uuid primary key default gen_random_uuid(),
  quest_id text not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  joined_at timestamptz not null default now(),
  unique (quest_id, user_id)
);

create table if not exists public.quest_submissions (
  id text primary key,
  quest_id text not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  proof_type text not null check (proof_type in ('link','image','text','prediction')),
  proof_value text not null,
  note text,
  status text not null check (status in ('accepted','pending','rejected')),
  xp_awarded integer not null default 0,
  review_summary text,
  created_at timestamptz not null default now()
);

alter table public.predictions
  add column if not exists call_type text,
  add column if not exists confidence text,
  add column if not exists compare_token_slug text,
  add column if not exists compare_token_name text,
  add column if not exists expires_at timestamptz,
  add column if not exists baseline_price numeric,
  add column if not exists baseline_volume_24h numeric,
  add column if not exists baseline_holders integer,
  add column if not exists resolution_note text,
  add column if not exists score_awarded integer,
  add column if not exists question text,
  add column if not exists binary_answer text;

alter table public.quest_participants enable row level security;
alter table public.quest_submissions enable row level security;

-- Read access stays open so live boards, feeds, and leaderboards can render.
drop policy if exists "public read quest participants" on public.quest_participants;
create policy "public read quest participants"
  on public.quest_participants for select
  using (true);

drop policy if exists "public read quest submissions" on public.quest_submissions;
create policy "public read quest submissions"
  on public.quest_submissions for select
  using (true);

-- Users can only create their own participation and receipts.
drop policy if exists "users join own quests" on public.quest_participants;
create policy "users join own quests"
  on public.quest_participants for insert
  with check (auth.uid() = user_id);

drop policy if exists "users submit own quest proof" on public.quest_submissions;
create policy "users submit own quest proof"
  on public.quest_submissions for insert
  with check (auth.uid() = user_id);

-- Tighten prediction writes so ownership is real.
drop policy if exists "public insert predictions" on public.predictions;
drop policy if exists "users insert own predictions" on public.predictions;
create policy "users insert own predictions"
  on public.predictions for insert
  with check (auth.uid()::text = user_id);

drop policy if exists "users update own predictions" on public.predictions;
create policy "users update own predictions"
  on public.predictions for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create index if not exists idx_quest_participants_quest_id on public.quest_participants(quest_id, joined_at desc);
create index if not exists idx_quest_participants_user_id on public.quest_participants(user_id, joined_at desc);
create index if not exists idx_quest_submissions_quest_id on public.quest_submissions(quest_id, created_at desc);
create index if not exists idx_quest_submissions_user_id on public.quest_submissions(user_id, created_at desc);
create index if not exists idx_predictions_user_id on public.predictions(user_id, timestamp desc);
