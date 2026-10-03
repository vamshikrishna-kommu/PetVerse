import { QueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from './axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes — data is fresh
      gcTime: 1000 * 60 * 30,           // 30 minutes — garbage collect
      retry: (failureCount, error) => {
        // Don't retry 401/403/404 errors
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error
        ) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status === 401 || status === 403 || status === 404) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      onError: (error) => {
        // Global mutation error — individual components can override
        console.error('[Mutation Error]', getApiErrorMessage(error));
      },
    },
  },
});
