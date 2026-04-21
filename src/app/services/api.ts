import {
  mockTokens,
  mockConvictionData,
  mockSwarmData,
  mockLoreStream,
} from '../data/tokens';
import { mockQuests } from '../data/quests';
import { mockPredictions, mockProphets } from '../data/predictions';
import { mockUserProfiles, mockCounterfactuals } from '../data/users';
import { mockRaidCampaigns, mockContentVariants, mockReplyLines } from '../data/raids';
import type {
  ConvictionAnalysis,
  CounterfactualEntry,
  ForgeInput,
  GeneratedRaidContent,
  LaunchIdentity,
  LivePulseEvent,
  LoreEntry,
  Prediction,
  PredictionOpportunity,
  PredictionCallType,
  PredictionConfidence,
  Prophet,
  Quest,
  QuestForgeInput,
  QuestSuggestionPack,
  QuestActivity,
  QuestLeaderboardEntry,
  QuestLiveEvent,
  QuestSubmission,
  RaidCampaign,
  RaidGenerationInput,
  SwarmBehavior,
  Token,
  UserProfile,
} from '../types';
import { env, hasApiBaseBackend, hasSupabaseBackend } from '../lib/env';
import { readStorage, writeStorage } from '../lib/persistence';
import { insertRow, invokeFunction, selectRows, updateRows, upsertRows } from '../lib/supabase';
import { formatPercent, formatUsd } from '../lib/format';
import { getCurrentActor } from '../auth/authStore';

const STORAGE_KEYS = {
  predictions: 'sloan.predictions',
  predictionMeta: 'sloan.predictions.meta',
  forge: 'sloan.forge.identity',
  raids: 'sloan.raids.generated',
  raidsHistory: 'sloan.raids.history',
  questJoins: 'sloan.quests.joins',
  questSubmissions: 'sloan.quests.submissions',
  quests: 'sloan.quests.owner',
};

const DEMO_TOKEN_SLUGS = new Set(['pepeai', 'wojak-terminal', 'doge-vader', 'moon-cat', 'frog-cartel']);
const DEMO_USERNAMES = new Set(['cryptowizard', 'moonhunter', 'moonpunter', 'degen_master', 'ta_expert', 'realist_dave', 'whale_watcher', 'meme_lord', 'chart_junkie']);

function isDemoTokenSlug(slug?: string | null) {
  return Boolean(slug && DEMO_TOKEN_SLUGS.has(slug));
}

function isDemoUsername(username?: string | null) {
  return Boolean(username && DEMO_USERNAMES.has(username));
}

function sanitizeTokens(tokens: Token[]) {
  return tokens.filter((token) => !isDemoTokenSlug(token.slug));
}

function sanitizePredictions(predictions: Prediction[]) {
  return predictions.filter((prediction) => !isDemoTokenSlug(prediction.tokenSlug) && !isDemoUsername(prediction.username));
}

function sanitizeProphets(prophets: Prophet[]) {
  return prophets.filter((prophet) => !isDemoUsername(prophet.username));
}

function sanitizeQuests(quests: Quest[]) {
  return quests.filter((quest) => !isDemoTokenSlug(quest.tokenSlug));
}

function sanitizeProfiles(profile?: UserProfile) {
  if (!profile || isDemoUsername(profile.username)) return undefined;
  return profile;
}

function currentUsername() {
  return getCurrentActor().username;
}

function currentUserId() {
  return getCurrentActor().userId;
}

function isAuthenticatedActor() {
  return Boolean(getCurrentActor().isAuthenticated && currentUserId() && currentUserId() !== env.currentUser);
}

function currentActorFilters(usernameColumn = 'created_by', userIdColumn = 'created_by_user_id') {
  if (isAuthenticatedActor()) {
    return { [userIdColumn]: currentUserId() } as Record<string, string>;
  }
  return { [usernameColumn]: currentUsername() } as Record<string, string>;
}

function sanitizeCounterfactuals(entries: CounterfactualEntry[]) {
  return entries.filter((entry) => !isDemoTokenSlug(entry.tokenSlug));
}

function sanitizeRaids(campaigns: RaidCampaign[]) {
  return campaigns.filter((campaign) => !isDemoTokenSlug(campaign.tokenSlug));
}

const allowMockData = env.useMockApi;


function estimateCounterfactualDelta(token: Token, direction: 'upside' | 'drawdown' = 'upside') {
  const basis = Math.max(
    token.volume24h * 0.015,
    token.marketCap * 0.0008,
    token.holders * 14,
    Math.abs(token.priceChange24h) * 55,
    320,
  );
  const value = Math.min(14000, Math.max(320, Math.round(basis)));
  return direction === 'upside' ? value : -Math.max(220, Math.round(value * 0.55));
}

function uniqueCounterfactualEntries(entries: CounterfactualEntry[]) {
  const seen = new Set<string>();
  const output: CounterfactualEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.tokenSlug}:${entry.missedAction}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }

  return output;
}

function buildDerivedCounterfactuals(tokens: Token[], predictions: Prediction[], username: string) {
  const liveTokens = (tokens || []).filter((token) => Boolean(token.slug && token.name));
  const mine = (predictions || []).filter((prediction) => prediction.username === username);
  const bySlug = new Map(liveTokens.map((token) => [token.slug, token]));
  const entries: CounterfactualEntry[] = [];

  const pushEntry = (entry: CounterfactualEntry | null | undefined) => {
    if (entry) entries.push(entry);
  };

  for (const prediction of mine) {
    const token = bySlug.get(prediction.tokenSlug);
    if (!token) continue;
    const question = prediction.question || '';
    const answeredYes = prediction.binaryAnswer === 'yes';
    const optimisticMove = token.priceChange24h > 6 || token.volume24h > (prediction.baselineVolume24h || 0) * 1.15 || token.holders > (prediction.baselineHolders || 0) + 12;
    const weakMove = token.priceChange24h < -6 || token.volume24h < (prediction.baselineVolume24h || token.volume24h) * 0.85;

    if (!answeredYes && optimisticMove) {
      pushEntry({
        id: `derived-${prediction.id}-hesitation`,
        tokenName: token.name,
        tokenSlug: token.slug,
        missedAction: `Answered no on a live setup while ${token.name} kept expanding after your call.`,
        potentialGain: estimateCounterfactualDelta(token, 'upside'),
        timestamp: prediction.timestamp,
        insight: question
          ? `Your read on “${question}” stayed too defensive even as price, volume, or holders kept improving. Pattern: over-caution on live strength.`
          : `You leaned defensive while live strength stayed intact. Pattern: over-caution on tokens that are already proving demand.`,
      });
    }

    if (answeredYes && weakMove) {
      pushEntry({
        id: `derived-${prediction.id}-stubborn`,
        tokenName: token.name,
        tokenSlug: token.slug,
        missedAction: `Stayed yes on ${token.name} while the setup cooled and the tape stopped confirming it.`,
        potentialGain: estimateCounterfactualDelta(token, 'drawdown'),
        timestamp: prediction.timestamp,
        insight: question
          ? `Your conviction on “${question}” held even after the live state weakened. Pattern: staying committed after the signal already lost quality.`
          : `You kept the bullish read after the signal weakened. Pattern: late exits on fading meme momentum.`,
      });
    }
  }

  const predictedSlugs = new Set(mine.map((prediction) => prediction.tokenSlug));
  const ranked = [...liveTokens].sort((a, b) => {
    const scoreA = (a.volume24h || 0) + Math.max(0, a.priceChange24h || 0) * 1800 + (a.holders || 0) * 8;
    const scoreB = (b.volume24h || 0) + Math.max(0, b.priceChange24h || 0) * 1800 + (b.holders || 0) * 8;
    return scoreB - scoreA;
  });

  const hotWatcher = ranked.find((token) => !predictedSlugs.has(token.slug) && token.priceChange24h > 5);
  if (hotWatcher) {
    pushEntry({
      id: `derived-${hotWatcher.slug}-watcher`,
      tokenName: hotWatcher.name,
      tokenSlug: hotWatcher.slug,
      missedAction: `Watched ${hotWatcher.name} stay active without making a call while the tape kept building.`,
      potentialGain: estimateCounterfactualDelta(hotWatcher, 'upside'),
      timestamp: hotWatcher.lastSyncedAt || new Date().toISOString(),
      insight: `You waited for perfect certainty on a token that already had visible participation. Pattern: hesitation after confirmation instead of before it.`,
    });
  }

  const fadeToken = ranked.find((token) => token.priceChange24h < -8 || token.momentum === 'falling');
  if (fadeToken) {
    pushEntry({
      id: `derived-${fadeToken.slug}-fomo`,
      tokenName: fadeToken.name,
      tokenSlug: fadeToken.slug,
      missedAction: `This was the kind of setup where a late entry would have been punished after the crowd already stretched it.`,
      potentialGain: estimateCounterfactualDelta(fadeToken, 'drawdown'),
      timestamp: fadeToken.lastSyncedAt || new Date().toISOString(),
      insight: `The live state on ${fadeToken.name} is a reminder that not every hot feed item is an entry. Pattern: protect yourself from peak-chasing when crowd energy is already exhausted.`,
    });
  }

  const holderExpansion = ranked.find((token) => !predictedSlugs.has(token.slug) && token.holders > 0 && token.volume24h > 0 && token.priceChange24h > 0);
  if (holderExpansion) {
    pushEntry({
      id: `derived-${holderExpansion.slug}-expansion`,
      tokenName: holderExpansion.name,
      tokenSlug: holderExpansion.slug,
      missedAction: `Skipped a token with both participation and holder expansion while waiting for one more confirmation.`,
      potentialGain: estimateCounterfactualDelta(holderExpansion, 'upside'),
      timestamp: holderExpansion.lastSyncedAt || new Date().toISOString(),
      insight: `When holders and volume rise together, Sloan reads it as cleaner confirmation than pure noise. Pattern: letting extra caution erase obvious participation clues.`,
    });
  }

  return uniqueCounterfactualEntries(entries).slice(0, 8);
}

interface DbToken {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  holders: number;
  momentum: Token['momentum'];
  image?: string | null;
  narrative_summary?: string | null;
  address?: string | null;
  source?: string | null;
  source_url?: string | null;
  fourmeme_status?: string | null;
  listed_pancake?: boolean | null;
  refreshed_at?: string | null;
  source_rank_label?: string | null;
}

interface DbConviction {
  token_slug: string;
  bull_case: string[];
  bear_case: string[];
  risks: string[];
  triggers: string[];
  conviction_score: number;
  timeframe: string;
}

interface DbSwarm {
  token_slug: string;
  label: string;
  percentage: number;
  trend: SwarmBehavior['trend'];
}

interface DbLore {
  id: string;
  token_slug: string;
  timestamp: string;
  content: string;
  type: LoreEntry['type'];
}

interface DbQuest {
  id: string;
  title: string;
  description: string;
  category: Quest['category'];
  reward: number;
  deadline?: string | null;
  progress?: number | null;
  completed: boolean;
  token_slug?: string | null;
  mission_brief?: string | null;
  submission_rule?: string | null;
  example_proof?: string | null;
  proof_type?: Quest['proofType'] | null;
  difficulty?: Quest['difficulty'] | null;
  created_by_user_id?: string | null;
  created_by_username?: string | null;
  ai_suggested?: boolean | null;
  owner_note?: string | null;
}

interface DbQuestParticipant {
  id?: string;
  quest_id: string;
  user_id: string;
  username: string;
  joined_at: string;
}

interface DbQuestSubmission {
  id: string;
  quest_id: string;
  user_id: string;
  username: string;
  proof_type: QuestSubmission['proofType'];
  proof_value: string;
  note?: string | null;
  status: QuestSubmission['status'];
  xp_awarded: number;
  review_summary?: string | null;
  created_at: string;
}

interface DbPrediction {
  id: string;
  user_id: string;
  username: string;
  token_slug: string;
  token_name: string;
  prediction: Prediction['prediction'];
  target_price?: number | null;
  timeframe: string;
  reasoning: string;
  timestamp: string;
  likes: number;
  status: Prediction['status'];
  call_type?: PredictionCallType | null;
  confidence?: PredictionConfidence | null;
  compare_token_slug?: string | null;
  compare_token_name?: string | null;
  expires_at?: string | null;
  baseline_price?: number | null;
  baseline_volume_24h?: number | null;
  baseline_holders?: number | null;
  resolution_note?: string | null;
  score_awarded?: number | null;
  question?: string | null;
  binary_answer?: 'yes' | 'no' | null;
}

interface DbProphet {
  username: string;
  rank: number;
  accuracy: number;
  total_predictions: number;
  correct_predictions: number;
  streak: number;
  avatar?: string | null;
}

interface DbUserProfile {
  username: string;
  display_name: string;
  avatar?: string | null;
  archetype: string;
  prophet_rank: number;
  raider_impact: number;
  quests_completed: number;
  favorite_categories: string[];
  joined_date: string;
  badges: string[];
}

interface DbAuthProfileRow {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface DbCounterfactual {
  id: string;
  token_name: string;
  token_slug: string;
  missed_action: string;
  potential_gain: number;
  timestamp: string;
  insight: string;
}

interface DbRaidCampaign {
  id: string;
  name: string;
  token_slug: string;
  status: RaidCampaign['status'];
  participants: number;
  posts_generated: number;
  engagement: number;
}

interface DbRaidGeneration {
  id: string;
  created_by_user_id?: string | null;
  created_by_username?: string | null;
  token_slug?: string | null;
  token_name: string;
  token_ticker?: string | null;
  platform: string;
  vibe: string;
  objective: string;
  audience?: string | null;
  contrast?: string | null;
  call_to_action_input?: string | null;
  narrative_summary?: string | null;
  momentum?: string | null;
  volume_24h?: number | null;
  holders?: number | null;
  price_change_24h?: number | null;
  source_rank_label?: string | null;
  mission_brief: string;
  variants: string[];
  reply_lines: string[];
  quote_replies: string[];
  raid_angles: string[];
  do_not_say: string[];
  call_to_action: string;
  created_at: string;
}

interface DbLaunchIdentity {
  id: string;
  created_by: string;
  created_by_user_id?: string | null;
  concept: string;
  target_audience: string;
  vibe: string;
  project_name: string;
  project_summary?: string | null;
  hero_line?: string | null;
  meme_dna: string[];
  name_options: string[];
  ticker_options: string[];
  lore: string[];
  slogans: string[];
  community_hooks?: string[] | null;
  ritual_ideas?: string[] | null;
  enemy_framing?: string[] | null;
  launch_copy: string[];
  launch_checklist?: string[] | null;
  aesthetic_direction: string[];
  created_at: string;
  updated_at?: string | null;
}

interface DbSyncRun {
  id: string;
  source: string;
  status: 'success' | 'partial' | 'error' | 'running';
  synced_count: number;
  inserted_count: number;
  updated_count: number;
  details?: string | null;
  created_at: string;
}

function mapToken(row: DbToken): Token {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ticker: row.ticker,
    price: row.price,
    priceChange24h: row.price_change_24h,
    marketCap: row.market_cap,
    volume24h: row.volume_24h,
    holders: row.holders,
    momentum: row.momentum,
    image: row.image ?? undefined,
    address: row.address ?? undefined,
    narrativeSummary: row.narrative_summary ?? undefined,
    source: row.source ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    fourMemeStatus: row.fourmeme_status ?? undefined,
    listedPancake: row.listed_pancake ?? undefined,
    lastSyncedAt: row.refreshed_at ?? undefined,
    sourceRankLabel: row.source_rank_label ?? undefined,
  };
}

function mapConviction(row: DbConviction): ConvictionAnalysis {
  return {
    tokenSlug: row.token_slug,
    bullCase: row.bull_case,
    bearCase: row.bear_case,
    risks: row.risks,
    triggers: row.triggers,
    convictionScore: row.conviction_score,
    timeframe: row.timeframe,
  };
}

function mapSwarm(row: DbSwarm): SwarmBehavior {
  return {
    label: row.label,
    percentage: row.percentage,
    trend: row.trend,
  };
}

function mapLore(row: DbLore): LoreEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    content: row.content,
    type: row.type,
  };
}

function mapQuest(row: DbQuest): Quest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    reward: row.reward,
    deadline: row.deadline ?? undefined,
    progress: row.progress ?? undefined,
    completed: row.completed,
    tokenSlug: row.token_slug ?? undefined,
    missionBrief: row.mission_brief ?? undefined,
    submissionRule: row.submission_rule ?? undefined,
    exampleProof: row.example_proof ?? undefined,
    proofType: row.proof_type ?? undefined,
    difficulty: row.difficulty ?? undefined,
    createdByUserId: row.created_by_user_id ?? undefined,
    createdByUsername: row.created_by_username ?? undefined,
    aiSuggested: row.ai_suggested ?? undefined,
    ownerNote: row.owner_note ?? undefined,
  };
}

