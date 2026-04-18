import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function requireEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    throw new Error(`${name} is missing. Add it to your .env file.`);
  }
  return value;
}

export const FOURMEME_API_BASE = (process.env.FOURMEME_API_BASE_URL || 'https://four.meme/meme-api/v1').trim();
export const BINANCE_WEB3_BASE = (process.env.BINANCE_WEB3_BASE_URL || 'https://web3.binance.com').trim();

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function pickString(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function parseNumberish(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function pickNumber(source, keys) {
  for (const key of keys) {
    const parsed = parseNumberish(source?.[key]);
    if (parsed != null) return parsed;
  }
  return 0;
}

export function pickNumberOrNull(source, keys) {
  for (const key of keys) {
    const parsed = parseNumberish(source?.[key]);
    if (parsed != null) return parsed;
  }
  return null;
}

export function pickBoolean(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }
  return false;
}


export function withStaticPrefix(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `https://bin.bnbstatic.com${raw}`;
  return raw;
}

export function pickPercent(source, keys) {
  const value = pickNumberOrNull(source, keys);
  return value != null && Number.isFinite(value) ? value : 0;
}

export function pickPercentOrNull(source, keys) {
  const value = pickNumberOrNull(source, keys);
  return value != null && Number.isFinite(value) ? value : null;
}

export function coalescePositiveNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

export function scoreMomentum({ change24h = 0, volume24h = 0, holders = 0, tradeCount24h = 0, rankLabel = '', liquidity = 0 }) {
  let score = 0;
  if (change24h >= 20) score += 4;
  else if (change24h >= 8) score += 3;
  else if (change24h >= 3) score += 2;
  else if (change24h <= -15) score -= 4;
  else if (change24h <= -6) score -= 3;
  else if (change24h <= -2) score -= 2;

  if (volume24h >= 100000) score += 3;
  else if (volume24h >= 20000) score += 2;
  else if (volume24h >= 5000) score += 1;

  if (holders >= 1000) score += 2;
  else if (holders >= 250) score += 1;

  if (tradeCount24h >= 1000) score += 2;
  else if (tradeCount24h >= 200) score += 1;

  if (liquidity >= 50000) score += 1;

  const normalizedRank = String(rankLabel || '').toUpperCase();
  if (normalizedRank === 'HOT' || normalizedRank === 'VOL_DAY_1') score += 1;
  if (normalizedRank === 'DEX') score += 1;

  if (score >= 4) return 'rising';
  if (score <= -2) return 'falling';
  return 'stable';
}

export function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload;
  const nestedData = record.data && typeof record.data === 'object' ? record.data : null;
  const candidates = [
    record.data,
    record.list,
    record.records,
    record.rows,
    record.items,
    nestedData?.list,
    nestedData?.records,
    nestedData?.rows,
    nestedData?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function deriveMomentum(change24h) {
  if (change24h >= 3) return 'rising';
  if (change24h <= -3) return 'falling';
  return 'stable';
}

export function createNarrativeSummary(token) {
  const direction = token.priceChange24h >= 0
    ? 'attention is still expanding'
    : 'attention has cooled and needs a fresh spark';
  const marketLayer = token.listedPancake
    ? 'The token is already in the more public trading phase, so community follow-through matters more now.'
    : 'The token is still behaving like an early-stage launch where attention can move faster than trust.';

  return `${token.name} is live on Four.meme, ${direction}, and Sloan is reading roughly ${Math.round(token.volume24h)} in 24h volume with about ${Math.round(token.holders)} holders. ${marketLayer}`;
}


export async function binanceWeb3Request(pathname, init = {}) {
  const response = await fetch(`${BINANCE_WEB3_BASE}${pathname}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      'User-Agent': 'binance-web3/1.1 (Sloan)',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Binance Web3 request failed for ${pathname}: ${response.status} ${JSON.stringify(json).slice(0, 280)}`);
  }

  return json;
}

export function extractBinanceData(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.data)) return payload.data.data;
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.list)) return payload.data.list;
  return [];
}

