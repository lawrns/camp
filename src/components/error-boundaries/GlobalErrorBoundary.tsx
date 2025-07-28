/**
 * Global Error Boundary
 *
 * Top-level error boundary for the entire application
 * Catches all unhandled errors and provides recovery mechanisms
 */

"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface GlobalErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function GlobalErrorFallback({ error, resetErrorBoundary }: GlobalErrorFallbackProps) {
  const isChunkError =
    (error instanceof Error ? error.message : String(error)).includes("Loading chunk") ||
    (error instanceof Error ? error.message : String(error)).includes("ChunkLoadError") ||
    (error instanceof Error ? error.message : String(error)).includes("Failed to import") ||
    error.name === "ChunkLoadError";

  const isAnimationError =
    (error instanceof Error ? error.message : String(error)).includes("framer-motion") ||
    (error instanceof Error ? error.message : String(error)).includes("OptimizedMotion") ||
    (error instanceof Error ? error.message : String(error)).includes("AnimatePresence");

  const isNetworkError =
    (error instanceof Error ? error.message : String(error)).includes("fetch") || (error instanceof Error ? error.message : String(error)).includes("Network") || (error instanceof Error ? error.message : String(error)).includes("ERR_NETWORK");

  // Log error for monitoring

  // Report to error monitoring service
  if (typeof window !== "undefined") {
    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: (error instanceof Error ? error.message : String(error)),
          stack: error.stack,
        },
        context: {
          component: "GlobalErrorBoundary",
          type: isChunkError ? "ChunkLoadError" : isAnimationError ? "AnimationError" : "ApplicationError",
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((reportError) => {

    });
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center spacing-3">
      <div className="bg-background border-ds-border w-full max-w-md rounded-ds-lg border shadow-card-deep">
        <div className="p-spacing-md">
          <div className="mb-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Something went wrong</h1>
              <p className="text-foreground text-sm">
                {isChunkError
                  ? "Failed to load application components"
                  : isAnimationError
                    ? "Animation system encountered an error"
                    : isNetworkError
                      ? "Network connection issue"
                      : "An unexpected error occurred"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {isChunkError && (
              <div className="rounded-ds-md bg-blue-50 spacing-3">
                <p className="text-sm text-blue-800">
                  This usually happens when the application is updated. Refreshing the page should resolve the issue.
                </p>
              </div>
            )}

            {isAnimationError && (
              <div className="rounded-ds-md bg-yellow-50 spacing-3">
                <p className="text-sm text-yellow-800">
                  Animation components failed to load. The application will work with simplified styling.
                </p>
              </div>
            )}

            {isNetworkError && (
              <div className="rounded-ds-md bg-orange-50 spacing-3">
                <p className="text-sm text-orange-800">Please check your internet connection and try again.</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Clear caches and retry
                  if (typeof window !== "undefined") {
                    // Clear webpack module cache
                    if ((window as any).__webpack_require__?.cache) {
                      Object.keys((window as any).__webpack_require__.cache).forEach((key) => {
                        delete (window as any).__webpack_require__.cache[key];
                      });
                    }

                    // Clear browser caches
                    if ("caches" in window) {
                      caches.keys().then((names) => {
                        names.forEach((name) => caches.delete(name));
                      });
                    }
                  }

                  resetErrorBoundary();
                }}
                className="bg-primary inline-flex flex-1 items-center justify-center rounded-ds-md border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="border-ds-border-strong text-foreground bg-background hover:bg-background inline-flex flex-1 items-center justify-center rounded-ds-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => (window.location.href = "/")}
                className="border-ds-border-strong text-foreground bg-background hover:bg-background inline-flex flex-1 items-center justify-center rounded-ds-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </button>

              <a
                href="/support"
                className="border-ds-border-strong text-foreground bg-background hover:bg-background inline-flex flex-1 items-center justify-center rounded-ds-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Bug className="mr-2 h-4 w-4" />
                Report Issue
              </a>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4">
              <summary className="text-foreground-muted hover:text-foreground cursor-pointer text-sm">
                Error Details (Development)
              </summary>
              <div className="bg-background mt-2 rounded spacing-3 font-mono text-tiny">
                <div>
                  <strong>Error:</strong> {(error instanceof Error ? error.message : String(error))}
                </div>
                <div>
                  <strong>Type:</strong> {error.name}
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-tiny">{error.stack}</pre>
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

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function GlobalErrorBoundary({ children, onError }: GlobalErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {

    onError?.(error, errorInfo);
  };

  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={handleError}
      onReset={() => {
        // Clear all caches on reset
        if (typeof window !== "undefined") {
          // Clear webpack module cache
          if ((window as any).__webpack_require__?.cache) {
            Object.keys((window as any).__webpack_require__.cache).forEach((key) => {
              delete (window as any).__webpack_require__.cache[key];
            });
          }

          // Clear localStorage items that might be causing issues
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes("chunk") || key.includes("cache") || key.includes("error"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
