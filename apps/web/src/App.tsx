import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { queryClient } from '@/shared/lib/queryClient';
import { router } from '@/app/router';
import { useUIStore, applyTheme } from '@/app/store/ui.store';
import { useAuthStore } from '@/app/store/auth.store';
import { authApi } from '@/features/auth/api/authApi';
import { useRealtimeNotifications } from '@/features/notifications/hooks/useRealtimeNotifications';

function RealtimeNotificationListener() {
  useRealtimeNotifications();
  return null;
}

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const { setUser, setAccessToken, logout, isAuthenticated, isLoading } = useAuthStore();

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // ── Silent auth initialization on every page load ──────────────────
  // Attempt to refresh the access token using the httpOnly refresh cookie.
  // If it succeeds → authenticated. If it fails → logged out.
  // Runs once on mount; ProtectedRoute waits on isLoading before rendering.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        // Fetch fresh user profile so the store is always up-to-date
        const user = await authApi.getMe();
        setUser(user);
      } catch {
        // Refresh failed — no valid session, clear any stale persisted data
        logout();
      }
    };

    // Run if we're in the initial loading state or have a session to validate
    if (isLoading || isAuthenticated) {
      initializeAuth();
    } else {
      // No session at all — we're done loading
      useAuthStore.getState().setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeNotificationListener />
      <RouterProvider router={router} />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
