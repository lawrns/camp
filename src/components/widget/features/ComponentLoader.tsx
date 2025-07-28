/**
 * Component Loader
 *
 * Loading states and fallbacks for lazy-loaded components:
 * - Adaptive loading indicators based on network conditions
 * - Skeleton screens for better perceived performance
 * - Error boundaries with retry mechanisms
 * - Accessibility-compliant loading states
 */

import React from "react";
import { useAdaptiveAnimations } from "@/lib/animations/adaptive-animations";
import { AnimatedSpinner } from "@/components/animations/MicroAnimations";

interface ComponentLoaderProps {
  type?: string;
  size?: "small" | "medium" | "large";
  showText?: boolean;
  className?: string;
}

export function ComponentLoader({
  type = "component",
  size = "medium",
  showText = true,
  className = "",
}: ComponentLoaderProps) {
  const { quality } = useAdaptiveAnimations();

  const sizeClasses = {
    small: "spacing-4",
    medium: "spacing-6",
    large: "spacing-8",
  };

  const spinnerSizes = {
    small: "small" as const,
    medium: "medium" as const,
    large: "large" as const,
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Loading ${type}`}
    >
      <AnimatedSpinner size={spinnerSizes[size]} className="mb-3" />

      {showText && (
        <div className="text-center">
          <p className="text-foreground mb-1 text-sm">Loading {type}...</p>
          <p className="text-foreground-muted text-tiny">Please wait a moment</p>
        </div>
      )}
    </div>
  );
}

// Skeleton loader for chat messages
export function MessageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 spacing-3" role="status" aria-label="Loading messages">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex space-x-3">
          <div className="h-8 w-8 animate-pulse rounded-ds-full bg-gray-200"></div>
          <div className="flex-1 space-y-spacing-sm">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for widget panel
export function PanelSkeleton() {
  return (
    <div
      className="bg-background h-96 w-80 rounded-ds-lg spacing-3 shadow-card-deep"
      role="status"
      aria-label="Loading chat widget"
    >
      {/* Header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Messages skeleton */}
      <div className="mb-4 space-y-3">
        <MessageSkeleton count={2} />
      </div>

      {/* Input skeleton */}
      <div className="flex space-x-spacing-sm">
        <div className="h-10 flex-1 animate-pulse rounded bg-gray-200"></div>
        <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

// Error boundary component
export class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {

  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-spacing-md text-center">
      <div className="mb-4 text-red-500">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h3 className="mb-2 text-base font-semibold text-gray-900">Something went wrong</h3>

      <p className="text-foreground mb-4 text-sm">Failed to load component. Please try again.</p>

      <button
        onClick={retry}
        className="bg-primary rounded-ds-lg px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Try Again
      </button>

      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 text-left">
          <summary className="text-foreground-muted cursor-pointer text-sm">Error Details</summary>
          <pre className="mt-2 max-w-sm overflow-auto rounded bg-red-50 p-spacing-sm text-tiny text-red-600">
            {(error instanceof Error ? error.message : String(error))}
          </pre>
        </details>
      )}
    </div>
  );
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  options: {
    fallback?: React.ComponentType<ComponentLoaderProps>;
    errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    loaderProps?: ComponentLoaderProps;
  } = {}
) {
  const { fallback: FallbackComponent = ComponentLoader, errorFallback, loaderProps = {} } = options;

  return function LazyLoadedComponent(props: P) {
    return (
      <ComponentErrorBoundary fallback={errorFallback}>
        <React.Suspense fallback={<FallbackComponent {...loaderProps} />}>
          <LazyComponent {...props} />
        </React.Suspense>
      </ComponentErrorBoundary>
    );
  };
}

export default ComponentLoader;
