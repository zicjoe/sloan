import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const env = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  fourmemeBaseUrl: process.env.FOURMEME_API_BASE_URL || 'https://four.meme/meme-api/v1',
  pageSize: Number(process.env.FOURMEME_SYNC_PAGE_SIZE || 20),
  limit: Number(process.env.FOURMEME_SYNC_LIMIT || 60),
  rankingTypes: (process.env.FOURMEME_RANKING_TYPES || 'HOT,NEW,VOL_DAY_1,DEX').split(',').map((x) => x.trim()).filter(Boolean),
  searchEnabled: (process.env.FOURMEME_SEARCH_ENABLED || 'true').toLowerCase() === 'true',
  searchType: process.env.FOURMEME_SEARCH_TYPE || 'HOT',
  searchListType: process.env.FOURMEME_SEARCH_LIST_TYPE || 'NOR',
  searchStatus: process.env.FOURMEME_SEARCH_STATUS || 'ALL',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  analysisModel: process.env.FOURMEME_ANALYSIS_MODEL || 'gpt-4.1-mini',
  aiAnalysisLimit: Number(process.env.FOURMEME_AI_ANALYSIS_LIMIT || 8),
};

const supabaseHeaders = {
  apikey: env.supabaseServiceRoleKey,
  Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function main() {
  console.log('Sloan Four.meme sync starting...');
  const run = await insertSyncRun();

  try {
    const rankingResults = await Promise.all(env.rankingTypes.map((type) => fetchRanking(type)));
    const listResults = env.searchEnabled ? await fetchSearchList() : [];
    const merged = mergeCandidates([...rankingResults.flat(), ...listResults]).slice(0, env.limit);

    console.log(`Fetched ${merged.length} candidate tokens from Four.meme.`);

    const detailed = [];
    for (const candidate of merged) {
      const detail = candidate.address ? await fetchTokenDetail(candidate.address) : null;
      detailed.push(mergeObjects(candidate, detail));
    }

    const normalized = dedupeByAddressOrSlug(detailed.map(normalizeToken).filter(Boolean));
    console.log(`Normalized ${normalized.length} tokens.`);

    const tokens = [];
    const convictions = [];
    const loreEntries = [];

    for (let index = 0; index < normalized.length; index += 1) {
      const token = normalized[index];
      const analysis = index < env.aiAnalysisLimit
        ? await buildAiAnalysis(token)
        : buildHeuristicAnalysis(token);

      tokens.push({
        id: token.address || token.slug,
        slug: token.slug,
        name: token.name,
        ticker: token.ticker,
        price: token.price,
        price_change_24h: token.priceChange24h,
        market_cap: token.marketCap,
        volume_24h: token.volume24h,
        holders: token.holders,
        momentum: token.momentum,
        image: token.image || null,
        narrative_summary: analysis.narrativeSummary,
        token_address: token.address || null,
        source_url: token.sourceUrl || null,
        source_status: token.status || null,
        source_rank_label: token.sourceRankLabel || null,
        source_updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        raw_payload: token.rawPayload || {},
      });

      convictions.push({
        token_slug: token.slug,
        bull_case: analysis.bullCase,
        bear_case: analysis.bearCase,
        risks: analysis.risks,
        triggers: analysis.triggers,
        conviction_score: analysis.convictionScore,
        timeframe: analysis.timeframe,
        updated_at: new Date().toISOString(),
      });

      loreEntries.push(...buildLoreEntries(token, analysis));
    }

    await upsert('tokens', tokens, 'id');
    await upsert('token_convictions', convictions, 'token_slug');
    if (loreEntries.length > 0) {
      await replaceLoreEntries(loreEntries);
    }

    await finishSyncRun(run.id, 'success', tokens.length, env.rankingTypes, `Synced ${tokens.length} live Four.meme tokens into Supabase.`);
    console.log(`Sync complete. Upserted ${tokens.length} tokens.`);
  } catch (error) {
    console.error('Four.meme sync failed:', error);
    await finishSyncRun(run.id, 'failed', 0, env.rankingTypes, String(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  }
}

async function fetchRanking(type) {
  const response = await fetch(`${env.fourmemeBaseUrl}/public/token/ranking`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, pageSize: env.pageSize }),
  });

  const json = await safeJson(response);
  if (!response.ok) {
    throw new Error(`Ranking ${type} failed with ${response.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }

  return extractTokenArray(json).map((item) => ({ ...item, sourceRankLabel: type }));
}

async function fetchSearchList() {
  const response = await fetch(`${env.fourmemeBaseUrl}/public/token/search`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: env.searchType,
      listType: env.searchListType,
      pageIndex: 1,
      pageSize: env.pageSize,
      status: env.searchStatus,
      sort: 'DESC',
    }),
  });

  const json = await safeJson(response);
  if (!response.ok) {
    console.warn(`Search list fetch failed with ${response.status}. Continuing without list data.`);
    return [];
  }

  return extractTokenArray(json).map((item) => ({ ...item, sourceRankLabel: item.sourceRankLabel || 'SEARCH' }));
}

async function fetchTokenDetail(address) {
  const url = new URL(`${env.fourmemeBaseUrl}/private/token/get/v2`);
  url.searchParams.set('address', address);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await safeJson(response);
  if (!response.ok) {
    return null;
  }

  return extractTokenObject(json);
}

function normalizeToken(input) {
  if (!input) return null;

  const address = pick(input, ['address', 'tokenAddress', 'contractAddress', 'tokenAddr', 'coinAddress']);
  const name = cleanText(pick(input, ['tokenName', 'name', 'projectName'])) || cleanText(pick(input, ['symbol', 'ticker'])) || 'Unknown Token';
  const ticker = cleanText(pick(input, ['symbol', 'ticker', 'tokenSymbol'])) || slugify(name).slice(0, 8).toUpperCase() || 'MEME';
  const slugBase = slugify(name || ticker || address || cryptoSafeId());
  const slug = slugBase || (address ? `token-${address.slice(2, 8).toLowerCase()}` : `token-${cryptoSafeId().slice(0, 8)}`);
  const price = toNumber(pick(input, ['price', 'currentPrice', 'tokenPrice', 'lastPrice'])) || 0;
  const priceChange24h = toNumber(pick(input, ['priceChange24h', 'priceChange', 'change24h', 'increase24h'])) || 0;
  const marketCap = toNumber(pick(input, ['marketCap', 'mcap', 'fdv', 'fullyDilutedValuation', 'marketValue'])) || 0;
  const volume24h = toNumber(pick(input, ['volume24h', 'vol24h', 'tradeAmount24h', 'volume', 'amount24h'])) || 0;
  const holders = Math.round(toNumber(pick(input, ['holders', 'holderCount', 'holdCount', 'holder'])) || 0);
  const status = cleanText(pick(input, ['status', 'tradeStatus', 'listingStatus'])) || 'UNKNOWN';
  const sourceUrl = buildSourceUrl(address, slug);
  const image = cleanText(pick(input, ['logoUrl', 'logo', 'image', 'icon']));
  const sourceRankLabel = cleanText(pick(input, ['sourceRankLabel', 'type'])) || undefined;
  const momentum = getMomentum(priceChange24h, volume24h);

  return {
    address,
    slug,
    name,
    ticker,
    price,
    priceChange24h,
    marketCap,
    volume24h,
    holders,
    status,
    image,
    momentum,
    sourceUrl,
    sourceRankLabel,
    rawPayload: input,
  };
}

function mergeCandidates(items) {
  return items.filter(Boolean).map((item) => extractTokenObject(item) || item);
}

function dedupeByAddressOrSlug(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.address || item.slug;
    if (!key) continue;
    const current = map.get(key);
    map.set(key, mergeObjects(current || {}, item));
  }
  return Array.from(map.values());
}

function buildHeuristicAnalysis(token) {
  const convictionScore = Math.max(24, Math.min(94,
    45 +
    Math.min(18, token.priceChange24h / 6) +
    Math.min(14, token.volume24h > 0 ? Math.log10(token.volume24h + 1) * 3 : 0) +
    Math.min(12, token.holders > 0 ? Math.log10(token.holders + 1) * 4 : 0) +
    (token.momentum === 'rising' ? 8 : token.momentum === 'falling' ? -10 : 0),
  ));

  const narrativeSummary = `${token.name} is showing ${token.momentum} meme posture on Four.meme with ${formatCompact(token.volume24h)} in 24h volume and ${token.holders.toLocaleString()} holders. The setup looks ${convictionScore >= 70 ? 'tradable' : convictionScore >= 50 ? 'watchable' : 'fragile'}, with attention currently flowing through a ${token.sourceRankLabel || 'live'} discovery lane.`;

  return {
    narrativeSummary,
    bullCase: [
      `${token.name} is already surfacing in live Four.meme discovery flows.`,
      `${formatCompact(token.volume24h)} of recent volume suggests the launch is attracting active participation.`,
      `${token.holders.toLocaleString()} holders give the meme a broader base than pure insider traffic.`,
    ],
    bearCase: [
      `Meme attention can reverse fast if the ranking position fades.`,
      `${token.name} still depends on social follow-through, not just token page traffic.`,
      `${token.status || 'Current'} status can change quickly as launch conditions evolve.`,
    ],
    risks: [
      'Early meme launches are reflexive and can punish late entries fast.',
      'Crowded attention without durable community behavior can collapse quickly.',
      'Price and holder metrics can change sharply between sync windows.',
    ],
    triggers: [
      'Sustained rank presence across HOT and volume views.',
      'Holder growth that stays positive alongside volume.',
      'Fresh community content that keeps attention from decaying after launch.',
    ],
    convictionScore: Math.round(convictionScore),
    timeframe: '24h to 7 days',
  };
}

async function buildAiAnalysis(token) {
  if (!env.openAiApiKey) {
    return buildHeuristicAnalysis(token);
  }

  const prompt = `You are analyzing a live Four.meme token for Sloan, an AI meme token intelligence product. Return JSON only with keys: narrativeSummary, bullCase, bearCase, risks, triggers, convictionScore, timeframe. Each of bullCase, bearCase, risks, triggers must be an array of 3 short strings. convictionScore must be an integer from 0 to 100. Use this token data: ${JSON.stringify({
    name: token.name,
    ticker: token.ticker,
    address: token.address,
    status: token.status,
    sourceRankLabel: token.sourceRankLabel,
    price: token.price,
    priceChange24h: token.priceChange24h,
    marketCap: token.marketCap,
    volume24h: token.volume24h,
    holders: token.holders,
  })}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.analysisModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a careful crypto product analyst. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    const json = await safeJson(response);
    const content = json?.choices?.[0]?.message?.content;
    if (!response.ok || !content) {
      return buildHeuristicAnalysis(token);
    }

    const parsed = JSON.parse(content);
    return {
      narrativeSummary: String(parsed.narrativeSummary || '').trim() || buildHeuristicAnalysis(token).narrativeSummary,
      bullCase: arrayOfStrings(parsed.bullCase, 3),
      bearCase: arrayOfStrings(parsed.bearCase, 3),
      risks: arrayOfStrings(parsed.risks, 3),
      triggers: arrayOfStrings(parsed.triggers, 3),
      convictionScore: clampInt(parsed.convictionScore, 0, 100, buildHeuristicAnalysis(token).convictionScore),
      timeframe: String(parsed.timeframe || '24h to 7 days'),
    };
  } catch {
    return buildHeuristicAnalysis(token);
  }
}

function buildLoreEntries(token, analysis) {
  const now = new Date().toISOString();
  return [
    {
      id: `${token.slug}-sync-${Date.now()}`,
      token_slug: token.slug,
      timestamp: now,
      content: `Sloan synced ${token.name} from Four.meme with ${formatCompact(token.volume24h)} in 24h volume and ${token.holders.toLocaleString()} holders.`,
      type: 'event',
    },
    {
      id: `${token.slug}-analysis-${Date.now()}`,
      token_slug: token.slug,
      timestamp: now,
      content: analysis.narrativeSummary,
      type: 'announcement',
    },
  ];
}

async function replaceLoreEntries(entries) {
  const tokenSlugs = [...new Set(entries.map((entry) => entry.token_slug))];
  for (const slug of tokenSlugs) {
    const url = new URL(`${env.supabaseUrl}/rest/v1/token_lore`);
    url.searchParams.set('token_slug', `eq.${slug}`);
    await fetch(url, { method: 'DELETE', headers: supabaseHeaders });
  }
  await upsert('token_lore', entries, 'id');
}

async function upsert(table, rows, conflict) {
  if (!rows.length) return;
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });

  const json = await safeJson(response);
  if (!response.ok) {
    throw new Error(`Supabase upsert failed for ${table}: ${response.status} ${JSON.stringify(json).slice(0, 300)}`);
  }

  return json;
}

