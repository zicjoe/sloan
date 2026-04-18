import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOURMEME_API_BASE = Deno.env.get('FOURMEME_API_BASE_URL') || 'https://four.meme/meme-api/v1';
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type JsonRecord = Record<string, unknown>;

interface NormalizedToken {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  holders: number;
  momentum: 'rising' | 'falling' | 'stable';
  image: string | null;
  narrative_summary: string;
  address: string | null;
  source: string;
  source_url: string | null;
  fourmeme_status: string | null;
  listed_pancake: boolean;
  refreshed_at: string;
  source_rank_label: string | null;
  raw_payload: JsonRecord;
}

interface CandidateRecord {
  label: string;
  data: JsonRecord;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function extractArray(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload as JsonRecord[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as JsonRecord;
  const nestedData = record.data && typeof record.data === 'object' ? record.data as JsonRecord : null;
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
    if (Array.isArray(candidate)) return candidate as JsonRecord[];
  }

  return [];
}

function pickString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickNumber(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,%\s,]/g, '');
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function pickBoolean(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    if (typeof value === 'number') return value > 0;
  }
  return false;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function deriveMomentum(change24h: number): 'rising' | 'falling' | 'stable' {
  if (change24h >= 3) return 'rising';
  if (change24h <= -3) return 'falling';
  return 'stable';
}

function createNarrativeSummary(token: {
  name: string;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  listedPancake: boolean;
}) {
  const direction = token.priceChange24h >= 0
    ? 'attention is still expanding'
    : 'attention has cooled and needs a fresh spark';
  const marketLayer = token.listedPancake
    ? 'The token is already in the more public trading phase, so community follow-through matters more now.'
    : 'The token is still behaving like an early-stage launch where attention can move faster than trust.';

  return `${token.name} is live on Four.meme, ${direction}, and Sloan is reading roughly ${Math.round(token.volume24h)} in 24h volume with about ${Math.round(token.holders)} holders. ${marketLayer}`;
}