function mapPrediction(row: DbPrediction): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    tokenSlug: row.token_slug,
    tokenName: row.token_name,
    prediction: row.prediction,
    targetPrice: row.target_price ?? undefined,
    timeframe: row.timeframe,
    reasoning: row.reasoning,
    timestamp: row.timestamp,
    likes: row.likes,
    status: row.status,
    callType: row.call_type ?? undefined,
    confidence: row.confidence ?? undefined,
    compareTokenSlug: row.compare_token_slug ?? undefined,
    compareTokenName: row.compare_token_name ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    baselinePrice: row.baseline_price ?? undefined,
    baselineVolume24h: row.baseline_volume_24h ?? undefined,
    baselineHolders: row.baseline_holders ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
    scoreAwarded: row.score_awarded ?? undefined,
    question: row.question ?? undefined,
    binaryAnswer: row.binary_answer ?? undefined,
  };
}

function mapQuestJoin(row: DbQuestParticipant): LocalQuestJoin {
  return {
    questId: row.quest_id,
    username: row.username,
    joinedAt: row.joined_at,
  };
}

function mapQuestSubmissionRow(row: DbQuestSubmission): LocalQuestSubmissionRecord {
  return {
    id: row.id,
    questId: row.quest_id,
    username: row.username,
    proofType: row.proof_type,
    proofValue: row.proof_value,
    note: row.note ?? undefined,
    status: row.status,
    xpAwarded: row.xp_awarded,
    reviewSummary: row.review_summary ?? undefined,
    createdAt: row.created_at,
  };
}

function mapProphet(row: DbProphet): Prophet {
  return {
    username: row.username,
    rank: row.rank,
    accuracy: row.accuracy,
    totalPredictions: row.total_predictions,
    correctPredictions: row.correct_predictions,
    streak: row.streak,
    avatar: row.avatar ?? undefined,
  };
}


function inferArchetype({ predictionsCount, accuracy, questsCompleted }: { predictionsCount: number; accuracy: number; questsCompleted: number }) {
  if (accuracy >= 70 && predictionsCount >= 5) return 'Signal sniper';
  if (questsCompleted >= 5) return 'Quest closer';
  if (predictionsCount >= 3) return 'Conviction builder';
  return 'Radar scout';
}

function deriveProfileBadges({ predictionsCount, accuracy, questsCompleted }: { predictionsCount: number; accuracy: number; questsCompleted: number }) {
  const badges: string[] = [];
  if (predictionsCount >= 1) badges.push('First call');
  if (predictionsCount >= 5) badges.push('Active prophet');
  if (accuracy >= 60 && predictionsCount >= 3) badges.push('Good read');
  if (accuracy >= 75 && predictionsCount >= 5) badges.push('Sharp conviction');
  if (questsCompleted >= 1) badges.push('Quest joined');
  if (questsCompleted >= 3) badges.push('Quest closer');
  return badges;
}

async function deriveUserProfileFromAuthProfile(row: DbAuthProfileRow): Promise<UserProfile> {
  const username = row.username;
  const [predictions, prophet, questLeaderboard, tokens] = await Promise.all([
    predictionApi.getByUser(username).catch(() => [] as Prediction[]),
    prophetApi.getByUsername(username).catch(() => undefined),
    questApi.getLeaderboard().catch(() => [] as QuestLeaderboardEntry[]),
    tokenApi.getAll().catch(() => [] as Token[]),
  ]);

  const mine = predictions || [];
  const questEntry = (questLeaderboard || []).find((entry) => entry.username === username);
  const correctCount = mine.filter((prediction) => prediction.status === 'correct').length;
  const resolvedCount = mine.filter((prediction) => prediction.status !== 'pending').length;
  const accuracy = resolvedCount > 0 ? Math.round((correctCount / resolvedCount) * 100) : 0;
  const tokenBySlug = new Map((tokens || []).map((token) => [token.slug, token]));
  const categoryCounts = new Map<string, number>();
  for (const prediction of mine) {
    const category = tokenBySlug.get(prediction.tokenSlug)?.category;
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }
  const favoriteCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  const questsCompleted = questEntry?.completed ?? 0;
  const raiderImpact = Math.max(
    questEntry?.xp ?? 0,
    mine.length * 18 + questsCompleted * 65 + correctCount * 25,
  );
  const badges = deriveProfileBadges({
    predictionsCount: mine.length,
    accuracy,
    questsCompleted,
  });

  return {
    username,
    displayName: row.display_name || username,
    avatar: row.avatar_url || undefined,
    archetype: inferArchetype({ predictionsCount: mine.length, accuracy, questsCompleted }),
    prophetRank: prophet?.rank ?? 0,
    raiderImpact,
    questsCompleted,
    favoriteCategories: favoriteCategories.length > 0 ? favoriteCategories : ['Meme'],
    joinedDate: row.created_at || new Date().toISOString(),
    badges,
  };
}

function mapProfile(row: DbUserProfile): UserProfile {
  return {
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar ?? undefined,
    archetype: row.archetype,
    prophetRank: row.prophet_rank,
    raiderImpact: row.raider_impact,
    questsCompleted: row.quests_completed,
    favoriteCategories: row.favorite_categories,
    joinedDate: row.joined_date,
    badges: row.badges,
  };
}

function mapCounterfactual(row: DbCounterfactual): CounterfactualEntry {
  return {
    id: row.id,
    tokenName: row.token_name,
    tokenSlug: row.token_slug,
    missedAction: row.missed_action,
    potentialGain: row.potential_gain,
    timestamp: row.timestamp,
    insight: row.insight,
  };
}

function mapRaid(row: DbRaidCampaign): RaidCampaign {
  return {
    id: row.id,
    name: row.name,
    tokenSlug: row.token_slug,
    status: row.status,
    participants: row.participants,
    postsGenerated: row.posts_generated,
    engagement: row.engagement,
  };
}

function mapRaidGeneration(row: DbRaidGeneration): GeneratedRaidContent {
  return {
    platform: row.platform,
    missionBrief: row.mission_brief,
    variants: row.variants ?? [],
    replyLines: row.reply_lines ?? [],
    quoteReplies: row.quote_replies ?? [],
    raidAngles: row.raid_angles ?? [],
    doNotSay: row.do_not_say ?? [],
    callToAction: row.call_to_action,
  };
}

function mapLaunchIdentity(row: DbLaunchIdentity): LaunchIdentity {
  return {
    projectName: row.project_name,
    projectSummary: row.project_summary ?? row.launch_copy?.[0] ?? `${row.project_name} is a Four.meme launch concept built for ${row.target_audience.toLowerCase()} with a ${row.vibe.toLowerCase()} posture.`,
    heroLine: row.hero_line ?? row.slogans?.[0] ?? `${row.project_name}. Built for attention.`,
    memeDNA: row.meme_dna,
    nameOptions: row.name_options,
    tickerOptions: row.ticker_options,
    lore: row.lore,
    slogans: row.slogans,
    communityHooks: row.community_hooks ?? row.slogans?.slice(0, 3) ?? [],
    ritualIdeas: row.ritual_ideas ?? [
      `Reply with ${row.ticker_options?.[0] ?? '$MEME'} on every milestone update.`,
      'Post one meme receipt daily to keep the cult feed alive.',
      'Celebrate every leaderboard climb with a shared call-and-response line.',
    ],
    enemyFraming: row.enemy_framing ?? [
      `Not another dead launch page. ${row.project_name} is built to feel alive.`,
      'Against empty copycat memes with no identity backbone.',
    ],
    launchCopy: row.launch_copy,
    launchChecklist: row.launch_checklist ?? [
      'Lock the hero line and ticker before posting.',
      'Publish the first 3 launch posts within the same attention window.',
      'Give the community one ritual and one rivalry angle on day one.',
    ],
    aestheticDirection: row.aesthetic_direction,
  };
}

function mapSyncRun(row: DbSyncRun) {
  return {
    id: row.id,
    source: row.source,
    status: row.status,
    syncedCount: row.synced_count,
    insertedCount: row.inserted_count,
    updatedCount: row.updated_count,
    details: row.details ?? undefined,
    createdAt: row.created_at,
  };
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!hasApiBaseBackend) {
    if (allowMockData) return fallback;
    throw new Error(`API backend is not configured for ${path}`);
  }

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (allowMockData) return fallback;
    throw error;
  }
}

function getStoredPredictions(): Prediction[] {
  return readStorage(STORAGE_KEYS.predictions, [] as Prediction[]);
}

interface LocalPredictionMeta {
  id: string;
  callType?: PredictionCallType;
  confidence?: PredictionConfidence;
  compareTokenSlug?: string;
  compareTokenName?: string;
  expiresAt?: string;
  baselinePrice?: number;
  baselineVolume24h?: number;
  baselineHolders?: number;
  resolutionNote?: string;
  scoreAwarded?: number;
  question?: string;
  binaryAnswer?: 'yes' | 'no';
}

function getStoredPredictionMeta() {
  return readStorage(STORAGE_KEYS.predictionMeta, {} as Record<string, LocalPredictionMeta>);
}

function writePredictionMeta(meta: Record<string, LocalPredictionMeta>) {
  writeStorage(STORAGE_KEYS.predictionMeta, meta);
}

function persistPredictionMeta(meta: LocalPredictionMeta) {
  const current = getStoredPredictionMeta();
  current[meta.id] = { ...(current[meta.id] || {}), ...meta };
  writePredictionMeta(current);
  return current[meta.id];
}

function mergePredictionMeta(prediction: Prediction): Prediction {
  const meta = getStoredPredictionMeta()[prediction.id];
  if (!meta) return prediction;
  return { ...prediction, ...meta };
}

function persistPrediction(prediction: Prediction) {
  const merged = mergePredictionMeta(prediction);
  const current = getStoredPredictions().filter((item) => item.id !== merged.id);
  writeStorage(STORAGE_KEYS.predictions, [merged, ...current]);
  return merged;
}

function getPredictionPool() {
  const pool = allowMockData ? [...getStoredPredictions(), ...mockPredictions] : getStoredPredictions();
  return sanitizePredictions(pool).map(mergePredictionMeta);
}

interface LocalQuestJoin {
  questId: string;
  username: string;
  joinedAt: string;
}

interface LocalQuestSubmissionRecord {
  id: string;
  questId: string;
  username: string;
  proofType: QuestSubmission['proofType'];
  proofValue: string;
  note?: string;
  status: QuestSubmission['status'];
  xpAwarded: number;
  reviewSummary?: string;
  createdAt: string;
}

function getStoredQuestJoins() {
  return readStorage(STORAGE_KEYS.questJoins, [] as LocalQuestJoin[]);
}

function writeQuestJoins(joins: LocalQuestJoin[]) {
  writeStorage(STORAGE_KEYS.questJoins, joins);
}

function getStoredQuestSubmissions() {
  return readStorage(STORAGE_KEYS.questSubmissions, [] as LocalQuestSubmissionRecord[]);
}

function writeQuestSubmissions(submissions: LocalQuestSubmissionRecord[]) {
  writeStorage(STORAGE_KEYS.questSubmissions, submissions);
}

function hasAuthenticatedActor() {
  return Boolean(getCurrentActor().isAuthenticated && currentUserId() && currentUserId() !== env.currentUser);
}

async function getQuestJoinsSource() {
  if (hasSupabaseBackend) {
    const rows = await selectRows<DbQuestParticipant[]>('quest_participants', { orderBy: { column: 'joined_at', ascending: false } }, []);
    return rows.map(mapQuestJoin);
  }
  return getStoredQuestJoins();
}

async function getQuestSubmissionsSource() {
  if (hasSupabaseBackend) {
    const rows = await selectRows<DbQuestSubmission[]>('quest_submissions', { orderBy: { column: 'created_at', ascending: false } }, []);
    return rows.map(mapQuestSubmissionRow);
  }
  return getStoredQuestSubmissions();
}

function getQuestDifficulty(reward: number): Quest['difficulty'] {
  if (reward >= 900) return 'hard';
  if (reward >= 500) return 'medium';
  return 'easy';
}

function getQuestProofType(category: Quest['category']): Quest['proofType'] {
  switch (category) {
    case 'posting':
    case 'rivalry':
      return 'link';
    case 'meme':
      return 'image';
    case 'prediction':
      return 'prediction';
    default:
      return 'text';
  }
}

function createQuestSubmissionId() {
  return `quest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapQuestSubmission(record: LocalQuestSubmissionRecord): QuestSubmission {
  return { ...record };
}

function evaluateQuestSubmission(quest: Quest, proofValue: string, note?: string) {
  const trimmed = proofValue.trim();
  const noteText = (note || '').trim();
  const noteLength = noteText.length;
  const proofType = quest.proofType || getQuestProofType(quest.category);
  const lower = trimmed.toLowerCase();
  const hasUrl = /^https?:\/\//i.test(trimmed);
  const looksLikeXLink = /^https?:\/\/(www\.)?(x|twitter)\.com\//i.test(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const mentionsCondition = /(if|when|unless|because|volume|holders|liquidity|trend|breakout|fails|holds|above|below)/i.test(trimmed + ' ' + noteText);
  const mentionsToken = quest.tokenName ? lower.includes(quest.tokenName.toLowerCase()) : false;

  if (!trimmed) {
    return { status: 'rejected' as const, xpAwarded: 0, reviewSummary: 'No proof was submitted, so Sloan could not score the mission.' };
  }

  if (proofType === 'link') {
    if (looksLikeXLink) {
      return { status: 'accepted' as const, xpAwarded: quest.reward, reviewSummary: 'Strong receipt. The X link is valid and Sloan can treat this as completed posting proof.' };
    }
    if (hasUrl) {
      return { status: 'pending' as const, xpAwarded: Math.round(quest.reward * 0.65), reviewSummary: 'The link is real, but Sloan prefers an X or thread link for posting missions.' };
    }
    return { status: 'rejected' as const, xpAwarded: 0, reviewSummary: 'Posting quests need a public link Sloan can verify, ideally an X post or reply.' };
  }

  if (proofType === 'image') {
    if (hasUrl && (/(png|jpg|jpeg|gif|webp)/i.test(lower) || looksLikeXLink)) {
      return { status: 'accepted' as const, xpAwarded: quest.reward, reviewSummary: 'Visual receipt accepted. Sloan has enough evidence that a meme asset was actually submitted.' };
    }
    if (wordCount >= 14 && noteLength >= 18) {
      return { status: 'pending' as const, xpAwarded: Math.round(quest.reward * 0.6), reviewSummary: 'The concept is usable, but Sloan still needs a visual link or stronger proof for a meme mission.' };
    }
    return { status: 'rejected' as const, xpAwarded: 0, reviewSummary: 'Meme quests need a meme link or a clearer caption concept with context.' };
  }

  if (proofType === 'prediction') {
    if (wordCount >= 12 && mentionsCondition && (mentionsToken || noteLength >= 18)) {
      return { status: 'accepted' as const, xpAwarded: quest.reward, reviewSummary: 'Prediction accepted. It is specific enough to judge later and anchored to a real condition.' };
    }
    if (wordCount >= 8) {
      return { status: 'pending' as const, xpAwarded: Math.round(quest.reward * 0.55), reviewSummary: 'The call is visible, but it still needs a clearer condition or timeframe to feel scoreable.' };
    }
    return { status: 'rejected' as const, xpAwarded: 0, reviewSummary: 'Prediction quests need a clear call with a reason, a condition, or a timeframe.' };
  }

  if (wordCount >= 16 && (noteLength >= 16 || mentionsCondition || mentionsToken)) {
    return { status: 'accepted' as const, xpAwarded: quest.reward, reviewSummary: 'Submission accepted. The receipt has enough detail to count as real participation.' };
  }

  if (wordCount >= 8 || noteLength >= 18) {
    return { status: 'pending' as const, xpAwarded: Math.round(quest.reward * 0.6), reviewSummary: 'The mission is moving, but Sloan wants one more layer of detail before fully accepting it.' };
  }

  return { status: 'rejected' as const, xpAwarded: 0, reviewSummary: 'This receipt is too thin. Add more context or a stronger proof link.' };
}

function buildQuestSubmissionRule(quest: Quest, token?: Token) {
  const tokenLabel = token?.name || quest.tokenName || 'the token';
  switch (quest.category) {
    case 'posting':
      return `Submit one public X post or reply link that pushes ${tokenLabel} with a real angle, not a generic shill line.`;
    case 'prediction':
      return `Write one scoreable call on ${tokenLabel} with a condition or timeframe. Sloan should be able to judge it later.`;
    case 'meme':
      return `Submit a meme image link or a reusable caption concept that the community could actually repost for ${tokenLabel}.`;
    case 'rivalry':
      return `Frame ${tokenLabel} against the rival token in one line with a clear contrast, then submit the post link or the line itself.`;
    case 'recovery':
    default:
      return `Write the comeback angle, missed-opportunity lesson, or narrative reset that could sharpen conviction on ${tokenLabel}.`;
  }
}

function buildQuestExampleProof(quest: Quest, token?: Token, rivalTokenName?: string) {
  const tokenLabel = token?.name || quest.tokenName || 'the token';
  switch (quest.category) {
    case 'posting':
      return `https://x.com/yourhandle/status/123 — "${tokenLabel} is getting posted because the joke is clean and the crowd can repeat it in one line."`;
    case 'prediction':
      return `${tokenLabel} stays hot for the next 24h if volume keeps expanding and holders do not flatten.`;
    case 'meme':
      return `${tokenLabel}: "Built in one tab. Shipped before the standup ended."`;
    case 'rivalry':
      return `${tokenLabel} has the cleaner story. ${rivalTokenName || 'The rival token'} has noise, but no repeatable line the crowd can own.`;
    case 'recovery':
    default:
      return `${tokenLabel} is not dead, it just has weak framing. The comeback angle is to turn the missed entry into a cleaner second-cycle story.`;
  }
}

