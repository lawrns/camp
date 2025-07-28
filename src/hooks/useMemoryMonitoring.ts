import { useEffect, useRef } from "react";
import { useCampfireStore } from "@/store";

export function useMemoryMonitoring(interval = 30000) {
  // Check every 30 seconds
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Note: setMemoryUsage not available in current store implementation

  useEffect(() => {
    const checkMemory = () => {
      if (typeof window !== "undefined" && "performance" in window) {
        // @ts-ignore - memory API might not be available in all browsers
        const memory = window.performance.memory;
        if (memory) {
          // setMemoryUsage not implemented in store
          // setMemoryUsage(memory.usedJSHeapSize);

          // Log warning if memory usage is high
          const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

          if (usedMB > limitMB * 0.9) {
          }
        }
      }
    };

    // Initial check
    checkMemory();

    // Set up interval
    intervalRef.current = setInterval(checkMemory, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval]);

  return {
    checkMemoryNow: () => {
      if (typeof window !== "undefined" && "performance" in window) {
        // @ts-ignore
        const memory = window.performance.memory;
        if (memory) {
          return {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
            percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
          };
        }
      }
      return null;
    },
  };
}
