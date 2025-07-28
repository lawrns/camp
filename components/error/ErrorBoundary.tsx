"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning as AlertTriangle, House as Home, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
// import { captureExceptionAndLogIfDevelopment } from '@/lib/sentry-client'; // Module not found
import { handleComponentError } from "@/lib/client-errors";
import { AppError, handleError } from "@/lib/errors/errorHandling";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Icon } from "@/lib/ui/Icon";
import { ErrorContext, UnifiedErrorBoundary, UnifiedErrorBoundaryProps } from "./UnifiedErrorBoundary";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * @deprecated Use UnifiedErrorBoundary instead. This is a wrapper for backward compatibility.
 */
export class ErrorBoundary extends Component<Props, State> {
  private unifiedBoundaryRef = React.createRef<UnifiedErrorBoundary>();

  override render() {
    const { children, fallback, onError, resetKeys, resetOnPropsChange } = this.props;

    // Map old props to new UnifiedErrorBoundary props
    const unifiedProps: UnifiedErrorBoundaryProps = {
      children,
      domain: "default",
      severity: "medium",
      fallback,
      onError: onError ? (error: any, errorInfo: any, context: any) => onError(error, errorInfo) : undefined,
      resetKeys,
      resetOnPropsChange,
      maxRetries: 3,
      enableLogging: true,
      enableReporting: true,
      showErrorDetails: process.env.NODE_ENV === "development",
    };

    return <UnifiedErrorBoundary ref={this.unifiedBoundaryRef} {...unifiedProps} />;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  onRetry: () => void;
}

function ErrorFallback({ error, errorId, retryCount, onRetry }: ErrorFallbackProps) {
  const isAppError = error instanceof AppError;
  const userMessage = isAppError ? error.message : "Something went wrong";
  const showRetry = retryCount < 3;

  return (
    <div className="border-status-error-light flex min-h-[200px] w-full flex-col items-center justify-center rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] p-spacing-md text-center">
      <Icon icon={AlertTriangle} className="text-brand-mahogany-500 mb-4 h-12 w-12" />

      <h3 className="mb-2 text-base font-semibold text-red-900">Oops! Something went wrong</h3>

      <p className="text-red-600-dark mb-4 max-w-md text-sm">{userMessage}</p>

      {process.env.NODE_ENV === "development" && error && (
        <details className="mb-4 max-w-lg">
          <summary className="cursor-pointer text-tiny text-red-600 hover:text-red-800">
            Technical Details (Development Only)
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-[var(--fl-color-danger-subtle)] p-spacing-sm text-left text-tiny text-red-800">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-ds-2">
        {showRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-red-600-dark border-[var(--fl-color-danger-muted)] hover:bg-[var(--fl-color-danger-subtle)]"
          >
            <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}

        <Button
          onClick={() => {
            if (isFeatureEnabled("enableRealtimeSync")) {
              // In realtime-only mode, just reset the error state
              onRetry();
            } else {
              // Fallback to page reload for legacy mode
              window.location.reload();
            }
          }}
          variant="outline"
          size="sm"
          className="text-red-600-dark border-[var(--fl-color-danger-muted)] hover:bg-[var(--fl-color-danger-subtle)]"
        >
          {isFeatureEnabled("enableRealtimeSync") ? "Reset" : "Reload Page"}
        </Button>
      </div>

      {errorId && <p className="text-brand-mahogany-500 mt-4 text-tiny">Error ID: {errorId}</p>}
    </div>
  );
}

// Convenience wrapper for common use cases
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorHandler() {
  return (error: Error, errorInfo?: { [key: string]: any }) => {
    const appError = error instanceof AppError ? error : handleError(error);

    // Simple error logging for development
    if (process.env.NODE_ENV === "development") {
    }

    // You can add more error reporting logic here
    // For example, sending to error tracking service
  };
}