function buildQuestMissionBrief(quest: Quest, token?: Token) {
  const tokenName = token?.name || quest.tokenName || quest.tokenSlug || 'this token';
  const tokenContext = token?.narrativeSummary
    ? token.narrativeSummary
    : token
      ? `${tokenName} is showing ${token.momentum} momentum with ${toCompactMoney(token.volume24h)} in 24h volume.`
      : `${tokenName} needs a stronger community loop to stay sticky after discovery.`;

  switch (quest.category) {
    case 'posting':
      return `Turn ${tokenName} into a repeatable timeline story. Use one clean line, one real angle, and proof that people actually engaged. ${tokenContext}`;
    case 'prediction':
      return `Make a public call that is specific enough to be judged later. Sloan should be able to tell whether your conviction held up or folded. ${tokenContext}`;
    case 'meme':
      return `Create a meme asset that the community can reuse, not just a one-off joke. The mission is to give ${tokenName} something screenshot-friendly and repeatable.`;
    case 'rivalry':
      return `Pick a real contrast and push it hard. This quest is about framing ${tokenName} against the usual weak launches and making the community line easy to repeat.`;
    case 'recovery':
    default:
      return `Use this quest to turn a missed trade or weak moment into a cleaner story for the next cycle. Sloan wants reflection that can sharpen future conviction.`;
  }
}

function buildQuestParticipants(quest: Quest, joins: LocalQuestJoin[], token?: Token) {
  const joined = joins.filter((item) => item.questId === quest.id).length;
  const progressBase = quest.progress ? Math.max(1, Math.round(quest.progress / 8)) : 0;
  const rewardBase = Math.max(2, Math.round(quest.reward / 140));
  const tokenBase = token?.holders ? Math.min(24, Math.max(0, Math.round(token.holders / 1500))) : 0;
  return Math.max(joined, joined + progressBase, rewardBase + tokenBase);
}

function buildQuestProgress(quest: Quest, joined: boolean, submission?: LocalQuestSubmissionRecord) {
  if (quest.completed || submission?.status === 'accepted') return 100;
  if (submission?.status === 'pending') return 82;
  if (submission?.status === 'rejected') return 38;
  if (joined) return Math.max(quest.progress ?? 0, 18);
  return quest.progress ?? 0;
}

function enrichQuest(baseQuest: Quest, tokens: Token[], joins: LocalQuestJoin[], submissions: LocalQuestSubmissionRecord[]): Quest {
  const token = baseQuest.tokenSlug ? tokens.find((item) => item.slug === baseQuest.tokenSlug) : undefined;
  const myJoin = joins.some((join) => join.questId === baseQuest.id && join.username === currentUsername());
  const mySubmission = submissions
    .filter((submission) => submission.questId === baseQuest.id && submission.username === currentUsername())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const completed = baseQuest.completed || mySubmission?.status === 'accepted';
  const joined = myJoin || Boolean(mySubmission);
  const mySubmissionStatus: Quest['mySubmissionStatus'] = mySubmission
    ? mySubmission.status === 'accepted'
      ? 'accepted'
      : mySubmission.status === 'pending'
        ? 'pending'
        : 'rejected'
    : joined
      ? 'joined'
      : 'none';

  return {
    ...baseQuest,
    tokenName: token?.name || baseQuest.tokenName,
    participants: buildQuestParticipants(baseQuest, joins, token),
    difficulty: baseQuest.difficulty || getQuestDifficulty(baseQuest.reward),
    proofType: baseQuest.proofType || getQuestProofType(baseQuest.category),
    missionBrief: baseQuest.missionBrief || buildQuestMissionBrief(baseQuest, token),
    submissionRule: baseQuest.submissionRule || buildQuestSubmissionRule(baseQuest, token),
    exampleProof: baseQuest.exampleProof || buildQuestExampleProof(baseQuest, token),
    joined,
    mySubmissionStatus,
    status: completed ? 'complete' : mySubmission?.status === 'pending' ? 'pending_review' : 'open',
    xpAwarded: mySubmission?.xpAwarded || (completed ? baseQuest.reward : 0),
    completed,
    progress: buildQuestProgress(baseQuest, joined, mySubmission),
  };
}


function slugifyQuestValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64) || `quest-${Date.now().toString(36)}`;
}

function buildOwnerQuestSuggestions(token: Token, preferredCategory?: Quest['category']): QuestSuggestionPack {
  const categories: Quest['category'][] = preferredCategory ? [preferredCategory] : ['posting', 'prediction', 'meme'];
  const chosen = categories.length === 1 ? categories : ['posting', 'prediction', 'meme'];
  const volumeLine = token.volume24h > 0 ? `$${Math.round(token.volume24h).toLocaleString()} 24h volume` : 'live attention starting to form';
  const holderLine = token.holders > 0 ? `${token.holders.toLocaleString()} holders` : 'holder expansion still early';
  const rivalSlug = token.sourceRankLabel === 'HOT' ? 'the usual weak copycat launches' : 'the louder timeline tourists';
  const suggestionByCategory: Record<Quest['category'], Quest> = {
    posting: {
      id: `owner-suggest-${token.slug}-posting`,
      title: `${token.name} narrative push`,
      description: `Publish one strong post that makes ${token.name} easier to repeat across the timeline.`,
      category: 'posting',
      reward: 220,
      completed: false,
      tokenSlug: token.slug,
      tokenName: token.name,
      difficulty: 'easy',
      proofType: 'link',
      missionBrief: `${token.name} already has ${volumeLine}. Use that proof and the one-line narrative to create a post the community can reuse today.`,
      submissionRule: `Submit one public X or thread link that clearly frames why ${token.name} matters right now.`,
      exampleProof: `https://x.com/yourhandle/status/... with a line like “${token.name} already has ${volumeLine} and still looks early.”`,
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: true,
    },
    prediction: {
      id: `owner-suggest-${token.slug}-prediction`,
      title: `${token.name} conviction check`,
      description: `Ask the community to make one sharp call on whether ${token.name} can keep its live strength.`,
      category: 'prediction',
      reward: 260,
      completed: false,
      tokenSlug: token.slug,
      tokenName: token.name,
      difficulty: 'medium',
      proofType: 'prediction',
      missionBrief: `${token.name} is sitting on ${holderLine}. This quest works best if the community states one clear 24h condition instead of vague hype.`,
      submissionRule: `Submit one yes-or-no prediction with a timeframe and one reason tied to live data.`,
      exampleProof: `${token.name} keeps momentum for 24h if holders expand past today's baseline and volume does not break down.`,
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: true,
    },
    meme: {
      id: `owner-suggest-${token.slug}-meme`,
      title: `${token.name} slogan and meme drop`,
      description: `Create one meme caption or slogan the community can actually repeat for ${token.name}.`,
      category: 'meme',
      reward: 300,
      completed: false,
      tokenSlug: token.slug,
      tokenName: token.name,
      difficulty: 'medium',
      proofType: 'image',
      missionBrief: `${token.name} needs reusable language, not random posts. Use this quest to produce one image, caption, or slogan that makes the story stick.`,
      submissionRule: `Submit one meme image link or one caption concept strong enough for the community to repost.`,
      exampleProof: `Caption concept: “${token.name}: they debug for 6 hours, we ship in one tab.”`,
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: true,
    },
    rivalry: {
      id: `owner-suggest-${token.slug}-rivalry`,
      title: `${token.name} story war`,
      description: `Frame why ${token.name} deserves attention over ${rivalSlug}.`,
      category: 'rivalry',
      reward: 360,
      completed: false,
      tokenSlug: token.slug,
      tokenName: token.name,
      difficulty: 'hard',
      proofType: 'link',
      missionBrief: `This is a narrative fight, not a pump war. Use the mission to sharpen why ${token.name} has the stronger meme story, culture angle, or timing.`,
      submissionRule: `Submit one public post or reply that contrasts ${token.name} against a clear rival without turning into spam.`,
      exampleProof: `“${token.name} has the cleaner story. The other side only has noise. This one has repeatable culture.”`,
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: true,
    },
    recovery: {
      id: `owner-suggest-${token.slug}-recovery`,
      title: `${token.name} recovery arc`,
      description: `Use one mission to reset the tone around ${token.name} after a weak stretch.`,
      category: 'recovery',
      reward: 240,
      completed: false,
      tokenSlug: token.slug,
      tokenName: token.name,
      difficulty: 'medium',
      proofType: 'text',
      missionBrief: `${token.name} needs a cleaner second wind. Ask the community for one post, slogan, or angle that repositions the story without pretending the tape never weakened.`,
      submissionRule: `Submit one recovery angle with a concrete line the community can reuse.`,
      exampleProof: `${token.name} is not dead, it just needs a sharper reason to care than yesterday's weak shill cycle.`,
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: true,
    },
  };
  const suggestions = chosen.map((category) => suggestionByCategory[category]).filter(Boolean);
  return {
    tokenSlug: token.slug,
    tokenName: token.name,
    strategyNote: `${token.name} is live with ${volumeLine} and ${holderLine}. Sloan suggests owner-led quests that turn that attention into repeatable missions instead of generic spam.`,
    suggestions,
  };
}

async function getQuestBaseQuests(tokens: Token[] = []) {
  const dynamicQuests = buildDynamicQuestSet(tokens);

  if (hasSupabaseBackend) {
    const rows = await selectRows<DbQuest[]>('quests', { orderBy: { column: 'created_at', ascending: false } }, []);
    const storedQuests = sanitizeQuests(rows.map(mapQuest));
    if (storedQuests.length > 0) {
      const ownerPublished = storedQuests.sort((a, b) => {
        const ownerA = a.createdByUsername ? 1 : 0;
        const ownerB = b.createdByUsername ? 1 : 0;
        return ownerB - ownerA;
      });
      return uniqueQuests(ownerPublished);
    }
    if (dynamicQuests.length > 0) return uniqueQuests(dynamicQuests);
  }

  const localOwnerQuests = sanitizeQuests(readStorage(STORAGE_KEYS.quests, [] as Quest[]));
  if (localOwnerQuests.length > 0) return uniqueQuests(localOwnerQuests);
  const fallbackQuests = allowMockData ? sanitizeQuests(mockQuests) : [];
  return dynamicQuests.length > 0 ? uniqueQuests([...dynamicQuests, ...fallbackQuests]) : fallbackQuests;
}

async function ensureQuestPersisted(quest: Quest) {
  if (!hasSupabaseBackend || !hasAuthenticatedActor()) return;

  await upsertRows<DbQuest[]>('quests', {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    category: quest.category,
    reward: quest.reward,
    deadline: quest.deadline ?? null,
    progress: typeof quest.progress === 'number' ? quest.progress : null,
    completed: Boolean(quest.completed),
    token_slug: quest.tokenSlug ?? null,
    mission_brief: quest.missionBrief ?? null,
    submission_rule: quest.submissionRule ?? null,
    example_proof: quest.exampleProof ?? null,
    proof_type: quest.proofType ?? null,
    difficulty: quest.difficulty ?? null,
    created_by_user_id: quest.createdByUserId ?? currentUserId() ?? null,
    created_by_username: quest.createdByUsername ?? currentUsername() ?? null,
    ai_suggested: quest.aiSuggested ?? false,
    owner_note: quest.ownerNote ?? null,
  }, { onConflict: 'id' }, []);
}

async function getEnrichedQuests() {
  const tokens = await tokenApi.getAll();
  const baseQuests = await getQuestBaseQuests(tokens || []);
  const [joins, submissions] = await Promise.all([getQuestJoinsSource(), getQuestSubmissionsSource()]);
  return baseQuests.map((quest) => enrichQuest(quest, tokens || [], joins, submissions));
}

function buildQuestLeaderboardEntries(submissions: LocalQuestSubmissionRecord[]): QuestLeaderboardEntry[] {
  const stats = new Map<string, { xp: number; completed: number; pending: number; lastAcceptedAt?: number }>();

  for (const submission of submissions) {
    const existing = stats.get(submission.username) || { xp: 0, completed: 0, pending: 0 };
    if (submission.status === 'accepted') {
      existing.xp += submission.xpAwarded;
      existing.completed += 1;
      existing.lastAcceptedAt = new Date(submission.createdAt).getTime();
    } else if (submission.status === 'pending') {
      existing.pending += 1;
    }
    stats.set(submission.username, existing);
  }

  const entries = [...stats.entries()]
    .map(([username, value]) => ({
      username,
      xp: value.xp,
      completed: value.completed,
      pending: value.pending,
      streak: Math.min(7, value.completed),
      badges: uniqueStrings([
        value.completed >= 3 ? 'Quest closer' : '',
        value.pending >= 2 ? 'Work in motion' : '',
        value.xp >= 1000 ? 'XP stacker' : '',
      ].filter(Boolean)),
    }))
    .sort((a, b) => (b.xp - a.xp) || (b.completed - a.completed) || a.username.localeCompare(b.username));

  if (entries.length === 0) {
    return [{ username: currentUsername(), xp: 0, completed: 0, pending: 0, streak: 0, badges: ['First mover'] }];
  }

  return entries;
}

function buildQuestActivity(submissions: LocalQuestSubmissionRecord[], joins: LocalQuestJoin[]): QuestActivity {
  const mine = submissions
    .filter((submission) => submission.username === currentUsername())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const accepted = mine.filter((submission) => submission.status === 'accepted');
  const pending = mine.filter((submission) => submission.status === 'pending');

  return {
    joinedCount: joins.filter((join) => join.username === currentUsername()).length,
    completedCount: accepted.length,
    pendingCount: pending.length,
    totalXp: accepted.reduce((sum, submission) => sum + submission.xpAwarded, 0),
    streak: Math.min(7, accepted.length),
    recentSubmissions: mine.slice(0, 4).map(mapQuestSubmission),
  };
}

function buildQuestLiveFeed(quests: Quest[], submissions: LocalQuestSubmissionRecord[], joins: LocalQuestJoin[]): QuestLiveEvent[] {
  const feed: QuestLiveEvent[] = [];

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  for (const submission of recentSubmissions) {
    const quest = quests.find((item) => item.id === submission.questId);
    if (!quest) continue;
    const tone = submission.status === 'accepted' ? 'accepted' : submission.status === 'pending' ? 'pending' : 'rejected';
    feed.push({
      id: `submission-${submission.id}`,
      questId: submission.questId,
      title: quest.title,
      subtitle: `${submission.username} submitted ${quest.proofType || 'proof'} and Sloan marked it ${submission.status}.`,
      tone,
      timestamp: submission.createdAt,
    });
  }

  const recentJoins = [...joins]
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 6);

  for (const join of recentJoins) {
    const quest = quests.find((item) => item.id === join.questId);
    if (!quest) continue;
    feed.push({
      id: `join-${join.username}-${join.questId}`,
      questId: join.questId,
      title: quest.title,
      subtitle: `${join.username} joined the mission queue for ${quest.tokenName || 'this token'}.`,
      tone: 'joined',
      timestamp: join.joinedAt,
    });
  }

  if (feed.length === 0) {
    for (const quest of quests.slice(0, 5)) {
      feed.push({
        id: `fresh-${quest.id}`,
        questId: quest.id,
        title: quest.title,
        subtitle: `${quest.tokenName || 'Live token'} surfaced a ${quest.category} mission in Sloan.`,
        tone: 'fresh',
        timestamp: quest.deadline || new Date().toISOString(),
      });
    }
  }

  return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'for', 'from', 'by', 'with', 'and', 'or', 'but', 'while', 'who', 'that', 'this',
  'is', 'are', 'was', 'were', 'be', 'being', 'been', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you',
  'your', 'into', 'about', 'single', 'people', 'because', 'just', 'real', 'era', 'launch', 'token', 'coin', 'meme',
]);

const GENERIC_FORGE_WORDS = new Set([
  'protocol', 'signal', 'reactor', 'cult', 'meme', 'playful', 'chaotic', 'professional', 'absurdist', 'degens',
  'crypto', 'internet', 'community', 'launch', 'token', 'coin', 'project', 'vibe', 'audience', 'identity', 'pack',
]);

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function uniqueStrings(values: string[], limit?: number) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (limit && output.length >= limit) break;
  }

  return output;
}


