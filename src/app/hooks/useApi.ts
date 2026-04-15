import { useState, useEffect } from 'react';

/**
 * Custom hook for API data fetching
 *
 * Usage:
 * const { data, loading, error, refetch } = useApi(tokenApi.getAll);
 *
 * To integrate with backend:
 * - This hook already handles loading and error states
 * - Just replace the API function with real fetch calls
 */

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunction();
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for mutations (POST, PATCH, DELETE)
 *
 * Usage:
 * const { mutate, loading, error } = useMutation(predictionApi.create);
 * await mutate(predictionData);
 */

interface UseMutationReturn<T, R> {
  mutate: (data: T) => Promise<R | null>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMutation<T, R>(
  apiFunction: (data: T) => Promise<R>
): UseMutationReturn<T, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data: T): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(data);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      return null;
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return { mutate, loading, error, reset };
}
