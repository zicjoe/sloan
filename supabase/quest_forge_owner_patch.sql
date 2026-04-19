alter table public.quests
  add column if not exists mission_brief text,
  add column if not exists submission_rule text,
  add column if not exists example_proof text,
  add column if not exists proof_type text,
  add column if not exists difficulty text,
  add column if not exists created_by_user_id text,
  add column if not exists created_by_username text,
  add column if not exists ai_suggested boolean not null default false,
  add column if not exists owner_note text;

alter table public.quests
  drop constraint if exists quests_proof_type_check;

alter table public.quests
  add constraint quests_proof_type_check
  check (proof_type is null or proof_type in ('link','text','image','prediction'));

alter table public.quests
  drop constraint if exists quests_difficulty_check;

alter table public.quests
  add constraint quests_difficulty_check
  check (difficulty is null or difficulty in ('easy','medium','hard'));

create index if not exists idx_quests_created_by_user_id on public.quests(created_by_user_id, created_at desc);
create index if not exists idx_quests_token_slug_created_at on public.quests(token_slug, created_at desc);


alter table public.quests enable row level security;

drop policy if exists "users insert own quests" on public.quests;
create policy "users insert own quests"
  on public.quests for insert
  with check (auth.uid()::text = created_by_user_id);

drop policy if exists "users update own quests" on public.quests;
create policy "users update own quests"
  on public.quests for update
  using (auth.uid()::text = created_by_user_id)
  with check (auth.uid()::text = created_by_user_id);
