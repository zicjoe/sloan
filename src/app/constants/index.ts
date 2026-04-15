// App Constants

export const APP_NAME = 'Sloan';
export const APP_TAGLINE = 'Four.meme AI Sprint OS';

export const QUEST_CATEGORIES = [
  'posting',
  'prediction',
  'meme',
  'rivalry',
  'recovery',
] as const;

export const PREDICTION_TYPES = ['moon', 'dump', 'sideways'] as const;

export const TOKEN_MOMENTUM = ['rising', 'falling', 'stable'] as const;

export const ROUTES = {
  HOME: '/',
  TOKEN: '/token',
  FORGE: '/forge',
  RAID_STUDIO: '/raid-studio',
  QUESTS: '/quests',
  PROPHETS: '/prophets',
  MIRROR: '/mirror',
  PASSPORT: '/passport',
  SETTINGS: '/settings',
} as const;
