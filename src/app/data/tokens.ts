/**
 * Mock Token Data
 *
 * TODO: Replace this file with API calls via services/api.ts
 * This is MOCK DATA for frontend-only demo purposes
 */

import { Token, ConvictionAnalysis, SwarmBehavior, LoreEntry } from '../types';

export const mockTokens: Token[] = [
  {
    id: '1',
    slug: 'pepeai',
    name: 'PepeAI',
    ticker: 'PEPEAI',
    price: 0.0042,
    priceChange24h: 156.3,
    marketCap: 42000000,
    volume24h: 8500000,
    holders: 12500,
    momentum: 'rising',
  },
  {
    id: '2',
    slug: 'wojak-terminal',
    name: 'Wojak Terminal',
    ticker: 'WOJAK',
    price: 0.0018,
    priceChange24h: -12.4,
    marketCap: 18000000,
    volume24h: 3200000,
    holders: 8900,
    momentum: 'falling',
  },
  {
    id: '3',
    slug: 'doge-vader',
    name: 'Doge Vader',
    ticker: 'DVADER',
    price: 0.089,
    priceChange24h: 8.7,
    marketCap: 89000000,
    volume24h: 12000000,
    holders: 24300,
    momentum: 'stable',
  },
  {
    id: '4',
    slug: 'moon-cat',
    name: 'Moon Cat Protocol',
    ticker: 'MCAT',
    price: 0.156,
    priceChange24h: 234.5,
    marketCap: 156000000,
    volume24h: 45000000,
    holders: 35600,
    momentum: 'rising',
  },
  {
    id: '5',
    slug: 'frog-cartel',
    name: 'Frog Cartel',
    ticker: 'FROG',
    price: 0.0067,
    priceChange24h: -8.2,
    marketCap: 6700000,
    volume24h: 890000,
    holders: 4200,
    momentum: 'falling',
  },
];

export const mockConvictionData: Record<string, ConvictionAnalysis> = {
  'pepeai': {
    tokenSlug: 'pepeai',
    bullCase: [
      'AI narrative converging with meme culture at perfect timing',
      'Team doxxed with strong crypto background and technical execution',
      'Major CEX listings confirmed for Q2, Binance rumors circulating',
      'Community governance model creating strong holder incentives',
    ],
    bearCase: [
      'Saturated AI meme market with 50+ competitors launching monthly',
      'Token utility still unclear beyond governance and staking',
      'Whale concentration: top 10 wallets hold 45% of supply',
      'Regulatory uncertainty around AI-branded tokens increasing',
    ],
    risks: [
      'Smart contract not fully audited by tier-1 firm',
      'Team tokens unlock in 6 months (15% of supply)',
      'Dependency on OpenAI API creates centralization risk',
      'Meme fatigue if AI narrative loses momentum',
    ],
    triggers: [
      'Binance listing confirmation',
      'Partnership with major AI protocol',
      '100M market cap psychological barrier',
      'Successful audit completion',
    ],
    convictionScore: 78,
    timeframe: '2-4 weeks',
  },
  'wojak-terminal': {
    tokenSlug: 'wojak-terminal',
    bullCase: [
      'Terminal UI aesthetic resonates with degen trader culture',
      'Active development team shipping features weekly',
      'Low market cap with room for 10x growth',
    ],
    bearCase: [
      'Limited real utility beyond meme value',
      'Declining social engagement metrics',
      'Weak holder retention, high sell pressure',
    ],
    risks: [
      'Anonymous team creates trust issues',
      'No major exchange interest yet',
      'Similar projects have failed historically',
    ],
    triggers: [
      'Viral social media moment',
      'Influencer endorsement',
      'Feature launch that adds utility',
    ],
    convictionScore: 42,
    timeframe: '1-2 months',
  },
  'moon-cat': {
    tokenSlug: 'moon-cat',
    bullCase: [
      'Massive social momentum with organic growth',
      'Strong community raids coordinated daily',
      'Partnerships with NFT projects creating ecosystem',
      'Celebrity endorsements from crypto Twitter',
    ],
    bearCase: [
      'No clear roadmap beyond speculation',
      'Token distribution favors early insiders',
      'Hype-driven, vulnerable to quick reversals',
    ],
    risks: [
      'Unsustainable growth rate',
      'Potential rug pull concerns',
      'Market manipulation allegations',
    ],
    triggers: [
      'Major exchange listing',
      '500M market cap milestone',
      'Strategic partnership announcement',
    ],
    convictionScore: 65,
    timeframe: '1-3 weeks',
  },
};

export const mockSwarmData: Record<string, SwarmBehavior[]> = {
  'pepeai': [
    { label: 'Diamond Hands', percentage: 42, trend: 'up' },
    { label: 'Day Traders', percentage: 28, trend: 'stable' },
    { label: 'Swing Scalpers', percentage: 18, trend: 'down' },
    { label: 'Bot Activity', percentage: 12, trend: 'stable' },
  ],
  'wojak-terminal': [
    { label: 'Diamond Hands', percentage: 25, trend: 'down' },
    { label: 'Day Traders', percentage: 35, trend: 'up' },
    { label: 'Swing Scalpers', percentage: 30, trend: 'up' },
    { label: 'Bot Activity', percentage: 10, trend: 'stable' },
  ],
  'moon-cat': [
    { label: 'Diamond Hands', percentage: 55, trend: 'up' },
    { label: 'Day Traders', percentage: 20, trend: 'stable' },
    { label: 'Swing Scalpers', percentage: 15, trend: 'down' },
    { label: 'Bot Activity', percentage: 10, trend: 'stable' },
  ],
};

export const mockLoreStream: Record<string, LoreEntry[]> = {
  'pepeai': [
    {
      id: '1',
      timestamp: '2026-04-14T10:30:00Z',
      content: 'PepeAI listed on Gate.io, volume spike detected',
      type: 'milestone',
    },
    {
      id: '2',
      timestamp: '2026-04-13T15:20:00Z',
      content: 'Team AMA revealed AI agent integration roadmap',
      type: 'announcement',
    },
    {
      id: '3',
      timestamp: '2026-04-12T08:45:00Z',
      content: 'Whale accumulated 2.5M tokens in single transaction',
      type: 'event',
    },
    {
      id: '4',
      timestamp: '2026-04-11T12:00:00Z',
      content: 'Community voted to burn 5% of treasury supply',
      type: 'announcement',
    },
    {
      id: '5',
      timestamp: '2026-04-10T09:15:00Z',
      content: 'Trading volume exceeded $10M for first time',
      type: 'milestone',
    },
  ],
  'moon-cat': [
    {
      id: '1',
      timestamp: '2026-04-14T14:00:00Z',
      content: 'Moon Cat crosses 150M market cap milestone',
      type: 'milestone',
    },
    {
      id: '2',
      timestamp: '2026-04-13T11:30:00Z',
      content: 'Partnership with Meow NFT collection announced',
      type: 'announcement',
    },
    {
      id: '3',
      timestamp: '2026-04-12T16:45:00Z',
      content: 'Community raid on Twitter trends globally',
      type: 'event',
    },
  ],
};
