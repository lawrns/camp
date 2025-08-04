/**
 * Performance Monitoring Store
 *
 * Tracks application performance metrics including render counts,
 * API response times, error counts, and memory usage.
 *
 * @module store/domains/performance
 */

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

/**
 * Performance metrics state interface
 */
export interface PerformanceMetrics {
  /** Number of component renders tracked */
  renderCount: number;

  /** Array of API response times in milliseconds (max 100 entries) */
  apiResponseTimes: number[];

  /** Total count of errors encountered */
  errorCount: number;

  /** Current memory usage in bytes (null if not available) */
  memoryUsage: number | null;
}

/**
 * Performance store state interface
 */
export interface PerformanceState {
  /** Performance metrics */
  metrics: PerformanceMetrics;

  /** Whether performance monitoring is enabled */
  isMonitoringEnabled: boolean;

  /** Last time metrics were reset */
  lastResetAt: string | null;
}

/**
 * Performance store actions interface
 */
export interface PerformanceActions {
  /**
   * Increment the render count by 1
   * Used to track component re-renders for performance optimization
   */
  incrementRenderCount: () => void;

  /**
   * Add an API response time measurement
   * Automatically maintains a rolling window of the last 100 measurements
   *
   * @param time - Response time in milliseconds
   */
  addApiResponseTime: (time: number) => void;

  /**
   * Increment the error count by 1
   * Used to track application errors for monitoring
   */
  incrementErrorCount: () => void;

  /**
   * Set the current memory usage
   *
   * @param usage - Memory usage in bytes, or null if unavailable
   */
  setMemoryUsage: (usage: number | null) => void;

  /**
   * Toggle performance monitoring on/off
   */
  toggleMonitoring: () => void;

  /**
   * Enable performance monitoring
   */
  enableMonitoring: () => void;

  /**
   * Disable performance monitoring
   */
  disableMonitoring: () => void;

  /**
   * Reset all performance metrics to initial values
   */
  resetMetrics: () => void;

  /**
   * Get average API response time from stored measurements
   *
   * @returns Average response time in milliseconds, or 0 if no measurements
   */
  getAverageApiResponseTime: () => number;

  /**
   * Get the 95th percentile API response time
   *
   * @returns 95th percentile response time in milliseconds, or 0 if no measurements
   */
  get95thPercentileResponseTime: () => number;

  /**
   * Get performance summary object
   *
   * @returns Object containing key performance metrics
   */
  getPerformanceSummary: () => {
    renderCount: number;
    errorCount: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    memoryUsageMB: number | null;
  };
}

/**
 * Combined performance store type
 */
export type PerformanceStore = PerformanceState & PerformanceActions;

/**
 * Initial state for performance store
 */
const initialState: PerformanceState = {
  metrics: {
    renderCount: 0,
    apiResponseTimes: [],
    errorCount: 0,
    memoryUsage: null,
  },
  isMonitoringEnabled: true,
  lastResetAt: null,
};

/**
 * Performance monitoring store
 *
 * @example
 * ```typescript
 * // Track a render
 * usePerformanceStore.getState().incrementRenderCount();
 *
 * // Track API response time
 * const startTime = Date.now();
 * const response = await fetch('/api/data');
 * const responseTime = Date.now() - startTime;
 * usePerformanceStore.getState().addApiResponseTime(responseTime);
 *
 * // Get performance summary
 * const summary = usePerformanceStore.getState().getPerformanceSummary();
 * console.log('Average API response time:', summary.avgResponseTime, 'ms');
 * ```
 */
export const usePerformanceStore = create<PerformanceStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          incrementRenderCount: () => {
            const state = get();
            if (!state.isMonitoringEnabled) return;

            set((draft) => {
              draft.metrics.renderCount++;
            });
          },

          addApiResponseTime: (time) => {
            const state = get();
            if (!state.isMonitoringEnabled) return;

            set((draft) => {
              draft.metrics.apiResponseTimes.push(time);

              // Keep only last 100 measurements for memory efficiency
              if (draft.metrics.apiResponseTimes.length > 100) {
                draft.metrics.apiResponseTimes.shift();
              }
            });
          },

          incrementErrorCount: () => {
            const state = get();
            if (!state.isMonitoringEnabled) return;

            set((draft) => {
              draft.metrics.errorCount++;
            });
          },

          setMemoryUsage: (usage) => {
            const state = get();
            if (!state.isMonitoringEnabled) return;

            set((draft) => {
              draft.metrics.memoryUsage = usage;
            });
          },

          toggleMonitoring: () => {
            set((draft) => {
              draft.isMonitoringEnabled = !draft.isMonitoringEnabled;
            });
          },

          enableMonitoring: () => {
            set((draft) => {
              draft.isMonitoringEnabled = true;
            });
          },

          disableMonitoring: () => {
            set((draft) => {
              draft.isMonitoringEnabled = false;
            });
          },

          resetMetrics: () => {
            set((draft) => {
              draft.metrics = {
                renderCount: 0,
                apiResponseTimes: [],
                errorCount: 0,
                memoryUsage: null,
              };
              draft.lastResetAt = new Date().toISOString();
            });
          },

          getAverageApiResponseTime: () => {
            const state = get();
            const times = state.metrics.apiResponseTimes;

            if (times.length === 0) return 0;

            const sum = times.reduce((acc: unknown, time: unknown) => acc + time, 0);
            return Math.round(sum / times.length);
          },

          get95thPercentileResponseTime: () => {
            const state = get();
            const times = [...state.metrics.apiResponseTimes].sort((a, b) => a - b);

            if (times.length === 0) return 0;

            const index = Math.floor(times.length * 0.95);
            return times[index] || times[times.length - 1] || 0;
          },

          getPerformanceSummary: () => {
            const state = get();
            const avgResponseTime = get().getAverageApiResponseTime();
            const p95ResponseTime = get().get95thPercentileResponseTime();

            return {
              renderCount: state.metrics.renderCount,
              errorCount: state.metrics.errorCount,
              avgResponseTime,
              p95ResponseTime,
              memoryUsageMB: state.metrics.memoryUsage ? Math.round(state.metrics.memoryUsage / 1024 / 1024) : null,
            };
          },
        }))
      ),
      {
        name: "campfire-performance-store",
        partialize: (state) => ({
          isMonitoringEnabled: state.isMonitoringEnabled,
          lastResetAt: state.lastResetAt,
          // Don't persist metrics as they should be fresh per session
        }),
      }
    ),
    {
      name: "Performance Store",
    }
  )
);

