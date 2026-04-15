# Sloan - AI Operating System for Meme Tokens

![Sloan](https://img.shields.io/badge/Built%20for-Four.meme%20AI%20Sprint-4adeff)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6)

> Navigate the chaos of meme tokens with AI-powered intelligence, community insights, and predictive analytics.

## 🎯 Overview

Sloan is an AI-native meme token intelligence platform built for the **Four.meme AI Sprint hackathon**. It combines AI-powered analysis with community wisdom to help users make smarter decisions in the meme token ecosystem.

### Key Features

- 🧠 **AI Conviction Analysis** - Bull case, bear case, risks, and triggers for every token
- 👥 **Swarm Intelligence** - Real-time crowd behavior analysis
- 🔮 **Prophet Predictions** - Community forecasting with leaderboard
- 🚀 **Launch Forge** - AI-powered meme token identity generator
- 📢 **Raid Studio** - Coordinate community growth campaigns
- 🎯 **Quest Arena** - Gamified engagement system
- 🪞 **Mirror Feed** - Learn from missed opportunities

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Visit `http://localhost:5173` to see the app.

## 📁 Project Structure

```
sloan/
├── src/app/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── data/           # Mock data (replace with API)
│   ├── services/       # API service layer
│   ├── types/          # TypeScript types
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   └── constants/      # App constants
├── ENGINEERING.md      # Detailed engineering docs
├── BACKEND_INTEGRATION.md  # Backend integration guide
└── README.md           # This file
```

## 🎨 Design System

- **Theme**: Dark-first crypto-native aesthetic
- **Primary Color**: `#4adeff` (Electric Cyan)
- **Typography**:
  - Display: Syne
  - Body: DM Sans
  - Code: JetBrains Mono

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18.3.1 |
| Routing | React Router 7.13.0 |
| Styling | Tailwind CSS 4.1.12 |
| Icons | Lucide React |
| Build | Vite 6.3.5 |
| Package Manager | pnpm |

## 📄 Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Command center (home) |
| `/dashboard/token/:slug` | Token detail & analysis |
| `/dashboard/forge` | Launch identity generator |
| `/dashboard/raid-studio` | Campaign management |
| `/dashboard/quests` | Quest tracking |
| `/dashboard/prophets` | Prediction platform |
| `/dashboard/mirror` | Counterfactual analysis |
| `/dashboard/passport/:username` | User profile |
| `/dashboard/settings` | Settings |

## 🔌 Backend Integration

This is currently a **frontend-only demo** with mocked data. To integrate with a real backend:

1. **Read** `BACKEND_INTEGRATION.md` for step-by-step guide
2. **Update** `src/app/services/api.ts` to replace mock data with API calls
3. **Use** the provided custom hooks (`useApi`, `useMutation`) for data fetching
4. **Add** authentication via the auth service layer

### Quick Example

```typescript
// Before (Mock)
export const tokenApi = {
  getAll: async () => Promise.resolve(mockTokens),
};

// After (Real API)
export const tokenApi = {
  getAll: async () => {
    const response = await fetch('/api/tokens');
    return response.json();
  },
};
```

## 📚 Documentation

- **[ENGINEERING.md](./ENGINEERING.md)** - Complete engineering documentation
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Backend integration guide

## 🎯 For Engineers

### Key Integration Points

1. **Data Layer**: `src/app/services/api.ts` - Replace all mock data here
2. **Components**: Already built with loading, empty, and error states
3. **Hooks**: Custom hooks for data fetching (`useApi`, `useMutation`)
4. **Types**: All TypeScript types defined in `src/app/types/index.ts`

### Component Library

Reusable components are ready to use:

- `<StatCard />` - Stat display
- `<TokenCard />` - Token card
- `<QuestCard />` - Quest card
- `<PredictionCard />` - Prediction card
- `<ProphetRow />` - Leaderboard row
- `<EmptyState />` - Empty state UI
- `<LoadingState />` - Loading indicators
- `<PageHeader />` - Page headers
- `<SectionHeader />` - Section headers

### Data Fetching Pattern

```typescript
import { useApi } from './hooks';
import { tokenApi } from './services/api';

function MyComponent() {
  const { data, loading, error, refetch } = useApi(tokenApi.getAll);

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Error" description={error.message} />;
  if (!data) return <EmptyState title="No data" />;

  return <div>{/* Render data */}</div>;
}
```

## 🎨 Styling Guide

### Tailwind Classes

Common patterns used throughout:

```tsx
// Cards
<div className="p-6 rounded-lg bg-card border border-card-border">

// Buttons
<button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">

// Input fields
<input className="w-full px-4 py-2 rounded-lg bg-input-background border border-border">
```

### Custom Animations

```css
.animate-fade-in      /* Fade in on load */
.animate-gradient     /* Animated gradient background */
.animate-blob         /* Floating blob animation */
```

## 🔒 Security Notes

This is a demo application. Before production:

- [ ] Add proper authentication
- [ ] Validate all user inputs
- [ ] Sanitize API responses
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Use HTTPS
- [ ] Secure API keys

## 🚢 Deployment

```bash
# Build
pnpm build

# Preview
pnpm preview

# Deploy dist/ folder to your hosting platform
```

Compatible with:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting

## 📝 License

Built for Four.meme AI Sprint 2026

## 🤝 Contributing

This is a hackathon project. For production use:
1. Review `ENGINEERING.md` for architecture details
2. Check `BACKEND_INTEGRATION.md` for integration guide
3. Update environment variables
4. Implement proper error handling
5. Add comprehensive tests

## ⚡ Performance

- Lazy load routes
- Optimize images
- Cache API responses
- Virtualize long lists
- Debounce user inputs

## 🎯 Roadmap

- [ ] Connect to real backend API
- [ ] Add WebSocket for real-time updates
- [ ] Implement authentication
- [ ] Add comprehensive error handling
- [ ] Set up analytics
- [ ] Optimize for mobile
- [ ] Add comprehensive tests

---

**Built with ⚡ for Four.meme AI Sprint**
