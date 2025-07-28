/**
 * Auth Store - Domain-specific store for authentication
 *
 * This store manages authentication state including user session,
 * organization context, and auth-related UI states.
 * Extracted from unified-campfire-store.ts for better separation of concerns.
 */

import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { eventBus } from "../../event-bus";

// ===== TYPE DEFINITIONS =====

export interface OrganizationSettings {
  aiEnabled: boolean;
  ragEnabled: boolean;
  autoHandoff: boolean;
  [key: string]: any;
}

export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
}

export interface AuthState {
  // Core auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Organization context
  organization: Organization | null;

  // Additional auth metadata
  lastAuthCheck: string | null;
  authMethod: "email" | "social" | "magic" | null;
}

export interface AuthActions {
  // Core actions
  setAuth: (user: User | null, session: Session | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;

  // Organization actions
  setOrganization: (organization: Organization | null) => void;
  updateOrganizationSettings: (settings: Partial<Organization["settings"]>) => void;

  // Extended actions
  updateUser: (updates: Partial<User>) => void;
  refreshSession: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

// ===== INITIAL STATE =====

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  organization: null,
  lastAuthCheck: null,
  authMethod: null,
};

// ===== STORE IMPLEMENTATION =====

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Core auth actions
          setAuth: (user, session) => {
            set((draft) => {
              draft.user = user;
              draft.session = session;
              draft.isAuthenticated = !!user;
              draft.isLoading = false;
              draft.error = null;
              draft.lastAuthCheck = new Date().toISOString();

              // Set organization from user metadata if available
              if ((user as any)?.user_metadata?.organization_id && !draft.organization) {
                // Organization will be loaded separately
              }
            });

            // Emit auth events for other stores
            if (!user) {
              eventBus.emit("auth:logout", {
                source: "AuthStore",
                userId: get().user?.id || "unknown",
              });
            } else {
              eventBus.emit("auth:login", {
                source: "AuthStore",
                userId: user.id,
                organizationId: (user as any).user_metadata?.organization_id || "",
                session,
              });
            }
          },

          setAuthLoading: (loading) =>
            set((draft) => {
              draft.isLoading = loading;
            }),

          setAuthError: (error) =>
            set((draft) => {
              draft.error = error;
              draft.isLoading = false;
            }),

          clearAuth: () => {
            // Get userId before clearing
            const userId = get().user?.id;

            set((draft) => {
              draft.user = null;
              draft.session = null;
              draft.isAuthenticated = false;
              draft.isLoading = false;
              draft.error = null;
              draft.organization = null;
              draft.lastAuthCheck = null;
              draft.authMethod = null;
            });

            // Emit clear event for other stores to clean up
            eventBus.emit("auth:clear", {
              source: "AuthStore",
              userId: userId || "unknown",
            });
          },

          // Organization actions
          setOrganization: (organization) =>
            set((draft) => {
              draft.organization = organization;
            }),

          updateOrganizationSettings: (settings) =>
            set((draft) => {
              if (draft.organization) {
                draft.organization.settings = {
                  ...draft.organization.settings,
                  ...settings,
                };
              }
            }),

          // Extended actions
          updateUser: (updates) =>
            set((draft) => {
              if (draft.user) {
                Object.assign(draft.user, updates);
              }
            }),

          refreshSession: async () => {
            set((draft) => {
              draft.isLoading = true;
            });

            try {
              // Implementation would call Supabase to refresh
              // This is a placeholder - actual implementation depends on supabase client
              const { user, session } = get();
              if (session) {
                // const { data, error } = await supabase.auth.refreshSession();
                // if (data) {
                //   get().setAuth(data.user, data.session);
                // }
              }
            } catch (error) {
              set((draft) => {
                draft.error = "Failed to refresh session";
              });
            } finally {
              set((draft) => {
                draft.isLoading = false;
              });
            }
          },

          checkAuthStatus: async () => {
            set((draft) => {
              draft.isLoading = true;
            });

            try {
              // Check current auth status with backend
              // const { data: { user, session } } = await supabase.auth.getSession();
              // get().setAuth(user, session);
            } catch (error) {
              set((draft) => {
                draft.error = "Failed to check auth status";
              });
            } finally {
              set((draft) => {
                draft.isLoading = false;
              });
            }
          },
        }))
      ),
      {
        name: "auth-store",
        // Only persist non-sensitive data
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          lastAuthCheck: state.lastAuthCheck,
          authMethod: state.authMethod,
          organization: state.organization,
        }),
      }
    ),
    {
      name: "AuthStore",
    }
  )
);

// ===== SELECTORS =====

export const authSelectors = {
  isLoggedIn: (state: AuthState) => state.isAuthenticated && !!state.user,
  isLoading: (state: AuthState) => state.isLoading,
  hasError: (state: AuthState) => !!state.error,
  userId: (state: AuthState) => state.user?.id,
  userEmail: (state: AuthState) => state.user?.email,
  organizationId: (state: AuthState) => state.organization?.id,
  organizationName: (state: AuthState) => state.organization?.name,
  hasOrganization: (state: AuthState) => !!state.organization,
};

// ===== CONVENIENCE HOOKS =====

/**
 * Hook to get full auth state
 */
export const useAuthState = () => useAuthStore();

/**
 * Hook to get current user
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Hook to get current organization
 */
export const useCurrentOrganization = () => useAuthStore((state) => state.organization);

/**
 * Hook to get auth loading state
 */
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

/**
 * Hook to get auth error
 */
export const useAuthError = () => useAuthStore((state) => state.error);

/**
 * Hook to get auth actions
 */
export const useAuthActions = () => {
  const {
    setAuth,
    setAuthLoading,
    setAuthError,
    clearAuth,
    setOrganization,
    updateOrganizationSettings,
    updateUser,
    refreshSession,
    checkAuthStatus,
  } = useAuthStore();

  return {
    setAuth,
    setAuthLoading,
    setAuthError,
    clearAuth,
    setOrganization,
    updateOrganizationSettings,
    updateUser,
    refreshSession,
    checkAuthStatus,
  };
};

// ===== COMPUTED GETTERS =====

/**
 * Get current user ID
 */
export const getCurrentUserId = () => useAuthStore.getState().user?.id;

/**
 * Get current organization ID
 */
export const getCurrentOrganizationId = () => useAuthStore.getState().organization?.id;

/**
 * Check if user has a specific role
 */
export const hasRole = (role: string) => {
  const user = useAuthStore.getState().user;
  return user?.user_metadata?.role === role;
};

/**
 * Check if organization has a specific feature enabled
 */
export const hasFeature = (feature: keyof OrganizationSettings) => {
  const org = useAuthStore.getState().organization;
  return org?.settings[feature] === true;
};
