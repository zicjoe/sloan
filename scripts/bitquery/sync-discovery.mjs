import { NEW_TOKENS_QUERY, TOP_LIQUIDITY_QUERY, TOP_MARKETCAP_QUERY, TOP_VOLUME_QUERY } from './queries.mjs';
import { argumentMap, env, nowIso, recordSyncRun, runBitquery, slugify, summariseTokenForUi, supabaseSelect, supabaseUpsert, safeNumber } from './shared.mjs';

function mapNewTokenEvent(event) {
  const args = argumentMap(event?.Arguments || []);
  const tokenAddress = args.token || args.tokenAddress || args.memeToken || args.currency || null;
  const name = args.name || args.tokenName || args.currencyName || tokenAddress;
  const symbol = args.symbol || args.ticker || args.currencySymbol || 'TOKEN';
  const creatorAddress = args.creator || event?.Transaction?.From || null;
  const totalSupply = safeNumber(args.totalSupply || args.supply || 1000000000, 1000000000);
  return {
    token_address: tokenAddress,
    name,
    symbol,
    slug: slugify(`${name}-${symbol}`),
    creator_address: creatorAddress,
    created_at_chain: event?.Block?.Time || nowIso(),
    source_protocol: 'bitquery_fourmeme',
    source_url: tokenAddress ? `https://four.meme/token/${tokenAddress}` : null,
    last_seen_at: nowIso(),
    raw_profile_json: { event, parsedArguments: args },
    total_supply: totalSupply,
  };
}

function mapMarketRow(row, rankLabel, capturedAt) {
  const tokenAddress = row?.Trade?.Currency?.SmartContract || null;
  const name = row?.Trade?.Currency?.Name || tokenAddress;
  const symbol = row?.Trade?.Currency?.Symbol || 'TOKEN';
  const priceUsd = safeNumber(row?.Trade?.PriceInUSD ?? row?.Trade?.current ?? row?.Trade?.price_24hr, null);
  const marketCapUsd = safeNumber(row?.Marketcap ?? (priceUsd != null ? priceUsd * 1_000_000_000 : null), null);
  const volume24hUsd = safeNumber(row?.volume_24hr ?? null, null);
  return {
    token_address: tokenAddress,
    captured_at: capturedAt,
    price_usd: priceUsd,
    market_cap_usd: marketCapUsd,
    volume_24h_usd: volume24hUsd,
    trade_count_24h: safeNumber(row?.trades_24hr ?? null, null),
    price_change_5m_pct: safeNumber(row?.change_5min ?? null, null),
    price_change_1h_pct: safeNumber(row?.change_1hr ?? null, null),
    price_change_24h_pct: safeNumber(row?.change_24hr ?? null, null),
    curve_progress_pct: null,
    rank_label: rankLabel,
    raw_snapshot_json: row,
    name,
    symbol,
  };
}

function mapLiquidityRow(row, capturedAt) {
  const tokenAddress = row?.Currency?.SmartContract || null;
  return {
    token_address: tokenAddress,
    captured_at: capturedAt,
    liquidity_usd: null,
    curve_progress_pct: null,
    rank_label: 'LIQUID',
    raw_snapshot_json: row,
    name: row?.Currency?.Name || tokenAddress,
    symbol: row?.Currency?.Symbol || 'TOKEN',
  };
}



function profileToTokenRow(profile) {
  return summariseTokenForUi({
    tokenAddress: profile.token_address,
    name: profile.name,
    symbol: profile.symbol,
    priceUsd: 0,
    priceChange24h: 0,
    marketCapUsd: 0,
    volume24hUsd: 0,
    holders: 0,
    sourceLabel: 'NEW',
    migrated: false,
    updatedAt: profile.created_at_chain || profile.last_seen_at || nowIso(),
    narrativeSummary: 'Fresh token detected from live Bitquery create events.',
    rawPayload: profile.raw_profile_json,
  });
}

function snapshotPriority(rankLabel) {
  const normalized = String(rankLabel || '').toUpperCase();
  if (normalized === 'HOT') return 3;
  if (normalized === 'VOL') return 2;
  if (normalized === 'LIQUID') return 1;
  return 0;
}

function pickPreferredSnapshots(snapshotRows) {
  const chosen = new Map();
  for (const row of snapshotRows || []) {
    if (!row?.token_address) continue;
    const existing = chosen.get(row.token_address);
    if (!existing || snapshotPriority(row.rank_label) > snapshotPriority(existing.rank_label)) {
      chosen.set(row.token_address, row);
    }
  }
  return [...chosen.values()];
}

