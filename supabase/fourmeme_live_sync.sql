alter table public.tokens add column if not exists address text unique;
alter table public.tokens add column if not exists source text not null default 'manual';
alter table public.tokens add column if not exists source_url text;
alter table public.tokens add column if not exists fourmeme_status text;
alter table public.tokens add column if not exists listed_pancake boolean not null default false;
alter table public.tokens add column if not exists refreshed_at timestamptz;
alter table public.tokens add column if not exists source_rank_label text;
alter table public.tokens add column if not exists total_supply numeric;
alter table public.tokens add column if not exists raw_payload jsonb;

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

alter table public.token_sync_runs enable row level security;

drop policy if exists "public read token sync runs" on public.token_sync_runs;
create policy "public read token sync runs" on public.token_sync_runs for select using (true);

create index if not exists idx_tokens_source on public.tokens(source, refreshed_at desc);
create index if not exists idx_token_sync_runs_created_at on public.token_sync_runs(created_at desc);
