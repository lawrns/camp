import { useAuthStore } from "./auth-store";

/**
 * Auth Domain Exports
 *
 * Central export point for all auth-related store functionality
 */

export * from "./auth-store";

// Additional exports for compatibility
export const useAuth = () => {
  return useAuthStore((state) => ({
    user: state.user,
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    organization: state.organization,
  }));
};

export const useUser = () => {
  return useAuthStore((state) => state.user);
};

export const useSession = () => {
  return useAuthStore((state) => state.session);
};

export const useSignIn = () => {
  return useAuthStore((state) => state.setAuth);
};

export const useSignOut = () => {
  return useAuthStore((state) => state.clearAuth);
};

export const useSetUser = () => {
  return useAuthStore((state) => state.updateUser);
};

export const useSetSession = () => {
  return useAuthStore((state) => state.setAuth);
};

export const getCsrfToken = () => {
  // Mock implementation for compatibility
  return Promise.resolve("mock-csrf-token");
};