function parseTimeframeMs(timeframe: string) {
  const value = timeframe.toLowerCase().trim();
  if (value.includes('1 hour')) return 60 * 60 * 1000;
  if (value.includes('6 hour')) return 6 * 60 * 60 * 1000;
  if (value.includes('24 hour')) return 24 * 60 * 60 * 1000;
  if (value.includes('3 day')) return 3 * 24 * 60 * 60 * 1000;
  if (value.includes('7 day')) return 7 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function buildPredictionExpiry(timestamp: string, timeframe: string) {
  return new Date(new Date(timestamp).getTime() + parseTimeframeMs(timeframe)).toISOString();
}

function resolvePredictionStatus(prediction: Prediction, tokens: Token[]): Prediction {
  if (prediction.status !== 'pending') return prediction;
  const expiresAt = prediction.expiresAt;
  if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) return prediction;

  const token = tokens.find((item) => item.slug === prediction.tokenSlug);
  if (!token) return prediction;

  const baselinePrice = prediction.baselinePrice ?? token.price;
  const baselineVolume = prediction.baselineVolume24h ?? Math.max(token.volume24h, 1);
  const baselineHolders = prediction.baselineHolders ?? Math.max(token.holders, 0);
  const compareToken = prediction.compareTokenSlug ? tokens.find((item) => item.slug === prediction.compareTokenSlug) : undefined;

  const priceDelta = baselinePrice > 0 ? ((token.price - baselinePrice) / baselinePrice) * 100 : token.priceChange24h;
  const volumeDelta = baselineVolume > 0 ? ((token.volume24h - baselineVolume) / baselineVolume) * 100 : 0;
  const holderDelta = baselineHolders > 0 ? ((token.holders - baselineHolders) / baselineHolders) * 100 : (token.holders > baselineHolders ? 100 : token.holders < baselineHolders ? -100 : 0);

  let propositionTrue = false;
  let resolutionNote = '';
  const callType = prediction.callType || 'momentum';

  if (callType === 'relative_strength' && compareToken) {
    const primaryEdge = token.priceChange24h - compareToken.priceChange24h;
    propositionTrue = primaryEdge > 2;
    resolutionNote = propositionTrue
      ? `${token.name} outperformed ${compareToken.name} by ${primaryEdge.toFixed(1)} points on 24h change.`
      : `${token.name} failed to outperform ${compareToken.name}. The edge finished at ${primaryEdge.toFixed(1)} points.`;
  } else if (callType === 'volume') {
    propositionTrue = volumeDelta >= 10;
    resolutionNote = propositionTrue
      ? `Volume increased by ${volumeDelta.toFixed(1)}% versus baseline.`
      : `Volume did not expand enough. The move finished at ${volumeDelta.toFixed(1)}% versus baseline.`;
  } else if (callType === 'holders') {
    propositionTrue = token.holders > baselineHolders;
    resolutionNote = propositionTrue
      ? `Holder count increased from ${baselineHolders} to ${token.holders}.`
      : `Holder count did not increase. It moved from ${baselineHolders} to ${token.holders}.`;
  } else if (callType === 'price') {
    propositionTrue = priceDelta >= 5;
    resolutionNote = propositionTrue
      ? `Price gained ${priceDelta.toFixed(1)}% versus baseline.`
      : `Price failed to clear the target. The move finished at ${priceDelta.toFixed(1)}%.`;
  } else if (callType === 'survival') {
    propositionTrue = token.momentum !== 'falling' && (token.priceChange24h > -8 || token.volume24h >= baselineVolume * 0.9);
    resolutionNote = propositionTrue
      ? `${token.name} kept enough activity and momentum to stay strong through the window.`
      : `${token.name} cooled off too much to count as strong through the window.`;
  } else {
    propositionTrue = priceDelta >= 6 || token.priceChange24h >= 8 || token.momentum === 'rising';
    resolutionNote = propositionTrue
      ? `${token.name} held enough follow-through for the bullish call to land.`
      : `${token.name} never found enough follow-through to validate the bullish call.`;
  }

  const votedYes = prediction.binaryAnswer ? prediction.binaryAnswer === 'yes' : prediction.prediction === 'moon';
  const correct = votedYes ? propositionTrue : !propositionTrue;
  const confidenceWeight = prediction.confidence === 'high' ? 1.15 : prediction.confidence === 'low' ? 0.9 : 1;
  const difficultyBase = callType === 'survival' ? 80 : callType === 'holders' ? 70 : 75;
  const scoreAwarded = correct
    ? Math.max(12, Math.round(difficultyBase * confidenceWeight))
    : -Math.max(12, Math.round(difficultyBase * 0.55 * confidenceWeight));

  persistPredictionMeta({
    id: prediction.id,
    resolutionNote,
    scoreAwarded,
  });

  return {
    ...prediction,
    status: correct ? 'correct' : 'incorrect',
    resolutionNote,
    scoreAwarded,
  };
}

