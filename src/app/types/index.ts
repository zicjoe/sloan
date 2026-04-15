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
}

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
  memeDNA: string[];
  nameOptions: string[];
  tickerOptions: string[];
  lore: string[];
  slogans: string[];
  launchCopy: string[];
  aestheticDirection: string[];
}


export interface ForgeInput {
  concept: string;
  targetAudience: string;
  vibe: string;
}

export interface RaidGenerationInput {
  token: string;
  platform: string;
  vibe: string;
  objective: string;
}

export interface GeneratedRaidContent {
  platform: string;
  variants: string[];
  replyLines: string[];
}
