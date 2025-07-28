// Performance optimization library exports
export * from "./tiered-cache";
export * from "./cached-data-fetchers";
export * from "./progressive-loading";
export * from "./lazy-component-loader";
export * from "./lazy-routes";
export * from "./optimized-components";
export * from "./performance-hooks";
export * from "./widget-optimization";

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds (based on Google recommendations)
  VITALS: {
    FCP_GOOD: 1800, // First Contentful Paint
    FCP_POOR: 3000,
    LCP_GOOD: 2500, // Largest Contentful Paint
    LCP_POOR: 4000,
    FID_GOOD: 100, // First Input Delay
    FID_POOR: 300,
    CLS_GOOD: 0.1, // Cumulative Layout Shift
    CLS_POOR: 0.25,
    TTI_GOOD: 3800, // Time to Interactive
    TTI_POOR: 7300,
  },

  // Resource budgets
  BUDGETS: {
    TOTAL_SIZE: 2 * 1024 * 1024, // 2MB total
    JS_SIZE: 600 * 1024, // 600KB JavaScript
    CSS_SIZE: 150 * 1024, // 150KB CSS
    IMAGE_SIZE: 1 * 1024 * 1024, // 1MB images
    FONT_SIZE: 100 * 1024, // 100KB fonts
  },

  // Cache settings
  CACHE: {
    MAX_MEMORY_ENTRIES: 1000,
    DEFAULT_TTL: 300, // 5 minutes
    PROFILE_TTL: 600, // 10 minutes
    CONVERSATION_TTL: 180, // 3 minutes
  },

  // Animation settings
  ANIMATION: {
    FAST_DURATION: 150,
    NORMAL_DURATION: 300,
    SLOW_DURATION: 500,
    EASING: "ease-out",
  },
} as const;

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window === "undefined") return;

  // Set up performance observers
  // Log performance budget violations
  const checkBudgets = () => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const totalSize = resources.reduce((total: any, resource: any) => {
      return total + (resource.transferSize || resource.encodedBodySize || 0);
    }, 0);

    if (totalSize > PERFORMANCE_CONFIG.BUDGETS.TOTAL_SIZE) {
    }
  };

  // Check budgets after initial load
  if (document.readyState === "complete") {
    setTimeout(checkBudgets, 1000);
  } else {
    window.addEventListener("load", () => {
      setTimeout(checkBudgets, 1000);
    });
  }
};

// Export performance utilities
export const performanceUtils = {
  // Measure execution time
  measure: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    return result;
  },

  // Measure async execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    return result;
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Initialize on import (for browser environments)
if (typeof window !== "undefined") {
  initPerformanceMonitoring();
}