async function fourMemeRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${FOURMEME_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let json: unknown = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Four.meme request failed for ${path}: ${response.status} ${JSON.stringify(json).slice(0, 240)}`);
  }

  return json;
}

function toRankLabel(label: string) {
  const normalized = label.toUpperCase();
  if (normalized.includes('HOT')) return 'HOT';
  if (normalized.includes('NEW')) return 'NEW';
  if (normalized.includes('VOLUME') || normalized.includes('VOL')) return 'VOL_DAY_1';
  if (normalized.includes('DEX') || normalized.includes('GRAD')) return 'DEX';
  return normalized;
}

async function fetchCandidateLists() {
  const attempts: Array<{ label: string; path: string; body?: JsonRecord }> = [
    { label: 'search-hot', path: '/public/token/search', body: { type: 'HOT', listType: 'NOR', status: 'ALL', sort: 'DESC', pageIndex: 1, pageSize: 20 } },
    { label: 'search-new', path: '/public/token/search', body: { type: 'NEW', listType: 'NOR', status: 'ALL', sort: 'DESC', pageIndex: 1, pageSize: 20 } },
    { label: 'search-legacy-hot', path: '/public/token/search', body: { orderBy: 'Hot', pageIndex: 1, pageSize: 20, listedPancake: false } },
    { label: 'ranking-hot', path: '/public/token/ranking', body: { type: 'HOT', pageSize: 20 } },
    { label: 'ranking-volume', path: '/public/token/ranking', body: { type: 'VOL_DAY_1', barType: 'HOUR24', pageSize: 20 } },
    { label: 'ranking-new', path: '/public/token/ranking', body: { type: 'NEW', pageSize: 20 } },
  ];

  const results: CandidateRecord[] = [];
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const json = await fourMemeRequest(attempt.path, {
        method: attempt.body ? 'POST' : 'GET',
        body: attempt.body ? JSON.stringify(attempt.body) : undefined,
      });
      const rows = extractArray(json);
      if (rows.length > 0) {
        results.push(...rows.map((row) => ({ label: toRankLabel(attempt.label), data: row })));
      }
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return { results, errors };
}

async function fetchTokenDetail(address: string) {
  try {
    const json = await fourMemeRequest(`/private/token/get/v2?address=${encodeURIComponent(address)}`);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const record = json as JsonRecord;
      if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
        return record.data as JsonRecord;
      }
      return record;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeToken(raw: JsonRecord, detail: JsonRecord | null, usedSlugs: Set<string>, rankLabel: string): NormalizedToken | null {
  const merged: JsonRecord = { ...raw, ...(detail || {}) };
  const address = pickString(merged, ['address', 'tokenAddress', 'contractAddress', 'coinAddress', 'ca', 'currencyAddress']);
  const name = pickString(merged, ['tokenName', 'name', 'fullName']) || (address ? `Token ${address.slice(2, 8)}` : 'Unknown Token');
  const ticker = pickString(merged, ['symbol', 'shortName', 'ticker']) || name.slice(0, 6).toUpperCase();
  let slug = slugify(`${name}-${ticker}`) || (address ? slugify(address.slice(2, 10)) : crypto.randomUUID());

  if (usedSlugs.has(slug) && address) {
    slug = `${slug}-${address.slice(-4).toLowerCase()}`;
  }
  usedSlugs.add(slug);

  const price = pickNumber(merged, ['price', 'currentPrice', 'tokenPrice', 'usdPrice', 'amountPrice']);
  const priceChange24h = pickNumber(merged, ['priceChange24h', 'priceChangePercent24h', 'change24h', 'barPriceChange24h', 'increase24h', 'priceIncreasePercent']);
  const marketCap = pickNumber(merged, ['marketCap', 'marketcap', 'mcap', 'fdv']);
  const volume24h = pickNumber(merged, ['volume24h', 'amount24h', 'trading24h', 'barVolume24h', 'tradingVolume']);
  const holders = Math.round(pickNumber(merged, ['holders', 'holderCount', 'holdCount', 'holder']));
  const listedPancake = pickBoolean(merged, ['listedPancake', 'listedDex', 'listedOnPancake']);
  const status = pickString(merged, ['status', 'launchStatus']);
  const image = pickString(merged, ['logoUrl', 'logo', 'image', 'icon']) || null;
  const refreshedAt = new Date().toISOString();

  return {
    id: address || slug,
    slug,
    name,
    ticker,
    price,
    price_change_24h: priceChange24h,
    market_cap: marketCap,
    volume_24h: volume24h,
    holders,
    momentum: deriveMomentum(priceChange24h),
    image,
    narrative_summary: createNarrativeSummary({
      name,
      priceChange24h,
      volume24h,
      holders,
      listedPancake: listedPancake || status.toUpperCase().includes('DEX') || status.toUpperCase().includes('TRADE'),
    }),
    address: address || null,
    source: 'four.meme',
    source_url: address ? `https://four.meme/token/${address}` : null,
    fourmeme_status: status || null,
    listed_pancake: listedPancake,
    refreshed_at: refreshedAt,
    source_rank_label: rankLabel,
    raw_payload: merged,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { results, errors } = await fetchCandidateLists();
    const candidateMap = new Map<string, CandidateRecord>();

    for (const item of results) {
      const address = pickString(item.data, ['address', 'tokenAddress', 'contractAddress', 'coinAddress', 'ca', 'currencyAddress']);
      const key = address || `${pickString(item.data, ['tokenName', 'name'])}-${pickString(item.data, ['symbol', 'shortName'])}`;
      if (key && !candidateMap.has(key)) candidateMap.set(key, item);
    }

    const candidates = Array.from(candidateMap.values()).slice(0, 24);

    if (candidates.length === 0) {
      const { data: run } = await supabase.from('token_sync_runs').insert({
        source: 'four.meme',
        status: 'error',
        synced_count: 0,
        inserted_count: 0,
        updated_count: 0,
        details: errors.length > 0 ? errors.join(' | ') : 'No candidates returned from Four.meme endpoints.',
      }).select().single();

      return jsonResponse({
        success: false,
        syncedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        message: 'Four.meme did not return any token candidates for Sloan to sync.',
        runId: run?.id,
      }, 500);
    }

    const detailResults = await Promise.allSettled(
      candidates.map(async (candidate) => {
        const address = pickString(candidate.data, ['address', 'tokenAddress', 'contractAddress', 'coinAddress', 'ca', 'currencyAddress']);
        const detail = address ? await fetchTokenDetail(address) : null;
        return { candidate, detail };
      }),
    );

    const usedSlugs = new Set<string>();
    const normalized = detailResults
      .filter((result): result is PromiseFulfilledResult<{ candidate: CandidateRecord; detail: JsonRecord | null }> => result.status === 'fulfilled')
      .map(({ value }) => normalizeToken(value.candidate.data, value.detail, usedSlugs, value.candidate.label))
      .filter((token): token is NormalizedToken => Boolean(token));

    const uniqueBySlug = Array.from(new Map(normalized.map((token) => [token.slug, token])).values());
    const slugs = uniqueBySlug.map((token) => token.slug);

    const { data: existingRows } = await supabase.from('tokens').select('slug').in('slug', slugs);
    const existingSlugs = new Set((existingRows || []).map((row) => row.slug));
    const insertedCount = uniqueBySlug.filter((token) => !existingSlugs.has(token.slug)).length;
    const updatedCount = uniqueBySlug.length - insertedCount;

    const { error: upsertError } = await supabase.from('tokens').upsert(uniqueBySlug, { onConflict: 'slug' });
    if (upsertError) {
      throw upsertError;
    }

    const runStatus = errors.length > 0 ? 'partial' : 'success';
    const { data: run, error: runError } = await supabase.from('token_sync_runs').insert({
      source: 'four.meme',
      status: runStatus,
      synced_count: uniqueBySlug.length,
      inserted_count: insertedCount,
      updated_count: updatedCount,
      details: errors.length > 0 ? errors.join(' | ') : 'Sync completed successfully.',
    }).select().single();

    if (runError) {
      throw runError;
    }

    return jsonResponse({
      success: true,
      syncedCount: uniqueBySlug.length,
      insertedCount,
      updatedCount,
      message: errors.length > 0
        ? `Sloan synced ${uniqueBySlug.length} live tokens from Four.meme with some endpoint fallbacks.`
        : `Sloan synced ${uniqueBySlug.length} live tokens from Four.meme.`,
      runId: run?.id,
      sampleSlugs: uniqueBySlug.slice(0, 5).map((token) => token.slug),
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown sync error';
    const { data: run } = await supabase.from('token_sync_runs').insert({
      source: 'four.meme',
      status: 'error',
      synced_count: 0,
      inserted_count: 0,
      updated_count: 0,
      details,
    }).select().single();

    return jsonResponse({
      success: false,
      syncedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      message: details,
      runId: run?.id,
    }, 500);
  }
});
