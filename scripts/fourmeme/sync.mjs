import process from 'node:process';
import {
  coalescePositiveNumber,
  dedupeCandidates,
  fetchCandidateLists,
  fetchTokenDetail,
  loadEnv,
  normalizeToken,
  selectSupabase,
  upsertSupabase,
} from './shared.mjs';

loadEnv();

function mergeTokenWithExisting(token, existing = {}) {
  const totalSupply = coalescePositiveNumber(token.total_supply, existing.total_supply);
  const price = coalescePositiveNumber(token.price, existing.price);
  const marketCap = coalescePositiveNumber(
    token.market_cap,
    totalSupply > 0 && price > 0 ? totalSupply * price : 0,
    existing.market_cap,
  );

  const volume24h = coalescePositiveNumber(token.volume_24h, existing.volume_24h);
  const holders = Math.round(coalescePositiveNumber(token.holders, existing.holders));
  const priceChange24h = (typeof token.price_change_24h === 'number' && Number.isFinite(token.price_change_24h) && token.price_change_24h !== 0)
    ? token.price_change_24h
    : ((typeof existing.price_change_24h === 'number' && Number.isFinite(existing.price_change_24h)) ? existing.price_change_24h : 0);

  return {
    ...existing,
    ...token,
    price,
    market_cap: marketCap,
    volume_24h: volume24h,
    holders,
    price_change_24h: priceChange24h,
    total_supply: totalSupply > 0 ? totalSupply : null,
    refreshed_at: token.refreshed_at || new Date().toISOString(),
  };
}

async function run() {
  const { results, errors } = await fetchCandidateLists();
  const candidates = dedupeCandidates(results).slice(0, 40);

  if (candidates.length === 0) {
    await upsertSupabase('token_sync_runs', [{
      source: 'four.meme',
      status: 'error',
      synced_count: 0,
      inserted_count: 0,
      updated_count: 0,
      details: errors.length > 0 ? errors.join(' | ') : 'No token candidates returned from Four.meme.',
    }]);

    throw new Error(errors.length > 0 ? errors.join(' | ') : 'Four.meme returned zero candidates.');
  }

  const usedSlugs = new Set();
  const normalized = [];

  for (const item of candidates) {
    const raw = item.data || {};
    const address = raw.address || raw.tokenAddress || raw.contractAddress || raw.coinAddress || raw.ca || raw.currencyAddress || '';
    const detail = address ? await fetchTokenDetail(String(address)) : null;
    const token = normalizeToken(raw, detail, usedSlugs, item.label);
    if (token) normalized.push(token);
  }

  const existing = await selectSupabase('tokens', '*', {});
  const existingBySlug = new Map(existing.map((row) => [row.slug, row]));
  const existingSlugs = new Set(existing.map((row) => row.slug));

  const rows = Array.from(new Map(normalized.map((token) => {
    const merged = mergeTokenWithExisting(token, existingBySlug.get(token.slug) || {});
    return [token.slug, merged];
  })).values());

  const insertedCount = rows.filter((row) => !existingSlugs.has(row.slug)).length;
  const updatedCount = rows.length - insertedCount;

  await upsertSupabase('tokens', rows, 'slug');
  await upsertSupabase('token_sync_runs', [{
    source: 'four.meme',
    status: errors.length > 0 ? 'partial' : 'success',
    synced_count: rows.length,
    inserted_count: insertedCount,
    updated_count: updatedCount,
    details: errors.length > 0 ? errors.join(' | ') : 'Four.meme sync completed successfully.',
  }]);

  console.log(JSON.stringify({
    success: true,
    syncedCount: rows.length,
    insertedCount,
    updatedCount,
    sampleSlugs: rows.slice(0, 8).map((row) => row.slug),
    warnings: errors,
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
