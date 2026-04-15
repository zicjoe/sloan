# Backend Integration Guide

## Quick Start

This guide shows how to connect Sloan to a real backend API.

## Step 1: Update API Service Layer

The file `src/app/services/api.ts` is your single integration point.

### Before (Mock Data)

```typescript
export const tokenApi = {
  getAll: async () => {
    return Promise.resolve(mockTokens);
  },
};
```

### After (Real API)

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const tokenApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/api/tokens`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    return response.json();
  },
};
```

## Step 2: Use Custom Hooks in Components

### Example: Token List Component

```typescript
import { useApi } from '../hooks';
import { tokenApi } from '../services/api';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { TokenCard } from '../components/TokenCard';
import { AlertCircle, Package } from 'lucide-react';

export function TokenList() {
  // useApi hook handles loading, error, and data states automatically
  const { data: tokens, loading, error, refetch } = useApi(tokenApi.getAll);

  if (loading) {
    return <LoadingState message="Loading tokens..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-8 h-8" />}
        title="Failed to load tokens"
        description={error.message}
        action={
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Try Again
          </button>
        }
      />
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-8 h-8" />}
        title="No tokens found"
        description="Start by adding your first token"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {tokens.map(token => (
        <TokenCard key={token.id} token={token} />
      ))}
    </div>
  );
}
```

### Example: Creating a Prediction

```typescript
import { useMutation } from '../hooks';
import { predictionApi } from '../services/api';
import { useState } from 'react';

export function PredictionForm() {
  const [formData, setFormData] = useState({
    tokenSlug: '',
    prediction: 'moon',
    targetPrice: '',
    timeframe: '7 days',
    reasoning: '',
  });

  const { mutate, loading, error } = useMutation(predictionApi.create);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await mutate(formData);

    if (result) {
      // Success! Clear form or redirect
      console.log('Prediction created:', result);
      setFormData({ /* reset */ });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          {error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground"
      >
        {loading ? 'Submitting...' : 'Submit Prediction'}
      </button>
    </form>
  );
}
```

## Step 3: Add Authentication

### Create Auth Service

```typescript
// src/app/services/auth.ts

export const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const { token, user } = await response.json();

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
```

### Add Auth Context

```typescript
// src/app/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getUser();
    setUser(user);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { user } = await authService.login(email, password);
    setUser(user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Protect Routes

```typescript
// src/app/components/ProtectedRoute.tsx

import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './LoadingState';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
```

## Step 4: Environment Configuration

### Create `.env` file

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=10000
```

### Access in Code

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```

## Step 5: Error Handling

### Create Error Boundary

```typescript
// src/app/components/ErrorBoundary.tsx

import { Component, ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          icon={<AlertCircle className="w-8 h-8" />}
          title="Something went wrong"
          description={this.state.error?.message}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Reload Page
            </button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

## Step 6: Add Request Interceptor

```typescript
// src/app/lib/api-client.ts

import { authService } from '../services/auth';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = authService.getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
    config
  );

  if (response.status === 401) {
    authService.logout();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}
```

### Use in API Service

```typescript
import { apiClient } from '../lib/api-client';

export const tokenApi = {
  getAll: () => apiClient('/api/tokens'),
  getBySlug: (slug: string) => apiClient(`/api/tokens/${slug}`),
  create: (data: any) => apiClient('/api/tokens', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
```

## Step 7: Add WebSocket for Real-time Updates

```typescript
// src/app/hooks/useWebSocket.ts

import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => setData(JSON.parse(event.data));

    return () => ws.close();
  }, [url]);

  return { data, connected };
}
```

### Use for Live Token Prices

```typescript
export function TokenPrice({ slug }) {
  const { data } = useWebSocket(`ws://localhost:3000/tokens/${slug}/price`);

  return <span>{data?.price || 'Loading...'}</span>;
}
```

## Common Patterns

### Pagination

```typescript
const [page, setPage] = useState(1);
const { data, loading } = useApi(
  () => tokenApi.getAll({ page, limit: 20 }),
  [page]
);
```

### Search with Debounce

```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

const { data } = useApi(
  () => tokenApi.search(debouncedSearch),
  [debouncedSearch]
);
```

### Infinite Scroll

```typescript
const [items, setItems] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const newItems = await tokenApi.getAll({ page });
  setItems([...items, ...newItems]);
  setPage(page + 1);
  setHasMore(newItems.length > 0);
};
```

## Testing API Integration

### Mock API Responses

```typescript
// tests/mocks/api.ts

export const mockApiResponse = (data: any, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};
```

### Test Component

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { TokenList } from './TokenList';
import * as api from '../services/api';

jest.mock('../services/api');

test('displays tokens after loading', async () => {
  api.tokenApi.getAll.mockResolvedValue([
    { id: '1', name: 'PepeAI', slug: 'pepeai' }
  ]);

  render(<TokenList />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('PepeAI')).toBeInTheDocument();
  });
});
```

## Next Steps

1. Replace all API functions in `services/api.ts`
2. Add authentication
3. Implement real-time features with WebSockets
4. Add comprehensive error handling
5. Set up monitoring and analytics
6. Deploy with proper environment variables

## Need Help?

- Check `ENGINEERING.md` for project structure
- Review component comments for integration points
- Look at `hooks/useApi.ts` for data fetching patterns
