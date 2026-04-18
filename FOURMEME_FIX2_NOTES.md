Sloan Four.meme fix 2

What changed
- tiny token prices now display correctly instead of rounding down to $0.000000
- Four.meme candidate rows are merged across sources before normalization so richer Binance pulse fields are not lost during dedupe
- sync now preserves older non-zero metrics when a fresh row is missing market cap, holders, or 24h change
- market cap can now fall back to price * total_supply when total supply is available

What to run
1. In Supabase SQL Editor run: supabase/fourmeme_metrics_fix2.sql
2. In Windows PowerShell inside the project root run:
   npm run sync:fourmeme
   npm run dev
