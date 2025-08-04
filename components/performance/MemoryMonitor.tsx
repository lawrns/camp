"use client";

import { Activity, AlertTriangle, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Types
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemorySnapshot {
  timestamp: number;
  memory: MemoryInfo;
  domNodes: number;
  eventListeners: number;
  components: number;
}

interface MemoryThresholds {
  growthWarning: number; // MB
  growthCritical: number; // MB
  totalWarning: number; // MB
  totalCritical: number; // MB
}

interface MemoryAlert {
  id: string;
  type: "warning" | "critical";
  message: string;
  timestamp: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Default thresholds
const DEFAULT_THRESHOLDS: MemoryThresholds = {
  growthWarning: 50, // 50MB growth
  growthCritical: 100, // 100MB growth
  totalWarning: 200, // 200MB total
  totalCritical: 400, // 400MB total
};

// Memory monitoring hook
export const useMemoryMonitor = (options?: {
  interval?: number;
  thresholds?: Partial<MemoryThresholds>;
  onAlert?: (alert: MemoryAlert) => void;
  enableLeakDetection?: boolean;
}) => {
  const { interval = 5000, thresholds = {}, onAlert, enableLeakDetection = true } = options || {};

  const [currentMemory, setCurrentMemory] = useState<MemoryInfo | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<MemorySnapshot[]>([]);
  const [alerts, setAlerts] = useState<MemoryAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const initialMemoryRef = useRef<number>(0);
  const componentCountRef = useRef<number>(0);
  const eventListenerCountRef = useRef<number>(0);

  const finalThresholds = useMemo(() => ({ ...DEFAULT_THRESHOLDS, ...thresholds }), [thresholds]);

  // Get current memory info
  const getMemoryInfo = useCallback((): MemoryInfo | null => {
    if ("memory" in performance && (performance as unknown).memory) {
      return (performance as unknown).memory;
    }
    return null;
  }, []);

  // Count DOM nodes
  const getDOMNodeCount = useCallback((): number => {
    return document.querySelectorAll("*").length;
  }, []);

  // Estimate event listener count (approximation)
  const getEventListenerCount = useCallback((): number => {
    // This is an approximation - in real scenarios you'd need to track listeners manually
    const elements = document.querySelectorAll("*");
    let count = 0;
    elements.forEach((el) => {
      // Count common event types
      const events = ["click", "mousedown", "mouseup", "keydown", "keyup", "scroll", "resize"];
      events.forEach((event) => {
        if ((el as unknown)[`on${event}`]) count++;
      });
    });
    return count;
  }, []);

  // Create memory snapshot
  const createSnapshot = useCallback((): MemorySnapshot | null => {
    const memory = getMemoryInfo();
    if (!memory) return null;

    return {
      timestamp: Date.now(),
      memory,
      domNodes: getDOMNodeCount(),
      eventListeners: getEventListenerCount(),
      components: componentCountRef.current,
    };
  }, [getMemoryInfo, getDOMNodeCount, getEventListenerCount]);

  // Check for memory issues
  const checkMemoryThresholds = useCallback(
    (snapshot: MemorySnapshot) => {
      const currentMB = snapshot.memory.usedJSHeapSize / 1024 / 1024;
      const growthMB = (snapshot.memory.usedJSHeapSize - initialMemoryRef.current) / 1024 / 1024;

      const newAlerts: MemoryAlert[] = [];

      // Check growth thresholds
      if (growthMB > finalThresholds.growthCritical) {
        newAlerts.push({
          id: `growth-critical-${Date.now()}`,
          type: "critical",
          message: `Memory usage has grown by ${growthMB.toFixed(1)}MB. This may indicate a memory leak.`,
          timestamp: Date.now(),
          actions: [
            {
              label: "Force Cleanup",
              action: () => forceCleanup(),
            },
            {
              label: "Refresh Page",
              action: () => window.location.reload(),
            },
          ],
        });
      } else if (growthMB > finalThresholds.growthWarning) {
        newAlerts.push({
          id: `growth-warning-${Date.now()}`,
          type: "warning",
          message: `Memory usage has grown by ${growthMB.toFixed(1)}MB. Consider refreshing if performance degrades.`,
          timestamp: Date.now(),
          actions: [
            {
              label: "Optimize",
              action: () => triggerGarbageCollection(),
            },
          ],
        });
      }

      // Check total memory thresholds
      if (currentMB > finalThresholds.totalCritical) {
        newAlerts.push({
          id: `total-critical-${Date.now()}`,
          type: "critical",
          message: `Total memory usage is ${currentMB.toFixed(1)}MB. Performance may be severely impacted.`,
          timestamp: Date.now(),
          actions: [
            {
              label: "Refresh Page",
              action: () => window.location.reload(),
            },
          ],
        });
      } else if (currentMB > finalThresholds.totalWarning) {
        newAlerts.push({
          id: `total-warning-${Date.now()}`,
          type: "warning",
          message: `Memory usage is ${currentMB.toFixed(1)}MB. Consider optimizing or refreshing.`,
          timestamp: Date.now(),
          actions: [
            {
              label: "Optimize",
              action: () => triggerGarbageCollection(),
            },
          ],
        });
      }

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts]);
        newAlerts.forEach((alert) => onAlert?.(alert));
      }
    },
    [finalThresholds, onAlert]
  );

  // Detect potential memory leaks
  const detectMemoryLeaks = useCallback(
    (history: MemorySnapshot[]) => {
      if (history.length < 5) return;

      const recent = history.slice(-5);
      const memoryGrowth = recent.map((snapshot, index) => {
        if (index === 0) return 0;
        return snapshot.memory.usedJSHeapSize - recent[index - 1].memory.usedJSHeapSize;
      });

      const avgGrowth = memoryGrowth.reduce((sum, growth) => sum + growth, 0) / memoryGrowth.length;
      const domGrowth = recent[recent.length - 1].domNodes - recent[0].domNodes;
      const listenerGrowth = recent[recent.length - 1].eventListeners - recent[0].eventListeners;

      // Detect consistent memory growth
      if (avgGrowth > 1024 * 1024) {
        // 1MB average growth
        const alert: MemoryAlert = {
          id: `leak-detection-${Date.now()}`,
          type: "warning",
          message: `Potential memory leak detected: consistent ${(avgGrowth / 1024 / 1024).toFixed(1)}MB growth per interval.`,
          timestamp: Date.now(),
          actions: [
            {
              label: "View Details",
              action: () => {
                // Action disabled in production
              },
            },
          ],
        };

        setAlerts((prev) => [...prev, alert]);
        onAlert?.(alert);
      }

      // Send to Sentry if available
      if (typeof window !== "undefined" && (window as unknown).Sentry) {
        (window as unknown).Sentry.addBreadcrumb({
          category: "memory",
          message: "Memory monitoring data",
          level: "info",
          data: {
            currentMemoryMB: recent[recent.length - 1].memory.usedJSHeapSize / 1024 / 1024,
            avgGrowthMB: avgGrowth / 1024 / 1024,
            domNodes: recent[recent.length - 1].domNodes,
            eventListeners: recent[recent.length - 1].eventListeners,
          },
        });
      }
    },
    [onAlert]
  );

  // Force garbage collection (if available)
  const triggerGarbageCollection = useCallback(() => {
    if ("gc" in window && typeof (window as unknown).gc === "function") {
      (window as unknown).gc();
    }

    // Manual cleanup strategies
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        // Force a minor cleanup
        const temp = new Array(1000).fill(0);
        temp.length = 0;
      });
    }
  }, []);

  // Force cleanup
  const forceCleanup = useCallback(() => {
    // Clear memory history except recent entries
    setMemoryHistory((prev) => prev.slice(-10));

    // Clear old alerts
    setAlerts((prev) => prev.filter((alert) => Date.now() - alert.timestamp < 300000)); // Keep last 5 minutes

    // Trigger garbage collection
    triggerGarbageCollection();

    // Dispatch cleanup event for other components
    window.dispatchEvent(new CustomEvent("memory-cleanup-requested"));
  }, [triggerGarbageCollection]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    const initialSnapshot = createSnapshot();
    if (!initialSnapshot) return;

    initialMemoryRef.current = initialSnapshot.memory.usedJSHeapSize;
    setCurrentMemory(initialSnapshot.memory);
    setMemoryHistory([initialSnapshot]);
    setIsMonitoring(true);

    intervalRef.current = setInterval(() => {
      const snapshot = createSnapshot();
      if (!snapshot) return;

      setCurrentMemory(snapshot.memory);
      setMemoryHistory((prev) => {
        const newHistory = [...prev, snapshot];

        // Keep only last 100 snapshots to prevent memory bloat
        const trimmedHistory = newHistory.slice(-100);

        // Check thresholds
        checkMemoryThresholds(snapshot);

        // Detect leaks if enabled
        if (enableLeakDetection) {
          detectMemoryLeaks(trimmedHistory);
        }

        return trimmedHistory;
      });
    }, interval);
  }, [isMonitoring, createSnapshot, interval, checkMemoryThresholds, enableLeakDetection, detectMemoryLeaks]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsMonitoring(false);
  }, []);

  // Component tracking
  const trackComponent = useCallback((increment: boolean = true) => {
    componentCountRef.current += increment ? 1 : -1;
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    currentMemory,
    memoryHistory,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    trackComponent,
    dismissAlert,
    clearAlerts,
    forceCleanup,
    triggerGarbageCollection,
  };
};

