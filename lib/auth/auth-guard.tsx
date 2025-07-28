"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireOrganization?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * AuthGuard component that ensures proper authentication state
 * and provides consistent error handling across the application
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requireOrganization = true,
  redirectTo = "/login",
  fallback
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, requireAuth, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--fl-color-brand)]"></div>
            <p className="text-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
          <div className="text-center">
            <p className="mb-4 text-red-600">Authentication required</p>
            <p className="text-foreground">Redirecting to login...</p>
          </div>
        </div>
      )
    );
  }

  // Check organization requirement
  if (requireOrganization && user && !user.organizationId) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
          <div className="text-center">
            <p className="mb-4 text-red-600">Organization access required</p>
            <p className="text-foreground">Please contact your administrator</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for wrapping pages that require authentication
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook to ensure auth context is available
 * Provides better error messages when auth context is missing
 */
export function useAuthGuard() {
  try {
    const auth = useAuth();
    return auth;
  } catch (error) {
    if (error instanceof Error && error.message.includes('useAuth must be used within a AuthProvider')) {
      console.error(
        '🔥 AUTH CONTEXT ERROR: useAuth hook called outside of AuthProvider context.\n' +
        'This usually means:\n' +
        '1. The component is not wrapped with AuthProvider\n' +
        '2. The AuthProvider is not properly configured in the layout\n' +
        '3. There\'s a component tree mismatch\n\n' +
        'Fix: Ensure AuthProvider wraps your component tree at the appropriate level.'
      );
    }
    throw error;
  }
}