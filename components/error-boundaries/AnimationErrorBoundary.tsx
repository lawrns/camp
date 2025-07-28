/**
 * Animation Error Boundary
 *
 * Comprehensive error boundary for animation and chunk loading failures
 * Provides graceful fallbacks and retry mechanisms
 */

"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface AnimationErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

function AnimationErrorFallback({ error, resetErrorBoundary, componentName }: AnimationErrorFallbackProps) {
  const isChunkError =
    error.message.includes("Loading chunk") ||
    error.message.includes("ChunkLoadError") ||
    error.message.includes("Failed to import") ||
    error.name === "ChunkLoadError";

  const isDynamicImportError =
    error.message.includes("dynamically imported module") || error.message.includes("Cannot resolve module");

  const isAnimationError = isChunkError || isDynamicImportError;

  // Log error for monitoring

  // Report to error monitoring service
  if (typeof window !== "undefined") {
    fetch("/api/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context: {
          component: componentName || "AnimationComponent",
          type: isChunkError ? "ChunkLoadError" : "AnimationError",
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch((reportError) => {

    });
  }

  if (isAnimationError) {
    return (
      <div className="relative rounded-ds-lg border border-[var(--fl-color-warning-muted)] bg-yellow-50 spacing-3">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Animation Loading Issue</h3>
            <p className="mt-1 text-sm text-yellow-700">
              {isChunkError
                ? "Animation components failed to load. Using simplified interface."
                : "Animation system encountered an error. Falling back to basic styling."}
            </p>
            <div className="mt-3 flex space-x-spacing-sm">
              <button
                onClick={() => {
                  // Clear module cache and retry
                  if (typeof window !== "undefined" && (window as any).__webpack_require__) {
                    const webpackRequire = (window as any).__webpack_require__;
                    if (webpackRequire.cache) {
                      Object.keys(webpackRequire.cache).forEach((key) => {
                        if (key.includes("framer-motion") || key.includes("animation")) {
                          delete webpackRequire.cache[key];
                        }
                      });
                    }
                  }
                  resetErrorBoundary();
                }}
                className="inline-flex items-center rounded border border-transparent bg-yellow-100 px-3 py-1.5 text-tiny font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-background inline-flex items-center rounded border border-[var(--fl-color-warning-muted)] px-3 py-1.5 text-tiny font-medium text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generic error fallback
  return (
    <div className="relative rounded-ds-lg border border-[var(--fl-color-danger-muted)] bg-red-50 spacing-3">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-red-800">Component Error</h3>
          <p className="mt-1 text-sm text-red-700">
            {componentName || "This component"} encountered an error and couldn't render properly.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-2">
              <summary className="cursor-pointer text-tiny text-red-600">Error Details (Development)</summary>
              <pre className="mt-1 whitespace-pre-wrap text-tiny text-red-600">{error.message}</pre>
            </details>
          )}
          <div className="mt-3">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center rounded border border-transparent bg-red-100 px-3 py-1.5 text-tiny font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnimationErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ComponentType<AnimationErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function AnimationErrorBoundary({
  children,
  componentName,
  fallback: CustomFallback,
  onError,
}: AnimationErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {

    onError?.(error, errorInfo);
  };

  const FallbackComponent = CustomFallback || AnimationErrorFallback;

  return (
    <ErrorBoundary
      FallbackComponent={(props) => <FallbackComponent {...props} componentName={componentName} />}
      onError={handleError}
      onReset={() => {
        // Clear any cached modules on reset
        if (typeof window !== "undefined" && (window as any).__webpack_require__) {
          const webpackRequire = (window as any).__webpack_require__;
          if (webpackRequire.cache) {
            Object.keys(webpackRequire.cache).forEach((key) => {
              if (key.includes("framer-motion") || key.includes("animation") || key.includes("motion")) {
                delete webpackRequire.cache[key];
              }
            });
          }
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Convenience wrapper for lazy-loaded components
export function withAnimationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => (
    <AnimationErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </AnimationErrorBoundary>
  );

  WrappedComponent.displayName = `withAnimationErrorBoundary(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for manual error boundary reset
export function useAnimationErrorReset() {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  return { resetKey, reset };
}