// Memory alert component
const MemoryAlert: React.FC<{
  alert: MemoryAlert;
  onDismiss: () => void;
}> = ({ alert, onDismiss }) => {
  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-md rounded-ds-lg border spacing-4 shadow-lg ${alert.type === "critical"
        ? "border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)] text-red-800"
        : "border-[var(--fl-color-warning-muted)] bg-[var(--fl-color-warning-subtle)] text-yellow-800"
        }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
          {alert.actions && (
            <div className="mt-2 flex gap-ds-2">
              {alert.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="hover:bg-background/75 rounded bg-background/50 px-2 py-1 text-tiny transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="hover:text-foreground text-gray-400 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Memory stats display component
const MemoryStats: React.FC<{
  memory: MemoryInfo;
  className?: string;
}> = ({ memory, className = "" }) => {
  const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
  const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
  const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
  const usagePercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);

  return (
    <div className={`space-y-1 text-xs ${className}`}>
      <div className="flex justify-between">
        <span>Used:</span>
        <span className="font-mono">{usedMB} MB</span>
      </div>
      <div className="flex justify-between">
        <span>Total:</span>
        <span className="font-mono">{totalMB} MB</span>
      </div>
      <div className="flex justify-between">
        <span>Limit:</span>
        <span className="font-mono">{limitMB} MB</span>
      </div>
      <div className="flex justify-between">
        <span>Usage:</span>
        <span className="font-mono">{usagePercent}%</span>
      </div>
    </div>
  );
};

// Development memory profiler
const MemoryProfiler: React.FC<{
  memoryHistory: MemorySnapshot[];
  onClear: () => void;
}> = ({ memoryHistory, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const latest = memoryHistory[memoryHistory.length - 1];
  const oldest = memoryHistory[0];
  const growth =
    latest && oldest ? ((latest.memory.usedJSHeapSize - oldest.memory.usedJSHeapSize) / 1024 / 1024).toFixed(1) : "0";

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-ds-lg bg-gray-900 text-white shadow-card-deep">
      <div className="flex cursor-pointer items-center gap-ds-2 spacing-3" onClick={() => setIsExpanded(!isExpanded)}>
        <Activity className="h-4 w-4" />
        <span className="text-sm font-medium">Memory Profiler</span>
        <span className="rounded bg-gray-700 px-2 py-1 text-tiny">
          {latest ? (latest.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) : "0"} MB
        </span>
      </div>

      {isExpanded && latest && (
        <div className="space-y-3 border-t border-gray-700 spacing-3">
          <MemoryStats memory={latest.memory} className="text-gray-300" />

          <div className="space-y-1 text-tiny text-gray-300">
            <div className="flex justify-between">
              <span>Growth:</span>
              <span className="font-mono">{growth} MB</span>
            </div>
            <div className="flex justify-between">
              <span>DOM Nodes:</span>
              <span className="font-mono">{latest.domNodes}</span>
            </div>
            <div className="flex justify-between">
              <span>Listeners:</span>
              <span className="font-mono">{latest.eventListeners}</span>
            </div>
            <div className="flex justify-between">
              <span>Components:</span>
              <span className="font-mono">{latest.components}</span>
            </div>
          </div>

          <div className="flex gap-ds-2">
            <button
              onClick={() => {
                // Action disabled in production
              }}
              className="rounded bg-gray-700 px-3 py-1 text-tiny text-gray-300 hover:bg-gray-600"
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main MemoryMonitor component
export const MemoryMonitor: React.FC<{
  children?: React.ReactNode;
  autoStart?: boolean;
  interval?: number;
  thresholds?: Partial<MemoryThresholds>;
  showProfiler?: boolean;
  enableLeakDetection?: boolean;
}> = ({
  children,
  autoStart = true,
  interval = 5000,
  thresholds,
  showProfiler = process.env.NODE_ENV === "development",
  enableLeakDetection = true,
}) => {
    const {
      currentMemory,
      memoryHistory,
      alerts,
      isMonitoring,
      startMonitoring,
      stopMonitoring,
      trackComponent,
      dismissAlert,
      clearAlerts,
      forceCleanup,
    } = useMemoryMonitor({
      interval,
      thresholds,
      enableLeakDetection,
    });

    // Auto-start monitoring
    useEffect(() => {
      if (autoStart && !isMonitoring) {
        startMonitoring();
      }
    }, [autoStart, isMonitoring, startMonitoring]);

    // Track this component
    useEffect(() => {
      trackComponent(true);
      return () => trackComponent(false);
    }, [trackComponent]);

    // Listen for cleanup requests
    useEffect(() => {
      const handleCleanupRequest = () => {
        forceCleanup();
      };

      window.addEventListener("memory-cleanup-requested", handleCleanupRequest);
      return () => {
        window.removeEventListener("memory-cleanup-requested", handleCleanupRequest);
      };
    }, [forceCleanup]);

    return (
      <>
        {children}

        {/* Render alerts */}
        {alerts.map((alert) => (
          <MemoryAlert key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
        ))}

        {/* Development profiler */}
        {showProfiler && <MemoryProfiler memoryHistory={memoryHistory} onClear={clearAlerts} />}
      </>
    );
  };

// Component wrapper for automatic memory tracking
export const withMemoryTracking = <P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const mountCountRef = useRef(0);

    useEffect(() => {
      mountCountRef.current++;

      // Track component mount
      window.dispatchEvent(
        new CustomEvent("component-mounted", {
          detail: { component: Component.name || "Anonymous", count: mountCountRef.current },
        })
      );

      return () => {
        // Track component unmount
        window.dispatchEvent(
          new CustomEvent("component-unmounted", {
            detail: { component: Component.name || "Anonymous", count: mountCountRef.current },
          })
        );
      };
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withMemoryTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default MemoryMonitor;
