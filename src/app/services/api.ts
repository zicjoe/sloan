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
  Prediction,
  RaidGenerationInput,
  SwarmBehavior,
  Token,
  UserProfile,
} from '../types';
import { env, hasBackend } from '../lib/env';
import { readStorage, writeStorage } from '../lib/persistence';

const STORAGE_KEYS = {
  predictions: 'sloan.predictions',
  forge: 'sloan.forge.identity',
  raids: 'sloan.raids.generated',
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!hasBackend) return fallback;

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function getStoredPredictions(): Prediction[] {
  return readStorage(STORAGE_KEYS.predictions, [] as Prediction[]);
}

function persistPrediction(prediction: Prediction) {
  const current = getStoredPredictions();
  writeStorage(STORAGE_KEYS.predictions, [prediction, ...current]);
  return prediction;
}

function getPredictionPool() {
  return [...getStoredPredictions(), ...mockPredictions];
}

function createHeuristicIdentity(input: ForgeInput): LaunchIdentity {
  const normalized = input.concept.trim() || 'AI meme cult';
  const clean = normalized
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);

  const seed = clean[0] || 'Sloan';
  const seedAlt = clean[1] || input.targetAudience;
  const vibeWord = input.vibe || 'Chaotic';
  const upper = (value: string) => value.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'SLOAN';

  return {
    projectName: `${seed} ${vibeWord}`,
    memeDNA: [
      `${vibeWord}-leaning`,
      `${input.targetAudience}-native`,
      'raid-friendly',
      'attention-optimized',
    ],
    nameOptions: [
      `${seed} Protocol`,
      `${seedAlt} Signal`,
      `${seed} Reactor`,
      `${seed}${vibeWord}`,
      `${seed} Cult`,
    ],
    tickerOptions: [
      `$${upper(seed)}`,
      `$${upper(seedAlt)}`,
      `$${upper(seed + vibeWord)}`,
      '$MEME',
      '$RAID',
    ],
    lore: [
      `${seed} started as an internet joke, then the crowd noticed it was getting smarter than the room.`,
      `The community treats ${seed} like a signal flare for people tired of copy-paste launches.`,
      `${seed} exists to turn online chaos into coordinated meme energy with a point to prove.`,
    ],
    slogans: [
      `${seed} is the timeline's new obsession.`,
      `Built for ${input.targetAudience.toLowerCase()}, loud enough for everyone else.`,
      `${vibeWord} energy. Cleaner execution.`,
      `Post harder. Hold smarter.`,
    ],
    launchCopy: [
      `Introducing ${seed}. ${normalized}. Built for ${input.targetAudience.toLowerCase()} and designed to move fast on attention.`,
      `${seed} is where ${vibeWord.toLowerCase()} internet culture meets real launch coordination. No dead air, just signal.`,
      `If the feed is the battlefield, ${seed} is built to survive it.`,
    ],
    aestheticDirection: [
      `${vibeWord} neon interface with meme-war-room energy`,
      `bold mascot system with terminal-inspired type`,
      `high contrast visuals optimized for reposts and screenshots`,
    ],
  };
}

function createRaidContent(input: RaidGenerationInput): GeneratedRaidContent {
  const token = input.token || 'this launch';
  const objective = input.objective || 'push attention';
  const vibe = input.vibe || 'bold';

  return {
    platform: input.platform || 'X',
    variants: [
      `${token} is getting louder for a reason. ${objective} while everyone else is still scrolling.`,
      `Not even close to saturated. ${token} has ${vibe.toLowerCase()} energy and the timeline is starting to notice.`,
      `${token} is one of the few launches that actually feels alive. ${objective} now, not after the crowd arrives.`,
      `The setup on ${token} is simple: strong meme identity, rising attention, and a community that actually shows up.`,
    ],
    replyLines: [
      `${token} still looks early.`,
      `Crowd is finally waking up here.`,
      `That narrative is sharper than most launches.`,
      `This one has better meme posture than the copycats.`,
    ],
  };
}

function createPredictionId() {
  return `pred-${Date.now().toString(36)}`;
}

