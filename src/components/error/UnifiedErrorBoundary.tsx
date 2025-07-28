"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

// Error domain types
export type ErrorDomain =
  | "default"
  | "ai"
  | "supabase"
  | "knowledge"
  | "dashboard"
  | "critical"
  | "notification"
  | "auth";

// Error severity levels
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// Error handler function type
export type ErrorHandler = (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void | Promise<void>;

// Extended ErrorContext interface
export interface ErrorContext {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  domain: ErrorDomain;
  severity: ErrorSeverity;
  retryCount: number;
  errorId: string;
  timestamp: Date;
  additionalData?: Record<string, unknown>;
}

export interface UnifiedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((context: ErrorContext) => ReactNode) | undefined;
  onError?: ErrorHandler | undefined;
  resetKeys?: (string | number)[] | undefined;
  domain?: ErrorDomain | undefined;
  severity?: ErrorSeverity | undefined;
  customErrorHandlers?: Partial<Record<ErrorDomain, ErrorHandler>> | undefined;
  maxRetries?: number | undefined;
  enableLogging?: boolean | undefined;
  enableReporting?: boolean | undefined;
  showErrorDetails?: boolean | undefined;
  resetOnPropsChange?: boolean | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  timestamp: Date | null;
}

export class UnifiedErrorBoundary extends Component<UnifiedErrorBoundaryProps, State> {
  constructor(props: UnifiedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      timestamp: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      timestamp: new Date(),
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { domain = "default", severity = "medium", enableLogging = true, onError, customErrorHandlers } = this.props;
    const { errorId, retryCount, timestamp } = this.state;

    if (enableLogging) {
    }

    this.setState({ errorInfo });

    // Create extended error context
    const context: ErrorContext = {
      error,
      errorInfo,
      resetError: this.resetError,
      domain,
      severity,
      retryCount,
      errorId: errorId || `error_${Date.now()}`,
      timestamp: timestamp || new Date(),
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    };

    // Call domain-specific error handler if available
    const domainHandler = customErrorHandlers?.[domain];
    if (domainHandler) {
      try {
        domainHandler(error, errorInfo, context);
      } catch (handlerError) {}
    }

    // Call general error handler
    if (onError) {
      try {
        onError(error, errorInfo, context);
      } catch (handlerError) {}
    }
  }

  override componentDidUpdate(prevProps: UnifiedErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      // Reset error when any prop changes
      let shouldReset = false;

      // Check if resetKeys changed
      if (resetKeys && prevProps.resetKeys !== resetKeys) {
        const hasResetKeyChanged = resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index]);
        if (hasResetKeyChanged) {
          shouldReset = true;
        }
      }

      // Check if other relevant props changed
      if (prevProps.domain !== this.props.domain || prevProps.severity !== this.props.severity) {
        shouldReset = true;
      }

      if (shouldReset) {
        this.resetError();
      }
    } else if (hasError && prevProps.resetKeys !== resetKeys) {
      // Legacy behavior for resetKeys only
      const hasResetKeyChanged = resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index]);
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      timestamp: null,
    });
  };

  override render() {
    const { hasError, error, errorInfo, errorId, retryCount, timestamp } = this.state;
    const {
      fallback,
      children,
      domain = "default",
      severity = "medium",
      maxRetries = 3,
      showErrorDetails = false,
    } = this.props;

    if (hasError && error) {
      const errorContext: ErrorContext = {
        error,
        errorInfo: errorInfo || { componentStack: "" },
        resetError: this.resetError,
        domain,
        severity,
        retryCount,
        errorId: errorId || `error_${Date.now()}`,
        timestamp: timestamp || new Date(),
        additionalData: {
          componentStack: errorInfo?.componentStack || "",
        },
      };

      if (typeof fallback === "function") {
        return fallback(errorContext);
      }

      if (fallback) {
        return fallback;
      }

      // Default error UI with improved features
      const canRetry = retryCount < maxRetries;
      const severityColors = {
        low: "bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-muted)] text-blue-900",
        medium: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)] text-yellow-900",
        high: "bg-orange-50 border-orange-200 text-orange-900",
        critical: "bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)] text-red-900",
      };

      return (
        <div
          className={`flex min-h-[400px] flex-col items-center justify-center rounded-ds-lg border spacing-8 ${severityColors[severity]}`}
        >
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold">Something went wrong</h2>
            <p className="mx-auto max-w-md">
              {severity === "critical"
                ? "A critical error occurred. Please contact support immediately."
                : "An unexpected error occurred. Please try refreshing the page or contact support if the issue persists."}
            </p>

            {showErrorDetails && (
              <details className="mx-auto mt-4 max-w-lg">
                <summary className="cursor-pointer text-sm hover:underline">Technical Details</summary>
                <pre className="bg-background mt-2 max-h-48 overflow-auto rounded spacing-3 text-left text-tiny">
                  {(error instanceof Error ? error.message : String(error))}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-ds-2">
              {canRetry && (
                <button
                  onClick={() => {
                    this.setState({ retryCount: retryCount + 1 });
                    this.resetError();
                  }}
                  className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Try Again ({maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.resetError}
                className="rounded-ds-lg bg-neutral-600 px-4 py-2 text-white transition-colors hover:bg-neutral-700"
              >
                Reset
              </button>
            </div>

            {errorId && <p className="mt-4 text-tiny opacity-75">Error ID: {errorId}</p>}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for using error boundary programmatically
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Export state interface for external use
export interface UnifiedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  timestamp: Date | null;
}

export default UnifiedErrorBoundary;
