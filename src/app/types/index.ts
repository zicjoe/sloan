export interface Token {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  momentum: 'rising' | 'falling' | 'stable';
  image?: string;
  address?: string;
  narrativeSummary?: string;
  source?: string;
  sourceUrl?: string;
  fourMemeStatus?: string;
  listedPancake?: boolean;
  lastSyncedAt?: string;
  sourceRankLabel?: string;
  category?: string;
  launchAge?: string;
  liquidity?: number;
  isAICreated?: boolean;
  isXMode?: boolean;
  isAntiSniper?: boolean;
  isTaxToken?: boolean;
  taxRate?: number;
  isPancake?: boolean;
  signalSummary?: string;
  reasonLine?: string;
  actionBias?: 'bullish' | 'bearish' | 'neutral';
  freshnessScore?: number;
  hasQuest?: boolean;
  questCount?: number;
  riskFlags?: string[];
}

export interface LivePulseEvent {
  id: string;
  title: string;
  subtitle: string;
  timestamp?: string;
  tokenSlug?: string;
  tone: 'hot' | 'fresh' | 'liquid' | 'watch';
}

export interface ConvictionAnalysis {
  tokenSlug: string;
  bullCase: string[];
  bearCase: string[];
  risks: string[];
  triggers: string[];
  convictionScore: number;
  timeframe: string;
}

export interface SwarmBehavior {
  label: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'posting' | 'prediction' | 'meme' | 'rivalry' | 'recovery';
  reward: number;
  deadline?: string;
  progress?: number;
  completed: boolean;
  tokenSlug?: string;
  tokenName?: string;
  participants?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  proofType?: 'link' | 'text' | 'image' | 'prediction';
  missionBrief?: string;
  submissionRule?: string;
  exampleProof?: string;
  joined?: boolean;
  mySubmissionStatus?: 'none' | 'joined' | 'pending' | 'accepted' | 'rejected';
  status?: 'open' | 'pending_review' | 'complete';
  xpAwarded?: number;
  createdByUserId?: string;
  createdByUsername?: string;
  aiSuggested?: boolean;
  ownerNote?: string;
}

export interface QuestSuggestionPack {
  tokenSlug: string;
  tokenName: string;
  suggestions: Quest[];
  strategyNote: string;
}

export interface QuestForgeInput {
  tokenSlug: string;
  category: Quest['category'];
  title: string;
  description: string;
  reward: number;
  difficulty: NonNullable<Quest['difficulty']>;
  proofType: NonNullable<Quest['proofType']>;
  missionBrief: string;
  submissionRule: string;
  exampleProof: string;
  deadline?: string;
  ownerNote?: string;
  aiSuggested?: boolean;
}

export interface QuestSubmission {
  id: string;
  questId: string;
  username: string;
  proofType: 'link' | 'text' | 'image' | 'prediction';
  proofValue: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  xpAwarded: number;
  reviewSummary?: string;
  createdAt: string;
}

export interface QuestLeaderboardEntry {
  username: string;
  xp: number;
  completed: number;
  pending: number;
  streak: number;
  badges: string[];
}

export interface QuestActivity {
  joinedCount: number;
  completedCount: number;
  pendingCount: number;
  totalXp: number;
  streak: number;
  recentSubmissions: QuestSubmission[];
}


export interface QuestLiveEvent {
  id: string;
  questId: string;
  title: string;
  subtitle: string;
  tone: 'joined' | 'accepted' | 'pending' | 'rejected' | 'fresh';
  timestamp: string;
}

export type PredictionCallType = 'momentum' | 'hold_strength' | 'outperform' | 'graduation' | 'breakdown';
export type PredictionConfidence = 'low' | 'medium' | 'high';

export interface Prediction {
  id: string;
  userId: string;
  username: string;
  tokenSlug: string;
  tokenName: string;
  prediction: 'moon' | 'dump' | 'sideways';
  targetPrice?: number;
  timeframe: string;
  reasoning: string;
  timestamp: string;
  likes: number;
  status: 'pending' | 'correct' | 'incorrect';
  callType?: PredictionCallType;
  confidence?: PredictionConfidence;
  compareTokenSlug?: string;
  compareTokenName?: string;
  expiresAt?: string;
  baselinePrice?: number;
  baselineVolume24h?: number;
  baselineHolders?: number;
  baselineLiquidity?: number;
  resolutionNote?: string;
  scoreAwarded?: number;
  question?: string;
  binaryAnswer?: 'yes' | 'no';
}

export interface PredictionOpportunity {
  id: string;
  title: string;
  subtitle: string;
  tokenSlug: string;
  compareTokenSlug?: string;
  callType: PredictionCallType;
  suggestedPrediction: Prediction['prediction'];
  timeframe: string;
  confidence: PredictionConfidence;
  reasoningHint: string;
  question: string;
  whyNow?: string;
  resolutionRule?: string;
  tokenState?: 'cold' | 'emerging' | 'heating' | 'crowded' | 'fragile' | 'graduating';
  yesLabel?: string;
  noLabel?: string;
}

export interface Prophet {
  username: string;
  rank: number;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  streak: number;
  avatar?: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatar?: string;
  archetype: string;
  prophetRank: number;
  raiderImpact: number;
  questsCompleted: number;
  favoriteCategories: string[];
  joinedDate: string;
  badges: string[];
}

export interface CounterfactualEntry {
  id: string;
  tokenName: string;
  tokenSlug: string;
  missedAction: string;
  potentialGain: number;
  timestamp: string;
  insight: string;
}

export interface LoreEntry {
  id: string;
  timestamp: string;
  content: string;
  type: 'event' | 'announcement' | 'milestone';
}

export interface RaidCampaign {
  id: string;
  name: string;
  tokenSlug: string;
  status: 'active' | 'completed';
  participants: number;
  postsGenerated: number;
  engagement: number;
}

export interface LaunchIdentity {
  projectName: string;
  projectSummary?: string;
  heroLine?: string;
  memeDNA: string[];
  nameOptions: string[];
  tickerOptions: string[];
  lore: string[];
  slogans: string[];
  communityHooks?: string[];
  ritualIdeas?: string[];
  enemyFraming?: string[];
  launchCopy: string[];
  launchChecklist?: string[];
  aestheticDirection: string[];
}

export interface ForgeInput {
  concept: string;
  targetAudience: string;
  vibe: string;
  memeCategory?: string;
  launchGoal?: string;
  enemyOrContrast?: string;
  referenceStyle?: string;
}

export interface RaidGenerationInput {
  token: string;
  platform: string;
  vibe: string;
  objective: string;
  audience?: string;
  contrast?: string;
  callToAction?: string;
  tokenTicker?: string;
  tokenSlug?: string;
  narrativeSummary?: string;
  momentum?: Token['momentum'];
  volume24h?: number;
  holders?: number;
  priceChange24h?: number;
  sourceRankLabel?: string;
}

export interface GeneratedRaidContent {
  platform: string;
  missionBrief: string;
  variants: string[];
  replyLines: string[];
  quoteReplies: string[];
  raidAngles: string[];
  doNotSay: string[];
  callToAction: string;
}

export interface SyncRun {
  id: string;
  source: string;
  status: 'success' | 'partial' | 'error' | 'running';
  syncedCount: number;
  insertedCount: number;
  updatedCount: number;
  createdAt: string;
  details?: string;
}
