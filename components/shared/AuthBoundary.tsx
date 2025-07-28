"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner as Loader2 } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Auth boundary component that ensures proper initialization order
 * Follows the 25 Commandments for proper auth context handling
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children, fallback, redirectTo = "/login" }) => {
  const auth = useAuth();
  const router = useRouter();

  // Handle redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    if (!auth.isLoading && (!auth.isAuthenticated || !auth.user)) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, router, redirectTo]);

  // Show loading state while auth is initializing
  if (auth.isLoading) {
    return (
      fallback || (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex items-center gap-ds-2 text-muted-foreground">
            <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
            <span>Initializing...</span>
          </div>
        </div>
      )
    );
  }

  // Show loading state while redirecting
  if (!auth.isAuthenticated || !auth.user) {
    return (
      fallback || (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex items-center gap-ds-2 text-muted-foreground">
            <Icon icon={Loader2} className="h-4 w-4 animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      )
    );
  }

  // Auth is ready, render children
  return <>{children}</>;
};

/**
 * Optional auth component - renders children only if auth context is available
 * Used for components that can work with or without auth
 *
 * This component uses React Error Boundary to safely handle auth context errors
 */
class OptionalAuthErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasAuthError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasAuthError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if this is an auth context error
    if (error.message.includes("useAuth must be used within") || error.message.includes("AUTH ERROR")) {
      return { hasAuthError: true };
    }

    // Let other errors bubble up
    return null;
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.hasAuthError) {
    }
  }

  override render() {
    if (this.state.hasAuthError) {
      return null; // Don't render when auth context is not available
    }

    return this.props.children;
  }
}

/**
 * Safe auth checker component that doesn't throw errors
 */
function SafeAuthChecker({ children }: { children: React.ReactNode }) {
  try {
    const auth = useAuth();

    // Only render if auth is properly initialized
    if (auth.isLoading) {
      return null;
    }

    return <>{children}</>;
  } catch (error) {
    // If auth context is not available, don't render anything
    return null;
  }
}

export const OptionalAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <OptionalAuthErrorBoundary>
      <SafeAuthChecker>{children}</SafeAuthChecker>
    </OptionalAuthErrorBoundary>
  );
};

/**
 * Auth-aware component wrapper that provides safe access to auth state
 */
export const WithAuth = <P extends object>(
  Component: React.ComponentType<P & { auth: ReturnType<typeof useAuth> }>
) => {
  return function AuthWrappedComponent(props: P) {
    return (
      <RequireAuth>
        <AuthInjector Component={Component} {...props} />
      </RequireAuth>
    );
  };
};

function AuthInjector<P extends object>({
  Component,
  ...props
}: P & {
  Component: React.ComponentType<P & { auth: ReturnType<typeof useAuth> }>;
}) {
  const auth = useAuth();
  return <Component {...(props as P)} auth={auth} />;
}
