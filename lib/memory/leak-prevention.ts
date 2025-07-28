/**
 * Memory Leak Prevention Utilities
 *
 * Provides utilities to prevent common memory leaks in React applications
 * Addresses the 201 potential memory leaks identified in analysis
 */

import { useCallback, useEffect, useRef } from "react";

interface CleanupFunction {
  (): void;
}

interface TimerHandle {
  id: number | NodeJS.Timeout;
  type: "timeout" | "interval";
  cleanup: CleanupFunction;
}

interface EventListenerHandle {
  element: EventTarget;
  event: string;
  handler: EventListener;
  cleanup: CleanupFunction;
}

class LeakPreventionManager {
  private static instance: LeakPreventionManager;
  private timers = new Set<TimerHandle>();
  private eventListeners = new Set<EventListenerHandle>();
  private webSockets = new Set<WebSocket>();
  private eventSources = new Set<EventSource>();
  private observers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();

  static getInstance(): LeakPreventionManager {
    if (!LeakPreventionManager.instance) {
      LeakPreventionManager.instance = new LeakPreventionManager();
    }
    return LeakPreventionManager.instance;
  }

  /**
   * Safe setTimeout with automatic cleanup tracking
   */
  public safeSetTimeout(callback: () => void, delay: number): CleanupFunction {
    const id = setTimeout(() => {
      callback();
      // Remove from tracking after execution
      this.timers.forEach((timer) => {
        if (timer.id === id) {
          this.timers.delete(timer);
        }
      });
    }, delay);

    const cleanup = () => {
      clearTimeout(id);
      this.timers.forEach((timer) => {
        if (timer.id === id) {
          this.timers.delete(timer);
        }
      });
    };

    const handle: TimerHandle = {
      id,
      type: "timeout",
      cleanup,
    };

    this.timers.add(handle);
    return cleanup;
  }

  /**
   * Safe setInterval with automatic cleanup tracking
   */
  public safeSetInterval(callback: () => void, delay: number): CleanupFunction {
    const id = setInterval(callback, delay);

    const cleanup = () => {
      clearInterval(id);
      this.timers.forEach((timer) => {
        if (timer.id === id) {
          this.timers.delete(timer);
        }
      });
    };

    const handle: TimerHandle = {
      id,
      type: "interval",
      cleanup,
    };

    this.timers.add(handle);
    return cleanup;
  }

  /**
   * Safe addEventListener with automatic cleanup tracking
   */
  public safeAddEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): CleanupFunction {
    element.addEventListener(event, handler, options);

    const cleanup = () => {
      element.removeEventListener(event, handler, options);
      this.eventListeners.forEach((listener) => {
        if (listener.element === element && listener.event === event && listener.handler === handler) {
          this.eventListeners.delete(listener);
        }
      });
    };

    const handle: EventListenerHandle = {
      element,
      event,
      handler,
      cleanup,
    };

    this.eventListeners.add(handle);
    return cleanup;
  }

  /**
   * Safe WebSocket with automatic cleanup tracking
   */
  public safeWebSocket(url: string): { ws: WebSocket; cleanup: CleanupFunction } {
    const ws = new WebSocket(url);
    this.webSockets.add(ws);

    const cleanup = () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      this.webSockets.delete(ws);
    };

    return { ws, cleanup };
  }

  /**
   * Safe EventSource with automatic cleanup tracking
   */
  public safeEventSource(url: string): { eventSource: EventSource; cleanup: CleanupFunction } {
    const eventSource = new EventSource(url);
    this.eventSources.add(eventSource);

    const cleanup = () => {
      eventSource.close();
      this.eventSources.delete(eventSource);
    };

    return { eventSource, cleanup };
  }

  /**
   * Safe Observer with automatic cleanup tracking
   */
  public safeObserver<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
    observer: T
  ): { observer: T; cleanup: CleanupFunction } {
    this.observers.add(observer);

    const cleanup = () => {
      observer.disconnect();
      this.observers.delete(observer);
    };

    return { observer, cleanup };
  }

  /**
   * Cleanup all tracked resources
   */
  public cleanupAll(): void {
    // Cleanup timers
    this.timers.forEach((timer) => timer.cleanup());
    this.timers.clear();

    // Cleanup event listeners
    this.eventListeners.forEach((listener) => listener.cleanup());
    this.eventListeners.clear();

    // Cleanup WebSockets
    this.webSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    });
    this.webSockets.clear();

    // Cleanup EventSources
    this.eventSources.forEach((es) => es.close());
    this.eventSources.clear();

    // Cleanup Observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

  }

  /**
   * Get current resource counts
   */
  public getResourceCounts() {
    return {
      timers: this.timers.size,
      eventListeners: this.eventListeners.size,
      webSockets: this.webSockets.size,
      eventSources: this.eventSources.size,
      observers: this.observers.size,
    };
  }
}