function enrichPredictions(predictions: Prediction[], tokens: Token[]) {
  return predictions
    .map(mergePredictionMeta)
    .map((prediction) => resolvePredictionStatus(prediction, tokens))
    .map((prediction) => mergePredictionMeta(prediction))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function syncResolvedPredictionsToBackend(previous: Prediction[], next: Prediction[]) {
  if (!hasSupabaseBackend || !hasAuthenticatedActor()) return;

  const previousById = new Map(previous.map((prediction) => [prediction.id, prediction]));
  const changed = next.filter((prediction) => {
    const earlier = previousById.get(prediction.id);
    return Boolean(
      earlier &&
      earlier.userId === currentUserId() &&
      earlier.status === 'pending' &&
      prediction.status !== 'pending'
    );
  });

  await Promise.all(changed.map((prediction) =>
    updateRows<DbPrediction>('predictions', { id: prediction.id, user_id: currentUserId() }, {
      status: prediction.status,
      resolution_note: prediction.resolutionNote ?? null,
      score_awarded: prediction.scoreAwarded ?? null,
    }).catch(() => null),
  ));
}

function buildProphetBoard(predictions: Prediction[]) {
  const stats = new Map<string, { total: number; correct: number; streak: number; score: number }>();

  const ordered = [...predictions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  for (const prediction of ordered) {
    const current = stats.get(prediction.username) || { total: 0, correct: 0, streak: 0, score: 0 };
    current.total += 1;
    if (prediction.status === 'correct') {
      current.correct += 1;
      current.streak += 1;
    } else if (prediction.status === 'incorrect') {
      current.streak = 0;
    }
    current.score += prediction.scoreAwarded ?? 0;
    stats.set(prediction.username, current);
  }

  const rows = [...stats.entries()].map(([username, value]) => ({
    username,
    accuracy: value.total > 0 ? (value.correct / value.total) * 100 : 0,
    totalPredictions: value.total,
    correctPredictions: value.correct,
    streak: value.streak,
    score: value.score,
  }));

  rows.sort((a, b) => (b.score - a.score) || (b.accuracy - a.accuracy) || (b.correctPredictions - a.correctPredictions) || a.username.localeCompare(b.username));

  return rows.map((row, index) => ({
    username: row.username,
    rank: index + 1,
    accuracy: row.accuracy,
    totalPredictions: row.totalPredictions,
    correctPredictions: row.correctPredictions,
    streak: row.streak,
  }));
}

function buildPredictionOpportunities(tokens: Token[]): PredictionOpportunity[] {
  const live = [...tokens]
    .filter((token) => token.slug && token.name)
    .sort((a, b) => (b.volume24h - a.volume24h) || (b.holders - a.holders));

  const opportunities: PredictionOpportunity[] = [];
  const top = live.slice(0, 12);

  top.forEach((token, index) => {
    const variant = index % 4;
    if (variant === 0) {
      opportunities.push({
        id: `opp-volume-${token.slug}`,
        title: `${token.name} • volume call`,
        subtitle: `${token.ticker} is trading ${formatUsd(token.volume24h)} in 24h volume right now.`,
        tokenSlug: token.slug,
        callType: 'volume',
        suggestedPrediction: 'moon',
        timeframe: '24 hours',
        confidence: token.momentum === 'rising' ? 'medium' : 'low',
        reasoningHint: `${token.name} already has live activity. Sloan thinks the next clean question is whether that volume expands from here.`,
        question: `Will ${token.name}'s 24h volume increase over the next 24 hours?`,
        yesLabel: 'Yes',
        noLabel: 'No',
      });
    } else if (variant === 1) {
      opportunities.push({
        id: `opp-holders-${token.slug}`,
        title: `${token.name} • holder growth call`,
        subtitle: `${token.holders || 0} holders are currently tracked for ${token.ticker}.`,
        tokenSlug: token.slug,
        callType: 'holders',
        suggestedPrediction: 'moon',
        timeframe: '24 hours',
        confidence: 'medium',
        reasoningHint: `${token.name} has enough visibility for a clean holder-growth yes or no call.`,
        question: `Will ${token.name}'s holder count increase over the next 24 hours?`,
        yesLabel: 'Yes',
        noLabel: 'No',
      });
    } else if (variant === 2) {
      opportunities.push({
        id: `opp-price-${token.slug}`,
        title: `${token.name} • price call`,
        subtitle: `${token.ticker} is moving ${formatPercent(token.priceChange24h, { showPlus: true })} over 24h.`,
        tokenSlug: token.slug,
        callType: 'price',
        suggestedPrediction: 'moon',
        timeframe: '24 hours',
        confidence: token.momentum === 'rising' ? 'medium' : 'low',
        reasoningHint: `${token.name} has enough price motion for a simple up-or-not call.`,
        question: `Will ${token.name}'s price increase over the next 24 hours?`,
        yesLabel: 'Yes',
        noLabel: 'No',
      });
    } else {
      opportunities.push({
        id: `opp-survival-${token.slug}`,
        title: `${token.name} • momentum call`,
        subtitle: `${token.ticker} currently reads ${token.momentum} on Sloan's board.`,
        tokenSlug: token.slug,
        callType: 'survival',
        suggestedPrediction: 'moon',
        timeframe: '24 hours',
        confidence: 'low',
        reasoningHint: `${token.name} has enough signal for a simple yes-or-no call on whether it stays strong.`,
        question: `Will ${token.name} stay strong over the next 24 hours?`,
        yesLabel: 'Yes',
        noLabel: 'No',
      });
    }
  });

  return opportunities.slice(0, 12);
}

function buildSyntheticPredictions(tokens: Token[]): Prediction[] {
  const live = uniqueTokens(tokens).filter((token) => token.slug && token.name).slice(0, 4);
  if (live.length === 0) return [];

  const picks = [
    { username: 'signal_saint', callType: 'momentum' as PredictionCallType, prediction: 'moon' as const, timeframe: '1 hour', confidence: 'medium' as PredictionConfidence, offsetHours: 4, reasoning: 'The board still has headroom and the setup is not fully exhausted yet.' },
    { username: 'volume_oracle', callType: 'volume' as PredictionCallType, prediction: 'sideways' as const, timeframe: '6 hours', confidence: 'medium' as PredictionConfidence, offsetHours: 12, reasoning: 'Volume looks active, but not explosive enough to keep expanding all day.' },
    { username: 'narrative_monk', callType: 'survival' as PredictionCallType, prediction: 'moon' as const, timeframe: '24 hours', confidence: 'low' as PredictionConfidence, offsetHours: 30, reasoning: 'This token still has enough story surface to stay alive after the next cycle.' },
  ];

  const output: Prediction[] = [];
  for (let index = 0; index < picks.length; index += 1) {
    const seed = picks[index];
    const token = live[index % live.length];
    const timestamp = new Date(Date.now() - seed.offsetHours * 60 * 60 * 1000).toISOString();
    output.push({
      id: `seed-${seed.callType}-${token.slug}-${index}`,
      userId: seed.username,
      username: seed.username,
      tokenSlug: token.slug,
      tokenName: token.name,
      prediction: seed.prediction,
      timeframe: seed.timeframe,
      reasoning: seed.reasoning,
      timestamp,
      likes: 0,
      status: 'pending',
      callType: seed.callType,
      confidence: seed.confidence,
      expiresAt: buildPredictionExpiry(timestamp, seed.timeframe),
      baselinePrice: token.price * (seed.prediction === 'moon' ? 0.94 : seed.prediction === 'dump' ? 1.08 : 1),
      baselineVolume24h: Math.max(1, token.volume24h * (seed.callType === 'volume' ? (seed.prediction === 'moon' ? 0.72 : seed.prediction === 'dump' ? 1.28 : 1.02) : 1)),
      baselineHolders: Math.max(0, Math.round(token.holders * 0.96)),
    });
  }

  if (live.length >= 2) {
    const primary = live[0];
    const compare = live[1];
    const timestamp = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    output.push({
      id: `seed-relative-${primary.slug}-${compare.slug}`,
      userId: 'edge_archivist',
      username: 'edge_archivist',
      tokenSlug: primary.slug,
      tokenName: primary.name,
      compareTokenSlug: compare.slug,
      compareTokenName: compare.name,
      prediction: 'moon',
      timeframe: '24 hours',
      reasoning: 'The primary token has the stronger combination of narrative and holder traction right now.',
      timestamp,
      likes: 0,
      status: 'pending',
      callType: 'relative_strength',
      confidence: 'high',
      expiresAt: buildPredictionExpiry(timestamp, '24 hours'),
      baselinePrice: primary.price,
      baselineVolume24h: primary.volume24h,
      baselineHolders: primary.holders,
    });
  }

  return output;
}


function extractQuotedPhrases(concept: string) {
  return [...concept.matchAll(/["“”']([^"“”']{2,40})["“”']/g)]
    .map((match) => titleCase(match[1].trim()))
    .filter(Boolean);
}

function extractAnchorWords(concept: string) {
  return uniqueStrings(
    concept
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
      .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
      .map((word) => titleCase(word)),
    18,
  );
}

type ForgeArchetype = 'cult' | 'ai_irony' | 'mascot_war' | 'builder_underdog' | 'anti_copycat' | 'terminal_absurdism' | 'schizo_finance';

interface ForgeLexicon {
  archetype: ForgeArchetype;
  posture: string;
  strongWords: string[];
  strongPhrases: string[];
  enemyLine: string;
  chantSeed: string;
  visualSeed: string;
}

const FORGE_BANNED_NAME_WORDS = new Set([
  ...GENERIC_FORGE_WORDS,
  'protocol', 'signal', 'reactor', 'club', 'mode', 'dao', 'labs', 'network', 'platform',
  'coin', 'token', 'alpha', 'beta', 'future', 'legend', 'launch', 'project', 'community',
  'memegpt', 'tokenbot', 'cryptomind', 'playful', 'viral', 'powered', 'intelligence', 'utility',
]);

const FORGE_SOFT_BAD_PHRASES = [
  'community-driven',
  'ai-powered',
  'future of',
  'designed to',
  'built for attention',
  'launch people actually want to join',
  'turns',
  'wins by',
  'community-first',
  'viral potential',
  'where intelligence meets internet culture',
  'hackathon-ready',
  'persistent profile',
  'meme launch concept',
  'internet-native',
  'shaped by',
  'designed to leave',
  'point of view',
  'launch-ready',
  'stands out',
];

function normalizeForgeWord(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function compactTickerFromPhrase(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !FORGE_BANNED_NAME_WORDS.has(word.toLowerCase()));

  if (words.length === 0) return '$SLON';

  const cleanedWords = words
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
    .filter(Boolean);

  const bestWord = cleanedWords
    .slice()
    .sort((a, b) => Math.abs(a.length - 4) - Math.abs(b.length - 4))[0] ?? 'SLON';

  let candidate = bestWord;
  if (candidate.length > 5) {
    const first = candidate[0];
    const compact = `${first}${candidate.slice(1).replace(/[AEIOU]/g, '')}`;
    candidate = compact.length >= 3 ? compact.slice(0, 5) : candidate.slice(0, 5);
  }

  if (candidate.length < 3 && cleanedWords.length > 1) {
    const pair = `${cleanedWords[0].slice(0, 2)}${cleanedWords[1].slice(0, 2)}`.replace(/[^A-Z0-9]/g, '');
    if (pair.length >= 3) candidate = pair.slice(0, 5);
  }

  if (candidate.length < 3 && cleanedWords.length > 1) {
    const acronym = cleanedWords.map((word) => word[0]).join('').slice(0, 5);
    if (acronym.length >= 3) candidate = acronym;
  }

  if (candidate.length < 3) candidate = `${candidate}X`.slice(0, 3);

  return `$${candidate}`;
}

function classifyForgeArchetype(input: ForgeInput): ForgeArchetype {
  const full = [input.concept, input.memeCategory, input.enemyOrContrast, input.referenceStyle, input.launchGoal]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(prompt|agent|terminal|ai|bot|model|compute|inference|gpu|llm)/.test(full)) return 'ai_irony';
  if (/(church|ritual|cult|gospel|prophet|prayer|religion|sect|believer|faith)/.test(full)) return 'cult';
  if (/(dog|cat|frog|ape|mascot|hamster|monkey|bear|pepe|wojak|shiba)/.test(full)) return 'mascot_war';
  if (/(debug|ship|builder|browser|tab|gym|deploy|code|terminal|sprint|shipper)/.test(full)) return 'builder_underdog';
  if (/(copy|paste|soulless|generic|fake|scam|rug|extract|npc|empty)/.test(full)) return 'anti_copycat';
  if (/(printer|agenda|theory|alpha|cabal|insider|wire|desk|macro|whale)/.test(full)) return 'schizo_finance';
  return 'terminal_absurdism';
}

function buildForgePosture(input: ForgeInput, archetype: ForgeArchetype) {
  const vibe = (input.vibe ?? '').toLowerCase();
  if (vibe.includes('menacing')) return 'predatory conviction';
  if (vibe.includes('chaotic')) return 'weaponized timeline chaos';
  if (vibe.includes('absurd')) return 'terminal absurdism';
  if (vibe.includes('professional')) return 'fake-serious flex';
  if (vibe.includes('cult')) return 'internet-cult conviction';
  if (archetype == 'cult') return 'internet-cult conviction';
  if (archetype == 'ai_irony') return 'terminal god-complex humor';
  if (archetype == 'mascot_war') return 'mascot war energy';
  if (archetype == 'builder_underdog') return 'underdog shipper bravado';
  if (archetype == 'anti_copycat') return 'anti-copycat aggression';
  if (archetype == 'schizo_finance') return 'schizo finance theater';
  return 'inside-joke energy';
}

function scoreForgeWord(word: string) {
  const cleaned = normalizeForgeWord(word);
  if (!cleaned || cleaned.length < 3) return -10;
  let score = 0;
  if (cleaned.length >= 4 && cleaned.length <= 8) score += 7;
  if (!FORGE_BANNED_NAME_WORDS.has(cleaned)) score += 6;
  if (/[0-9]/.test(cleaned)) score -= 6;
  if (/(protocol|reactor|signal|token|coin|launch|project|community|labs|dao)/.test(cleaned)) score -= 12;
  if (/(loop|printer|cartel|church|hours|season|agenda|tax|terminal|gang|opera|shift|bot|theory|cabal|filter|gospel|tab|gym|alpha)/.test(cleaned)) score += 4;
  return score;
}

function buildForgeLexicon(input: ForgeInput): ForgeLexicon {
  const concept = input.concept.trim();
  const archetype = classifyForgeArchetype(input);
  const posture = buildForgePosture(input, archetype);
  const quoted = extractQuotedPhrases(concept);
  const words = extractAnchorWords([
    input.concept,
    input.memeCategory ?? '',
    input.launchGoal ?? '',
    input.enemyOrContrast ?? '',
    input.referenceStyle ?? '',
  ].join(' '));

  const strongWords = uniqueStrings(
    [...quoted.flatMap((phrase) => extractAnchorWords(phrase)), ...words]
      .filter((word) => scoreForgeWord(word) > 1)
      .sort((a, b) => scoreForgeWord(b) - scoreForgeWord(a)),
    10,
  );

  const strongPhrases = uniqueStrings(
    [
      ...quoted.filter((phrase) => phrase.split(/\s+/).length <= 3),
      ...strongWords.flatMap((word, index) => {
        const next = strongWords[index + 1];
        return next ? [titleCase(`${word} ${next}`)] : [];
      }),
      ...words.slice(0, 4).flatMap((word, index) => {
        const next = words[index + 1];
        return next ? [titleCase(`${word} ${next}`)] : [];
      }),
    ],
    10,
  );

  const fallbackWords = {
    cult: ['Church', 'Season', 'Hours', 'Gospel'],
    ai_irony: ['Terminal', 'Loop', 'Printer', 'Bot'],
    mascot_war: ['Cartel', 'Gang', 'Army', 'Mafia'],
    builder_underdog: ['Gym', 'Shift', 'Tab', 'Printer'],
    anti_copycat: ['Filter', 'Exit', 'Tax', 'Police'],
    schizo_finance: ['Agenda', 'Theory', 'Cabal', 'Alpha'],
    terminal_absurdism: ['Opera', 'Agenda', 'Machine', 'World'],
  } as const;

  const finalWords = strongWords.length ? strongWords : fallbackWords[archetype];
  const chantSeed = finalWords[0] ?? 'Glitch';
  const visualSeed = finalWords[1] ?? chantSeed;

  const defaultEnemy = {
    cult: 'cold launches with no believers',
    ai_irony: 'AI wrappers pretending to be culture',
    mascot_war: 'mascots with no war cry',
    builder_underdog: 'people still holding meetings while the timeline moves',
    anti_copycat: 'copy-paste launches with no soul',
    schizo_finance: 'chart cosplay with no myth behind it',
    terminal_absurdism: 'forgettable launches that never earn a phrase',
  } as const;

  return {
    archetype,
    posture,
    strongWords: finalWords,
    strongPhrases,
    enemyLine: input.enemyOrContrast?.trim() || defaultEnemy[archetype],
    chantSeed,
    visualSeed,
  };
}

function splitForgeWords(value: string) {
  return value.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function combineForgeWords(primary: string, secondary: string) {
  const a = primary.replace(/\s+/g, '');
  const b = secondary.replace(/\s+/g, '');
  if (!a || !b) return '';
  if ((a + b).length <= 15) return titleCase(`${a}${b}`);
  const clippedA = a.length > 6 ? `${a.slice(0, 4)}${a.slice(4).replace(/[aeiou]/gi, '').slice(0, 2)}` : a;
  const clippedB = b.length > 6 ? b.slice(0, 4) : b;
  return titleCase(`${clippedA}${clippedB}`.slice(0, 15));
}

function buildNameCandidates(input: ForgeInput, lexicon: ForgeLexicon) {
  const [primary = 'Glitch', secondary = 'Printer', tertiary = 'Season'] = lexicon.strongWords;
  const candidates: string[] = [
    ...lexicon.strongPhrases,
    primary,
    titleCase(`${primary} ${secondary}`),
    combineForgeWords(primary, secondary),
    titleCase(`${primary} ${tertiary}`),
  ];

  switch (lexicon.archetype) {
    case 'cult':
      candidates.push(`${primary} Hours`, `${primary} Church`, `${primary} Gospel`, `House Of ${primary}`, `${primary} Season`);
      break;
    case 'ai_irony':
      candidates.push(`${primary} Terminal`, `${primary} Loop`, `${primary} Printer`, `${primary} Bot`, combineForgeWords(primary, 'Terminal'));
      break;
    case 'mascot_war':
      candidates.push(`${primary} Cartel`, `${primary} Gang`, `${primary} Mafia`, `${secondary} Cartel`, `${primary} Army`);
      break;
    case 'builder_underdog':
      candidates.push(`${primary} Gym`, `${primary} Shift`, `${primary} Tab`, `${primary} Printer`, `${primary} Hours`);
      break;
    case 'anti_copycat':
      candidates.push(`No ${primary}`, `${primary} Filter`, `${primary} Exit`, `${primary} Tax`, `${primary} Police`);
      break;
    case 'schizo_finance':
      candidates.push(`${primary} Agenda`, `${primary} Theory`, `${primary} Cabal`, `${primary} Alpha`, `${primary} Desk`);
      break;
    default:
      candidates.push(`${primary} Opera`, `${primary} Agenda`, `${primary} Machine`, `${primary} World`, `${primary} TV`);
      break;
  }

  if (input.launchGoal?.trim()) {
    const goalWord = extractAnchorWords(input.launchGoal)[0];
    if (goalWord && scoreForgeWord(goalWord) > 0) candidates.push(`${primary} ${goalWord}`);
  }

  return uniqueStrings(candidates.map(titleCase));
}

function isValidForgeName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const words = splitForgeWords(trimmed);
  if (words.length > 3) return false;
  if (trimmed.length < 3 || trimmed.length > 22) return false;
  if (words.every((word) => FORGE_BANNED_NAME_WORDS.has(word.toLowerCase()))) return false;
  if (words.some((word) => /(protocol|signal|reactor|dao|network|platform|labs)/i.test(word))) return false;
  return true;
}

function scoreForgeName(value: string, input: ForgeInput, lexicon: ForgeLexicon) {
  const trimmed = value.trim();
  if (!isValidForgeName(trimmed)) return -100;
  const words = splitForgeWords(trimmed);
  const normalized = trimmed.toLowerCase();
  let score = 0;
  if (words.length === 1) score += 9;
  if (words.length === 2) score += 7;
  if (trimmed.length >= 4 && trimmed.length <= 14) score += 8;
  if (!FORGE_SOFT_BAD_PHRASES.some((phrase) => normalized.includes(phrase))) score += 4;
  if (lexicon.strongWords.some((word) => normalized.includes(word.toLowerCase()))) score += 10;
  if (lexicon.strongPhrases.some((phrase) => normalized.includes(phrase.toLowerCase()))) score += 4;
  if (lexicon.archetype === 'cult' && /(season|gospel|hours|house|church)/i.test(trimmed)) score += 5;
  if (lexicon.archetype === 'ai_irony' && /(terminal|loop|printer|bot)/i.test(trimmed)) score += 5;
  if (lexicon.archetype === 'mascot_war' && /(cartel|gang|mafia|army|wars)/i.test(trimmed)) score += 5;
  if (lexicon.archetype === 'builder_underdog' && /(gym|printer|tab|hours|shift)/i.test(trimmed)) score += 5;
  if (lexicon.archetype === 'anti_copycat' && /(no|exit|filter|tax|police)/i.test(trimmed)) score += 5;
  if (lexicon.archetype === 'schizo_finance' && /(agenda|theory|cabal|alpha|desk)/i.test(trimmed)) score += 5;
  if (/(community|driven|future|powered|network|protocol|platform|labs)/i.test(trimmed)) score -= 12;
  if (/(mode|club|signal|reactor|labs)/i.test(trimmed)) score -= 10;
  return score;
}

function buildNameOptions(input: ForgeInput) {
  const lexicon = buildForgeLexicon(input);
  const ranked = buildNameCandidates(input, lexicon)
    .filter(isValidForgeName)
    .sort((a, b) => scoreForgeName(b, input, lexicon) - scoreForgeName(a, input, lexicon));

  return uniqueStrings(ranked, 5);
}

function scoreForgeTicker(value: string, lexicon: ForgeLexicon) {
  const ticker = value.replace('$', '').toUpperCase();
  if (ticker.length < 3 || ticker.length > 6) return -100;
  let score = 0;
  if (ticker.length >= 3 && ticker.length <= 5) score += 9;
  if (/[AEIOUY]/.test(ticker)) score += 5;
  if (/^(MEME|RAID|CULT|SIGNAL|TOKEN|COIN|ALPHA|MOON)$/i.test(ticker)) score -= 24;
  if (lexicon.strongWords.some((word) => ticker.includes(normalizeForgeWord(word).slice(0, 3).toUpperCase()))) score += 6;
  if (/^[BCDFGHJKLMNPQRSTVWXYZ]{5,6}$/.test(ticker)) score -= 6;
  if (/(GPT|AIB|MEM|TOK|COI)$/.test(ticker)) score -= 6;
  return score;
}

function buildTickerCandidates(seed: string) {
  const words = splitForgeWords(seed).filter((word) => !FORGE_BANNED_NAME_WORDS.has(word.toLowerCase()));
  if (words.length === 0) return ['$SLON'];

  const outputs: string[] = [];
  const cleaned = words.map((word) => word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()).filter(Boolean);
  for (const word of cleaned) {
    if (word.length >= 3 && word.length <= 5) outputs.push(`$${word}`);
    if (word.length > 5) {
      const compact = `${word[0]}${word.slice(1).replace(/[AEIOU]/g, '')}`;
      outputs.push(`$${compact.slice(0, 5)}`);
      outputs.push(`$${word.slice(0, 5)}`);
    }
  }

  if (cleaned.length > 1) {
    const pair = `${cleaned[0].slice(0, 2)}${cleaned[1].slice(0, 2)}`;
    if (pair.length >= 3) outputs.push(`$${pair.slice(0, 5)}`);
    const blend = `${cleaned[0].slice(0, 3)}${cleaned[1].slice(0, 2)}`;
    if (blend.length >= 3) outputs.push(`$${blend.slice(0, 5)}`);
    const acronym = cleaned.map((word) => word[0]).join('');
    if (acronym.length >= 3) outputs.push(`$${acronym.slice(0, 5)}`);
  }

  outputs.push(compactTickerFromPhrase(seed));
  return uniqueStrings(outputs);
}

function buildTickerOptions(nameOptions: string[], input: ForgeInput) {
  const lexicon = buildForgeLexicon(input);
  const wordSeeds = uniqueStrings([
    ...nameOptions,
    ...lexicon.strongWords,
    ...lexicon.strongPhrases,
  ]);

  const candidates = uniqueStrings(wordSeeds.flatMap((seed) => buildTickerCandidates(seed)));

  return candidates
    .filter((ticker) => !['$MEME', '$RAID', '$CULT'].includes(ticker))
    .sort((a, b) => scoreForgeTicker(b, lexicon) - scoreForgeTicker(a, lexicon))
    .slice(0, 5);
}

function isWeakForgeName(value?: string | null) {
  const name = (value ?? '').trim();
  if (!name) return true;
  return scoreForgeName(name, {
    concept: name,
    targetAudience: 'Degens',
    vibe: 'Chaotic',
  }, buildForgeLexicon({ concept: name, targetAudience: 'Degens', vibe: 'Chaotic' })) < 6;
}

function isWeakForgeLine(value?: string | null) {
  const line = (value ?? '').trim();
  if (!line || line.length < 18) return true;
  const lower = line.toLowerCase();
  return FORGE_SOFT_BAD_PHRASES.some((phrase) => lower.includes(phrase)) || /(community-driven|ai-powered|future of|utility|point of view|designed to|built around)/i.test(lower);
}

function scoreForgeLine(value: string, lexicon: ForgeLexicon, mode: 'hero' | 'copy' | 'lore' | 'hook') {
  const line = value.trim();
  if (!line) return -100;
  if (isWeakForgeLine(line)) return -40;
  const lower = line.toLowerCase();
  let score = 0;
  if (mode === 'hero') {
    if (line.length >= 24 && line.length <= 110) score += 10;
    if (/\./.test(line)) score += 3;
  } else {
    if (line.length >= 28 && line.length <= 180) score += 6;
  }
  if (/(they|while|not|against|just|still|already|came|brought|post)/i.test(line)) score += 5;
  if (lexicon.strongWords.some((word) => lower.includes(word.toLowerCase()))) score += 6;
  if (lower.includes(lexicon.enemyLine.toLowerCase().split(' ')[0] ?? '')) score += 2;
  if (/(community-driven|ai-powered|future of|utility|project|platform|ecosystem)/i.test(line)) score -= 12;
  return score;
}

function mergeForgeList(primary: string[] | undefined, fallback: string[], limit: number, score: (value: string) => number) {
  return uniqueStrings([...(primary ?? []), ...fallback])
    .filter((value) => score(value) > -50)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

function createHeroLine(projectName: string, input: ForgeInput, lexicon: ForgeLexicon) {
  const enemy = lexicon.enemyLine.toLowerCase();
  const chantSeed = lexicon.chantSeed.toLowerCase();

  switch (lexicon.archetype) {
    case 'cult':
      return `They brought another launch. ${projectName} brought a religion.`;
    case 'ai_irony':
      return `${projectName} is what happens when ${chantSeed} gets terminal access and a feed to infect.`;
    case 'mascot_war':
      return `${projectName} is not here to blend in. It is here to make the feed pick a side.`;
    case 'builder_underdog':
      return `While they are still in meetings, ${projectName} is already all over the timeline.`;
    case 'anti_copycat':
      return `${projectName} exists to embarrass ${enemy} with something people will actually repeat.`;
    case 'schizo_finance':
      return `${projectName} turns market brain damage into one clean thing the timeline can chant.`;
    default:
      return `${projectName} is not another launch. It is a phrase the feed will still be repeating tonight.`;
  }
}

function createHeuristicIdentity(input: ForgeInput): LaunchIdentity {
  const normalized = input.concept.trim() || 'AI meme cult';
  const audience = input.targetAudience || 'Degens';
  const category = input.memeCategory || 'internet-native meme';
  const reference = input.referenceStyle || 'war-room screenshot energy';
  const lexicon = buildForgeLexicon(input);
  const nameOptions = buildNameOptions(input);
  const projectName = nameOptions[0] || lexicon.strongWords[0] || 'Glitch Season';
  const tickerOptions = buildTickerOptions(nameOptions, input);
  const heroLine = createHeroLine(projectName, input, lexicon);
  const ticker = tickerOptions[0] || '$GLCH';
  const topWord = lexicon.chantSeed;
  const secondWord = lexicon.visualSeed || audience;

  return {
    projectName,
    projectSummary: `${projectName} is a ${category.toLowerCase()} built around ${topWord.toLowerCase()} and ${lexicon.posture}. The goal is simple: beat ${lexicon.enemyLine.toLowerCase()} with a name, ticker, and phrase the timeline actually wants to pass around.`,
    heroLine,
    memeDNA: uniqueStrings([
      lexicon.posture,
      `${category.toLowerCase()} with a repeatable phrase`,
      `${topWord.toLowerCase()} as the chant anchor`,
      'reply-native launch language',
      'one screenshot identity the timeline can copy',
    ], 5),
    nameOptions,
    tickerOptions,
    lore: [
      `${projectName} started as something the feed could laugh at, then turned into something people kept repeating anyway.`,
      `The point is not utility theatre. The point is to make ${topWord.toLowerCase()} feel unavoidable for one clean attention window.`,
      `${projectName} wins when people can quote it, mock it, and still keep posting ${ticker}.`,
    ],
    slogans: uniqueStrings([
      heroLine,
      `${ticker} or stay in the replies.`,
      `They brought another roadmap. We brought ${projectName}.`,
      `Say less. Post ${ticker}.`,
    ], 4),
    communityHooks: [
      `Chant line: “${ticker} is the only one with a pulse.”`,
      `Turn ${topWord} into the repeated inside-word under every launch post.`,
      `Make the first 10 replies sound like one movement, not random noise.`,
    ],
    ritualIdeas: [
      `Post one daily “${projectName} check” at the same hour and keep the wording identical.`,
      `Use one repeated screenshot format so every repost looks like it belongs to the same movement.`,
      `Pick one slogan and make it the default community response on milestones.`,
    ],
    enemyFraming: [
      `Against ${lexicon.enemyLine.toLowerCase()}.`,
      `${projectName} is for people who want something sharper than generic launch theatre.`,
    ],
    launchCopy: [
      `Introducing ${projectName}. ${normalized} with ${lexicon.posture} and a ticker the feed can actually chant: ${ticker}.`,
      `${projectName} is the launch for people tired of ${lexicon.enemyLine.toLowerCase()} pretending to be culture.`,
      `Built for ${audience.toLowerCase()}, shaped like ${reference.toLowerCase()}, and made to leave one line stuck in the timeline.`,
    ],
    launchChecklist: [
      'Lock one lead name and one chantable ticker before touching visuals.',
      'Choose the single enemy line the launch will repeat all day.',
      'Prepare the first post plus three replies that all sound like the same movement.',
      'Keep the launch window tight so the phrase, the enemy, and the meme all land together.',
    ],
    aestheticDirection: [
      `${lexicon.posture} with ${topWord.toLowerCase()} as the visual anchor`,
      `screenshots and assets inspired by ${reference.toLowerCase()}`,
      'high-contrast, repost-friendly visuals built for quote tweets and replies',
    ],
  };
}

function repairIdentityOutput(input: ForgeInput, identity: LaunchIdentity) {
  const heuristic = createHeuristicIdentity(input);
  const lexicon = buildForgeLexicon(input);
  const fallbackName = heuristic.projectName;
  const combinedNames = mergeForgeList(identity.nameOptions, heuristic.nameOptions, 5, (value) => scoreForgeName(value, input, lexicon));
  const combinedTickers = mergeForgeList(identity.tickerOptions, heuristic.tickerOptions, 5, (value) => scoreForgeTicker(value, lexicon));

  const repaired: LaunchIdentity = {
    ...identity,
    projectName: isWeakForgeName(identity.projectName)
      ? (combinedNames[0] || fallbackName)
      : identity.projectName,
    projectSummary: !isWeakForgeLine(identity.projectSummary) && scoreForgeLine(identity.projectSummary ?? '', lexicon, 'copy') > 2
      ? identity.projectSummary
      : heuristic.projectSummary,
    heroLine: !isWeakForgeLine(identity.heroLine) && scoreForgeLine(identity.heroLine ?? '', lexicon, 'hero') > 5
      ? identity.heroLine
      : heuristic.heroLine,
    memeDNA: mergeForgeList(identity.memeDNA, heuristic.memeDNA, 5, (value) => value.length > 8 ? 2 : -10),
    nameOptions: combinedNames,
    tickerOptions: combinedTickers,
    lore: mergeForgeList(identity.lore, heuristic.lore, 3, (value) => scoreForgeLine(value, lexicon, 'lore')),
    slogans: mergeForgeList(identity.slogans, heuristic.slogans, 4, (value) => scoreForgeLine(value, lexicon, 'hero')),
    communityHooks: mergeForgeList(identity.communityHooks, heuristic.communityHooks ?? [], 3, (value) => scoreForgeLine(value, lexicon, 'hook')),
    ritualIdeas: mergeForgeList(identity.ritualIdeas, heuristic.ritualIdeas ?? [], 3, (value) => scoreForgeLine(value, lexicon, 'hook')),
    enemyFraming: mergeForgeList(identity.enemyFraming, heuristic.enemyFraming ?? [], 2, (value) => scoreForgeLine(value, lexicon, 'hook')),
    launchCopy: mergeForgeList(identity.launchCopy, heuristic.launchCopy, 3, (value) => scoreForgeLine(value, lexicon, 'copy')),
    launchChecklist: mergeForgeList(identity.launchChecklist, heuristic.launchChecklist ?? [], 4, (value) => value.length > 12 ? value.length : -20),
    aestheticDirection: mergeForgeList(identity.aestheticDirection, heuristic.aestheticDirection, 3, (value) => value.length > 12 ? value.length : -20),
  };

  if (isWeakForgeName(repaired.projectName)) repaired.projectName = fallbackName;
  if (isWeakForgeLine(repaired.heroLine)) repaired.heroLine = heuristic.heroLine;
  if (isWeakForgeLine(repaired.projectSummary)) repaired.projectSummary = heuristic.projectSummary;
  return repaired;
}

function createRaidContent(input: RaidGenerationInput): GeneratedRaidContent {
  const token = input.token || 'this launch';
  const ticker = input.tokenTicker || `$${token.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase()}`;
  const objective = input.objective || 'win timeline mindshare';
  const vibe = input.vibe || 'Sharp';
  const audience = input.audience || 'Degens';
  const contrast = input.contrast || 'copy-paste launches with no real identity';
  const narrative = input.narrativeSummary || `${token} already has enough motion to justify a coordinated push.`;
  const callToAction = input.callToAction || `Push ${ticker} while attention is still cheap.`;
  const momentumLine = input.momentum === 'rising'
    ? 'Momentum is already leaning in our favor.'
    : input.momentum === 'falling'
      ? 'The push needs to reframe the story before the crowd fully rotates away.'
      : 'The setup is calm enough to shape the timeline before it gets crowded.';
  const metricsLine = input.volume24h && input.volume24h > 0
    ? `${toCompactMoney(input.volume24h)} in 24h volume means people are already touching it.`
    : 'This still needs a cleaner distribution push to feel unavoidable.';

  return {
    platform: input.platform || 'X',
    missionBrief: `${token} needs a ${vibe.toLowerCase()} push aimed at ${audience.toLowerCase()} to ${objective}. Anchor every post to the actual story: ${narrative} ${momentumLine} ${metricsLine}`,
    variants: uniqueStrings([
      `${token} is not another empty ticker. ${narrative} ${callToAction}`,
      `While other launches are begging for attention, ${token} already has a cleaner story. ${objective} before the feed catches up.`,
      `${ticker} works because it has a sharper joke than the usual landfill. ${callToAction}`,
      `${token} is the kind of launch people can explain in one line, which is exactly why it can travel fast.`,
    ], 4),
    replyLines: uniqueStrings([
      `${token} has a cleaner setup than the usual timeline spam.`,
      `The joke actually lands here, which already puts it ahead of half the feed.`,
      `This is stronger than the recycled launches people are still forcing.`,
      `${ticker} still looks underposted for the amount of attention it can pull.`,
    ], 4),
    quoteReplies: uniqueStrings([
      `This one is easy to repost because the framing actually sticks.`,
      `Most launches ask for belief. ${token} gives people a line they can repeat.`,
      `The contrast versus ${contrast} is doing half the work already.`,
      `${metricsLine} The timeline has not priced that in yet.`,
    ], 4),
    raidAngles: uniqueStrings([
      `Underdog angle versus ${contrast}`,
      'Push the one-line story that ordinary traders can repeat without explaining too much',
      'Make the contrast between a real joke and forced meme packaging obvious',
    ], 3),
    doNotSay: uniqueStrings([
      'Do not promise moon math or guaranteed gains.',
      'Do not spam generic lines like next 100x or this will melt faces.',
      'Do not sound like a bot farm repeating the same sentence.',
    ], 3),
    callToAction,
  };
}

function repairRaidContent(input: RaidGenerationInput, content: GeneratedRaidContent): GeneratedRaidContent {
  const heuristic = createRaidContent(input);
  return {
    platform: content.platform || heuristic.platform,
    missionBrief: content.missionBrief && content.missionBrief.length > 40 ? content.missionBrief : heuristic.missionBrief,
    variants: uniqueStrings([...(content.variants || []).filter((line) => line.length > 20), ...heuristic.variants], 4),
    replyLines: uniqueStrings([...(content.replyLines || []).filter((line) => line.length > 12), ...heuristic.replyLines], 4),
    quoteReplies: uniqueStrings([...(content.quoteReplies || []).filter((line) => line.length > 18), ...heuristic.quoteReplies], 4),
    raidAngles: uniqueStrings([...(content.raidAngles || []).filter((line) => line.length > 14), ...heuristic.raidAngles], 3),
    doNotSay: uniqueStrings([...(content.doNotSay || []).filter((line) => line.length > 14), ...heuristic.doNotSay], 3),
    callToAction: content.callToAction && content.callToAction.length > 8 ? content.callToAction : heuristic.callToAction,
  };
}

function toCompactMoney(value: number) {
  try {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  } catch {
    return `${Math.round(value)}`;
  }
}

function createHeuristicNarrative(token: Token) {
  if (token.narrativeSummary) return token.narrativeSummary;

  const momentumPhrase = token.momentum === 'rising'
    ? 'attention is climbing faster than the average Four.meme launch'
    : token.momentum === 'falling'
      ? 'the meme still has a pulse, but attention is cooling and conviction needs a fresh catalyst'
      : 'the token is holding a middle lane where the crowd is watching for a stronger reason to choose a side';

  const scale = token.marketCap > 0
    ? `It is trading around a ${toCompactMoney(token.marketCap)} market cap with ${toCompactMoney(token.volume24h)} in 24h volume and roughly ${toCompactMoney(token.holders)} holders.`
    : `On Sloan, the token already shows active market behavior with ${toCompactMoney(token.volume24h)} in volume and around ${toCompactMoney(token.holders)} holders.`;

  return `${token.name} is a live Four.meme token where ${momentumPhrase}. ${scale}`;
}

function createHeuristicConviction(token: Token): ConvictionAnalysis {
  const bullish = token.priceChange24h >= 0;
  const convictionScore = Math.max(28, Math.min(88, Math.round(50 + token.priceChange24h / 4 + Math.min(token.holders / 500, 12) + Math.min(token.volume24h / 100000, 10))));

  return {
    tokenSlug: token.slug,
    bullCase: [
      `${token.name} still has measurable crowd interest with ${toCompactMoney(token.volume24h)} in 24h volume.`,
      `${toCompactMoney(token.holders)} holders give the launch a wider base than a ghost town meme.`,
      bullish ? 'Recent price action is still supporting the attention loop instead of fighting it.' : 'Even after a pullback, the token still has enough surface area for a rebound if attention returns.',
    ],
    bearCase: [
      'Meme attention can vanish quickly when a fresher narrative takes over the feed.',
      token.holders < 500 ? 'Holder breadth is still thin, so a few exits can distort the chart fast.' : 'Holder breadth is decent, but it can still hide weak conviction if most wallets are passive.',
      token.marketCap > 0 ? `At roughly ${toCompactMoney(token.marketCap)} market cap, upside now depends on sustained belief, not just novelty.` : 'Without a stable market cap base, price can become noisy and hard to trust.',
    ],
    risks: [
      'Crowd behavior on meme launches can flip before fundamentals even matter.',
      token.priceChange24h > 40 ? 'The move is already hot, which increases late-entry risk.' : 'Momentum is not explosive yet, which can cause impatience and weak hands.',
      token.listedPancake ? 'Once Pancake liquidity becomes the main story, attention can rotate out just as fast.' : 'Pre-DEX launches can still be fragile if attention outruns real commitment.',
    ],
    triggers: [
      bullish ? 'Price continues holding trend while volume stays elevated.' : 'Volume returns before price fully recovers, showing buyers are still willing to rotate back in.',
      `${toCompactMoney(token.holders)} holder base continues to expand instead of flatlining.`,
      token.listedPancake ? 'Community keeps posting after the DEX phase instead of going silent.' : 'The token earns a cleaner catalyst such as trend ranking or stronger community raids.',
    ],
    convictionScore,
    timeframe: '24h to 7 days',
  };
}

function createHeuristicSwarm(token: Token): SwarmBehavior[] {
  const base = token.momentum === 'rising'
    ? [38, 27, 22, 13]
    : token.momentum === 'falling'
      ? [20, 32, 30, 18]
      : [30, 28, 24, 18];

  return [
    { label: 'Early believers', percentage: base[0], trend: token.momentum === 'rising' ? 'up' : 'stable' },
    { label: 'Momentum traders', percentage: base[1], trend: token.priceChange24h >= 0 ? 'up' : 'stable' },
    { label: 'Late crowd', percentage: base[2], trend: token.momentum === 'falling' ? 'up' : 'down' },
    { label: 'Fast flippers', percentage: base[3], trend: token.momentum === 'falling' ? 'up' : 'stable' },
  ];
}

function createHeuristicLore(token: Token): LoreEntry[] {
  const now = Date.now();

  return [
    {
      id: `${token.slug}-sync`,
      timestamp: new Date(now).toISOString(),
      content: `Sloan refreshed ${token.name} from Four.meme with live ranking and token detail data.`,
      type: 'announcement',
    },
    {
      id: `${token.slug}-volume`,
      timestamp: new Date(now - 1000 * 60 * 90).toISOString(),
      content: `${token.name} is showing about ${toCompactMoney(token.volume24h)} in 24h volume across the latest sync.`,
      type: 'milestone',
    },
    {
      id: `${token.slug}-holders`,
      timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
      content: `${token.name} now sits near ${toCompactMoney(token.holders)} holders, giving the crowd a clearer read on community depth.`,
      type: 'event',
    },
  ];
}

function createPredictionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `pred-${Date.now().toString(36)}`;
}

async function getTokensFromSupabase(): Promise<Token[]> {
  const rows = await selectRows<DbToken[]>('tokens', { orderBy: { column: 'refreshed_at', ascending: false } }, []);
  return sanitizeTokens(rows.map(mapToken));
}

async function getConvictionFromSupabase(slug: string): Promise<ConvictionAnalysis | undefined> {
  const row = await selectRows<DbConviction | null>('token_convictions', {
    filters: { token_slug: slug },
    single: true,
  }, null);

  if (row) return mapConviction(row);

  const token = await tokenApi.getBySlug(slug);
  return token ? createHeuristicConviction(token) : undefined;
}

async function getSwarmFromSupabase(slug: string): Promise<SwarmBehavior[]> {
  const rows = await selectRows<DbSwarm[]>('token_swarm', {
    filters: { token_slug: slug },
    orderBy: { column: 'percentage', ascending: false },
  }, []);

  if (rows.length > 0) return rows.map(mapSwarm);

  const token = await tokenApi.getBySlug(slug);
  return token ? createHeuristicSwarm(token) : [];
}

async function getLoreFromSupabase(slug: string): Promise<LoreEntry[]> {
  const rows = await selectRows<DbLore[]>('token_lore', {
    filters: { token_slug: slug },
    orderBy: { column: 'timestamp', ascending: false },
  }, []);

  if (rows.length > 0) return rows.map(mapLore);

  const token = await tokenApi.getBySlug(slug);
  return token ? createHeuristicLore(token) : [];
}

async function getLatestSyncFromSupabase() {
  const row = await selectRows<DbSyncRun | null>('token_sync_runs', {
    orderBy: { column: 'created_at', ascending: false },
    limit: 1,
    single: true,
  }, null);

  return row ? mapSyncRun(row) : null;
}

async function getLiveTokensOnly(): Promise<Token[]> {
  const liveRows = await selectRows<DbToken[]>('tokens', {
    filters: { source: 'four.meme' },
    orderBy: { column: 'refreshed_at', ascending: false },
  }, []);

  const liveTokens = sanitizeTokens(liveRows.map(mapToken));
  if (liveTokens.length > 0) return liveTokens;

  const fallbackRows = await selectRows<DbToken[]>('tokens', { orderBy: { column: 'refreshed_at', ascending: false } }, []);
  return sanitizeTokens(fallbackRows.map(mapToken));
}

function byDescending<T>(items: T[], pick: (item: T) => number) {
  return [...items].sort((left, right) => pick(right) - pick(left));
}

function uniqueTokens(tokens: Token[]) {
  return Array.from(new Map(tokens.map((token) => [token.slug, token])).values());
}

function uniquePulse(events: LivePulseEvent[]) {
  return Array.from(new Map(events.map((event) => [event.id, event])).values());
}

function rankBucket(tokens: Token[], labels: string[]) {
  const wanted = labels.map((label) => label.toUpperCase());
  return uniqueTokens(tokens.filter((token) => wanted.includes((token.sourceRankLabel || '').toUpperCase())));
}

function createLivePulse(tokens: Token[]): LivePulseEvent[] {
  const fresh = byDescending(tokens.filter((token) => (token.sourceRankLabel || '').toUpperCase().includes('NEW') || token.momentum === 'rising'), (token) => new Date(token.lastSyncedAt || 0).getTime()).slice(0, 3).map((token) => ({
    id: `${token.slug}-fresh`,
    title: `${token.name} surfaced in the live feed`,
    subtitle: `${token.sourceRankLabel || 'Fresh sync'} • ${token.holders.toLocaleString()} holders • ${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%`,
    timestamp: token.lastSyncedAt,
    tokenSlug: token.slug,
    tone: 'fresh' as const,
  }));

  const hot = byDescending(tokens.filter((token) => (token.sourceRankLabel || '').toUpperCase().includes('HOT') || token.priceChange24h > 10), (token) => token.priceChange24h).slice(0, 3).map((token) => ({
    id: `${token.slug}-hot`,
    title: `${token.name} is running hot`,
    subtitle: `${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}% in 24h • ${token.volume24h.toLocaleString()} volume`,
    timestamp: token.lastSyncedAt,
    tokenSlug: token.slug,
    tone: 'hot' as const,
  }));

  const liquid = byDescending(tokens.filter((token) => token.listedPancake || (token.sourceRankLabel || '').toUpperCase().includes('DEX') || (token.sourceRankLabel || '').toUpperCase().includes('VOL')), (token) => token.volume24h).slice(0, 3).map((token) => ({
    id: `${token.slug}-liquid`,
    title: `${token.name} is drawing live liquidity`,
    subtitle: `${token.sourceRankLabel || 'DEX track'} • ${token.volume24h.toLocaleString()} volume • ${token.marketCap.toLocaleString()} market cap`,
    timestamp: token.lastSyncedAt,
    tokenSlug: token.slug,
    tone: 'liquid' as const,
  }));

  return uniquePulse([...fresh, ...hot, ...liquid]);
}

function toQuestSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'live';
}

