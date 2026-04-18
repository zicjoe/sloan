import {
  DEV_HOLDING_QUERY,
  LIQUIDITY_QUERY,
  TOKEN_LATEST_BUYS_SELLS_QUERY,
  TOKEN_METADATA_QUERY,
  TOKEN_OHLCV_QUERY,
  TOKEN_TRADE_METRICS_QUERY,
  TOP_HOLDERS_QUERY,
  TOP_TRADERS_QUERY,
} from './queries.mjs';
import { env, nowIso, recordSyncRun, runBitquery, safeNumber, summariseTokenForUi, supabaseSelect, supabaseUpsert } from './shared.mjs';

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString();
}

function uniqueByAddress(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const address = row?.token_address || row?.address;
    if (!address || seen.has(address)) return false;
    seen.add(address);
    return true;
  });
}

function chooseTrackedTokens(rows) {
  return uniqueByAddress(rows)
    .slice(0, env.trackedTokenLimit)
    .filter((row) => row.token_address || row.address)
    .map((row) => ({
      tokenAddress: row.token_address || row.address,
      name: row.name,
      symbol: row.symbol || row.ticker,
      slug: row.slug,
      devAddress: row.dev_address || null,
    }));
}


function firstFinite(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function clampPercent(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

async function fetchTrackedTokens() {
  const profiles = await supabaseSelect('bq_token_profiles', 'token_address,name,symbol,slug,dev_address,last_seen_at', {
    order: 'last_seen_at.desc',
    limit: String(env.trackedTokenLimit),
  }).catch(() => []);
  if (profiles.length) return chooseTrackedTokens(profiles);
  const fallbackTokens = await supabaseSelect('tokens', 'address,name,ticker,slug,refreshed_at', {
    'address': 'not.is.null',
    order: 'refreshed_at.desc',
    limit: String(env.trackedTokenLimit),
  });
  return chooseTrackedTokens(fallbackTokens);
}

async function run() {
  const startedAt = nowIso();
  try {
    const trackedTokens = await fetchTrackedTokens();
    const marketSnapshots = [];
    const ohlcvRows = [];
    const trades = [];
    const topTraders = [];
    const profilePatches = [];
    const tokenRows = [];

    const capturedAt = nowIso();

    for (const token of trackedTokens) {
      const vars = {
        token: token.tokenAddress,
        currency: token.tokenAddress,
        network: 'bsc',
        time_24hr_ago: isoAgo(24 * 60 * 60 * 1000),
        time_1hr_ago: isoAgo(60 * 60 * 1000),
        time_5min_ago: isoAgo(5 * 60 * 1000),
        address: token.devAddress || '0x0000000000000000000000000000000000000000',
      };

      const [metadataData, metricsData, ohlcvData, latestTradesData, liquidityData, holdersData, topTradersData] = await Promise.all([
        runBitquery(TOKEN_METADATA_QUERY, { token: vars.token }),
        runBitquery(TOKEN_TRADE_METRICS_QUERY, { currency: vars.currency, time_24hr_ago: vars.time_24hr_ago, time_1hr_ago: vars.time_1hr_ago, time_5min_ago: vars.time_5min_ago }),
        runBitquery(TOKEN_OHLCV_QUERY, { network: 'bsc', token: vars.token }),
        runBitquery(TOKEN_LATEST_BUYS_SELLS_QUERY, { currency: vars.currency }),
        runBitquery(LIQUIDITY_QUERY, { token: vars.token }),
        runBitquery(TOP_HOLDERS_QUERY, { token: vars.token }),
        runBitquery(TOP_TRADERS_QUERY, { network: 'bsc', token: vars.token }),
      ]);

      let devHoldingData = null;
      if (token.devAddress) {
        devHoldingData = await runBitquery(DEV_HOLDING_QUERY, { token: vars.token, address: vars.address }).catch(() => null);
      }

      const metadataTrade = metadataData?.EVM?.DEXTradeByTokens?.[0] || null;
      const holdersCount = safeNumber(metadataData?.EVM?.BalanceUpdates?.[0]?.holders, null);
      const marketPair = metadataData?.marketCap?.Trading?.Pairs?.[0] || null;
      const metrics = metricsData?.EVM?.DEXTradeByTokens?.[0] || null;
      const liquidityBalance = liquidityData?.EVM?.BalanceUpdates?.[0]?.balance;
      const rawLiquidityBalance = safeNumber(liquidityBalance, null);
      const curveProgressPct = rawLiquidityBalance == null ? null : clampPercent(100 - (((rawLiquidityBalance - 200000000) * 100) / 800000000));
      const top10HolderPct = clampPercent((holdersData?.EVM?.TransactionBalances || [])
        .reduce((sum, row) => sum + (safeNumber(row.holding_percentage, 0) || 0), 0));
      const devHoldingPct = clampPercent(safeNumber(devHoldingData?.EVM?.TransactionBalances?.[0]?.holding_percentage, null));
      const currentPrice = firstFinite(
        safeNumber(metrics?.Trade?.current, null),
        safeNumber(marketPair?.Price?.Average?.Mean, null),
        safeNumber(metadataTrade?.Trade?.PriceInUSD, null),
      );
      const marketCapUsd = firstFinite(
        safeNumber(marketPair?.marketcap, null),
        currentPrice != null ? currentPrice * safeNumber(profilePatches.at(-1)?.total_supply, 1_000_000_000) : null,
      );
      const priceChange5m = safeNumber(metrics?.change_5min, null);
      const priceChange1h = safeNumber(metrics?.change_1hr, null);
      const priceChange24h = safeNumber(metrics?.change_24hr, null);
      const latestName = token.name || metadataTrade?.Trade?.Currency?.Name || token.tokenAddress;
      const latestSymbol = token.symbol || metadataTrade?.Trade?.Currency?.Symbol || 'TOKEN';

      marketSnapshots.push({
        token_address: token.tokenAddress,
        captured_at: capturedAt,
        price_usd: currentPrice,
        market_cap_usd: marketCapUsd,
        liquidity_usd: null,
        volume_24h_usd: safeNumber(metrics?.volume_24hr, null),
        trade_count_24h: safeNumber(metrics?.trades_24hr, null),
        price_change_5m_pct: priceChange5m,
        price_change_1h_pct: priceChange1h,
        price_change_24h_pct: priceChange24h,
        curve_progress_pct: curveProgressPct,
        rank_label: 'DETAIL',
        raw_snapshot_json: {
          metadataData,
          metricsData,
          liquidityData,
        },
      });

      profilePatches.push({
        token_address: token.tokenAddress,
        slug: token.slug,
        name: latestName,
        symbol: latestSymbol,
        created_at_chain: metadataTrade?.Block?.createdAt || null,
        source_protocol: 'bitquery_fourmeme',
        source_url: `https://four.meme/token/${token.tokenAddress}`,
        is_migrated: false,
        is_phishy: null,
        dev_address: token.devAddress,
        dev_holding_pct: devHoldingPct,
        top10_holder_pct: top10HolderPct,
        last_seen_at: capturedAt,
        raw_profile_json: {
          metadataData,
          holdersData,
          devHoldingData,
        },
      });

      tokenRows.push(summariseTokenForUi({
        tokenAddress: token.tokenAddress,
        name: latestName,
        symbol: latestSymbol,
        priceUsd: currentPrice,
        priceChange24h,
        marketCapUsd,
        volume24hUsd: safeNumber(metrics?.volume_24hr, null),
        holders: holdersCount,
        sourceLabel: 'DETAIL',
        migrated: false,
        updatedAt: capturedAt,
        narrativeSummary: 'Live market detail synced from Bitquery.',
        rawPayload: {
          metricsData,
          metadataData,
        },
      }));

      for (const candle of ohlcvData?.EVM?.DEXTradeByTokens || []) {
        ohlcvRows.push({
          token_address: token.tokenAddress,
          bucket_start: candle?.Block?.Time,
          interval_label: '5m',
          open: safeNumber(candle?.Trade?.open, null),
          high: safeNumber(candle?.Trade?.high, null),
          low: safeNumber(candle?.Trade?.low, null),
          close: safeNumber(candle?.Trade?.close, null),
          volume_usd: safeNumber(candle?.volumeUSD, null),
          trades: null,
          raw_ohlcv_json: candle,
        });
      }

      for (const row of latestTradesData?.EVM?.buys || []) {
        trades.push({
          token_address: token.tokenAddress,
          tx_hash: row?.Transaction?.Hash,
          trade_time: row?.Block?.Time,
          side: 'buy',
          amount_token: safeNumber(row?.Trade?.Buy?.Amount, null),
          amount_quote: null,
          price_usd: safeNumber(row?.Trade?.Buy?.PriceInUSD, null),
          trader_address: row?.Trade?.Buy?.Buyer || null,
          protocol_name: 'fourmeme_v1',
          raw_trade_json: row,
        });
      }
      for (const row of latestTradesData?.EVM?.sells || []) {
        trades.push({
          token_address: token.tokenAddress,
          tx_hash: row?.Transaction?.Hash,
          trade_time: row?.Block?.Time,
          side: 'sell',
          amount_token: safeNumber(row?.Trade?.Sell?.Amount, null),
          amount_quote: null,
          price_usd: safeNumber(row?.Trade?.Sell?.PriceInUSD, null),
          trader_address: row?.Trade?.Sell?.Seller || null,
          protocol_name: 'fourmeme_v1',
          raw_trade_json: row,
        });
      }

      let rank = 1;
      for (const row of topTradersData?.EVM?.DEXTradeByTokens || []) {
        topTraders.push({
          token_address: token.tokenAddress,
          wallet_address: row?.Trade?.Buyer,
          window_label: 'combined',
          buy_volume: safeNumber(row?.buyVolume, null),
          sell_volume: safeNumber(row?.sellVolume, null),
          trade_count: null,
          last_trade_at: null,
          rank_position: rank++,
          volume_usd: safeNumber(row?.volumeUsd, null),
          raw_trader_json: row,
        });
      }
    }

    if (profilePatches.length) await supabaseUpsert('bq_token_profiles', profilePatches, 'token_address');
    if (marketSnapshots.length) await supabaseUpsert('bq_token_market_snapshots', marketSnapshots, 'token_address,captured_at,rank_label');
    if (ohlcvRows.length) await supabaseUpsert('bq_token_ohlcv', ohlcvRows, 'token_address,bucket_start,interval_label');
    if (trades.length) await supabaseUpsert('bq_live_trades', trades, 'tx_hash,side');
    if (topTraders.length) await supabaseUpsert('bq_top_traders', topTraders, 'token_address,wallet_address,window_label');
    if (tokenRows.length) await supabaseUpsert('tokens', tokenRows, 'address');

    await recordSyncRun({
      jobType: 'bitquery-market',
      status: 'success',
      recordsWritten: marketSnapshots.length + trades.length + topTraders.length + ohlcvRows.length,
      startedAt,
      finishedAt: nowIso(),
      details: `tracked=${trackedTokens.length}`,
    });

    console.log(JSON.stringify({
      success: true,
      trackedTokens: trackedTokens.length,
      marketSnapshots: marketSnapshots.length,
      trades: trades.length,
      topTraders: topTraders.length,
      ohlcvRows: ohlcvRows.length,
    }, null, 2));
  } catch (error) {
    await recordSyncRun({
      jobType: 'bitquery-market',
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