/**
 * Selector hooks for performance metrics
 */

/**
 * Hook to get current render count
 */
export const useRenderCount = () => usePerformanceStore((state) => state.metrics.renderCount);

/**
 * Hook to get current error count
 */
export const useErrorCount = () => usePerformanceStore((state) => state.metrics.errorCount);

/**
 * Hook to get average API response time
 */
export const useAverageApiResponseTime = () => {
  const getAverage = usePerformanceStore((state) => state.getAverageApiResponseTime);
  return getAverage();
};

/**
 * Hook to get 95th percentile API response time
 */
export const use95thPercentileResponseTime = () => {
  const getP95 = usePerformanceStore((state) => state.get95thPercentileResponseTime);
  return getP95();
};

/**
 * Hook to get memory usage in MB
 */
export const useMemoryUsageMB = () =>
  usePerformanceStore((state) =>
    state.metrics.memoryUsage ? Math.round(state.metrics.memoryUsage / 1024 / 1024) : null
  );

/**
 * Hook to get performance summary
 */
export const usePerformanceSummary = () => {
  const getSummary = usePerformanceStore((state) => state.getPerformanceSummary);
  return getSummary();
};

/**
 * Hook to check if monitoring is enabled
 */
export const useIsMonitoringEnabled = () => usePerformanceStore((state) => state.isMonitoringEnabled);

/**
 * Utility function to measure and track API call performance
 *
 * @param apiCall - Async function to measure
 * @returns Result of the API call
 *
 * @example
 * ```typescript
 * const data = await measureApiCall(() => fetch('/api/users'));
 * ```
 */
export async function measureApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await apiCall();
    const responseTime = Date.now() - startTime;
    usePerformanceStore.getState().addApiResponseTime(responseTime);
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    usePerformanceStore.getState().addApiResponseTime(responseTime);
    usePerformanceStore.getState().incrementErrorCount();
    throw error;
  }
}

/**
 * React hook to track component render count
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   useTrackRender();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useTrackRender() {
  const incrementRenderCount = usePerformanceStore((state) => state.incrementRenderCount);

  // Track render on component mount and updates
  incrementRenderCount();
}

/**
 * Performance monitoring middleware for automatic API tracking
 *
 * @param fetcher - The fetch function to wrap
 * @returns Wrapped fetch function with automatic performance tracking
 *
 * @example
 * ```typescript
 * // Replace global fetch with monitored version
 * window.fetch = createMonitoredFetch(window.fetch);
 * ```
 */
export function createMonitoredFetch(fetcher: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const startTime = Date.now();

    try {
      const response = await fetcher(input, init);
      const responseTime = Date.now() - startTime;

      // Only track if monitoring is enabled
      if (usePerformanceStore.getState().isMonitoringEnabled) {
        usePerformanceStore.getState().addApiResponseTime(responseTime);

        // Track errors based on response status
        if (!response.ok) {
          usePerformanceStore.getState().incrementErrorCount();
        }
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (usePerformanceStore.getState().isMonitoringEnabled) {
        usePerformanceStore.getState().addApiResponseTime(responseTime);
        usePerformanceStore.getState().incrementErrorCount();
      }

      throw error;
    }
  };
}

/**
 * Browser memory monitoring utility
 * Automatically updates memory usage if available
 *
 * @param intervalMs - Update interval in milliseconds (default: 30000)
 * @returns Cleanup function to stop monitoring
 *
 * @example
 * ```typescript
 * // Start monitoring memory every 30 seconds
 * const stopMonitoring = startMemoryMonitoring();
 *
 * // Later, stop monitoring
 * stopMonitoring();
 * ```
 */
export function startMemoryMonitoring(intervalMs = 30000): () => void {
  // Check if performance.memory is available (Chrome only)
  if (!("memory" in performance)) {
    console.warn("Performance memory API not available in this browser");
    return () => {};
  }

  const updateMemory = () => {
    // Chrome-specific performance.memory API
    const performanceWithMemory = performance as typeof performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (performanceWithMemory.memory && performanceWithMemory.memory.usedJSHeapSize) {
      usePerformanceStore.getState().setMemoryUsage(performanceWithMemory.memory.usedJSHeapSize);
    }
  };

  // Initial update
  updateMemory();

  // Set up interval
  const intervalId = setInterval(updateMemory, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
