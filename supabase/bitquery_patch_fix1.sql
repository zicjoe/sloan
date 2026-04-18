-- Apply this patch if you already ran the earlier Bitquery foundation SQL.
-- It adds the conflict target needed by market snapshot upserts and the token mirror columns used by Sloan.

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
