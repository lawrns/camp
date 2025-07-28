"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/Button-unified";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isSecurityRelated: boolean;
}

/**
 * Security-focused error boundary
 * Handles authentication, authorization, and security-related errors
 */
export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isSecurityRelated: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isSecurityRelated = SecurityErrorBoundary.isSecurityError(error);

    return {
      hasError: true,
      error,
      isSecurityRelated,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log security errors with extra context
    if (this.state.isSecurityRelated) {
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Determine if error is security-related
   */
  private static isSecurityError(error: Error): boolean {
    const securityKeywords = [
      "unauthorized",
      "forbidden",
      "authentication",
      "authorization",
      "csrf",
      "api key",
      "permission",
      "access denied",
      "invalid token",
      "rate limit",
    ];

    const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return securityKeywords.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Handle retry attempt
   */
  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, isSecurityRelated: false });
  };

  /**
   * Handle redirect to login
   */
  private handleLoginRedirect = (): void => {
    window.location.href = "/auth/login";
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Security-specific error UI
      if (this.state.isSecurityRelated) {
        return (
          <div className="flex min-h-[400px] items-center justify-center p-spacing-md">
            <div className="w-full max-w-md space-y-3">
              <Alert variant="error">
                <div className="space-y-spacing-sm">
                  <h3 className="font-semibold">Security Error</h3>
                  <p className="text-sm">A security-related error occurred. This might be due to:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Expired authentication session</li>
                    <li>Insufficient permissions</li>
                    <li>Invalid API key or token</li>
                    <li>Rate limiting protection</li>
                  </ul>
                </div>
              </Alert>

              <div className="flex gap-ds-2">
                <Button onClick={this.handleLoginRedirect} variant="primary" className="flex-1">
                  Login Again
                </Button>
                <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                  Retry
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 rounded bg-[var(--fl-color-background-subtle)] spacing-3 text-tiny">
                  <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
                    {"\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Generic error UI for non-security errors
      return (
        <div className="flex min-h-[400px] items-center justify-center p-spacing-md">
          <div className="w-full max-w-md space-y-3">
            <Alert variant="error">
              <div className="space-y-spacing-sm">
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="text-sm">An unexpected error occurred. Please try again.</p>
              </div>
            </Alert>

            <Button onClick={this.handleRetry} variant="primary" className="w-full">
              Try Again
            </Button>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 rounded bg-[var(--fl-color-background-subtle)] spacing-3 text-tiny">
                <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for wrapping components with security error boundary
 */
export function withSecurityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <SecurityErrorBoundary fallback={fallback}>
        <Component {...props} />
      </SecurityErrorBoundary>
    );
  };
}