function uniqueQuests(quests: Quest[]) {
  return Array.from(new Map(quests.map((quest) => [quest.id, quest])).values());
}

function buildQuestDescription(category: Quest['category'], token: Token, rival?: Token) {
  switch (category) {
    case 'posting':
      return `Use Raid Studio to create one clean post for ${token.name} and publish a proof link. Sloan wants a post that sounds native to the token, not generic shill copy.`;
    case 'prediction':
      return `Make one specific 24h call on ${token.name} with a real reason behind it. The point is to leave a claim Sloan can score later, not vague optimism.`;
    case 'meme':
      return `Create one reusable meme angle for ${token.name}. It should be something another holder could screenshot, repost, or turn into a reply format.`;
    case 'rivalry':
      return `Frame ${token.name} against ${rival?.name || 'the usual copy-paste launches'} with one memorable contrast line. Make the community story sharper, not louder.`;
    case 'recovery':
    default:
      return `Write a recovery angle for ${token.name}: why people missed it, why it still matters, or what would need to change for conviction to come back.`;
  }
}

function buildDynamicQuestSet(tokens: Token[]) {
  const live = uniqueTokens(tokens).filter((token) => token.slug && token.name);
  if (live.length === 0) return [] as Quest[];

  const hotToken = byDescending(
    live.filter((token) => (token.sourceRankLabel || '').toUpperCase().includes('HOT') || token.priceChange24h > 0),
    (token) => (token.priceChange24h * 4) + token.volume24h,
  )[0] || byDescending(live, (token) => token.volume24h)[0] || live[0];

  const newToken = byDescending(
    live.filter((token) => (token.sourceRankLabel || '').toUpperCase().includes('NEW')),
    (token) => new Date(token.lastSyncedAt || 0).getTime() + token.volume24h,
  )[0] || byDescending(live, (token) => new Date(token.lastSyncedAt || 0).getTime())[0] || live[0];

  const volumeLeader = byDescending(live, (token) => token.volume24h)[0] || live[0];
  const recoveryToken = byDescending(
    live.filter((token) => token.momentum === 'stable' || token.priceChange24h <= 2),
    (token) => token.volume24h + token.holders,
  )[0] || live[Math.min(2, live.length - 1)] || live[0];


  const seeds: Quest[] = [
    {
      id: `auto-post-${toQuestSlug(hotToken.slug)}`,
      title: `Push ${hotToken.name} into the feed`,
      description: buildQuestDescription('posting', hotToken),
      category: 'posting',
      reward: 320,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
      progress: hotToken.volume24h > 0 ? Math.min(54, Math.round(Math.log10(hotToken.volume24h + 10) * 18)) : 12,
      completed: false,
      tokenSlug: hotToken.slug,
      tokenName: hotToken.name,
      difficulty: 'easy',
      proofType: 'link',
      missionBrief: `Turn ${hotToken.name} into a post people can quote. Use Raid Studio, pick one angle, and bring back a link Sloan can score.`,
    },
    {
      id: `auto-predict-${toQuestSlug(volumeLeader.slug)}`,
      title: `Call the next move on ${volumeLeader.name}`,
      description: buildQuestDescription('prediction', volumeLeader),
      category: 'prediction',
      reward: 420,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      progress: volumeLeader.priceChange24h > 0 ? Math.min(46, Math.round(volumeLeader.priceChange24h)) : 10,
      completed: false,
      tokenSlug: volumeLeader.slug,
      tokenName: volumeLeader.name,
      difficulty: 'medium',
      proofType: 'prediction',
      missionBrief: `${volumeLeader.name} already has live volume. Your job is to make a call with a real condition, then let Prophet League judge whether you were early or loud.`,
    },
    {
      id: `auto-meme-${toQuestSlug(newToken.slug)}`,
      title: `Give ${newToken.name} a repeatable meme angle`,
      description: buildQuestDescription('meme', newToken),
      category: 'meme',
      reward: 360,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
      progress: newToken.holders > 0 ? Math.min(34, Math.round(Math.log10(newToken.holders + 10) * 9)) : 8,
      completed: false,
      tokenSlug: newToken.slug,
      tokenName: newToken.name,
      difficulty: 'medium',
      proofType: 'text',
      missionBrief: `${newToken.name} is still fresh. Create one caption, slogan, or meme format the community can keep repeating after the first spike.`,
    },
    {
      id: `auto-recovery-${toQuestSlug(recoveryToken.slug)}`,
      title: `Recovery angle for ${recoveryToken.name}`,
      description: buildQuestDescription('recovery', recoveryToken),
      category: 'recovery',
      reward: 280,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
      progress: recoveryToken.volume24h > 0 ? Math.min(28, Math.round(Math.log10(recoveryToken.volume24h + 10) * 7)) : 6,
      completed: false,
      tokenSlug: recoveryToken.slug,
      tokenName: recoveryToken.name,
      difficulty: 'easy',
      proofType: 'text',
      missionBrief: `${recoveryToken.name} is live but not fully owned by the crowd yet. Write the comeback angle or missed-opportunity story that could sharpen next-cycle conviction.`,
    },
  ];

  return uniqueQuests(seeds);
}

