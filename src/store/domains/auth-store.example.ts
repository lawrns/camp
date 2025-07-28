/**
 * Auth Store - Example Implementation
 *
 * This store manages authentication state including user session,
 * authentication status, and auth-related UI states.
 */

import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";

interface AuthState {
  // Core auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Additional auth metadata
  lastAuthCheck: string | null;
  authMethod: "email" | "social" | "magic" | null;
}

interface AuthActions {
  // Core actions
  setAuth: (user: User | null, session: Session | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;

  // Extended actions
  updateUser: (updates: Partial<User>) => void;
  refreshSession: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastAuthCheck: null,
  authMethod: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,

        setAuth: (user, session) => {
          set({
            user,
            session,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
            lastAuthCheck: new Date().toISOString(),
          });

          // Notify other stores of auth change
          if (!user) {
            // Trigger cleanup in other stores
            window.dispatchEvent(new CustomEvent("auth:logout"));
          } else {
            window.dispatchEvent(new CustomEvent("auth:login", { detail: { user } }));
          }
        },

        setAuthLoading: (loading) => set({ isLoading: loading }),

        setAuthError: (error) => set({ error, isLoading: false }),

        clearAuth: () => {
          set(initialState);
          // Clear other stores
          window.dispatchEvent(new CustomEvent("auth:clear"));
        },

        updateUser: (updates) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, ...updates },
            });
          }
        },

        refreshSession: async () => {
          set({ isLoading: true });
          try {
            // Implementation would call Supabase to refresh
            // This is just an example structure
            const { user, session } = get();
            if (session) {
              // const { data, error } = await supabase.auth.refreshSession();
              // if (data) set({ session: data.session });
            }
          } catch (error) {
            set({ error: "Failed to refresh session" });
          } finally {
            set({ isLoading: false });
          }
        },

        checkAuthStatus: async () => {
          set({ isLoading: true });
          try {
            // Check current auth status with backend
            // const { data: { user, session } } = await supabase.auth.getSession();
            // get().setAuth(user, session);
          } catch (error) {
            set({ error: "Failed to check auth status" });
          } finally {
            set({ isLoading: false });
          }
        },
      })),
      {
        name: "auth-store",
        // Only persist non-sensitive data
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          lastAuthCheck: state.lastAuthCheck,
          authMethod: state.authMethod,
        }),
      }
    ),
    {
      name: "AuthStore",
    }
  )
);

// Selectors for common auth checks
export const authSelectors = {
  isLoggedIn: (state: AuthState) => state.isAuthenticated && !!state.user,
  isLoading: (state: AuthState) => state.isLoading,
  hasError: (state: AuthState) => !!state.error,
  userId: (state: AuthState) => state.user?.id,
  userEmail: (state: AuthState) => state.user?.email,
};

// Convenience hooks
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
