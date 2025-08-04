import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning as AlertTriangle, Database, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { useUIStore } from "@/store/domains/ui/ui-store";
import { useStore as useCampfireStore } from "@/store/phoenix-store";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class StateManagementErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error in store
    useCampfireStore.getState().incrementErrorCount();

    // Add error notification
    useUIStore.getState().addNotification({
      type: "error",
      message: "A state management error occurred. Please refresh if the issue persists.",
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to monitoring service
    if (typeof window !== "undefined" && (window as unknown).Sentry) {
      (window as unknown).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
          stateManagement: {
            storeSize: useCampfireStore.getState().conversations?.length || 0,
            messageCount: Object.values(useCampfireStore.getState().messages || {}).flat().length,
          },
        },
      });
    }
  }

  handleReset = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });

    // Clear store errors
    useCampfireStore.getState().setUIError(null);
    useUIStore.getState().clearError();
  };

  handleClearCache = () => {
    // Clear persisted state
    if (typeof window !== "undefined") {
      localStorage.removeItem("campfire-store");
    }

    // Reload the page
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isStateError =
        this.state.error?.message?.includes("store") ||
        this.state.error?.message?.includes("state") ||
        this.state.error?.message?.includes("selector");

      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)] spacing-3">
          <div className="w-full max-w-md space-y-3">
            <Alert variant="error">
              <Icon icon={AlertTriangle} className="h-4 w-4" />
              <AlertTitle>State Management Error</AlertTitle>
              <AlertDescription>
                {isStateError
                  ? "An error occurred with the application state. This is often resolved by refreshing the page."
                  : "An unexpected error occurred in the application."}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === "development" && (
              <div className="bg-background rounded-ds-lg spacing-3 text-sm">
                <p className="mb-2 font-semibold">Error Details:</p>
                <pre className="whitespace-pre-wrap break-words text-tiny">{this.state.error?.stack}</pre>
              </div>
            )}

            <div className="flex gap-ds-2">
              <Button onClick={this.handleReset} variant="default" className="flex items-center gap-ds-2">
                <Icon icon={RefreshCw} className="h-4 w-4" />
                Try Again
              </Button>

              {isStateError && (
                <Button onClick={this.handleClearCache} variant="outline" className="flex items-center gap-ds-2">
                  <Icon icon={Database} className="h-4 w-4" />
                  Clear Cache & Reload
                </Button>
              )}
            </div>

            {this.state.errorCount > 2 && (
              <Alert>
                <AlertDescription>
                  Multiple errors detected. Consider refreshing the page or contacting support if the issue persists.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary imperatively
export function useStateErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: setError,
    clearError: () => setError(null),
  };
}
