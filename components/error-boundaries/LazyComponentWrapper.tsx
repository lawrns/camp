/**
 * Lazy Component Wrapper
 *
 * Wrapper for lazy-loaded components with error boundaries and fallbacks
 * Specifically designed to handle chunk loading failures
 */

"use client";

import React, { Suspense } from "react";
import { AnimationErrorBoundary } from "./AnimationErrorBoundary";

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
  loadingFallback?: React.ReactNode;
}

const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center spacing-3">
    <div className="h-6 w-6 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
  </div>
);

const DefaultErrorFallback = ({ componentName }: { componentName?: string }) => (
  <div className="rounded-ds-lg border border-[var(--fl-color-warning-muted)] bg-yellow-50 spacing-3">
    <div className="text-sm text-yellow-800">
      {componentName ? `${componentName} failed to load` : "Component failed to load"}. Using simplified version.
    </div>
  </div>
);

export function LazyComponentWrapper({
  children,
  fallback,
  componentName,
  loadingFallback,
}: LazyComponentWrapperProps) {
  return (
    <AnimationErrorBoundary
      componentName={componentName}
      fallback={fallback ? () => fallback : ({ error }) => <DefaultErrorFallback componentName={componentName} />}
    >
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>{children}</Suspense>
    </AnimationErrorBoundary>
  );
}

// Higher-order component for wrapping lazy components
export function withLazyErrorBoundary<P extends object>(
  LazyComponent: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: React.ReactNode;
    loadingFallback?: React.ReactNode;
  }
) {
  const WrappedComponent = (props: P) => (
    <LazyComponentWrapper
      componentName={options?.componentName || LazyComponent.displayName || LazyComponent.name}
      fallback={options?.fallback}
      loadingFallback={options?.loadingFallback}
    >
      <LazyComponent {...props} />
    </LazyComponentWrapper>
  );

  WrappedComponent.displayName = `withLazyErrorBoundary(${options?.componentName || LazyComponent.displayName || LazyComponent.name})`;

  return WrappedComponent;
}

// Utility for creating safe lazy components
export function createSafeLazyComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    componentName?: string;
    fallback?: React.ReactNode;
    loadingFallback?: React.ReactNode;
    retryCount?: number;
  }
) {
  const LazyComponent = React.lazy(() => {
    let retryCount = 0;
    const maxRetries = options?.retryCount || 3;

    const loadWithRetry = async (): Promise<{ default: React.ComponentType<P> }> => {
      try {
        return await importFn();
      } catch (error) {

        if (retryCount < maxRetries) {
          retryCount++;
          // Clear module cache before retry
          if (typeof window !== "undefined" && (window as any).__webpack_require__?.cache) {
            Object.keys((window as any).__webpack_require__.cache).forEach((key) => {
              if (key.includes("chunk") || key.includes("lazy")) {
                delete (window as any).__webpack_require__.cache[key];
              }
            });
          }

          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return loadWithRetry();
        }

        // Return fallback component after max retries
        return {
          default: (() =>
            options?.fallback || (
              <div className="rounded-ds-lg border border-[var(--fl-color-danger-muted)] bg-red-50 spacing-3">
                <div className="text-sm text-red-800">
                  Failed to load {options?.componentName || "component"} after {maxRetries} attempts.
                </div>
              </div>
            )) as React.ComponentType<P>,
        };
      }
    };

    return loadWithRetry();
  });

  return withLazyErrorBoundary(LazyComponent, options);
}