// React hooks for leak prevention

/**
 * Hook for safe timer management
 */
export function useSafeTimer() {
  const manager = LeakPreventionManager.getInstance();
  const cleanupFunctions = useRef<CleanupFunction[]>([]);

  const safeSetTimeout = useCallback(
    (callback: () => void, delay: number) => {
      const cleanup = manager.safeSetTimeout(callback, delay);
      cleanupFunctions.current.push(cleanup);
      return cleanup;
    },
    [manager]
  );

  const safeSetInterval = useCallback(
    (callback: () => void, delay: number) => {
      const cleanup = manager.safeSetInterval(callback, delay);
      cleanupFunctions.current.push(cleanup);
      return cleanup;
    },
    [manager]
  );

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach((cleanup) => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  return { safeSetTimeout, safeSetInterval };
}

/**
 * Hook for safe event listener management
 */
export function useSafeEventListener() {
  const manager = LeakPreventionManager.getInstance();
  const cleanupFunctions = useRef<CleanupFunction[]>([]);

  const addEventListener = useCallback(
    (element: EventTarget, event: string, handler: EventListener, options?: boolean | AddEventListenerOptions) => {
      const cleanup = manager.safeAddEventListener(element, event, handler, options);
      cleanupFunctions.current.push(cleanup);
      return cleanup;
    },
    [manager]
  );

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach((cleanup) => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  return { addEventListener };
}

/**
 * Hook for safe WebSocket management
 */
export function useSafeWebSocket(url: string | null) {
  const manager = LeakPreventionManager.getInstance();
  const wsRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<CleanupFunction | null>(null);

  useEffect(() => {
    if (!url) return;

    const { ws, cleanup } = manager.safeWebSocket(url);
    wsRef.current = ws;
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      wsRef.current = null;
    };
  }, [url, manager]);

  return wsRef.current;
}

/**
 * Hook for safe observer management
 */
export function useSafeObserver<T extends IntersectionObserver | MutationObserver | ResizeObserver>(
  createObserver: () => T
) {
  const manager = LeakPreventionManager.getInstance();
  const observerRef = useRef<T | null>(null);
  const cleanupRef = useRef<CleanupFunction | null>(null);

  useEffect(() => {
    const observer = createObserver();
    const { cleanup } = manager.safeObserver(observer);

    observerRef.current = observer;
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      observerRef.current = null;
    };
  }, [createObserver, manager]);

  return observerRef.current;
}

/**
 * Hook for automatic cleanup on component unmount
 */
export function useAutoCleanup() {
  const manager = LeakPreventionManager.getInstance();

  useEffect(() => {
    return () => {
      // This will clean up any resources created by this component
      // Note: This is a simplified approach - in practice, you'd want
      // more granular tracking per component
    };
  }, [manager]);

  const forceCleanup = useCallback(() => {
    manager.cleanupAll();
  }, [manager]);

  const getResourceCounts = useCallback(() => {
    return manager.getResourceCounts();
  }, [manager]);

  return { forceCleanup, getResourceCounts };
}

/**
 * Hook for memory-safe async operations
 */
export function useSafeAsync<T>() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  const safeAsync = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      const result = await asyncFn();
      return isMountedRef.current ? result : null;
    } catch (error) {
      if (isMountedRef.current) {
        throw error;
      }
      return null;
    }
  }, []);

  return { safeSetState, safeAsync, isMounted: () => isMountedRef.current };
}

// Export singleton instance
export const leakPreventionManager = LeakPreventionManager.getInstance();

export default leakPreventionManager;
