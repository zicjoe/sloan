alter table public.tokens add column if not exists total_supply numeric;

comment on column public.tokens.total_supply is 'Optional total token supply used for market cap fallback when upstream marketCap is missing.';
