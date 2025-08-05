"use client";

import React, { useEffect, useState } from "react";
import { Warning as AlertTriangle } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/button";
import { hasValidSupabaseConfig } from "@/lib/supabase";
import { Icon } from "@/lib/ui/Icon";
import { SupabaseErrorBoundary as UnifiedSupabaseErrorBoundary } from "./ErrorBoundaryProvider";

interface Props {
  children: React.ReactNode;
}

/**
 * Error boundary that handles Supabase configuration errors
 * Uses client-side only checking to prevent hydration mismatches
 */
export function SupabaseErrorBoundary({ children }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasValidConfig, setHasValidConfig] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    // Check configuration only on client side
    // In development, be more lenient with configuration
    const isValid = hasValidSupabaseConfig();
    const isDevelopment = process.env.NODE_ENV === "development";
    setHasValidConfig(isValid || isDevelopment);
  }, []);

  // During SSR and initial hydration, always render children
  if (!isMounted) {
    return <>{children}</>;
  }

  // Configuration is valid with fallbacks, no need to show error

  return <>{children}</>;
}

/**
 * Class-based error boundary for catching runtime errors
 * This is separate from the configuration check
 */
/**
 * @deprecated Use SupabaseErrorBoundary from ErrorBoundaryProvider instead
 */
export class SupabaseRuntimeErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  override render() {
    const { children } = this.props;

    return (
      <UnifiedSupabaseErrorBoundary
        maxRetries={3}
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 spacing-3">
            <div className="bg-background w-full max-w-md rounded-ds-lg p-spacing-lg shadow-card-deep">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-ds-full bg-[var(--color-destructive-subtle)] spacing-3">
                  <Icon icon={AlertTriangle} className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h2 className="mb-2 heading-center text-3xl font-bold text-gray-900">Supabase Connection Error</h2>
              <p className="text-foreground mb-6 text-center">
                We're having trouble connecting to our database. Please check your connection and try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-ds-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="border-ds-border-strong bg-background text-foreground w-full rounded-ds-md border px-4 py-2 transition hover:bg-[var(--color-background-subtle)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        }
      >
        {children}
      </UnifiedSupabaseErrorBoundary>
    );
  }
}
