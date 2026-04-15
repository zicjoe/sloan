import { RaidCampaign } from '../types';

export const mockRaidCampaigns: RaidCampaign[] = [
  {
    id: 'r1',
    name: 'PepeAI Moonshot Campaign',
    tokenSlug: 'pepeai',
    status: 'active',
    participants: 342,
    postsGenerated: 1850,
    engagement: 45000,
  },
  {
    id: 'r2',
    name: 'Moon Cat NFT Launch Raid',
    tokenSlug: 'moon-cat',
    status: 'active',
    participants: 567,
    postsGenerated: 3200,
    engagement: 89000,
  },
  {
    id: 'r3',
    name: 'Doge Vader Community Surge',
    tokenSlug: 'doge-vader',
    status: 'completed',
    participants: 234,
    postsGenerated: 1100,
    engagement: 28000,
  },
  {
    id: 'r4',
    name: 'Wojak Terminal Revival',
    tokenSlug: 'wojak-terminal',
    status: 'active',
    participants: 128,
    postsGenerated: 640,
    engagement: 12000,
  },
];

export const mockContentVariants = [
  {
    platform: 'Twitter',
    variants: [
      'PepeAI is revolutionizing the meme + AI meta. Smart contracts meet meme magic. $PEPEAI',
      'When AI meets meme culture, magic happens. PepeAI showing us the future. #PepeAI #AIRevolution',
      'Not your average meme coin. PepeAI is building real AI utility while riding the cultural wave. $PEPEAI',
      'The intersection of AI hype and meme culture = PepeAI. Don\'t sleep on this one. #Crypto',
    ],
  },
  {
    platform: 'Telegram',
    variants: [
      '🐸 PepeAI update: Team delivered AI agent integration ahead of schedule. Bullish.',
      '📊 Market check: PepeAI holding strong support at $0.004. Next resistance: $0.006',
      '🚀 Just added more $PEPEAI. AI narrative + meme power = inevitable moon mission',
    ],
  },
];

export const mockReplyLines = [
  'This is the way 🚀',
  'PepeAI gang rise up! 🐸',
  'GM to all PepeAI believers ☀️',
  'Still early. Most people sleeping on this.',
  'Diamond hands only 💎🙌',
  'LFG! The future is now.',
  'Finally someone gets it. $PEPEAI to the moon.',
  'Underrated take. More people need to see this.',
];
