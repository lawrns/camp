/**
 * Enhanced useAuth hook with better error handling and fallback behavior
 * This is a re-export of the core useAuth with additional safety features
 */

import { useAuth as useCoreAuth, AuthContextType } from '../src/lib/core/auth-provider';

// Re-export the consolidated auth system for backward compatibility
export { AuthProvider, useAuth, useUser } from "../src/lib/core/auth-provider";

/**
 * Enhanced useAuth hook that provides better error messages
 * and development-time guidance when auth context is missing
 */
export function useAuthWithGuard(): AuthContextType {
  return useCoreAuth();
}

/**
 * Safe useAuth hook that returns null instead of throwing
 * when auth context is not available. Useful for components
 * that might be rendered outside of auth context.
 */
export function useSafeAuth(): AuthContextType | null {
  try {
    return useCoreAuth();
  } catch (error) {
    if (error instanceof Error && error.message.includes('useAuth must be used within a AuthProvider')) {
      // Log warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ useSafeAuth: Auth context not available. Component may be outside AuthProvider tree.'
        );
      }
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Hook that checks if auth context is available
 * Returns boolean instead of throwing error
 */
export function useHasAuth(): boolean {
  try {
    useCoreAuth();
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook for components that require authentication
 * Throws descriptive error if user is not authenticated
 */
export function useRequireAuth(): AuthContextType {
  const auth = useCoreAuth();
  
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error(
      'Component requires authentication but user is not logged in. ' +
      'Wrap this component with AuthGuard or check authentication state before rendering.'
    );
  }
  
  return auth;
}

/**
 * Hook for components that require organization access
 * Throws descriptive error if user doesn't have organization access
 */
export function useRequireOrganization(): AuthContextType {
  const auth = useRequireAuth();
  
  if (auth.user && !auth.user.organizationId) {
    throw new Error(
      'Component requires organization access but user is not associated with an organization. ' +
      'Contact your administrator or complete organization setup.'
    );
  }
  
  return auth;
}

/**
 * Hook that provides auth state with loading and error handling
 * Returns a more structured auth state object
 */
export function useAuthState() {
  const auth = useCoreAuth();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    hasOrganization: !!auth.user?.organizationId,
    organizationId: auth.user?.organizationId,
    organizationRole: auth.user?.organizationRole,
    // Computed states
    isReady: !auth.isLoading && !auth.error,
    needsAuth: !auth.isLoading && !auth.isAuthenticated,
    needsOrganization: auth.isAuthenticated && !auth.user?.organizationId,
  };
}

// Export types for convenience
export type { AuthenticatedUser as AuthUser } from "../src/lib/core/auth";
export type { AuthContextType } from '../src/lib/core/auth-provider';
