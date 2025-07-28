/**
 * Widget Error Boundary
 *
 * Specialized error boundary for widget components with
 * chunk loading error recovery and graceful fallbacks
 */

"use client";

import { AlertTriangle, MessageCircle, RefreshCw, X } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  organizationId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {


    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry for chunk loading errors
    if (this.isChunkLoadError(error) && this.state.retryCount < 3) {
      this.autoRetry();
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private isChunkLoadError(error: Error): boolean {
    return (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Loading CSS chunk") ||
      error.message.includes("Failed to import") ||
      error.message.includes("dynamically imported module")
    );
  }

  private autoRetry = () => {
    if (this.state.retryCount >= 3) return;

    this.setState({ isRetrying: true });

    // Clear module cache for chunk loading errors
    if (this.state.error && this.isChunkLoadError(this.state.error)) {
      this.clearModuleCache();
    }

    this.retryTimeoutId = setTimeout(
      () => {
        this.setState((prevState) => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));
      },
      1000 + this.state.retryCount * 1000
    ); // Exponential backoff
  };

  private clearModuleCache = () => {
    // Clear webpack module cache for dynamic imports
    if (typeof window !== "undefined" && (window as any).__webpack_require__) {
      const webpackRequire = (window as any).__webpack_require__;
      if (webpackRequire.cache) {
        Object.keys(webpackRequire.cache).forEach((key) => {
          if (key.includes("widget") || key.includes("Panel")) {
            delete webpackRequire.cache[key];
          }
        });
      }
    }
  };

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to error monitoring service
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        component: "Widget",
        organizationId: this.props.organizationId,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to error reporting endpoint
    fetch("/api/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorReport),
    }).catch((reportError) => {

    });
  };

  private handleRetry = () => {
    this.autoRetry();
  };

  private handleClose = () => {
    // Reset error state and close widget
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });

    // Notify parent to close widget
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("widget-close"));
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="bg-background fixed bottom-4 right-4 z-50 w-80 rounded-ds-lg border border-[var(--fl-color-danger-muted)] shadow-card-deep"
          data-testid="widget-error-boundary"
        >
          <div className="spacing-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-spacing-sm">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-medium text-gray-900">Widget Error</h3>
              </div>
              <button onClick={this.handleClose} className="hover:text-foreground text-gray-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-foreground text-sm">
                {this.isChunkLoadError(this.state.error!)
                  ? "Failed to load widget components. This might be due to a network issue."
                  : "The chat widget encountered an unexpected error."}
              </p>

              {this.state.retryCount < 3 && (
                <div className="flex space-x-spacing-sm">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="bg-primary flex flex-1 items-center justify-center space-x-spacing-sm rounded-ds-md px-3 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${this.state.isRetrying ? "animate-spin" : ""}`} />
                    <span>{this.state.isRetrying ? "Retrying..." : "Try Again"}</span>
                  </button>
                </div>
              )}

              {this.state.retryCount >= 3 && (
                <div className="space-y-spacing-sm">
                  <p className="text-foreground-muted text-tiny">
                    Multiple retry attempts failed. Please refresh the page or contact support.
                  </p>
                  <div className="flex space-x-spacing-sm">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex flex-1 items-center justify-center space-x-spacing-sm rounded-ds-md bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reload Page</span>
                    </button>
                    <a
                      href="/support"
                      className="bg-primary flex flex-1 items-center justify-center space-x-spacing-sm rounded-ds-md px-3 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Support</span>
                    </a>
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-3">
                  <summary className="text-foreground-muted cursor-pointer text-tiny">Error Details (Development)</summary>
                  <div className="bg-background mt-2 rounded p-spacing-sm font-mono text-tiny">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Retry Count:</strong> {this.state.retryCount}
                    </div>
                    {this.state.error.stack && (
                      <div className="mt-1">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-tiny">{this.state.error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
