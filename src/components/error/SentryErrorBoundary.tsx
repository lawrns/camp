"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning as AlertTriangle, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { errorLogger } from "@/lib/services/ErrorLoggingService";
import { Icon } from "@/lib/ui/Icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "component" | "widget";
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our service
    const errorId = errorLogger.logClientError(
      (error instanceof Error ? error.message : String(error)),
      this.getComponentName(),
      undefined // User context will be added automatically
    );

    this.setState({ errorId });

    // Add component stack to breadcrumbs
    errorLogger.addBreadcrumb("Component Error", "error", {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.getComponentName(),
      level: this.props.level || "component",
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private getComponentName(): string {
    return this.constructor.name || "ErrorBoundary";
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null as any, errorId: "" });
  };

  private handleReportProblem = () => {
    const { error, errorId } = this.state;

    // Create error report
    const report = {
      errorId,
      message: error?.message || "Unknown error",
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      alert("Error details copied to clipboard. Please send this to support.");
    });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      const { level = "component" } = this.props;

      if (level === "widget") {
        return (
          <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3 text-center">
            <Icon icon={AlertTriangle} className="text-brand-mahogany-500 mx-auto mb-2 h-6 w-6" />
            <p className="text-red-600-dark mb-2 text-sm">Widget temporarily unavailable</p>
            <Button size="sm" variant="outline" onClick={this.handleRetry} className="text-red-600-dark border-[var(--fl-color-danger-muted)]" leftIcon={<Icon icon={RefreshCw} className="h-4 w-4" />}>
              Retry
            </Button>
          </div>
        );
      }

      if (level === "page") {
        return (
          <div className="flex min-h-screen items-center justify-center spacing-3">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-ds-full bg-[var(--fl-color-danger-subtle)]">
                  <Icon icon={AlertTriangle} className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground text-center">
                  We've encountered an unexpected error. Our team has been notified.
                </p>

                {this.state.errorId && (
                  <div className="rounded border bg-[var(--fl-color-background-subtle)] spacing-3">
                    <p className="mb-1 text-tiny text-[var(--fl-color-text-muted)]">Error ID:</p>
                    <code className="text-foreground font-mono text-tiny">{this.state.errorId}</code>
                  </div>
                )}

                <div className="flex space-x-spacing-sm">
                  <Button onClick={this.handleRetry} className="flex-1" leftIcon={<Icon icon={RefreshCw} className="h-4 w-4" />}>
                    Retry
                  </Button>

                  <Button variant="outline" onClick={this.handleReportProblem} className="flex-1">
                    Report Problem
                  </Button>
                </div>

                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
                    Go to Homepage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Default component-level error
      return (
        <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
          <div className="flex items-start space-x-3">
            <Icon icon={AlertTriangle} className="text-brand-mahogany-500 mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Component Error</h3>
              <p className="text-red-600-dark mt-1 text-sm">
                This component encountered an error and couldn't render.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-tiny text-red-600">Error Details (Development)</summary>
                  <pre className="mt-1 whitespace-pre-wrap text-tiny text-red-600">
                    {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
                    {this.state.error.stack && (
                      <>
                        <br />
                        <br />
                        {this.state.error.stack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="mt-3 flex space-x-spacing-sm">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="text-red-600-dark border-[var(--fl-color-danger-muted)]"
                >
                  <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useSentryErrorHandler() {
  return {
    logError: (error: Error, context?: string) => {
      errorLogger.logClientError((error instanceof Error ? error.message : String(error)), context);
    },
    logWarning: (message: string, context?: Record<string, any>) => {
      const logContext: Parameters<typeof errorLogger.logWarning>[1] = {};
      if (context !== undefined) {
        logContext.extra = context;
      }
      errorLogger.logWarning(message, logContext);
    },
    logInfo: (message: string, context?: Record<string, any>) => {
      const logContext: Parameters<typeof errorLogger.logInfo>[1] = {};
      if (context !== undefined) {
        logContext.extra = context;
      }
      errorLogger.logInfo(message, logContext);
    },
  };
}
