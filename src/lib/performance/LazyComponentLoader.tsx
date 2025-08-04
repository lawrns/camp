/**
 * Lazy Component Loader
 *
 * Implements dynamic imports and lazy loading to reduce bundle size
 * Target: Recover from 471ms regression back to <100ms performance
 *
 * Features:
 * - Dynamic component imports
 * - Loading states and error boundaries
 * - Bundle splitting optimization
 * - Performance monitoring
 * - Memory management
 */

import React, { ComponentType, lazy, ReactNode, Suspense } from "react";
import { AlertCircle, Loader } from "lucide-react";

interface LazyLoadOptions {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  retryCount?: number;
  timeout?: number;
  preload?: boolean;
}

interface LazyComponentProps {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
}

/**
 * Enhanced lazy loading with error handling and retry logic
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType<any> {
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback = <DefaultErrorFallback />,
    retryCount = 3,
    timeout = 10000,
    preload = false,
  } = options;

  // Create lazy component with timeout
  const LazyComponent = lazy(() => {
    return Promise.race([
      importFn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Component load timeout")), timeout)),
    ]);
  });

  // Preload if requested
  if (preload) {
    importFn().catch(() => {
      // Silently fail preload attempts
    });
  }

  // Wrapper component with error boundary
  const WrappedComponent: ComponentType<any> = (props) => {
    return (
      <ErrorBoundary fallback={errorFallback} retryCount={retryCount}>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  return WrappedComponent;
}

/**
 * Error boundary for lazy components
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryAttempts: number;
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode; retryCount: number },
  ErrorBoundaryState
> {
  constructor(props: unknown) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {

  }

  retry = () => {
    if (this.state.retryAttempts < this.props.retryCount) {
      this.setState({
        hasError: false,
        error: null,
        retryAttempts: this.state.retryAttempts + 1,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (React.isValidElement(this.props.fallback)) {
        return React.cloneElement(this.props.fallback as React.ReactElement, {
          error: this.state.error,
          retry: this.retry,
          canRetry: this.state.retryAttempts < this.props.retryCount,
        });
      }
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Default loading fallback component
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center spacing-4">
    <div className="flex items-center space-x-2 text-gray-600">
      <Loader className="h-4 w-4 animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  </div>
);

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
  error?: Error;
  retry?: () => void;
  canRetry?: boolean;
}> = ({ error, retry, canRetry = true }) => (
  <div className="flex flex-col items-center justify-center spacing-4 text-center">
    <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
    <p className="mb-2 text-sm text-gray-600">Failed to load component</p>
    {error && <p className="mb-3 text-xs text-gray-500">{(error instanceof Error ? error.message : String(error))}</p>}
    {canRetry && retry && (
      <button onClick={retry} className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">
        Retry
      </button>
    )}
  </div>
);

/**
 * Lazy-loaded components for the inbox dashboard
 */

// Smart Reply Panel (heavy AI component)
export const LazySmartReplyPanel = createLazyComponent(
  () => import("../components/InboxDashboard/sub-components/SmartReplyPanel"),
  {
    preload: false, // Load only when needed
    fallback: (
      <div className="flex w-80 items-center justify-center border-l border-gray-200 bg-white">
        <DefaultLoadingFallback />
      </div>
    ),
  }
);

// Advanced File Upload (heavy component with image processing)
export const LazyAdvancedFileUpload = createLazyComponent(
  () => import("../components/InboxDashboard/sub-components/AdvancedFileUpload"),
  {
    preload: false,
    fallback: (
      <div className="rounded-ds-lg border-2 border-dashed border-gray-300 spacing-6 text-center">
        <DefaultLoadingFallback />
      </div>
    ),
  }
);

// Rich Text Composer (heavy editor component)
export const LazyRichTextComposer = createLazyComponent(
  () => import("../components/InboxDashboard/sub-components/RichTextComposer"),
  {
    preload: false,
    fallback: (
      <div className="flex min-h-[100px] items-center justify-center rounded-ds-lg border border-gray-300 spacing-3">
        <DefaultLoadingFallback />
      </div>
    ),
  }
);

// Message Reactions (lighter component, can preload)
export const LazyMessageReactions = createLazyComponent(
  () => import("../components/InboxDashboard/sub-components/MessageReactions"),
  {
    preload: true, // Small component, safe to preload
    fallback: (
      <div className="flex h-8 items-center">
        <DefaultLoadingFallback />
      </div>
    ),
  }
);

/**
 * Performance monitoring for lazy components
 */
export class LazyLoadPerformanceMonitor {
  private static loadTimes: Map<string, number> = new Map();
  private static loadCounts: Map<string, number> = new Map();

  static startLoad(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;

      // Update metrics
      const currentCount = this.loadCounts.get(componentName) || 0;
      const currentAvg = this.loadTimes.get(componentName) || 0;

      const newAvg = (currentAvg * currentCount + loadTime) / (currentCount + 1);

      this.loadTimes.set(componentName, newAvg);
      this.loadCounts.set(componentName, currentCount + 1);

    };
  }

  static getMetrics(): Record<string, { averageLoadTime: number; loadCount: number }> {
    const metrics: Record<string, { averageLoadTime: number; loadCount: number }> = {};

    for (const [component, avgTime] of this.loadTimes.entries()) {
      metrics[component] = {
        averageLoadTime: avgTime,
        loadCount: this.loadCounts.get(component) || 0,
      };
    }

    return metrics;
  }

  static getTotalSavings(): number {
    // Estimate bundle size savings from lazy loading
    const componentSizes = {
      SmartReplyPanel: 45, // KB
      AdvancedFileUpload: 35, // KB
      RichTextComposer: 25, // KB
      MessageReactions: 8, // KB
    };

    return Object.values(componentSizes).reduce((total, size) => total + size, 0);
  }
}

/**
 * Hook for monitoring lazy component performance
 */
export function useLazyLoadMonitoring(componentName: string) {
  React.useEffect(() => {
    const endLoad = LazyLoadPerformanceMonitor.startLoad(componentName);
    return endLoad;
  }, [componentName]);
}

/**
 * Preload critical components based on user interaction
 */
export function preloadCriticalComponents() {
  // Preload components that are likely to be used soon
  const criticalComponents = [() => import("../components/InboxDashboard/sub-components/MessageReactions")];

  criticalComponents.forEach((importFn) => {
    importFn().catch(() => {
      // Silently fail preload attempts
    });
  });
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleImpact() {
  const metrics = LazyLoadPerformanceMonitor.getMetrics();
  const totalSavings = LazyLoadPerformanceMonitor.getTotalSavings();

  return {
    lazyComponentMetrics: metrics,
    estimatedBundleSavings: `${totalSavings}KB`,
    recommendedOptimizations: [
      "Consider preloading MessageReactions for better UX",
      "Keep SmartReplyPanel lazy-loaded (largest component)",
      "Monitor AdvancedFileUpload usage patterns",
    ],
  };
}
