import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function loadDotEnv() {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(dotenvPath)) return;
  const content = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

export const env = {
  bitqueryEndpoint: process.env.BITQUERY_ENDPOINT || 'https://streaming.bitquery.io/graphql',
  bitqueryAccessToken: process.env.BITQUERY_ACCESS_TOKEN || '',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  freshLimit: Number(process.env.BITQUERY_FRESH_LIMIT || 30),
  hotLimit: Number(process.env.BITQUERY_HOT_LIMIT || 30),
  volumeLimit: Number(process.env.BITQUERY_VOLUME_LIMIT || 30),
  liquidityLimit: Number(process.env.BITQUERY_LIQUIDITY_LIMIT || 30),
  trackedTokenLimit: Number(process.env.BITQUERY_TRACKED_TOKEN_LIMIT || 25),
};

export function requireEnv(keys) {
  const missing = keys.filter((key) => !envByKey(key));
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function envByKey(key) {
  return key === 'BITQUERY_ACCESS_TOKEN' ? env.bitqueryAccessToken
    : key === 'SUPABASE_URL' ? env.supabaseUrl
    : key === 'SUPABASE_SERVICE_ROLE_KEY' ? env.supabaseServiceRoleKey
    : process.env[key];
}

export async function runBitquery(query, variables = {}) {
  requireEnv(['BITQUERY_ACCESS_TOKEN']);
  const response = await fetch(env.bitqueryEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.bitqueryAccessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors?.length) {
    throw new Error(`Bitquery request failed: ${response.status} ${JSON.stringify(payload.errors || payload)}`);
  }
  return payload.data;
}

export async function supabaseUpsert(table, rows, onConflict) {
  if (!rows?.length) return [];
  requireEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set('on_conflict', onConflict);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  const payload = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase upsert ${table} failed: ${response.status} ${payload}`);
  }
  return payload ? JSON.parse(payload) : [];
}

export async function supabaseSelect(table, select, queryParams = {}) {
  requireEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    },
  });
  const payload = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase select ${table} failed: ${response.status} ${payload}`);
  }
  return payload ? JSON.parse(payload) : [];
}

export async function supabasePatch(table, queryParams, patch) {
  requireEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(queryParams)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  });
  const payload = await response.text();
  if (!response.ok) throw new Error(`Supabase patch ${table} failed: ${response.status} ${payload}`);
  return payload ? JSON.parse(payload) : [];
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || `token-${Date.now()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function safeNumber(value, fallback = null) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function argumentMap(argumentsArray = []) {
  const mapped = {};
  for (const arg of argumentsArray) {
    const raw = arg?.Value || {};
    mapped[arg?.Name || 'unknown'] = raw.address ?? raw.string ?? raw.bigInteger ?? raw.integer ?? raw.bool ?? raw.hex ?? null;
  }
  return mapped;
}

function deriveMomentum(change24h, volume24hUsd) {
  if (typeof change24h === 'number') {
    if (change24h >= 5) return 'rising';
    if (change24h <= -5) return 'falling';
  }
  if (typeof volume24hUsd === 'number' && volume24hUsd > 0) return 'rising';
  return 'stable';
}

export function summariseTokenForUi({
  tokenAddress,
  name,
  symbol,
  priceUsd,
  priceChange24h,
  marketCapUsd,
  volume24hUsd,
  holders,
  sourceLabel,
  migrated = false,
  updatedAt,
  narrativeSummary,
  rawPayload,
  source = 'bitquery',
}) {
  const normalizedChange24h = typeof priceChange24h === 'number' ? priceChange24h : 0;
  const momentum = deriveMomentum(normalizedChange24h, volume24hUsd);
  return {
    id: tokenAddress,
    slug: slugify(`${name || symbol}-${symbol || tokenAddress?.slice(2, 8) || ''}`),
    name: name || symbol || tokenAddress,
    ticker: symbol || 'TOKEN',
    price: priceUsd ?? 0,
    price_change_24h: normalizedChange24h,
    market_cap: marketCapUsd ?? 0,
    volume_24h: volume24hUsd ?? 0,
    holders: holders ?? 0,
    momentum,
    narrative_summary: narrativeSummary || (sourceLabel ? `${sourceLabel} rail from Bitquery` : 'Live token profile from Bitquery'),
    address: tokenAddress,
    source,
    source_url: tokenAddress ? `https://four.meme/token/${tokenAddress}` : null,
    fourmeme_status: migrated ? 'migrated' : 'live',
    listed_pancake: Boolean(migrated),
    refreshed_at: updatedAt || nowIso(),
    source_rank_label: sourceLabel || null,
    raw_payload: rawPayload || null,
  };
}

export async function recordSyncRun({ jobType, status, recordsWritten = 0, details = null, startedAt = null, finishedAt = null }) {
  const row = {
    id: crypto.randomUUID(),
    job_type: jobType,
    status,
    records_written: recordsWritten,
    error_text: details,
    started_at: startedAt || nowIso(),
    finished_at: finishedAt || nowIso(),
  };
  await supabaseUpsert('bq_sync_runs', [row], 'id');
  return row;
}