export async function fourMemeRequest(pathname, init = {}) {
  const response = await fetch(`${FOURMEME_API_BASE}${pathname}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Four.meme request failed for ${pathname}: ${response.status} ${JSON.stringify(json).slice(0, 280)}`);
  }

  return json;
}

export function toRankLabel(label) {
  const normalized = String(label || '').toUpperCase();
  if (normalized.includes('HOT')) return 'HOT';
  if (normalized.includes('NEW')) return 'NEW';
  if (normalized.includes('VOLUME') || normalized.includes('VOL')) return 'VOL_DAY_1';
  if (normalized.includes('DEX') || normalized.includes('GRAD')) return 'DEX';
  return normalized || 'LIVE';
}


export async function fetchCandidateLists() {
  const attempts = [
    { label: 'search-hot', path: '/public/token/search', body: { type: 'HOT', listType: 'NOR', status: 'ALL', sort: 'DESC', pageIndex: 1, pageSize: 20 } },
    { label: 'search-new', path: '/public/token/search', body: { type: 'NEW', listType: 'NOR', status: 'ALL', sort: 'DESC', pageIndex: 1, pageSize: 20 } },
    { label: 'search-legacy-hot', path: '/public/token/search', body: { orderBy: 'Hot', pageIndex: 1, pageSize: 20, listedPancake: false } },
    { label: 'ranking-hot', path: '/public/token/ranking', body: { type: 'HOT', pageSize: 20 } },
    { label: 'ranking-volume', path: '/public/token/ranking', body: { type: 'VOL_DAY_1', barType: 'HOUR24', pageSize: 20 } },
    { label: 'ranking-new', path: '/public/token/ranking', body: { type: 'NEW', pageSize: 20 } },
  ];

  const pulseAttempts = [
    { label: 'NEW', rankType: 10 },
    { label: 'HOT', rankType: 20 },
    { label: 'DEX', rankType: 30 },
  ];

  const results = [];
  const errors = [];

  for (const attempt of attempts) {
    try {
      const json = await fourMemeRequest(attempt.path, {
        method: attempt.body ? 'POST' : 'GET',
        body: attempt.body ? JSON.stringify(attempt.body) : undefined,
      });
      const rows = extractArray(json);
      if (rows.length > 0) {
        results.push(...rows.map((row) => ({ label: toRankLabel(attempt.label), data: row, source: 'fourmeme-direct' })));
      }
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  for (const attempt of pulseAttempts) {
    try {
      const json = await binanceWeb3Request('/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/rank/list/ai', {
        method: 'POST',
        body: JSON.stringify({
          chainId: '56',
          rankType: attempt.rankType,
          limit: 20,
          protocol: [2001],
        }),
      });
      const rows = extractBinanceData(json);
      if (rows.length > 0) {
        results.push(...rows.map((row) => ({ label: attempt.label, data: row, source: 'binance-pulse' })));
      }
    } catch (error) {
      errors.push(`pulse-${attempt.label.toLowerCase()}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return { results, errors };
}

export async function fetchTokenDetail(address) {
  if (!address) return null;
  try {
    const json = await fourMemeRequest(`/private/token/get/v2?address=${encodeURIComponent(address)}`);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const record = json;
      if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
        return record.data;
      }
      return record;
    }
  } catch {
    return null;
  }

  return null;
}


export function normalizeToken(raw, detail, usedSlugs, rankLabel) {
  const merged = { ...raw, ...(detail || {}) };
  const address = pickString(merged, ['address', 'tokenAddress', 'contractAddress', 'coinAddress', 'ca', 'currencyAddress']);
  const name = pickString(merged, ['tokenName', 'name', 'fullName']) || (address ? `Token ${address.slice(2, 8)}` : 'Unknown Token');
  const ticker = pickString(merged, ['symbol', 'shortName', 'ticker']) || name.slice(0, 6).toUpperCase();
  let slug = slugify(`${name}-${ticker}`) || (address ? slugify(address.slice(2, 10)) : `token-${Date.now().toString(36)}`);

  if (usedSlugs.has(slug) && address) {
    slug = `${slug}-${address.slice(-4).toLowerCase()}`;
  }
  usedSlugs.add(slug);

  const totalSupply = pickNumberOrNull(merged, ['totalSupply', 'total_supply', 'supply', 'maxSupply']);
  const price = pickNumberOrNull(merged, ['price', 'currentPrice', 'tokenPrice', 'usdPrice', 'amountPrice']) ?? 0;
  const priceChange24h = pickPercentOrNull(merged, ['priceChange24h', 'priceChange', 'priceChangePercent24h', 'change24h', 'barPriceChange24h', 'increase24h', 'priceIncreasePercent']);
  const marketCapDirect = pickNumberOrNull(merged, ['marketCap', 'marketcap', 'mcap', 'fdv']);
  const volume24h = pickNumberOrNull(merged, ['volume24h', 'volume', 'amount24h', 'trading24h', 'barVolume24h', 'tradingVolume']) ?? 0;
  const holders = pickNumberOrNull(merged, ['holders', 'holderCount', 'holdCount', 'holder']);
  const liquidity = pickNumberOrNull(merged, ['liquidity', 'lpUsd', 'liquidityUsd']) ?? 0;
  const tradeCount24h = pickNumberOrNull(merged, ['count', 'count24h', 'tradeCount24h', 'trades24h']) ?? 0;
  const listedPancake = pickBoolean(merged, ['listedPancake', 'listedDex', 'listedOnPancake']) || String(merged?.migrateStatus || '') === '1';
  const status = pickString(merged, ['status', 'launchStatus']) || (listedPancake ? 'MIGRATED' : 'LIVE');
  const image = withStaticPrefix(pickString(merged, ['icon', 'logoUrl', 'logo', 'image'])) || null;
  const refreshedAt = new Date().toISOString();
  const computedMarketCap = marketCapDirect && marketCapDirect > 0
    ? marketCapDirect
    : (totalSupply && totalSupply > 0 && price > 0 ? totalSupply * price : null);
  const momentum = scoreMomentum({
    change24h: priceChange24h ?? 0,
    volume24h,
    holders: holders ?? 0,
    tradeCount24h,
    rankLabel,
    liquidity,
  });

  const summaryBits = [];
  if (volume24h > 0) summaryBits.push(`${Math.round(volume24h).toLocaleString()} in 24h volume`);
  if ((holders ?? 0) > 0) summaryBits.push(`${Math.round(holders).toLocaleString()} holders`);
  if (liquidity > 0) summaryBits.push(`${Math.round(liquidity).toLocaleString()} liquidity`);
  if (tradeCount24h > 0) summaryBits.push(`${Math.round(tradeCount24h).toLocaleString()} trades`);

  return {
    id: address || slug,
    slug,
    name,
    ticker,
    price,
    price_change_24h: priceChange24h,
    market_cap: computedMarketCap,
    volume_24h: volume24h,
    holders: holders != null ? Math.round(holders) : null,
    total_supply: totalSupply,
    momentum,
    image,
    narrative_summary: summaryBits.length > 0
      ? `${name} is being tracked live across the Four.meme ecosystem with ${summaryBits.join(', ')}. Sloan currently reads the setup as ${momentum}.`
      : createNarrativeSummary({
          name,
          priceChange24h: priceChange24h ?? 0,
          volume24h,
          holders: holders ?? 0,
          listedPancake: listedPancake || status.toUpperCase().includes('DEX') || status.toUpperCase().includes('TRADE'),
        }),
    address: address || null,
    source: 'four.meme',
    source_url: address ? `https://four.meme/token/${address}` : null,
    fourmeme_status: status || null,
    listed_pancake: listedPancake || status.toUpperCase().includes('DEX') || status.toUpperCase().includes('TRADE'),
    refreshed_at: refreshedAt,
    source_rank_label: rankLabel,
    raw_payload: merged,
  };
}


export function dedupeCandidates(candidateRecords) {
  const rankScore = { HOT: 4, VOL_DAY_1: 3, DEX: 2, NEW: 1, LIVE: 0 };

  const richness = (row) => {
    const data = row?.data || {};
    let score = 0;
    if (pickNumber(data, ['marketCap', 'marketcap', 'mcap', 'fdv']) > 0) score += 3;
    if (pickNumber(data, ['volume24h', 'volume', 'amount24h', 'barVolume24h']) > 0) score += 3;
    if (pickNumber(data, ['holders', 'holderCount', 'holdCount']) > 0) score += 2;
    if (pickNumber(data, ['liquidity', 'lpUsd', 'liquidityUsd']) > 0) score += 1;
    if (pickNumber(data, ['count', 'count24h', 'tradeCount24h']) > 0) score += 1;
    return score;
  };

  const merged = new Map();

  for (const item of candidateRecords) {
    const address = pickString(item.data, ['address', 'tokenAddress', 'contractAddress', 'coinAddress', 'ca', 'currencyAddress']);
    const key = address || `${pickString(item.data, ['tokenName', 'name'])}-${pickString(item.data, ['symbol', 'shortName'])}`;
    if (!key) continue;

    if (!merged.has(key)) {
      merged.set(key, { ...item, labels: [String(item.label || 'LIVE').toUpperCase()] });
      continue;
    }

    const existing = merged.get(key);
    const existingRank = rankScore[String(existing.label || 'LIVE').toUpperCase()] || 0;
    const nextRank = rankScore[String(item.label || 'LIVE').toUpperCase()] || 0;
    const existingRichness = richness(existing);
    const nextRichness = richness(item);
    const bestLabel = nextRank > existingRank ? item.label : existing.label;

    merged.set(key, {
      ...existing,
      label: bestLabel,
      source: existing.source === item.source ? existing.source : `${existing.source},${item.source}`,
      labels: Array.from(new Set([...(existing.labels || []), String(item.label || 'LIVE').toUpperCase()])),
      data: {
        ...(existing.data || {}),
        ...(item.data || {}),
      },
      richness: Math.max(existingRichness, nextRichness),
    });
  }

  return Array.from(merged.values());
}

export async function upsertSupabase(table, rows, onConflict) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const normalizedRows = Array.isArray(rows)
    ? (() => {
        const keySet = new Set();
        for (const row of rows) {
          if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
          for (const key of Object.keys(row)) keySet.add(key);
        }
        const keys = Array.from(keySet);
        const nowIso = new Date().toISOString();
        return rows.map((row) => {
          const record = {};
          for (const key of keys) {
            const value = row?.[key];
            if ((key === 'created_at' || key === 'updated_at') && (value === undefined || value === null || value === '')) {
              record[key] = row?.refreshed_at || nowIso;
              continue;
            }
            record[key] = value === undefined ? null : value;
          }
          return record;
        });
      })()
    : rows;

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set('on_conflict', onConflict);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(normalizedRows),
  });

  const text = await response.text();
  let json = [];
  try {
    json = text ? JSON.parse(text) : [];
  } catch {
    json = [];
  }

  if (!response.ok) {
    throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${text}`);
  }

  return Array.isArray(json) ? json : [json];
}

export async function selectSupabase(table, select, filters = {}) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', select);

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, `eq.${value}`);
  }

  const response = await fetch(url.toString(), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let json = [];
  try {
    json = text ? JSON.parse(text) : [];
  } catch {
    json = [];
  }

  if (!response.ok) {
    throw new Error(`Supabase select failed for ${table}: ${response.status} ${text}`);
  }

  return Array.isArray(json) ? json : [json];
}
