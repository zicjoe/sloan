create extension if not exists pgcrypto;

create table if not exists public.tokens (
  id text primary key,
  slug text unique not null,
  name text not null,
  ticker text not null,
  price numeric not null default 0,
  price_change_24h numeric not null default 0,
  market_cap numeric not null default 0,
  volume_24h numeric not null default 0,
  holders integer not null default 0,
  total_supply numeric,
  momentum text not null check (momentum in ('rising','falling','stable')),
  image text,
  narrative_summary text,
  address text unique,
  source text not null default 'manual',
  source_url text,
  fourmeme_status text,
  listed_pancake boolean not null default false,
  refreshed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.token_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('success','partial','error','running')),
  synced_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.token_convictions (
  token_slug text primary key references public.tokens(slug) on delete cascade,
  bull_case text[] not null default '{}',
  bear_case text[] not null default '{}',
  risks text[] not null default '{}',
  triggers text[] not null default '{}',
  conviction_score integer not null default 0,
  timeframe text not null default '7 days',
  updated_at timestamptz not null default now()
);

create table if not exists public.token_swarm (
  id uuid primary key default gen_random_uuid(),
  token_slug text not null references public.tokens(slug) on delete cascade,
  label text not null,
  percentage integer not null,
  trend text not null check (trend in ('up','down','stable')),
  created_at timestamptz not null default now()
);

create table if not exists public.token_lore (
  id text primary key,
  token_slug text not null references public.tokens(slug) on delete cascade,
  timestamp timestamptz not null,
  content text not null,
  type text not null check (type in ('event','announcement','milestone'))
);

create table if not exists public.quests (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('posting','prediction','meme','rivalry','recovery')),
  reward integer not null default 0,
  deadline timestamptz,
  progress integer,
  completed boolean not null default false,
  token_slug text references public.tokens(slug) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id text primary key,
  user_id text not null,
  username text not null,
  token_slug text not null references public.tokens(slug) on delete cascade,
  token_name text not null,
  prediction text not null check (prediction in ('moon','dump','sideways')),
  target_price numeric,
  timeframe text not null,
  reasoning text not null,
  timestamp timestamptz not null default now(),
  likes integer not null default 0,
  status text not null default 'pending' check (status in ('pending','correct','incorrect'))
);

create table if not exists public.prophets (
  username text primary key,
  rank integer not null,
  accuracy numeric not null,
  total_predictions integer not null,
  correct_predictions integer not null,
  streak integer not null default 0,
  avatar text
);

create table if not exists public.user_profiles (
  username text primary key,
  display_name text not null,
  avatar text,
  archetype text not null,
  prophet_rank integer not null,
  raider_impact integer not null default 0,
  quests_completed integer not null default 0,
  favorite_categories text[] not null default '{}',
  joined_date date not null,
  badges text[] not null default '{}'
);

create table if not exists public.counterfactual_entries (
  id text primary key,
  token_name text not null,
  token_slug text not null references public.tokens(slug) on delete cascade,
  missed_action text not null,
  potential_gain numeric not null,
  timestamp timestamptz not null,
  insight text not null
);

create table if not exists public.raid_campaigns (
  id text primary key,
  name text not null,
  token_slug text not null references public.tokens(slug) on delete cascade,
  status text not null check (status in ('active','completed')),
  participants integer not null default 0,
  posts_generated integer not null default 0,
  engagement integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_identity_generations (
  id text primary key,
  created_by text not null,
  concept text not null,
  target_audience text not null,
  vibe text not null,
  project_name text not null,
  meme_dna text[] not null default '{}',
  name_options text[] not null default '{}',
  ticker_options text[] not null default '{}',
  lore text[] not null default '{}',
  slogans text[] not null default '{}',
  launch_copy text[] not null default '{}',
  aesthetic_direction text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.tokens enable row level security;
alter table public.token_sync_runs enable row level security;
alter table public.token_convictions enable row level security;
alter table public.token_swarm enable row level security;
alter table public.token_lore enable row level security;
alter table public.quests enable row level security;
alter table public.predictions enable row level security;
alter table public.prophets enable row level security;
alter table public.user_profiles enable row level security;
alter table public.counterfactual_entries enable row level security;
alter table public.raid_campaigns enable row level security;
alter table public.launch_identity_generations enable row level security;

drop policy if exists "public read tokens" on public.tokens;
create policy "public read tokens" on public.tokens for select using (true);

drop policy if exists "public read token sync runs" on public.token_sync_runs;
create policy "public read token sync runs" on public.token_sync_runs for select using (true);

drop policy if exists "public read token convictions" on public.token_convictions;
create policy "public read token convictions" on public.token_convictions for select using (true);

drop policy if exists "public read token swarm" on public.token_swarm;
create policy "public read token swarm" on public.token_swarm for select using (true);

drop policy if exists "public read token lore" on public.token_lore;
create policy "public read token lore" on public.token_lore for select using (true);

drop policy if exists "public read quests" on public.quests;
create policy "public read quests" on public.quests for select using (true);

drop policy if exists "public read predictions" on public.predictions;
create policy "public read predictions" on public.predictions for select using (true);

drop policy if exists "public insert predictions" on public.predictions;
create policy "public insert predictions" on public.predictions for insert with check (true);

drop policy if exists "public read prophets" on public.prophets;
create policy "public read prophets" on public.prophets for select using (true);

drop policy if exists "public read profiles" on public.user_profiles;
create policy "public read profiles" on public.user_profiles for select using (true);

drop policy if exists "public update profiles" on public.user_profiles;
create policy "public update profiles" on public.user_profiles for update using (true) with check (true);

drop policy if exists "public read counterfactuals" on public.counterfactual_entries;
create policy "public read counterfactuals" on public.counterfactual_entries for select using (true);

drop policy if exists "public read raid campaigns" on public.raid_campaigns;
create policy "public read raid campaigns" on public.raid_campaigns for select using (true);

drop policy if exists "public read launch identities" on public.launch_identity_generations;
create policy "public read launch identities" on public.launch_identity_generations for select using (true);

drop policy if exists "public insert launch identities" on public.launch_identity_generations;
create policy "public insert launch identities" on public.launch_identity_generations for insert with check (true);

create index if not exists idx_tokens_source on public.tokens(source, refreshed_at desc);
create index if not exists idx_tokens_source_rank_label on public.tokens(source_rank_label, refreshed_at desc);
create index if not exists idx_token_sync_runs_created_at on public.token_sync_runs(created_at desc);
create index if not exists idx_predictions_username on public.predictions(username);
create index if not exists idx_predictions_timestamp on public.predictions(timestamp desc);
create index if not exists idx_token_swarm_token_slug on public.token_swarm(token_slug);
create index if not exists idx_token_lore_token_slug on public.token_lore(token_slug);
create index if not exists idx_launch_identity_created_by on public.launch_identity_generations(created_by, created_at desc);

-- Demo seed rows removed so Sloan starts clean and live-first.
-- No demo rows are inserted by default. Use live sync workers to populate Sloan.
