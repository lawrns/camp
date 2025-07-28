"use client";

import React, { Component, ReactNode } from "react";
import { Warning as AlertCircle, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Clear any auth-related storage
    if (typeof window !== "undefined") {
      try {
        const authKeys = Object.keys(localStorage).filter(
          (key: any) => key.includes("supabase") || key.includes("auth")
        );
        authKeys.forEach((key: any) => localStorage.removeItem(key));
      } catch (e) {}
    }

    // Reload the page to ensure clean state
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isAuthError =
        this.state.error?.message?.toLowerCase().includes("auth") ||
        this.state.error?.message?.toLowerCase().includes("supabase");

      return (
        <div className="flex min-h-screen items-center justify-center spacing-3">
          <div className="w-full max-w-md space-y-3">
            <Alert variant="error">
              <Icon icon={AlertCircle} className="h-4 w-4" />
              <AlertTitle>{isAuthError ? "Authentication Error" : "Something went wrong"}</AlertTitle>
              <AlertDescription className="mt-2">
                {isAuthError ? (
                  <>
                    We encountered an issue with authentication. This might be due to:
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>Session expired</li>
                      <li>WifiHighHigh connectivity issues</li>
                      <li>Browser storage problems</li>
                    </ul>
                  </>
                ) : (
                  <>
                    An unexpected error occurred. Please try refreshing the page.
                    {process.env.NODE_ENV === "development" && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Error details</summary>
                        <pre className="bg-background mt-2 overflow-auto rounded p-spacing-sm text-tiny">
                          {this.state.error?.toString()}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={this.handleReset} variant="default" className="flex-1">
                <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>

              {isAuthError && (
                <Button
                  onClick={() => {
                    // For error boundary, we'll use window.location as a fallback
                    // since we can't use hooks in class components
                    window.location.href = "/login";
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Login
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to use in functional components
export function useAuthErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);

  return { setError, resetError };
}
