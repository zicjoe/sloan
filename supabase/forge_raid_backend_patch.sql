
alter table if exists public.launch_identity_generations
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists project_summary text,
  add column if not exists hero_line text,
  add column if not exists community_hooks text[] not null default '{}',
  add column if not exists ritual_ideas text[] not null default '{}',
  add column if not exists enemy_framing text[] not null default '{}',
  add column if not exists launch_checklist text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_launch_identity_created_by_user_id
  on public.launch_identity_generations(created_by_user_id, created_at desc);

alter table if exists public.launch_identity_generations enable row level security;

drop policy if exists "users read own launch identities" on public.launch_identity_generations;
create policy "users read own launch identities"
  on public.launch_identity_generations for select
  using (
    auth.uid() = created_by_user_id
    or (created_by_user_id is null and coalesce(auth.jwt() ->> 'sub', '') = '')
  );

drop policy if exists "users insert own launch identities" on public.launch_identity_generations;
create policy "users insert own launch identities"
  on public.launch_identity_generations for insert
  with check (
    auth.uid() = created_by_user_id
    or created_by_user_id is null
  );

drop policy if exists "users update own launch identities" on public.launch_identity_generations;
create policy "users update own launch identities"
  on public.launch_identity_generations for update
  using (auth.uid() = created_by_user_id or created_by_user_id is null)
  with check (auth.uid() = created_by_user_id or created_by_user_id is null);

create table if not exists public.raid_generations (
  id text primary key,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_username text,
  token_slug text references public.tokens(slug) on delete set null,
  token_name text not null,
  token_ticker text,
  platform text not null,
  vibe text not null,
  objective text not null,
  audience text,
  contrast text,
  call_to_action_input text,
  narrative_summary text,
  momentum text,
  volume_24h numeric,
  holders integer,
  price_change_24h numeric,
  source_rank_label text,
  mission_brief text not null,
  variants text[] not null default '{}',
  reply_lines text[] not null default '{}',
  quote_replies text[] not null default '{}',
  raid_angles text[] not null default '{}',
  do_not_say text[] not null default '{}',
  call_to_action text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.raid_generations enable row level security;

drop policy if exists "users read own raid generations" on public.raid_generations;
create policy "users read own raid generations"
  on public.raid_generations for select
  using (
    auth.uid() = created_by_user_id
    or created_by_user_id is null
  );

drop policy if exists "users insert own raid generations" on public.raid_generations;
create policy "users insert own raid generations"
  on public.raid_generations for insert
  with check (
    auth.uid() = created_by_user_id
    or created_by_user_id is null
  );

drop policy if exists "users update own raid generations" on public.raid_generations;
create policy "users update own raid generations"
  on public.raid_generations for update
  using (auth.uid() = created_by_user_id or created_by_user_id is null)
  with check (auth.uid() = created_by_user_id or created_by_user_id is null);

create index if not exists idx_raid_generations_created_by_user_id
  on public.raid_generations(created_by_user_id, created_at desc);
create index if not exists idx_raid_generations_created_by_username
  on public.raid_generations(created_by_username, created_at desc);
create index if not exists idx_raid_generations_token_slug
  on public.raid_generations(token_slug, created_at desc);
