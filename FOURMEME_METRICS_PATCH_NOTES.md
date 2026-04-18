Sloan metrics patch

What changed
- Four.meme live sync now enriches token metrics from the public Binance Web3 Meme Rush rank API filtered to Four.meme protocol 2001.
- This fills market cap, 24h volume, holders, price change, and a better Sloan momentum label.
- Four.meme direct token endpoints remain in the sync path for token identity and detail hydration where available.

What to do
1. Replace your project files with this patch.
2. Keep your existing Supabase env values.
3. Run: npm run sync:fourmeme
4. Refresh Sloan in the browser.

Optional env
BINANCE_WEB3_BASE_URL=https://web3.binance.com
