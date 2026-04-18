import { FOURMEME_PROXY, STABLE_AND_BASE_QUOTES } from './queries.mjs';
import { argumentMap, env, nowIso, recordSyncRun, requireEnv, slugify, summariseTokenForUi, supabaseUpsert, safeNumber } from './shared.mjs';

const TRADES_SUBSCRIPTION = `
subscription SloanFourMemeTrades {
  EVM(network: bsc) {
    DEXTrades(where: { Trade: { Dex: { ProtocolName: { is: "fourmeme_v1" } } } }) {
      Block { Time }
      Trade {
        Buy {
          Buyer
          Currency { Name Symbol SmartContract }
          Amount
          Price
          PriceInUSD
        }
        Sell {
          Seller
          Currency { Name Symbol SmartContract }
          Amount
        }
      }
      Transaction { Hash }
    }
  }
}`;

const TOKEN_CREATES_SUBSCRIPTION = `
subscription SloanFourMemeTokenCreates {
  EVM(network: bsc) {
    Events(
      where: {
        Transaction: { To: { is: "${FOURMEME_PROXY}" } }
        Log: { Signature: { Name: { is: "TokenCreate" } } }
      }
    ) {
      Block { Time Number }
      Arguments {
        Name
        Value {
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_String_Value_Arg { string }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Integer_Value_Arg { integer }
        }
      }
      Transaction { Hash From }
    }
  }
}`;


const KNOWN_QUOTES = new Set(STABLE_AND_BASE_QUOTES.map((value) => String(value || '').toLowerCase()));

function normalizeAddress(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function chooseTradeTokenAddress(trade) {
  const buyAddress = trade?.Buy?.Currency?.SmartContract || null;
  const sellAddress = trade?.Sell?.Currency?.SmartContract || null;
  if (buyAddress && !KNOWN_QUOTES.has(normalizeAddress(buyAddress))) return buyAddress;
  if (sellAddress && !KNOWN_QUOTES.has(normalizeAddress(sellAddress))) return sellAddress;
  return buyAddress || sellAddress;
}

function chooseTradeSide(trade) {
  const buyAddress = trade?.Buy?.Currency?.SmartContract || null;
  return buyAddress && !KNOWN_QUOTES.has(normalizeAddress(buyAddress)) ? 'buy' : 'sell';
}

function mapCreateEvent(event) {
  const args = argumentMap(event?.Arguments || []);
  const tokenAddress = args.token || args.tokenAddress || args.memeToken || args.currency || null;
  const name = args.name || args.tokenName || args.currencyName || tokenAddress;
  const symbol = args.symbol || args.ticker || args.currencySymbol || 'TOKEN';
  const creatorAddress = args.creator || event?.Transaction?.From || null;
  const totalSupply = safeNumber(args.totalSupply || args.supply || 1000000000, 1000000000);
  return {
    token_address: tokenAddress,
    slug: slugify(`${name}-${symbol}`),
    name,
    symbol,
    creator_address: creatorAddress,
    created_at_chain: event?.Block?.Time || nowIso(),
    source_protocol: 'bitquery_fourmeme',
    source_url: tokenAddress ? `https://four.meme/token/${tokenAddress}` : null,
    total_supply: totalSupply,
    last_seen_at: nowIso(),
    raw_profile_json: { event, parsedArguments: args },
  };
}

function wsUrl() {
  const token = encodeURIComponent(env.bitqueryAccessToken);
  return `wss://streaming.bitquery.io/graphql?token=${token}`;
}

function sendJson(ws, payload) {
  ws.send(JSON.stringify(payload));
}

async function appendTrade(row) {
  await supabaseUpsert('bq_live_trades', [row], 'tx_hash,side');
}

async function appendTokenCreation(payload) {
  const events = payload?.EVM?.Events || [];
  const profiles = events.map(mapCreateEvent).filter((row) => row.token_address);
  if (!profiles.length) return;

  await supabaseUpsert('bq_token_profiles', profiles, 'token_address');
  await supabaseUpsert('tokens', profiles.map((profile) => summariseTokenForUi({
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
    updatedAt: profile.created_at_chain || profile.last_seen_at,
    narrativeSummary: 'Fresh token detected from the live Bitquery stream.',
    rawPayload: profile.raw_profile_json,
  })), 'address');

  await recordSyncRun({
    jobType: 'bitquery-stream-token-create',
    status: 'success',
    recordsWritten: profiles.length,
    startedAt: nowIso(),
    finishedAt: nowIso(),
    details: `profiles=${profiles.length}`,
  });
}

function startSubscription(ws, id, query) {
  sendJson(ws, { id, type: 'subscribe', payload: { query } });
}

function handleMessage(message) {
  const payload = JSON.parse(message.toString());
  if (payload.type === 'next' && payload.id === 'trades') {
    const row = payload.payload?.data?.EVM?.DEXTrades?.[0];
    if (row?.Transaction?.Hash) {
      const tokenAddress = chooseTradeTokenAddress(row?.Trade);
      if (!tokenAddress) return;
      appendTrade({
        token_address: tokenAddress,
        tx_hash: row?.Transaction?.Hash,
        trade_time: row?.Block?.Time,
        side: chooseTradeSide(row?.Trade),
        amount_token: safeNumber(row?.Trade?.Buy?.Amount ?? row?.Trade?.Sell?.Amount, null),
        amount_quote: null,
        price_usd: safeNumber(row?.Trade?.Buy?.PriceInUSD ?? row?.Trade?.Sell?.PriceInUSD ?? null, null),
        trader_address: row?.Trade?.Buy?.Buyer || row?.Trade?.Sell?.Seller || null,
        protocol_name: 'fourmeme_v1',
        raw_trade_json: row,
      }).catch((error) => console.error('trade upsert failed', error));
    }
  }
  if (payload.type === 'next' && payload.id === 'creates') {
    appendTokenCreation(payload.payload?.data).catch((error) => console.error('token create write failed', error));
  }
}

async function main() {
  requireEnv(['BITQUERY_ACCESS_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (typeof WebSocket === 'undefined') {
    throw new Error('Global WebSocket client is not available in this Node runtime. Use Node 22+ or add a ws client.');
  }
  const ws = new WebSocket(wsUrl(), 'graphql-transport-ws');
  ws.addEventListener('open', () => {
    sendJson(ws, { type: 'connection_init' });
  });
  ws.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data.toString());
    if (payload.type === 'connection_ack') {
      startSubscription(ws, 'trades', TRADES_SUBSCRIPTION);
      startSubscription(ws, 'creates', TOKEN_CREATES_SUBSCRIPTION);
      return;
    }
    handleMessage(event.data);
  });
  ws.addEventListener('error', (error) => {
    console.error('Bitquery stream error', error);
  });
  ws.addEventListener('close', async () => {
    await recordSyncRun({
      jobType: 'bitquery-stream',
      status: 'partial',
      recordsWritten: 0,
      startedAt: nowIso(),
      finishedAt: nowIso(),
      details: 'WebSocket stream closed',
    }).catch(() => {});
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
