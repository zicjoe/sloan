# Sloan - Engineer Handoff Summary

## 🎯 What This Project Is

Sloan is a **frontend-only demo** of an AI meme token intelligence platform. All data is currently mocked. The codebase is structured for easy backend integration.

## 📦 What You're Getting

A production-ready React app with:
- ✅ 9 fully functional pages
- ✅ Reusable component library
- ✅ Centralized API service layer (ready for backend)
- ✅ Custom hooks for data fetching
- ✅ TypeScript types for all data structures
- ✅ Dark crypto-native design system
- ✅ Responsive layouts
- ✅ Loading, empty, and error states

## 🚀 Get Started in 3 Steps

### 1. Install and Run

```bash
pnpm install
pnpm dev
```

### 2. Explore the App

Visit these pages to see what's built:
- `/` - Landing page
- `/dashboard` - Main dashboard
- `/dashboard/token/pepeai` - Token detail example
- `/dashboard/prophets` - Prediction platform
- `/dashboard/forge` - Launch generator

### 3. Read the Docs

- **README.md** - Project overview
- **ENGINEERING.md** - Detailed architecture
- **BACKEND_INTEGRATION.md** - How to wire up backend

## 🔑 Key Files for Backend Integration

### 1. API Service Layer ⭐ MOST IMPORTANT

**File**: `src/app/services/api.ts`

This is your single integration point. Replace mock data with real API calls here.

```typescript
// Current: Returns mock data
export const tokenApi = {
  getAll: async () => Promise.resolve(mockTokens),
};

// TODO: Replace with real API
export const tokenApi = {
  getAll: async () => {
    const res = await fetch('/api/tokens');
    return res.json();
  },
};
```

### 2. Custom Hooks

**File**: `src/app/hooks/useApi.ts`

Use these hooks in components for automatic loading/error handling:

```typescript
const { data, loading, error, refetch } = useApi(tokenApi.getAll);
```

### 3. TypeScript Types

**File**: `src/app/types/index.ts`

All data structures are defined here. Use these when building your API responses.

### 4. Mock Data (To Be Replaced)

**Files**:
- `src/app/data/tokens.ts`
- `src/app/data/quests.ts`
- `src/app/data/predictions.ts`
- `src/app/data/users.ts`
- `src/app/data/raids.ts`

⚠️ **Delete these files** after integrating real backend.

## 📊 Project Stats

```
Pages:           9
Components:      25+
Reusable UI:     10 core components
Mock Data:       ~200 entries
Routes:          10
API Endpoints:   15 (defined, need implementation)
```

## 🎨 Design Tokens

**Colors**:
- Primary: `#4adeff` (Electric Cyan)
- Background: `#0a0a0f`
- Card: `#111118`

**Fonts**:
- Display: Syne
- Body: DM Sans
- Code: JetBrains Mono

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔌 API Endpoints to Implement

### Tokens
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/:slug` - Get token details
- `GET /api/tokens/:slug/conviction` - Get AI analysis
- `GET /api/tokens/:slug/swarm` - Get crowd data
- `GET /api/tokens/:slug/lore` - Get event stream

### Predictions
- `GET /api/predictions` - List predictions
- `POST /api/predictions` - Create prediction
- `GET /api/prophets/leaderboard` - Get top prophets

### Quests
- `GET /api/quests` - List quests
- `POST /api/quests/:id/complete` - Mark complete

### Users
- `GET /api/users/:username` - Get profile
- `PATCH /api/users/:username` - Update profile

### Raids
- `GET /api/raids` - List campaigns
- `POST /api/raids/generate` - Generate content

See `ENGINEERING.md` for complete API spec.

## 🛠️ Component Library

### Cards
- `<TokenCard />` - Display token info
- `<QuestCard />` - Display quest
- `<PredictionCard />` - Display prediction
- `<StatCard />` - Display stat

### Layout
- `<PageHeader />` - Page header with back link
- `<SectionHeader />` - Section title with icon/action

### States
- `<LoadingState />` - Loading indicator
- `<EmptyState />` - Empty/error state
- `<ProphetRow />` - Leaderboard row

Import all at once:
```typescript
import { TokenCard, LoadingState, EmptyState } from './components';
```

## 📁 File Organization

```
src/app/
├── components/       ← Reusable UI components
├── pages/            ← Route pages
├── services/         ← ⭐ API integration point
├── hooks/            ← Custom React hooks
├── data/             ← ⚠️ DELETE after backend integration
├── types/            ← TypeScript definitions
├── lib/              ← Utility functions
└── constants/        ← App constants
```

## ✅ What's Already Done

- [x] Full responsive UI
- [x] All pages built
- [x] Component library
- [x] Routing configured
- [x] Mock data structure
- [x] TypeScript types
- [x] Loading states
- [x] Empty states
- [x] Error states
- [x] Dark theme
- [x] Custom animations

## 🎯 What You Need to Do

1. **Backend API** - Build API endpoints (see ENGINEERING.md)
2. **Replace Mocks** - Update `services/api.ts`
3. **Add Auth** - Implement authentication
4. **Environment** - Set up `.env` file
5. **Deploy** - Deploy to production

## 🚨 Important Notes

### Security
- No auth implemented (frontend-only demo)
- No input validation (add server-side)
- No rate limiting (add in backend)
- API keys exposed (use env variables)

### Performance
- No caching (add with React Query or SWR)
- No pagination (add when connecting API)
- No virtualization (add for long lists)

### Testing
- No tests included (add as needed)
- Mock API responses for testing

## 📞 Need Help?

### Quick Reference
- Project structure: `ENGINEERING.md`
- Backend guide: `BACKEND_INTEGRATION.md`
- Component usage: Check component JSDoc comments
- Type definitions: `src/app/types/index.ts`

### Common Questions

**Q: Where do I add API calls?**  
A: `src/app/services/api.ts` - This is the only place.

**Q: How do I use loading states?**  
A: Use the `useApi` hook - it handles loading/error automatically.

**Q: Where are the types?**  
A: `src/app/types/index.ts` - All TypeScript interfaces.

**Q: How do I add a new page?**  
A: Create in `pages/`, add route in `routes.ts`, add to sidebar.

**Q: Where's the auth?**  
A: Not implemented. See `BACKEND_INTEGRATION.md` step 3.

**Q: Can I delete the mock data?**  
A: Yes, after backend integration. It's only in `data/` folder.

## 🎁 Bonus Files

- **ENGINEERING.md** - Complete technical documentation
- **BACKEND_INTEGRATION.md** - Step-by-step integration guide
- **README.md** - Project overview
- **HANDOFF.md** - This file

## 🏁 Final Checklist

Before going to production:

- [ ] Replace all mock data in `services/api.ts`
- [ ] Add authentication
- [ ] Set up environment variables
- [ ] Add error tracking (Sentry, etc.)
- [ ] Add analytics
- [ ] Implement proper error handling
- [ ] Add rate limiting
- [ ] Security audit
- [ ] Performance optimization
- [ ] Add tests
- [ ] Deploy to production

## 💡 Pro Tips

1. **Start with one API endpoint** - Get `tokenApi.getAll()` working first
2. **Use the custom hooks** - They handle 90% of the work
3. **Keep types updated** - Update `types/index.ts` as API changes
4. **Use Loading/Empty states** - They're already built
5. **Check component comments** - They explain integration points

---

**Ready to ship!** Start with `BACKEND_INTEGRATION.md` and wire up that first API endpoint. 🚀

Questions? Check the docs or review the code comments.
