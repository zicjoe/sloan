export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').trim(),
  useMockApi: (import.meta.env.VITE_USE_MOCK_API || 'true').toLowerCase() !== 'false',
  currentUser: import.meta.env.VITE_CURRENT_USER || 'current_user',
};

export const hasBackend = Boolean(env.apiBaseUrl) && !env.useMockApi;