export const tokenApi = {
  getAll: async () => getJson<Token[]>('/api/tokens', mockTokens),
  getBySlug: async (slug: string) => getJson<Token | undefined>(`/api/tokens/${slug}`, mockTokens.find(t => t.slug === slug)),
  getConviction: async (slug: string) => getJson<ConvictionAnalysis | undefined>(`/api/tokens/${slug}/conviction`, mockConvictionData[slug]),
  getSwarmData: async (slug: string) => getJson<SwarmBehavior[] | undefined>(`/api/tokens/${slug}/swarm`, mockSwarmData[slug]),
  getLoreStream: async (slug: string) => getJson(`/api/tokens/${slug}/lore`, mockLoreStream[slug]),
};

export const questApi = {
  getAll: async () => getJson('/api/quests', mockQuests),
  getActive: async () => getJson('/api/quests?status=active', mockQuests.filter(q => !q.completed)),
  getByCategory: async (category: string) => getJson(`/api/quests?category=${category}`, mockQuests.filter(q => q.category === category)),
};

export const predictionApi = {
  getAll: async () => getJson('/api/predictions', getPredictionPool()),
  getByUser: async (username: string) => getJson(`/api/predictions?user=${username}`, getPredictionPool().filter(p => p.username === username)),
  create: async (payload: Partial<Prediction> & { tokenSlug: string; prediction: Prediction['prediction']; reasoning: string; timeframe: string; targetPrice?: number }) => {
    if (hasBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create prediction');
      return (await response.json()) as Prediction;
    }

    const token = mockTokens.find(item => item.slug === payload.tokenSlug);
    const prediction: Prediction = {
      id: createPredictionId(),
      userId: env.currentUser,
      username: env.currentUser,
      tokenSlug: payload.tokenSlug,
      tokenName: token?.name || payload.tokenSlug,
      prediction: payload.prediction,
      targetPrice: payload.targetPrice,
      timeframe: payload.timeframe,
      reasoning: payload.reasoning,
      timestamp: new Date().toISOString(),
      likes: 0,
      status: 'pending',
    };

    return persistPrediction(prediction);
  },
};

export const prophetApi = {
  getLeaderboard: async () => getJson('/api/prophets/leaderboard', mockProphets),
  getByUsername: async (username: string) => getJson(`/api/prophets/${username}`, mockProphets.find(p => p.username === username)),
};

export const userApi = {
  getProfile: async (username: string) => getJson<UserProfile | undefined>(`/api/users/${username}`, mockUserProfiles[username]),
  updateProfile: async (username: string, data: Partial<UserProfile>) => {
    if (hasBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    }

    const nextProfile = { ...mockUserProfiles[username], ...data };
    return Promise.resolve(nextProfile);
  },
  getCounterfactuals: async (_username: string) => getJson<CounterfactualEntry[]>('/api/users/counterfactuals', mockCounterfactuals),
};

export const raidApi = {
  getCampaigns: async () => getJson('/api/raids', mockRaidCampaigns),
  getActive: async () => getJson('/api/raids?status=active', mockRaidCampaigns.filter(c => c.status === 'active')),
  getContentVariants: async () => getJson('/api/raids/content-variants', mockContentVariants),
  getReplyLines: async () => getJson('/api/raids/reply-lines', mockReplyLines),
  generateContent: async (params: RaidGenerationInput) => {
    if (hasBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/raids/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate raid content');
      return response.json();
    }

    const content = createRaidContent(params);
    writeStorage(STORAGE_KEYS.raids, content);
    return { success: true, content };
  },
};

export const forgeApi = {
  getLastIdentity: async () => readStorage<LaunchIdentity | null>(STORAGE_KEYS.forge, null),
  generateIdentity: async (params: ForgeInput) => {
    if (hasBackend) {
      const response = await fetch(`${env.apiBaseUrl}/api/forge/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate launch identity');
      return response.json();
    }

    const identity = createHeuristicIdentity(params);
    writeStorage(STORAGE_KEYS.forge, identity);
    return { success: true, identity };
  },
};
