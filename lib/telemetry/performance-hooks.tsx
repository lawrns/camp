"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Performance metrics interface
interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tti: number;
}

interface ComponentMetrics {
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

// Core Web Vitals hook
export const useWebVitals = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    // Time to First Byte (TTFB)
    const navigationTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      setMetrics((prev) => ({ ...prev, ttfb }));
    }

    // First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
    if (fcpEntry) {
      setMetrics((prev) => ({ ...prev, fcp: fcpEntry.startTime }));
    }

    // Use PerformanceObserver for modern metrics
    if ("PerformanceObserver" in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        if (lastEntry) {
          setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (error) {}

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            setMetrics((prev) => ({ ...prev, fid }));
          }
        });
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (error) {}

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics((prev) => ({ ...prev, cls: clsValue }));
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (error) {}

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
    return undefined;
  }, []);

  return metrics;
};

// Component render performance hook
export const useRenderPerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    mountTime: 0,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  const mountTimeRef = useRef<number>(0);
  const renderTimesRef = useRef<number[]>([]);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    // Record mount time
    mountTimeRef.current = performance.now();
    setMetrics((prev) => ({ ...prev, mountTime: mountTimeRef.current }));
  }, []);

  useEffect(() => {
    // Record render time
    const renderTime = performance.now() - renderStartRef.current;
    if (renderStartRef.current > 0) {
      renderTimesRef.current.push(renderTime);

      const average = renderTimesRef.current.reduce((a: any, b: any) => a + b, 0) / renderTimesRef.current.length;

      setMetrics((prev) => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime,
        averageRenderTime: average,
      }));

      // Log slow renders
      if (renderTime > 16) {
        // Slower than 60fps
      }
    }

    renderStartRef.current = performance.now();
  });

  return metrics;
};

// Memory usage monitoring hook
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Network monitoring hook
export const useNetworkMonitoring = () => {
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      }
    };

    updateNetworkInfo();

    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", updateNetworkInfo);

      return () => {
        connection.removeEventListener("change", updateNetworkInfo);
      };
    }
    return undefined;
  }, []);

  return networkInfo;
};

// Resource timing hook
export const useResourceTiming = () => {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const updateResources = () => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      setResources(entries);
    };

    updateResources();

    // Update every 10 seconds
    const interval = setInterval(updateResources, 10000);

    return () => clearInterval(interval);
  }, []);

  const getResourcesByType = useCallback(
    (type: string) => {
      return resources.filter((resource: any) => {
        const url = new URL(resource.name);
        const extension = url.pathname.split(".").pop();

        switch (type) {
          case "script":
            return extension === "js" || resource.initiatorType === "script";
          case "style":
            return extension === "css" || resource.initiatorType === "css";
          case "image":
            return ["png", "jpg", "jpeg", "webp", "svg"].includes(extension || "");
          case "font":
            return ["woff", "woff2", "ttf", "otf"].includes(extension || "");
          default:
            return false;
        }
      });
    },
    [resources]
  );

  const getTotalSize = useCallback(
    (type?: string) => {
      const targetResources = type ? getResourcesByType(type) : resources;
      return targetResources.reduce((total: any, resource: any) => {
        return total + (resource.transferSize || resource.encodedBodySize || 0);
      }, 0);
    },
    [resources, getResourcesByType]
  );

  return {
    resources,
    getResourcesByType,
    getTotalSize,
    totalResources: resources.length,
  };
};

// Performance budget monitoring
export const usePerformanceBudget = (budgets: {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  totalSize?: number;
}) => {
  const webVitals = useWebVitals();
  const { getTotalSize } = useResourceTiming();
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    const newViolations: string[] = [];

    if (budgets.fcp && webVitals.fcp && webVitals.fcp > budgets.fcp) {
      newViolations.push(`FCP ${webVitals.fcp.toFixed(0)}ms exceeds budget ${budgets.fcp}ms`);
    }

    if (budgets.lcp && webVitals.lcp && webVitals.lcp > budgets.lcp) {
      newViolations.push(`LCP ${webVitals.lcp.toFixed(0)}ms exceeds budget ${budgets.lcp}ms`);
    }

    if (budgets.fid && webVitals.fid && webVitals.fid > budgets.fid) {
      newViolations.push(`FID ${webVitals.fid.toFixed(0)}ms exceeds budget ${budgets.fid}ms`);
    }

    if (budgets.cls && webVitals.cls && webVitals.cls > budgets.cls) {
      newViolations.push(`CLS ${webVitals.cls.toFixed(3)} exceeds budget ${budgets.cls}`);
    }

    if (budgets.totalSize) {
      const totalSize = getTotalSize();
      if (totalSize > budgets.totalSize) {
        newViolations.push(
          `Total size ${(totalSize / 1024).toFixed(1)}KB exceeds budget ${(budgets.totalSize / 1024).toFixed(1)}KB`
        );
      }
    }

    setViolations(newViolations);

    // Log violations
    newViolations.forEach((violation: any) => {});
  }, [webVitals, budgets, getTotalSize]);

  return {
    violations,
    hasBudgetViolations: violations.length > 0,
    webVitals,
  };
};

// Performance monitoring context
export const usePerformanceMonitoring = (config?: {
  componentName?: string;
  enableWebVitals?: boolean;
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  budget?: any;
}) => {
  const webVitals = config?.enableWebVitals !== false ? useWebVitals() : null;
  const renderMetrics = config?.componentName ? useRenderPerformance(config.componentName) : null;
  const memoryInfo = config?.enableMemoryMonitoring ? useMemoryMonitoring() : null;
  const networkInfo = config?.enableNetworkMonitoring ? useNetworkMonitoring() : null;
  const budgetResults = config?.budget ? usePerformanceBudget(config.budget) : null;

  return {
    webVitals,
    renderMetrics,
    memoryInfo,
    networkInfo,
    budgetResults,
  };
};