export const tokenApi = {
  getAll: async () => {
    if (hasSupabaseBackend) return getLiveTokensOnly();
    if (allowMockData) return getJson<Token[]>('/api/tokens', mockTokens);
    return [];
  },
  getBySlug: async (slug: string) => {
    if (hasSupabaseBackend) {
      const row = await selectRows<DbToken | null>('tokens', { filters: { slug }, single: true }, null);
      return row ? mapToken(row) : undefined;
    }
    if (allowMockData) return getJson<Token | undefined>(`/api/tokens/${slug}`, mockTokens.find(t => t.slug === slug));
    return undefined;
  },
  getConviction: async (slug: string) => {
    if (hasSupabaseBackend) return getConvictionFromSupabase(slug);

    const fallback = allowMockData ? mockConvictionData[slug] : undefined;
    if (fallback) return getJson<ConvictionAnalysis | undefined>(`/api/tokens/${slug}/conviction`, fallback);

    const token = allowMockData ? mockTokens.find(item => item.slug === slug) : undefined;
    return token ? createHeuristicConviction(token) : undefined;
  },
  getSwarmData: async (slug: string) => {
    if (hasSupabaseBackend) return getSwarmFromSupabase(slug);

    const fallback = allowMockData ? mockSwarmData[slug] : undefined;
    if (fallback) return getJson<SwarmBehavior[] | undefined>(`/api/tokens/${slug}/swarm`, fallback);

    const token = allowMockData ? mockTokens.find(item => item.slug === slug) : undefined;
    return token ? createHeuristicSwarm(token) : [];
  },
  getLoreStream: async (slug: string) => {
    if (hasSupabaseBackend) return getLoreFromSupabase(slug);

    const fallback = allowMockData ? mockLoreStream[slug] : undefined;
    if (fallback) return getJson<LoreEntry[] | undefined>(`/api/tokens/${slug}/lore`, fallback);

    const token = allowMockData ? mockTokens.find(item => item.slug === slug) : undefined;
    return token ? createHeuristicLore(token) : [];
  },
  getLatestSync: async () => {
    if (hasSupabaseBackend) return getLatestSyncFromSupabase();
    return null;
  },
  getRankBuckets: async () => {
    const tokens = hasSupabaseBackend ? await getLiveTokensOnly() : (allowMockData ? mockTokens : []);
    const hot = rankBucket(tokens, ['HOT', 'SEARCH-HOT']);
    const newest = rankBucket(tokens, ['NEW', 'SEARCH-NEW']).length > 0 ? rankBucket(tokens, ['NEW', 'SEARCH-NEW']) : byDescending(tokens, (token) => new Date(token.lastSyncedAt || 0).getTime()).slice(0, 6);
    const volume = rankBucket(tokens, ['VOL_DAY_1', 'VOLUME', 'DEX', 'RANKING-VOLUME']).length > 0 ? rankBucket(tokens, ['VOL_DAY_1', 'VOLUME', 'DEX', 'RANKING-VOLUME']) : byDescending(tokens, (token) => token.volume24h).slice(0, 6);
    const graduated = byDescending(tokens.filter((token) => token.listedPancake || (token.fourMemeStatus || '').toUpperCase().includes('DEX') || (token.fourMemeStatus || '').toUpperCase().includes('TRADE')), (token) => token.volume24h).slice(0, 6);
    return {
      hot: hot.length > 0 ? hot : byDescending(tokens, (token) => token.priceChange24h).slice(0, 6),
      newest: newest.slice(0, 6),
      volume: volume.slice(0, 6),
      graduated: graduated.length > 0 ? graduated : byDescending(tokens, (token) => token.marketCap).slice(0, 6),
    };
  },
  getLivePulse: async () => {
    const tokens = hasSupabaseBackend ? await getLiveTokensOnly() : (allowMockData ? mockTokens : []);
    return createLivePulse(tokens).slice(0, 8);
  },
  syncFromFourMeme: async () => {
    if (!hasSupabaseBackend) {
      return {
        success: false,
        syncedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        message: 'Supabase is not configured, so live Four.meme sync is disabled.',
      };
    }

    return invokeFunction<{
      success: boolean;
      syncedCount: number;
      insertedCount: number;
      updatedCount: number;
      message: string;
      runId?: string;
      sampleSlugs?: string[];
    }>('sync-fourmeme', {}, {
      success: false,
      syncedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      message: 'sync-fourmeme function is not deployed yet.',
    });
  },
};

