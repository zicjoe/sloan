-- Sloan Bitquery foundation for live Four.meme market, trade, and trust data.
-- Run this after your base schema.sql.

create table if not exists public.bq_token_profiles (
  token_address text primary key,
  slug text,
  name text not null,
  symbol text,
  creator_address text,
  created_at_chain timestamptz,
  source_protocol text not null default 'bitquery_fourmeme',
  source_url text,
  is_migrated boolean,
  is_phishy boolean,
  dev_address text,
  dev_holding_pct numeric,
  top10_holder_pct numeric,
  total_supply numeric,
  last_seen_at timestamptz not null default now(),
  raw_profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bq_token_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.bq_token_profiles(token_address) on delete cascade,
  captured_at timestamptz not null,
  price_usd numeric,
  market_cap_usd numeric,
  liquidity_usd numeric,
  volume_24h_usd numeric,
  trade_count_24h integer,
  price_change_5m_pct numeric,
  price_change_1h_pct numeric,
  price_change_24h_pct numeric,
  curve_progress_pct numeric,
  rank_label text,
  raw_snapshot_json jsonb not null default '{}'::jsonb
);

create table if not exists public.bq_token_ohlcv (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.bq_token_profiles(token_address) on delete cascade,
  bucket_start timestamptz not null,
  interval_label text not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume_usd numeric,
  trades integer,
  raw_ohlcv_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (token_address, bucket_start, interval_label)
);

create table if not exists public.bq_live_trades (
  id uuid primary key default gen_random_uuid(),
  token_address text references public.bq_token_profiles(token_address) on delete cascade,
  tx_hash text not null,
  trade_time timestamptz not null,
  side text not null check (side in ('buy','sell')),
  amount_token numeric,
  amount_quote numeric,
  price_usd numeric,
  trader_address text,
  protocol_name text,
  raw_trade_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tx_hash, side)
);

create table if not exists public.bq_liquidity_events (
  id uuid primary key default gen_random_uuid(),
  token_address text references public.bq_token_profiles(token_address) on delete cascade,
  tx_hash text not null,
  event_time timestamptz not null,
  event_type text not null,
  liquidity_usd numeric,
  target_dex text,
  raw_event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tx_hash, event_type)
);

create table if not exists public.bq_migrations (
  id uuid primary key default gen_random_uuid(),
  token_address text references public.bq_token_profiles(token_address) on delete cascade,
  migration_time timestamptz not null,
  destination_dex text,
  pair_address text,
  pool_address text,
  raw_migration_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (token_address, migration_time)
);

create table if not exists public.bq_top_traders (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.bq_token_profiles(token_address) on delete cascade,
  wallet_address text not null,
  window_label text not null,
  buy_volume numeric,
  sell_volume numeric,
  trade_count integer,
  last_trade_at timestamptz,
  rank_position integer,
  volume_usd numeric,
  raw_trader_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (token_address, wallet_address, window_label)
);

create table if not exists public.bq_sync_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('success','partial','error','running')),
  records_written integer not null default 0,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bq_profiles_last_seen on public.bq_token_profiles(last_seen_at desc);
create index if not exists idx_bq_market_snapshots_token_time on public.bq_token_market_snapshots(token_address, captured_at desc);
create index if not exists idx_bq_market_snapshots_rank_label on public.bq_token_market_snapshots(rank_label, captured_at desc);
create index if not exists idx_bq_live_trades_token_time on public.bq_live_trades(token_address, trade_time desc);
create index if not exists idx_bq_liquidity_events_token_time on public.bq_liquidity_events(token_address, event_time desc);
create index if not exists idx_bq_migrations_token_time on public.bq_migrations(token_address, migration_time desc);
create index if not exists idx_bq_top_traders_token_rank on public.bq_top_traders(token_address, rank_position asc);
create index if not exists idx_bq_sync_runs_job_created on public.bq_sync_runs(job_type, created_at desc);

alter table public.bq_token_profiles enable row level security;
alter table public.bq_token_market_snapshots enable row level security;
alter table public.bq_token_ohlcv enable row level security;
alter table public.bq_live_trades enable row level security;
alter table public.bq_liquidity_events enable row level security;
alter table public.bq_migrations enable row level security;
alter table public.bq_top_traders enable row level security;
alter table public.bq_sync_runs enable row level security;

drop policy if exists "public read bq token profiles" on public.bq_token_profiles;
create policy "public read bq token profiles" on public.bq_token_profiles for select using (true);

drop policy if exists "public read bq token market snapshots" on public.bq_token_market_snapshots;
create policy "public read bq token market snapshots" on public.bq_token_market_snapshots for select using (true);

drop policy if exists "public read bq token ohlcv" on public.bq_token_ohlcv;
create policy "public read bq token ohlcv" on public.bq_token_ohlcv for select using (true);

drop policy if exists "public read bq live trades" on public.bq_live_trades;
create policy "public read bq live trades" on public.bq_live_trades for select using (true);

drop policy if exists "public read bq liquidity events" on public.bq_liquidity_events;
create policy "public read bq liquidity events" on public.bq_liquidity_events for select using (true);

drop policy if exists "public read bq migrations" on public.bq_migrations;
create policy "public read bq migrations" on public.bq_migrations for select using (true);

drop policy if exists "public read bq top traders" on public.bq_top_traders;
create policy "public read bq top traders" on public.bq_top_traders for select using (true);

drop policy if exists "public read bq sync runs" on public.bq_sync_runs;
create policy "public read bq sync runs" on public.bq_sync_runs for select using (true);

create or replace view public.bq_latest_market_snapshot as
select distinct on (token_address)
  token_address,
  captured_at,
  price_usd,
  market_cap_usd,
  liquidity_usd,
  volume_24h_usd,
  trade_count_24h,
  price_change_5m_pct,
  price_change_1h_pct,
  price_change_24h_pct,
  curve_progress_pct,
  rank_label,
  raw_snapshot_json
from public.bq_token_market_snapshots
order by token_address, captured_at desc;

create or replace view public.token_live_overview as
select
  t.id,
  t.slug,
  coalesce(p.name, t.name) as name,
  coalesce(p.symbol, t.ticker) as ticker,
  t.address,
  coalesce(m.price_usd, t.price) as price,
  coalesce(m.market_cap_usd, t.market_cap) as market_cap,
  coalesce(m.volume_24h_usd, t.volume_24h) as volume_24h,
  t.holders,
  m.trade_count_24h,
  m.curve_progress_pct,
  p.dev_holding_pct,
  p.top10_holder_pct,
  p.is_migrated,
  m.rank_label,
  m.captured_at as market_updated_at,
  t.refreshed_at as app_updated_at,
  t.source,
  t.source_url
from public.tokens t
left join public.bq_token_profiles p on p.token_address = t.address
left join public.bq_latest_market_snapshot m on m.token_address = t.address;


alter table public.tokens add column if not exists source_rank_label text;
alter table public.tokens add column if not exists raw_payload jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_bq_token_market_snapshots_token_captured_rank'
  ) THEN
    ALTER TABLE public.bq_token_market_snapshots
      ADD CONSTRAINT uq_bq_token_market_snapshots_token_captured_rank
      UNIQUE (token_address, captured_at, rank_label);
  END IF;
END $$;