function dedupeBy(rows, keyFn) {
  const seen = new Map();
  for (const row of rows || []) {
    const key = keyFn(row);
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

async function ensureProfilesFromSnapshotRows(snapshotRows) {
  const existing = await supabaseSelect('bq_token_profiles', 'token_address', { limit: '5000' });
  const known = new Set(existing.map((row) => row.token_address));
  const newProfiles = dedupeBy(
    snapshotRows
      .filter((row) => row.token_address && !known.has(row.token_address))
      .map((row) => ({
        token_address: row.token_address,
        slug: slugify(`${row.name}-${row.symbol}`),
        name: row.name || row.token_address,
        symbol: row.symbol || 'TOKEN',
        source_protocol: 'bitquery_fourmeme',
        source_url: row.token_address ? `https://four.meme/token/${row.token_address}` : null,
        last_seen_at: nowIso(),
        raw_profile_json: row.raw_snapshot_json,
      })),
    (row) => row.token_address
  );
  if (newProfiles.length) {
    await supabaseUpsert('bq_token_profiles', newProfiles, 'token_address');
  }
}

async function mirrorLatestRowsIntoTokens(snapshotRows, holdersMap = new Map()) {
  const preferredRows = pickPreferredSnapshots(snapshotRows);
  const rows = preferredRows
    .filter((row) => row.token_address)
    .map((row) => summariseTokenForUi({
      tokenAddress: row.token_address,
      name: row.name,
      symbol: row.symbol,
      priceUsd: row.price_usd,
      priceChange24h: row.price_change_24h_pct,
      marketCapUsd: row.market_cap_usd,
      volume24hUsd: row.volume_24h_usd,
      holders: holdersMap.get(row.token_address) || 0,
      sourceLabel: row.rank_label,
      migrated: false,
      updatedAt: row.captured_at,
      narrativeSummary: `Live ${row.rank_label || 'DISCOVERY'} snapshot from Bitquery.`,
      rawPayload: row.raw_snapshot_json,
    }));
  if (rows.length) {
    await supabaseUpsert('tokens', rows, 'address');
  }
}

async function run() {
  const startedAt = nowIso();
  try {
    const [newTokensData, topMarketData, topVolumeData, topLiquidityData] = await Promise.all([
      runBitquery(NEW_TOKENS_QUERY, { limit: env.freshLimit }),
      runBitquery(TOP_MARKETCAP_QUERY, { limit: env.hotLimit }),
      runBitquery(TOP_VOLUME_QUERY, { limit: env.volumeLimit }),
      runBitquery(TOP_LIQUIDITY_QUERY, { limit: env.liquidityLimit }),
    ]);

    const profileRows = dedupeBy(
      (newTokensData?.EVM?.Events || []).map(mapNewTokenEvent).filter((row) => row.token_address),
      (row) => row.token_address
    );
    if (profileRows.length) {
      await supabaseUpsert('bq_token_profiles', profileRows, 'token_address');
      await supabaseUpsert('tokens', profileRows.map(profileToTokenRow), 'address');
    }

    const capturedAt = nowIso();
    const hotSnapshots = dedupeBy((topMarketData?.EVM?.DEXTradeByTokens || []).map((row) => mapMarketRow(row, 'HOT', capturedAt)).filter((row) => row.token_address), (row) => `${row.token_address}:HOT`);
    const volumeSnapshots = dedupeBy((topVolumeData?.EVM?.DEXTradeByTokens || []).map((row) => mapMarketRow(row, 'VOL', capturedAt)).filter((row) => row.token_address), (row) => `${row.token_address}:VOL`);
    const liquiditySnapshots = dedupeBy((topLiquidityData?.EVM?.BalanceUpdates || []).map((row) => mapLiquidityRow(row, capturedAt)).filter((row) => row.token_address), (row) => `${row.token_address}:LIQUID`);

    const snapshots = [...hotSnapshots, ...volumeSnapshots, ...liquiditySnapshots];
    if (snapshots.length) {
      await ensureProfilesFromSnapshotRows(snapshots);
      await supabaseUpsert(
        'bq_token_market_snapshots',
        snapshots.map(({ name, symbol, ...rest }) => rest),
        'token_address,captured_at,rank_label'
      );
      await mirrorLatestRowsIntoTokens(snapshots);
    }

    await recordSyncRun({
      jobType: 'bitquery-discovery',
      status: 'success',
      recordsWritten: profileRows.length + snapshots.length,
      startedAt,
      finishedAt: nowIso(),
      details: `profiles=${profileRows.length}, snapshots=${snapshots.length}`,
    });

    console.log(JSON.stringify({ success: true, profiles: profileRows.length, snapshots: snapshots.length }, null, 2));
  } catch (error) {
    await recordSyncRun({
      jobType: 'bitquery-discovery',
      status: 'error',
      recordsWritten: 0,
      startedAt,
      finishedAt: nowIso(),
      details: error instanceof Error ? error.message : String(error),
    }).catch(() => {});
    console.error(error);
    process.exitCode = 1;
  }
}

run();
