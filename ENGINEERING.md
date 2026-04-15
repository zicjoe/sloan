# Sloan - Engineering Documentation

## Overview

Sloan is an AI-native meme token intelligence platform built for the Four.meme AI Sprint hackathon. This is a **frontend-only demo** with mocked data, designed for easy backend integration.

## Tech Stack

- **Framework**: React 18.3.1
- **Routing**: React Router 7.13.0
- **Styling**: Tailwind CSS 4.1.12
- **Icons**: Lucide React
- **Build Tool**: Vite 6.3.5
- **Package Manager**: pnpm

## Project Structure

```
src/app/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar + top nav
│   ├── Sidebar.tsx     # Left navigation
│   ├── TopNav.tsx      # Top bar with search and user menu
│   ├── TokenCard.tsx   # Token display card
│   ├── QuestCard.tsx   # Quest display card
│   ├── PredictionCard.tsx  # Prediction display card
│   ├── ProphetRow.tsx  # Leaderboard row component
│   ├── StatCard.tsx    # Stat display card
│   ├── SectionHeader.tsx   # Page section headers
│   ├── PageHeader.tsx  # Page headers with back links
│   ├── EmptyState.tsx  # Empty state UI
│   ├── LoadingState.tsx    # Loading indicators
│   └── ui/             # Shadcn UI components
│
├── pages/              # Page components (routes)
│   ├── Landing.tsx     # Marketing landing page (/)
│   ├── Home.tsx        # Dashboard home (/dashboard)
│   ├── TokenPage.tsx   # Token detail page
│   ├── LaunchForge.tsx # Launch identity generator
│   ├── RaidStudio.tsx  # Campaign management
│   ├── QuestArena.tsx  # Quest tracking
│   ├── ProphetLeague.tsx   # Prediction platform
│   ├── MirrorFeed.tsx  # Counterfactual analysis
│   ├── PassportPage.tsx    # User profiles
│   ├── Settings.tsx    # User settings
│   └── NotFound.tsx    # 404 page
│
├── data/               # Mock data (REPLACE WITH API CALLS)
│   ├── tokens.ts       # Token data, conviction, swarm, lore
│   ├── quests.ts       # Quest data
│   ├── predictions.ts  # Predictions and prophets
│   ├── users.ts        # User profiles and counterfactuals
│   └── raids.ts        # Raid campaigns and content
│
├── services/           # API service layer
│   └── api.ts          # Centralized data fetching (TODO: replace mocks)
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All shared types
│
├── lib/                # Utility functions
│   └── utils.ts        # Helper functions
│
├── constants/          # App constants
│   └── index.ts        # Routes, categories, etc.
│
├── routes.ts           # React Router configuration
└── App.tsx             # Root component
```

## Data Flow

### Current (Mock Data)

```
Component → Mock Data (data/*.ts) → UI
```

### After Backend Integration

```
Component → Service Layer (services/api.ts) → Backend API → UI
```

## Backend Integration Guide

### Step 1: Replace Mock Data with API Calls

The `src/app/services/api.ts` file is the **single source of truth** for all data fetching. Replace mock data with real API calls:

```typescript
// Before (Mock)
export const tokenApi = {
  getAll: async () => {
    return Promise.resolve(mockTokens);
  },
};

// After (Real API)
export const tokenApi = {
  getAll: async () => {
    const response = await fetch('/api/tokens');
    if (!response.ok) throw new Error('Failed to fetch tokens');
    return response.json();
  },
};
```

### Step 2: Add Authentication

1. Create an auth service in `src/app/services/auth.ts`
2. Implement login/logout/token management
3. Add auth headers to API requests
4. Protect routes with auth checks

### Step 3: Add Loading States

Components are ready for loading states. Add them like this:

```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  setLoading(true);
  tokenApi.getAll()
    .then(setData)
    .finally(() => setLoading(false));
}, []);

if (loading) return <LoadingState />;
```

### Step 4: Add Error Handling

```typescript
const [error, setError] = useState(null);

tokenApi.getAll()
  .catch(err => setError(err.message));

if (error) return <EmptyState icon={<AlertCircle />} title="Error" description={error} />;
```

## API Endpoints (To Be Implemented)

### Tokens
- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:slug` - Get token by slug
- `GET /api/tokens/:slug/conviction` - Get conviction analysis
- `GET /api/tokens/:slug/swarm` - Get swarm behavior
- `GET /api/tokens/:slug/lore` - Get lore stream

### Quests
- `GET /api/quests` - Get all quests
- `GET /api/quests?status=active` - Get active quests
- `GET /api/quests?category=:category` - Get quests by category
- `POST /api/quests/:id/complete` - Mark quest complete

### Predictions
- `GET /api/predictions` - Get all predictions
- `GET /api/predictions?user=:username` - Get user predictions
- `POST /api/predictions` - Create prediction

### Prophets
- `GET /api/prophets/leaderboard` - Get leaderboard
- `GET /api/prophets/:username` - Get prophet by username

### Users
- `GET /api/users/:username` - Get user profile
- `PATCH /api/users/:username` - Update profile
- `GET /api/users/:username/counterfactuals` - Get missed opportunities

### Raids
- `GET /api/raids` - Get all campaigns
- `GET /api/raids?status=active` - Get active campaigns
- `POST /api/raids/generate` - Generate raid content

### Launch Forge
- `POST /api/forge/generate` - Generate launch identity

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your_api_key_here
```

## Styling System

### Theme Variables

All colors and spacing are defined in `src/styles/theme.css`:
- Dark-first design
- Primary color: `#4adeff` (electric cyan)
- Font families: Syne (display), DM Sans (body), JetBrains Mono (code)

### Custom Classes

```css
.animate-fade-in      /* Fade in animation */
.animate-gradient     /* Gradient background animation */
.animate-blob         /* Blob floating animation */
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Routes

- `/` - Landing page
- `/dashboard` - Command center (home)
- `/dashboard/token/:slug` - Token detail
- `/dashboard/forge` - Launch Forge
- `/dashboard/raid-studio` - Raid Studio
- `/dashboard/quests` - Quest Arena
- `/dashboard/prophets` - Prophet League
- `/dashboard/mirror` - Mirror Feed
- `/dashboard/passport/:username` - User profile
- `/dashboard/settings` - Settings

## Key Features to Wire Up

1. **Real-time Updates**: WebSocket for live token prices, swarm data
2. **AI Generation**: API calls for conviction analysis, content generation
3. **User Authentication**: JWT or session-based auth
4. **Image Upload**: Profile pictures, meme uploads
5. **Notifications**: Real-time quest/prediction updates
6. **Analytics**: Track user behavior, prediction accuracy

## Performance Considerations

- Lazy load pages with React Router
- Virtualize long lists (token lists, leaderboards)
- Cache API responses
- Debounce search inputs
- Optimize images with next-gen formats

## Security Checklist

- [ ] Sanitize user inputs
- [ ] Validate API responses
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Use HTTPS in production
- [ ] Secure API keys
- [ ] Implement proper CORS

## Deployment

The app is configured for Vite deployment. For production:

1. Build: `pnpm build`
2. Deploy `dist/` folder to your hosting platform
3. Configure environment variables
4. Set up CDN for static assets

## Support

For questions about the codebase:
- Review this documentation
- Check component comments
- Look at `services/api.ts` for data integration points
- Review `types/index.ts` for data structures

Built for Four.meme AI Sprint 2026