export const questApi = {
  getAll: async () => {
    return getEnrichedQuests();
  },
  getActive: async () => {
    const quests = await getEnrichedQuests();
    return quests.filter((quest) => !quest.completed);
  },
  getByCategory: async (category: string) => {
    const quests = await getEnrichedQuests();
    return quests.filter((quest) => quest.category === category);
  },
  getLeaderboard: async () => {
    const submissions = await getQuestSubmissionsSource();
    return buildQuestLeaderboardEntries(submissions);
  },
  getMyActivity: async () => {
    const [submissions, joins] = await Promise.all([getQuestSubmissionsSource(), getQuestJoinsSource()]);
    return buildQuestActivity(submissions, joins);
  },
  getLiveFeed: async () => {
    const [quests, submissions, joins] = await Promise.all([getEnrichedQuests(), getQuestSubmissionsSource(), getQuestJoinsSource()]);
    return buildQuestLiveFeed(quests, submissions, joins);
  },
  getForgeSuggestions: async ({ tokenSlug, category }: { tokenSlug?: string; category?: Quest['category'] } = {}) => {
    const tokens = await tokenApi.getAll();
    const token = tokenSlug ? tokens.find((item) => item.slug === tokenSlug) : tokens[0];
    if (!token) throw new Error('No live token available for quest suggestions');
    return buildOwnerQuestSuggestions(token, category);
  },
  publishQuest: async (input: QuestForgeInput) => {
    const tokens = await tokenApi.getAll();
    const token = tokens.find((item) => item.slug === input.tokenSlug);
    const quest: Quest = {
      id: `owner-${slugifyQuestValue(input.tokenSlug)}-${slugifyQuestValue(input.title)}-${Date.now().toString(36)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      reward: input.reward,
      deadline: input.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      completed: false,
      tokenSlug: input.tokenSlug,
      tokenName: token?.name,
      difficulty: input.difficulty,
      proofType: input.proofType,
      missionBrief: input.missionBrief.trim(),
      submissionRule: input.submissionRule.trim(),
      exampleProof: input.exampleProof.trim(),
      createdByUserId: currentUserId(),
      createdByUsername: currentUsername(),
      aiSuggested: Boolean(input.aiSuggested),
      ownerNote: input.ownerNote?.trim() || undefined,
    };

    if (hasSupabaseBackend && hasAuthenticatedActor()) {
      await ensureQuestPersisted(quest);
      return quest;
    }

    const existing = sanitizeQuests(readStorage(STORAGE_KEYS.quests, [] as Quest[]));
    writeStorage(STORAGE_KEYS.quests, [quest, ...existing.filter((item) => item.id !== quest.id)]);
    return quest;
  },
  joinQuest: async ({ questId }: { questId: string }) => {
    const joinedAt = new Date().toISOString();
    const quests = await getEnrichedQuests();
    const quest = quests.find((item) => item.id === questId);
    if (!quest) throw new Error('Quest not found');

    if (hasSupabaseBackend && hasAuthenticatedActor()) {
      await ensureQuestPersisted(quest);
      await upsertRows<DbQuestParticipant[]>('quest_participants', {
        quest_id: questId,
        user_id: currentUserId(),
        username: currentUsername(),
        joined_at: joinedAt,
      }, { onConflict: 'quest_id,user_id' }, []);
    } else {
      const joins = getStoredQuestJoins();
      const existing = joins.find((join) => join.questId === questId && join.username === currentUsername());
      if (!existing) {
        joins.unshift({ questId, username: currentUsername(), joinedAt });
        writeQuestJoins(joins);
      }
    }

    return quest;
  },
  submitProof: async ({ questId, proofType, proofValue, note }: { questId: string; proofType?: QuestSubmission['proofType']; proofValue: string; note?: string }) => {
    const joinedAt = new Date().toISOString();
    const quests = await getEnrichedQuests();
    const quest = quests.find((item) => item.id === questId);
    if (!quest) throw new Error('Quest not found');

    if (hasSupabaseBackend && hasAuthenticatedActor()) {
      await ensureQuestPersisted(quest);
      await upsertRows<DbQuestParticipant[]>('quest_participants', {
        quest_id: questId,
        user_id: currentUserId(),
        username: currentUsername(),
        joined_at: joinedAt,
      }, { onConflict: 'quest_id,user_id' }, []);
    } else {
      const joins = getStoredQuestJoins();
      if (!joins.find((join) => join.questId === questId && join.username === currentUsername())) {
        joins.unshift({ questId, username: currentUsername(), joinedAt });
        writeQuestJoins(joins);
      }
    }

    const result = evaluateQuestSubmission(quest, proofValue, note);
    const record: LocalQuestSubmissionRecord = {
      id: createQuestSubmissionId(),
      questId,
      username: currentUsername(),
      proofType: proofType || quest.proofType || getQuestProofType(quest.category),
      proofValue,
      note: note?.trim() || undefined,
      status: result.status,
      xpAwarded: result.xpAwarded,
      reviewSummary: result.reviewSummary,
      createdAt: new Date().toISOString(),
    };

    if (hasSupabaseBackend && hasAuthenticatedActor()) {
      const inserted = await insertRow<DbQuestSubmission>('quest_submissions', {
        id: record.id,
        quest_id: record.questId,
        user_id: currentUserId(),
        username: record.username,
        proof_type: record.proofType,
        proof_value: record.proofValue,
        note: record.note ?? null,
        status: record.status,
        xp_awarded: record.xpAwarded,
        review_summary: record.reviewSummary ?? null,
        created_at: record.createdAt,
      });
      return mapQuestSubmissionRow(inserted);
    }

    const submissions = getStoredQuestSubmissions();
    submissions.unshift(record);
    writeQuestSubmissions(submissions);
    return mapQuestSubmission(record);
  },
};

export const predictionApi = {
  getAll: async () => {
    const tokens = await tokenApi.getAll();
    const seeded = buildSyntheticPredictions(tokens || []);
    if (hasSupabaseBackend) {
      const rows = await selectRows<DbPrediction[]>('predictions', { orderBy: { column: 'timestamp', ascending: false } }, []);
      const live = sanitizePredictions(rows.map(mapPrediction));
      const enriched = enrichPredictions(live.length > 0 ? live : seeded, tokens || []);
      await syncResolvedPredictionsToBackend(live, enriched);
      return enriched;
    }
    const localPool = getPredictionPool();
    return getJson<Prediction[]>('/api/predictions', enrichPredictions(localPool.length > 0 ? localPool : seeded, tokens || []));
  },
  getByUser: async (username: string) => {
    const predictions = await predictionApi.getAll();
    return predictions.filter((prediction) => prediction.username === username);
  },
  create: async (payload: Partial<Prediction> & { tokenSlug: string; prediction: Prediction['prediction']; reasoning: string; timeframe: string; targetPrice?: number }) => {
    const token = await tokenApi.getBySlug(payload.tokenSlug);
    const timestamp = new Date().toISOString();
    const id = createPredictionId();

    const meta: LocalPredictionMeta = {
      id,
      callType: payload.callType,
      confidence: payload.confidence,
      compareTokenSlug: payload.compareTokenSlug,
      compareTokenName: payload.compareTokenName,
      expiresAt: buildPredictionExpiry(timestamp, payload.timeframe),
      baselinePrice: token?.price,
      baselineVolume24h: token?.volume24h,
      baselineHolders: token?.holders,
      question: (payload as any).question,
      binaryAnswer: (payload as any).binaryAnswer,
    };

    if (hasSupabaseBackend && hasAuthenticatedActor()) {
      const inserted = await insertRow<DbPrediction>('predictions', {
        id,
        user_id: currentUserId(),
        username: currentUsername(),
        token_slug: payload.tokenSlug,
        token_name: token?.name || payload.tokenSlug,
        prediction: payload.prediction,
        target_price: payload.targetPrice ?? null,
        timeframe: payload.timeframe,
        reasoning: payload.reasoning,
        timestamp,
        likes: 0,
        status: 'pending',
        call_type: payload.callType ?? null,
        confidence: payload.confidence ?? null,
        compare_token_slug: payload.compareTokenSlug ?? null,
        compare_token_name: payload.compareTokenName ?? null,
        expires_at: meta.expiresAt ?? null,
        baseline_price: meta.baselinePrice ?? null,
        baseline_volume_24h: meta.baselineVolume24h ?? null,
        baseline_holders: meta.baselineHolders ?? null,
        resolution_note: null,
        score_awarded: null,
        question: meta.question ?? null,
        binary_answer: meta.binaryAnswer ?? null,
      });
      return mapPrediction(inserted);
    }

    if (hasApiBaseBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create prediction');
      const created = (await response.json()) as Prediction;
      persistPredictionMeta({ ...meta, id: created.id });
      return mergePredictionMeta(created);
    }

    const prediction: Prediction = {
      id,
      userId: currentUserId(),
      username: currentUsername(),
      tokenSlug: payload.tokenSlug,
      tokenName: token?.name || payload.tokenSlug,
      prediction: payload.prediction,
      targetPrice: payload.targetPrice,
      timeframe: payload.timeframe,
      reasoning: payload.reasoning,
      timestamp,
      likes: 0,
      status: 'pending',
      ...meta,
    };

    persistPredictionMeta(meta);
    return persistPrediction(prediction);
  },
  getOpportunities: async () => {
    const tokens = await tokenApi.getAll();
    return buildPredictionOpportunities(tokens || []);
  },
};

export const prophetApi = {
  getLeaderboard: async () => {
    const predictions = await predictionApi.getAll();
    const derived = buildProphetBoard(predictions);
    if (derived.length > 0) return derived;

    if (hasSupabaseBackend) {
      const rows = await selectRows<DbProphet[]>('prophets', { orderBy: { column: 'rank', ascending: true } }, []);
      return sanitizeProphets(rows.map(mapProphet));
    }
    if (allowMockData) return getJson<Prophet[]>('/api/prophets/leaderboard', mockProphets);
    return [];
  },
  getByUsername: async (username: string) => {
    const leaderboard = await prophetApi.getLeaderboard();
    const found = leaderboard.find((prophet) => prophet.username === username);
    if (found) return found;
    if (hasSupabaseBackend) {
      const row = await selectRows<DbProphet | null>('prophets', { filters: { username }, single: true }, null);
      const mapped = row ? mapProphet(row) : undefined;
      return mapped && !isDemoUsername(mapped.username) ? mapped : undefined;
    }
    if (allowMockData) return getJson<Prophet | undefined>(`/api/prophets/${username}`, mockProphets.find(p => p.username === username));
    return undefined;
  },
};

export const userApi = {
  getProfile: async (username: string) => {
    if (hasSupabaseBackend) {
      const row = await selectRows<DbUserProfile | null>('user_profiles', { filters: { username }, single: true }, null);
      const mapped = sanitizeProfiles(row ? mapProfile(row) : undefined);
      if (mapped) return mapped;

      const authProfileRow = await selectRows<DbAuthProfileRow | null>('profiles', { filters: { username }, single: true }, null);
      if (authProfileRow && !isDemoUsername(authProfileRow.username)) {
        return deriveUserProfileFromAuthProfile(authProfileRow);
      }
    }
    if (allowMockData) return getJson<UserProfile | undefined>(`/api/users/${username}`, mockUserProfiles[username]);
    return undefined;
  },
  updateProfile: async (username: string, data: Partial<UserProfile>) => {
    if (hasSupabaseBackend) {
      const row = await updateRows<DbUserProfile>('user_profiles', { username }, {
        display_name: data.displayName,
        avatar: data.avatar,
        archetype: data.archetype,
        prophet_rank: data.prophetRank,
        raider_impact: data.raiderImpact,
        quests_completed: data.questsCompleted,
        favorite_categories: data.favoriteCategories,
        joined_date: data.joinedDate,
        badges: data.badges,
      });
      return mapProfile(row);
    }

    if (hasApiBaseBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    }

    if (allowMockData) {
      const nextProfile = { ...mockUserProfiles[username], ...data };
      return Promise.resolve(nextProfile);
    }

    throw new Error('Profile update requires a configured backend.');
  },
  getCounterfactuals: async (username: string) => {
    const tokens = await tokenApi.getAll();
    const predictions = await predictionApi.getByUser(username).catch(() => [] as Prediction[]);
    const derived = buildDerivedCounterfactuals(tokens || [], predictions || [], username);

    if (hasSupabaseBackend) {
      const rows = await selectRows<DbCounterfactual[]>('counterfactual_entries', { orderBy: { column: 'timestamp', ascending: false } }, []);
      const liveRows = sanitizeCounterfactuals(rows.map(mapCounterfactual));
      return uniqueCounterfactualEntries([...(liveRows || []), ...derived]).slice(0, 8);
    }

    const mockRows = allowMockData ? await getJson<CounterfactualEntry[]>('/api/users/counterfactuals', mockCounterfactuals) : [];
    return uniqueCounterfactualEntries([...(mockRows || []), ...derived]).slice(0, 8);
  },
};

async function getRaidGenerationsForCurrentActor(limit = 6) {
  if (!hasSupabaseBackend) return [] as DbRaidGeneration[];

  const userId = isAuthenticatedActor() ? currentUserId() : null;
  const username = currentUsername();

  if (userId) {
    const byUserId = await selectRows<DbRaidGeneration[]>('raid_generations', {
      filters: { created_by_user_id: userId },
      orderBy: { column: 'created_at', ascending: false },
      limit,
    }, []);

    if (byUserId.length > 0) return byUserId;
  }

  if (username) {
    const byUsername = await selectRows<DbRaidGeneration[]>('raid_generations', {
      filters: { created_by_username: username },
      orderBy: { column: 'created_at', ascending: false },
      limit,
    }, []);

    if (byUsername.length > 0) return byUsername;
  }

  return [] as DbRaidGeneration[];
}

export const raidApi = {
  getCampaigns: async () => {
    if (hasSupabaseBackend) {
      const rows = await selectRows<DbRaidCampaign[]>('raid_campaigns', { orderBy: { column: 'engagement', ascending: false } }, []);
      return sanitizeRaids(rows.map(mapRaid));
    }
    if (allowMockData) return getJson<RaidCampaign[]>('/api/raids', mockRaidCampaigns);
    return [];
  },
  getActive: async () => {
    if (hasSupabaseBackend) {
      const rows = await selectRows<DbRaidCampaign[]>('raid_campaigns', { filters: { status: 'active' }, orderBy: { column: 'engagement', ascending: false } }, []);
      return sanitizeRaids(rows.map(mapRaid));
    }
    if (allowMockData) return getJson<RaidCampaign[]>('/api/raids?status=active', mockRaidCampaigns.filter(c => c.status === 'active'));
    return [];
  },
  getContentVariants: async () => allowMockData ? getJson('/api/raids/content-variants', mockContentVariants) : [],
  getReplyLines: async () => allowMockData ? getJson('/api/raids/reply-lines', mockReplyLines) : [],
  getLastGenerated: async () => {
    const stored = readStorage<GeneratedRaidContent | null>(STORAGE_KEYS.raids, null);
    if (hasSupabaseBackend) {
      const rows = await getRaidGenerationsForCurrentActor(1);
      if (rows.length > 0) {
        const latest = mapRaidGeneration(rows[0]);
        if (!stored || latest.missionBrief !== stored.missionBrief) {
          writeStorage(STORAGE_KEYS.raids, latest);
        }
        return latest;
      }
    }
    return stored;
  },
  getHistory: async () => {
    const localHistory = readStorage<GeneratedRaidContent[]>(STORAGE_KEYS.raidsHistory, []);
    if (hasSupabaseBackend) {
      const rows = await getRaidGenerationsForCurrentActor(6);
      const remote = rows.map(mapRaidGeneration);
      if (remote.length > 0) {
        writeStorage(STORAGE_KEYS.raidsHistory, remote);
        return remote;
      }
    }
    const stored = readStorage<GeneratedRaidContent | null>(STORAGE_KEYS.raids, null);
    if (localHistory.length > 0) return localHistory;
    return stored ? [stored] : [];
  },
  generateContent: async (params: RaidGenerationInput) => {
    if (hasSupabaseBackend) {
      const fallback = { success: true, content: createRaidContent(params) };
      const result = await invokeFunction<{ success: boolean; content: GeneratedRaidContent }>('raid-generate', params, fallback);
      const repaired = repairRaidContent(params, result.content || fallback.content);
      const timestamp = new Date().toISOString();
      const generationId = createPredictionId();
      const inserted = await insertRow<DbRaidGeneration>('raid_generations', {
        id: generationId,
        created_by_user_id: isAuthenticatedActor() ? currentUserId() : null,
        created_by_username: currentUsername(),
        token_slug: params.tokenSlug ?? null,
        token_name: params.token,
        token_ticker: params.tokenTicker ?? null,
        platform: repaired.platform,
        vibe: params.vibe,
        objective: params.objective,
        audience: params.audience ?? null,
        contrast: params.contrast ?? null,
        call_to_action_input: params.callToAction ?? null,
        narrative_summary: params.narrativeSummary ?? null,
        momentum: params.momentum ?? null,
        volume_24h: params.volume24h ?? null,
        holders: params.holders ?? null,
        price_change_24h: params.priceChange24h ?? null,
        source_rank_label: params.sourceRankLabel ?? null,
        mission_brief: repaired.missionBrief,
        variants: repaired.variants,
        reply_lines: repaired.replyLines,
        quote_replies: repaired.quoteReplies,
        raid_angles: repaired.raidAngles,
        do_not_say: repaired.doNotSay,
        call_to_action: repaired.callToAction,
        created_at: timestamp,
      }, {
        id: generationId,
        created_by_user_id: isAuthenticatedActor() ? currentUserId() : null,
        created_by_username: currentUsername(),
        token_name: params.token,
        platform: repaired.platform,
        vibe: params.vibe,
        objective: params.objective,
        mission_brief: repaired.missionBrief,
        variants: repaired.variants,
        reply_lines: repaired.replyLines,
        quote_replies: repaired.quoteReplies,
        raid_angles: repaired.raidAngles,
        do_not_say: repaired.doNotSay,
        call_to_action: repaired.callToAction,
        created_at: timestamp,
      });
      if (isAuthenticatedActor() && inserted?.id && !inserted?.created_by_user_id) {
        try {
          await updateRows<DbRaidGeneration>('raid_generations', { id: inserted.id }, {
            created_by_user_id: currentUserId(),
            created_by_username: currentUsername(),
          }, inserted);
        } catch {
          // Keep the row usable through username fallback if the ownership repair cannot run.
        }
      }
      writeStorage(STORAGE_KEYS.raids, repaired);
      const existingHistory = readStorage<GeneratedRaidContent[]>(STORAGE_KEYS.raidsHistory, []);
      writeStorage(STORAGE_KEYS.raidsHistory, [repaired, ...existingHistory.filter((item) => item.missionBrief !== repaired.missionBrief)].slice(0, 6));
      return { ...result, content: repaired };
    }

    if (hasApiBaseBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/raids/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate raid content');
      const result = await response.json();
      const repaired = repairRaidContent(params, result.content || createRaidContent(params));
      writeStorage(STORAGE_KEYS.raids, repaired);
      const existingHistory = readStorage<GeneratedRaidContent[]>(STORAGE_KEYS.raidsHistory, []);
      writeStorage(STORAGE_KEYS.raidsHistory, [repaired, ...existingHistory.filter((item) => item.missionBrief !== repaired.missionBrief)].slice(0, 6));
      return { ...result, content: repaired };
    }

    const content = createRaidContent(params);
    writeStorage(STORAGE_KEYS.raids, content);
    const existingHistory = readStorage<GeneratedRaidContent[]>(STORAGE_KEYS.raidsHistory, []);
    writeStorage(STORAGE_KEYS.raidsHistory, [content, ...existingHistory.filter((item) => item.missionBrief !== content.missionBrief)].slice(0, 6));
    return { success: true, content };
  },
};

export const forgeApi = {
  getLastIdentity: async () => {
    const stored = readStorage<LaunchIdentity | null>(STORAGE_KEYS.forge, null);
    if (stored) return stored;
    if (hasSupabaseBackend) {
      const row = await selectRows<DbLaunchIdentity | null>('launch_identity_generations', {
        filters: currentActorFilters(),
        orderBy: { column: 'created_at', ascending: false },
        limit: 1,
        single: true,
      }, null);
      return row ? mapLaunchIdentity(row) : null;
    }
    return null;
  },
  getHistory: async () => {
    if (hasSupabaseBackend) {
      const rows = await selectRows<DbLaunchIdentity[]>('launch_identity_generations', {
        filters: currentActorFilters(),
        orderBy: { column: 'created_at', ascending: false },
        limit: 6,
      }, []);
      return rows.map(mapLaunchIdentity);
    }
    const stored = readStorage<LaunchIdentity | null>(STORAGE_KEYS.forge, null);
    return stored ? [stored] : [];
  },
  generateIdentity: async (params: ForgeInput) => {
    if (hasSupabaseBackend) {
      const fallbackIdentity = createHeuristicIdentity(params);
      const result = await invokeFunction<{ success: boolean; identity: LaunchIdentity }>('forge-generate', params, {
        success: true,
        identity: fallbackIdentity,
      });

      const repairedIdentity = repairIdentityOutput(params, result.identity);
      const timestamp = new Date().toISOString();

      await insertRow<DbLaunchIdentity>('launch_identity_generations', {
        id: createPredictionId(),
        created_by_user_id: isAuthenticatedActor() ? currentUserId() : null,
        created_by: currentUsername(),
        concept: params.concept,
        target_audience: params.targetAudience,
        vibe: params.vibe,
        project_name: repairedIdentity.projectName,
        project_summary: repairedIdentity.projectSummary ?? null,
        hero_line: repairedIdentity.heroLine ?? null,
        meme_dna: repairedIdentity.memeDNA,
        name_options: repairedIdentity.nameOptions,
        ticker_options: repairedIdentity.tickerOptions,
        lore: repairedIdentity.lore,
        slogans: repairedIdentity.slogans,
        community_hooks: repairedIdentity.communityHooks ?? [],
        ritual_ideas: repairedIdentity.ritualIdeas ?? [],
        enemy_framing: repairedIdentity.enemyFraming ?? [],
        launch_copy: repairedIdentity.launchCopy,
        launch_checklist: repairedIdentity.launchChecklist ?? [],
        aesthetic_direction: repairedIdentity.aestheticDirection,
        created_at: timestamp,
        updated_at: timestamp,
      }, {
        id: createPredictionId(),
        created_by: currentUsername(),
        concept: params.concept,
        target_audience: params.targetAudience,
        vibe: params.vibe,
        project_name: repairedIdentity.projectName,
        project_summary: repairedIdentity.projectSummary ?? null,
        hero_line: repairedIdentity.heroLine ?? null,
        meme_dna: repairedIdentity.memeDNA,
        name_options: repairedIdentity.nameOptions,
        ticker_options: repairedIdentity.tickerOptions,
        lore: repairedIdentity.lore,
        slogans: repairedIdentity.slogans,
        community_hooks: repairedIdentity.communityHooks ?? [],
        ritual_ideas: repairedIdentity.ritualIdeas ?? [],
        enemy_framing: repairedIdentity.enemyFraming ?? [],
        launch_copy: repairedIdentity.launchCopy,
        launch_checklist: repairedIdentity.launchChecklist ?? [],
        aesthetic_direction: repairedIdentity.aestheticDirection,
        created_at: timestamp,
        updated_at: timestamp,
      });

      writeStorage(STORAGE_KEYS.forge, repairedIdentity);
      return { ...result, identity: repairedIdentity };
    }

    if (hasApiBaseBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/forge/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate launch identity');
      return response.json();
    }

    const identity = repairIdentityOutput(params, createHeuristicIdentity(params));
    writeStorage(STORAGE_KEYS.forge, identity);
    return { success: true, identity };
  },
};
