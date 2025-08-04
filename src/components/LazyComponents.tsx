/**
 * Lazy-loaded components for bundle size optimization
 * Enhanced with advanced loading strategies and memory-aware loading
 */

import {
  AIInsightsDashboardSkeleton,
  ComprehensiveDashboardSkeleton,
  DashboardSkeleton,
  PerformanceMonitoringDashboardSkeleton,
  RAGAnalyticsDashboardSkeleton,
  RealtimeMetricsDashboardSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import { InboxDashboardSkeletonV2 } from "@/components/unified-ui/components/skeletons/unified-skeletons";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ComponentType, ReactNode, useEffect, useRef, useState } from "react";

// Enhanced loading component with progress indicator
const LoadingComponent = ({ progress = 0 }: { progress?: number }) => (
  <div className="flex flex-col items-center justify-center spacing-3">
    <div className="animate-pulse">
      <div className="h-8 w-8 rounded-ds-full bg-gray-200" />
    </div>
    {progress > 0 && (
      <div className="mt-2 h-1 w-32 rounded-ds-full bg-gray-200">
        <div
          className="bg-primary h-1 rounded-ds-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
  </div>
);

// Memory monitoring utilities
const getMemoryInfo = () => {
  if (typeof window !== "undefined" && "memory" in performance) {
    return (performance as unknown).memory;
  }
  return null;
};

const isMemoryAvailable = (threshold = 50 * 1024 * 1024) => {
  // 50MB threshold
  const memory = getMemoryInfo();
  if (!memory) return true; // Assume available if can't check
  return memory.usedJSHeapSize < threshold;
};

// Helper function to safely import components with fallback to default export
const safeImport = (importFn: () => Promise<any>, componentName?: string) => {
  return importFn()
    .then((mod) => {
      // Try to get the named export first, then fall back to default
      const component = componentName ? mod[componentName] : mod.default;
      if (component) {
        return { default: component };
      }
      // If neither exists, return the module as-is (might be default export)
      return mod;
    })
    .catch((error) => {

      // Return a fallback component
      return {
        default: () => (
          <div className="spacing-3 text-center text-red-500">Failed to load component: {componentName || "Unknown"}</div>
        ),
      };
    });
};

// Heavy dashboard components that should be lazy loaded
export const LazyComprehensiveDashboard = dynamic(
  () => safeImport(() => import("@/components/analytics/ComprehensiveDashboard"), "ComprehensiveDashboard"),
  {
    loading: () => <ComprehensiveDashboardSkeleton />,
    ssr: true, // Enable SSR for SEO but with loading state
  }
);

export const LazyRAGAnalyticsDashboard = dynamic(
  () => safeImport(() => import("@/components/analytics/RAGAnalyticsDashboard"), "RAGAnalyticsDashboard"),
  {
    loading: () => <RAGAnalyticsDashboardSkeleton />,
    ssr: true,
  }
);

export const LazyRealtimeMetricsDashboard = dynamic(
  () =>
    import("@/components/admin/RealtimeMetricsDashboard").then((mod) => ({ default: mod.RealtimeMetricsDashboard })),
  {
    loading: () => <RealtimeMetricsDashboardSkeleton />,
    ssr: false, // Realtime components should not SSR
  }
);

export const LazyPerformanceMonitoringDashboard = dynamic(
  () => import("@/components/analytics/PerformanceMonitoringDashboard"),
  {
    loading: () => <PerformanceMonitoringDashboardSkeleton />,
    ssr: false, // Performance monitoring should not SSR
  }
);



export const LazyAIInsightsDashboard = dynamic(
  () => import("@/components/ai/AIInsightsDashboard").then((mod) => ({ default: mod.AIInsightsDashboard })),
  {
    loading: () => <AIInsightsDashboardSkeleton />,
    ssr: true,
  }
);

export const LazySecurityAlertsDashboard = dynamic(
  () =>
    import("@/components/security/SecurityAlertsDashboard").then((mod) => ({ default: mod.SecurityAlertsDashboard })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyAgentWorkloadDashboard = dynamic(
  () => import("@/components/agent/AgentWorkloadDashboard").then((mod) => ({ default: mod.AgentWorkloadDashboard })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyKnowledgeBaseDashboard = dynamic(
  () =>
    import("@/components/knowledge/KnowledgeBaseDashboard").then((mod) => ({ default: mod.KnowledgeBaseDashboard })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyConfidenceMonitoringDashboard = dynamic(
  () =>
    import("@/components/ai/ConfidenceMonitoringDashboard").then((mod) => ({
      default: mod.ConfidenceMonitoringDashboard,
    })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

// New lazy components for expanded coverage
export const LazyAnalyticsDashboard = dynamic(
  () =>
    import("@/components/analytics/ComprehensiveDashboard").then((mod) => ({ default: mod.ComprehensiveDashboard })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyTeamManagementDashboard = dynamic(
  () => import("@/components/settings/TeamManagement").then((mod) => ({ default: mod.TeamManagement })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyIntegrationsDashboard = dynamic(
  () => import("@/components/integrations/IntegrationsManager").then((mod) => ({ default: mod.IntegrationsManager })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazySettingsDashboard = dynamic(
  () => import("@/components/settings/SettingsLayout").then((mod) => ({ default: mod.SettingsLayout })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyTicketSystemDashboard = dynamic(
  () => import("@/components/tickets/CreateTicket").then((mod) => ({ default: mod.CreateTicket })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyCustomerProfilePanel = dynamic(
  () => import("@/components/profile/OrganizationDetails").then((mod) => ({ default: mod.OrganizationDetails })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

export const LazyKnowledgeBaseEditor = dynamic(
  () => import("@/components/knowledge/ArticleEditor").then((mod) => ({ default: mod.ArticleEditor })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false, // Editor components should not SSR
  }
);

export const LazyAIConfigurationPanel = dynamic(
  () => import("@/components/ai/AIStatusDashboard").then((mod) => ({ default: mod.AIStatusDashboard })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: true,
  }
);

// Icon libraries - load only what's needed

// Utility to preload components
export const preloadComponent = (component: ComponentType<any>) => {
  if ("preload" in component && typeof component.preload === "function") {
    component.preload();
  }
};

// Enhanced HOC for lazy loading with advanced features
export function withLazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: ReactNode;
    memoryThreshold?: number;
    retryAttempts?: number;
    retryDelay?: number;
    showProgress?: boolean;
    ssr?: boolean;
  } = {}
) {
  const {
    fallback,
    memoryThreshold = 50 * 1024 * 1024, // 50MB
    retryAttempts = 3,
    retryDelay = 1000,
    showProgress = false,
    ssr = false,
  } = options;

  return dynamic(
    async () => {
      // Memory check before loading
      if (!isMemoryAvailable(memoryThreshold)) {

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
      }

      let lastError: Error | null = null;

      // Retry mechanism with exponential backoff
      for (let attempt = 0; attempt < retryAttempts; attempt++) {
        try {
          return await importFn();
        } catch (error) {
          lastError = error as Error;
          if (attempt < retryAttempts - 1) {
            const delay = retryDelay * Math.pow(2, attempt);

            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    },
    {
      loading: () => {
        if (showProgress) {
          return <LoadingComponentWithProgress />;
        }
        return fallback || <LoadingComponent />;
      },
      ssr,
    }
  );
}

// Loading component with progress tracking
const LoadingComponentWithProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return <LoadingComponent progress={progress} />;
};

// Route-level lazy loading with intelligent prefetching
export function withRouteLazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    prefetchRoutes?: string[];
    prefetchDelay?: number;
    fallback?: ReactNode;
  } = {}
) {
  const { prefetchRoutes = [], prefetchDelay = 2000, fallback } = options;

  const LazyComponent = dynamic(importFn, {
    loading: () => fallback || <LoadingComponent />,
    ssr: true,
  });

  return function RouteLazyComponent(props: P) {
    const router = useRouter();
    const prefetchedRef = useRef(new Set<string>());

    useEffect(() => {
      // Prefetch related routes after component loads
      const timer = setTimeout(() => {
        prefetchRoutes.forEach((route) => {
          if (!prefetchedRef.current.has(route)) {
            router.prefetch(route);
            prefetchedRef.current.add(route);
          }
        });
      }, prefetchDelay);

      return () => clearTimeout(timer);
    }, [router]);

    return <LazyComponent {...props} />;
  };
}

// Progressive loading based on viewport visibility
export function withProgressiveLoad<P extends object>(
  stages: Array<{
    importFn: () => Promise<{ default: ComponentType<any> }>;
    threshold?: number; // Viewport intersection threshold
    delay?: number;
  }>,
  fallback?: ReactNode
) {
  return function ProgressiveComponent(props: P) {
    const [loadedStages, setLoadedStages] = useState<ComponentType<any>[]>([]);
    const [currentStage, setCurrentStage] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && currentStage < stages.length) {
              const stage = stages[currentStage];

              const loadStage = async () => {
                try {
                  const delay = stage.delay || 0;
                  if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                  }

                  const module = await stage.importFn();
                  setLoadedStages((prev) => [...prev, module.default]);
                  setCurrentStage((prev) => prev + 1);
                } catch (error) {

                }
              };

              loadStage();
            }
          });
        },
        { threshold: stages[currentStage]?.threshold || 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [currentStage, stages]);

    return (
      <div ref={containerRef}>
        {loadedStages.map((Component, index) => (
          <Component key={index} {...props} />
        ))}
        {loadedStages.length === 0 && (fallback || <LoadingComponent />)}
      </div>
    );
  };
}

// Preloading strategies
export const preloadOnHover = (importFn: () => Promise<any>) => {
  let preloadPromise: Promise<any> | null = null;

  return {
    onMouseEnter: () => {
      if (!preloadPromise) {
        preloadPromise = importFn();
      }
    },
    onFocus: () => {
      if (!preloadPromise) {
        preloadPromise = importFn();
      }
    },
  };
};

export const preloadOnIdle = (importFn: () => Promise<any>, timeout = 5000) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preload = () => {
      if (isMemoryAvailable()) {
        importFn().catch(console.error);
      }
    };

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(preload, { timeout });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(preload, timeout);
      return () => clearTimeout(timer);
    }
  }, [importFn, timeout]);
};

export const preloadCriticalPath = (routes: Array<{ path: string; importFn: () => Promise<any> }>) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadTimer = setTimeout(() => {
      routes.forEach(({ importFn }) => {
        if (isMemoryAvailable()) {
          importFn().catch(console.error);
        }
      });
    }, 2000); // Preload after 2 seconds

    return () => clearTimeout(preloadTimer);
  }, [routes]);
};

// Memory-aware component loader
export const createMemoryAwareLoader = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  memoryThreshold = 100 * 1024 * 1024 // 100MB
) => {
  return function MemoryAwareComponent(props: P) {
    const [Component, setComponent] = useState<ComponentType<P> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadComponent = async () => {
        try {
          if (!isMemoryAvailable(memoryThreshold)) {
            setError("Insufficient memory to load component");
            setLoading(false);
            return;
          }

          const module = await importFn();
          setComponent(() => module.default);
          setLoading(false);
        } catch (err) {
          setError("Failed to load component");
          setLoading(false);
        }
      };

      loadComponent();
    }, []);

    if (loading) return <LoadingComponent />;
    if (error) return <div className="spacing-3 text-[var(--fl-color-danger)]">{error}</div>;
    if (!Component) return null;

    return <Component {...props} />;
  };
};