async function insertSyncRun() {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/fourmeme_sync_runs`, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify({ status: 'running', rankings_fetched: env.rankingTypes }),
  });
  const json = await safeJson(response);
  if (!response.ok) {
    throw new Error(`Could not create sync run: ${response.status} ${JSON.stringify(json)}`);
  }
  return Array.isArray(json) ? json[0] : json;
}

async function finishSyncRun(id, status, tokensProcessed, rankingsFetched, notes) {
  const url = new URL(`${env.supabaseUrl}/rest/v1/fourmeme_sync_runs`);
  url.searchParams.set('id', `eq.${id}`);
  await fetch(url, {
    method: 'PATCH',
    headers: supabaseHeaders,
    body: JSON.stringify({
      status,
      tokens_processed: tokensProcessed,
      rankings_fetched: rankingsFetched,
      notes,
      finished_at: new Date().toISOString(),
    }),
  });
}

function extractTokenArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const directKeys = ['data', 'list', 'rows', 'records', 'items', 'result'];
  for (const key of directKeys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
  }

  for (const key of directKeys) {
    const candidate = value[key];
    if (candidate && typeof candidate === 'object') {
      const nested = extractTokenArray(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
}

function extractTokenObject(value) {
  if (!value || typeof value !== 'object') return null;
  if (hasTokenShape(value)) return value;
  const directKeys = ['data', 'detail', 'result'];
  for (const key of directKeys) {
    const candidate = value[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      if (hasTokenShape(candidate)) return candidate;
      const nested = extractTokenObject(candidate);
      if (nested) return nested;
    }
  }
  return value;
}

function hasTokenShape(value) {
  return Boolean(pick(value, ['address', 'tokenAddress', 'contractAddress', 'name', 'tokenName', 'symbol', 'ticker']));
}

function mergeObjects(left, right) {
  return { ...(left || {}), ...(right || {}) };
}

function pick(source, keys) {
  if (!source || typeof source !== 'object') return undefined;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return undefined;
}

function buildSourceUrl(address, slug) {
  if (address) return `https://four.meme/en/token/${address}`;
  if (slug) return `https://four.meme/en/ranking?search=${encodeURIComponent(slug)}`;
  return null;
}

function formatCompact(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(number);
}

function getMomentum(priceChange24h, volume24h) {
  if (priceChange24h >= 5 || volume24h >= 1_000_000) return 'rising';
  if (priceChange24h <= -5) return 'falling';
  return 'stable';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const number = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function arrayOfStrings(value, limit = 3) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, limit);
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function cryptoSafeId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}


main();
