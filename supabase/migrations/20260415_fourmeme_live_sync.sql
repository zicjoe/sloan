alter table if exists public.tokens
  add column if not exists token_address text,
  add column if not exists source_url text,
  add column if not exists source_status text,
  add column if not exists source_rank_label text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists raw_payload jsonb default '{}'::jsonb;

create unique index if not exists idx_tokens_token_address on public.tokens(token_address) where token_address is not null;
create index if not exists idx_tokens_last_synced_at on public.tokens(last_synced_at desc);

create table if not exists public.fourmeme_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  tokens_processed integer not null default 0,
  rankings_fetched text[] not null default '{}',
  notes text
);

alter table public.fourmeme_sync_runs enable row level security;

drop policy if exists "public read fourmeme sync runs" on public.fourmeme_sync_runs;
create policy "public read fourmeme sync runs" on public.fourmeme_sync_runs for select using (true);
