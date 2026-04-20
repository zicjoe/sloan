alter table public.tokens add column if not exists label text;
alter table public.tokens add column if not exists launch_time timestamptz;
alter table public.tokens add column if not exists request_id text;
alter table public.tokens add column if not exists ai_created boolean not null default false;
alter table public.tokens add column if not exists x_mode boolean not null default false;
alter table public.tokens add column if not exists anti_sniper_enabled boolean not null default false;
alter table public.tokens add column if not exists tax_token boolean not null default false;
alter table public.tokens add column if not exists tax_fee_rate numeric;
alter table public.tokens add column if not exists tax_has_holder_rewards boolean not null default false;
alter table public.tokens add column if not exists tax_has_burn boolean not null default false;
alter table public.tokens add column if not exists tax_has_liquidity boolean not null default false;
alter table public.tokens add column if not exists risk_flags text[] not null default '{}';
alter table public.tokens add column if not exists signal_summary text;
alter table public.tokens add column if not exists reason_line text;
alter table public.tokens add column if not exists action_bias text;
alter table public.tokens add column if not exists freshness_score integer;
alter table public.tokens add column if not exists raw_payload jsonb;

alter table public.tokens drop constraint if exists tokens_action_bias_check;
alter table public.tokens add constraint tokens_action_bias_check check (action_bias is null or action_bias in ('watch','raid','prophet','intelligence'));

create table if not exists public.token_signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  token_slug text not null references public.tokens(slug) on delete cascade,
  refreshed_at timestamptz not null default now(),
  price numeric not null default 0,
  volume_24h numeric not null default 0,
  holders integer not null default 0,
  market_cap numeric not null default 0,
  source_rank_label text,
  signal_summary text,
  action_bias text check (action_bias is null or action_bias in ('watch','raid','prophet','intelligence')),
  created_at timestamptz not null default now()
);

alter table public.token_signal_snapshots enable row level security;

drop policy if exists "public read token signal snapshots" on public.token_signal_snapshots;
create policy "public read token signal snapshots" on public.token_signal_snapshots for select using (true);

create index if not exists idx_token_signal_snapshots_token_slug on public.token_signal_snapshots(token_slug, refreshed_at desc);
