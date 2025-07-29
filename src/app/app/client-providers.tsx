"use client";

import { analytics } from "@/lib/analytics/posthog-client";
import { SimpleQueryProvider } from "@/lib/react-query/SimpleQueryProvider";
import { AuthProvider } from "@/lib/core/auth-provider";
import { AuthErrorBoundary } from "@/components/system/AuthErrorBoundary";
import { Component, ErrorInfo, ReactNode, useEffect } from "react";

// Temporarily commented out to fix webpack module loading error
// import { ToastProvider } from "@/components/unified-ui/components/toast-provider";

// Simple error boundary that actually catches errors
class SimpleErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) { }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-danger-subtle)]">
          <div className="spacing-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-800">Something went wrong</h2>
            <p className="mb-4 text-red-600">Client provider error occurred</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main client providers wrapper - simplified structure
// Initialize analytics
function AnalyticsInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only track pageview if PostHog is properly initialized
    if (analytics.isInitialized()) {
      analytics.pageview(window.location.href);
    }
  }, []);

  return <>{children}</>;
}

// Auth provider wrapper - separate for pages that need auth
export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <SimpleErrorBoundary>
      <AuthErrorBoundary>
        <AuthProvider>
          <SimpleQueryProvider>{children}</SimpleQueryProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </SimpleErrorBoundary>
  );
}
