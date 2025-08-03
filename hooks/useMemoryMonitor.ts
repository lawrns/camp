/**
 * Memory Monitoring Hook
 *
 * Provides real-time memory usage monitoring and alerts
 * for React applications to prevent memory leaks
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentUsed: number;
  timestamp: number;
}

interface MemoryMonitorOptions {
  interval?: number; // ms
  warningThreshold?: number; // percentage
  criticalThreshold?: number; // percentage
  onWarning?: (info: MemoryInfo) => void;
  onCritical?: (info: MemoryInfo) => void;
  enabled?: boolean;
}

export const useMemoryMonitor = (options: MemoryMonitorOptions = {}) => {
  const {
    interval = 5000,
    warningThreshold = 70,
    criticalThreshold = 85,
    onWarning,
    onCritical,
    enabled = true,
  } = options;

  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastWarningRef = useRef<number>(0);
  const lastCriticalRef = useRef<number>(0);

  const checkMemory = useCallback(() => {
    if (typeof window === "undefined" || !("performance" in window)) {
      return;
    }

    // @ts-expect-error - performance.memory is Chrome-specific
    const memory = window.performance.memory;
    if (!memory) return;

    const info: MemoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      timestamp: Date.now(),
    };

    setMemoryInfo(info);

    // Check thresholds
    const now = Date.now();
    const ALERT_COOLDOWN = 30000; // 30 seconds

    if (info.percentUsed >= criticalThreshold) {
      setIsCritical(true);
      setIsWarning(true);

      if (now - lastCriticalRef.current > ALERT_COOLDOWN) {
        lastCriticalRef.current = now;
        onCritical?.(info);
      }
    } else if (info.percentUsed >= warningThreshold) {
      setIsCritical(false);
      setIsWarning(true);

      if (now - lastWarningRef.current > ALERT_COOLDOWN) {
        lastWarningRef.current = now;
        onWarning?.(info);
      }
    } else {
      setIsCritical(false);
      setIsWarning(false);
    }
  }, [warningThreshold, criticalThreshold, onWarning, onCritical]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkMemory();

    // Set up interval
    intervalRef.current = setInterval(checkMemory, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, checkMemory]);

  const formatBytes = useCallback((bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }, []);

  const getMemoryStats = useCallback(() => {
    if (!memoryInfo) return null;

    return {
      used: formatBytes(memoryInfo.usedJSHeapSize),
      total: formatBytes(memoryInfo.totalJSHeapSize),
      limit: formatBytes(memoryInfo.jsHeapSizeLimit),
      percentUsed: memoryInfo.percentUsed.toFixed(1) + "%",
      isWarning,
      isCritical,
    };
  }, [memoryInfo, isWarning, isCritical, formatBytes]);

  return {
    memoryInfo,
    memoryStats: getMemoryStats(),
    isWarning,
    isCritical,
    checkMemory,
  };
};

// Memory leak detector hook
export const useMemoryLeakDetector = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now());
  const initialMemoryRef = useRef<number>(0);

  useEffect(() => {
    // @ts-expect-error
    const memory = window.performance?.memory;
    if (memory) {
      initialMemoryRef.current = memory.usedJSHeapSize;
    }

    return () => {
      if (memory) {
        const currentMemory = memory.usedJSHeapSize;
        const memoryDiff = currentMemory - initialMemoryRef.current;
        const lifetime = Date.now() - mountTimeRef.current;

        // Log potential memory leak if memory increased significantly
        if (memoryDiff > 10 * 1024 * 1024) {
          // 10MB threshold
        }
      }
    };
  }, [componentName]);
};
