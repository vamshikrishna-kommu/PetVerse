import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IUser } from '@petverse/shared-types';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while the app is performing the initial silent token refresh on mount */
  isLoading: boolean;

  // Actions
  setUser: (user: IUser) => void;
  setAccessToken: (token: string) => void;
  setIsLoading: (loading: boolean) => void;
  updateUser: (partial: Partial<IUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ── Real initial state — no mock data ──────────────────────
      user: null,
      accessToken: null,
      isAuthenticated: false,
      // Start loading=true so ProtectedRoute shows a spinner while we
      // attempt the silent refresh on mount (see App.tsx).
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: true, isLoading: false }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      setIsLoading: (isLoading) =>
        set({ isLoading }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'petverse-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive fields.
      // accessToken is intentionally NOT persisted — it lives in memory only.
      // On page reload, App.tsx will re-hydrate it via the httpOnly refresh cookie.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // After rehydration from sessionStorage, mark as loading so the silent
      // refresh attempt can validate the session before rendering protected routes.
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we have a persisted authenticated session, we still need to refresh
          // the access token (it was not persisted). Keep isLoading true until App.tsx
          // completes the silent refresh.
          if (state.isAuthenticated) {
            state.isLoading = true;
          } else {
            state.isLoading = false;
          }
        }
      },
    }
  )
);
