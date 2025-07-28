/**
 * Comprehensive Memory Leak Prevention - Phase 9
 *
 * Advanced memory management system for long-running AI sessions
 * Prevents crashes and ensures sustained performance for global scale
 */

import { useCallback, useEffect, useRef } from "react";

// Global memory management state
interface MemoryState {
  intervals: Set<NodeJS.Timeout>;
  timeouts: Set<NodeJS.Timeout>;
  eventListeners: Map<EventTarget, Map<string, EventListener>>;
  webSockets: Set<WebSocket>;
  observers: Set<IntersectionObserver | MutationObserver | ResizeObserver>;
  abortControllers: Set<AbortController>;
}

class GlobalMemoryManager {
  private static instance: GlobalMemoryManager;
  private state: MemoryState;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 512 * 1024 * 1024; // 512MB threshold

  private constructor() {
    this.state = {
      intervals: new Set(),
      timeouts: new Set(),
      eventListeners: new Map(),
      webSockets: new Set(),
      observers: new Set(),
      abortControllers: new Set(),
    };

    this.startMemoryMonitoring();
    this.setupGlobalCleanup();
  }

  static getInstance(): GlobalMemoryManager {
    if (!GlobalMemoryManager.instance) {
      GlobalMemoryManager.instance = new GlobalMemoryManager();
    }
    return GlobalMemoryManager.instance;
  }

  // Safe timer management
  safeSetInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.state.intervals.add(interval);
    return interval;
  }

  safeSetTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(() => {
      callback();
      this.state.timeouts.delete(timeout);
    }, delay);
    this.state.timeouts.add(timeout);
    return timeout;
  }

  safeClearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.state.intervals.delete(interval);
  }

  safeClearTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout);
    this.state.timeouts.delete(timeout);
  }

  // Safe event listener management
  safeAddEventListener(
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(event, listener, options);

    if (!this.state.eventListeners.has(target)) {
      this.state.eventListeners.set(target, new Map());
    }
    this.state.eventListeners.get(target)!.set(event, listener);
  }

  safeRemoveEventListener(target: EventTarget, event: string): void {
    const listeners = this.state.eventListeners.get(target);
    if (listeners) {
      const listener = listeners.get(event);
      if (listener) {
        target.removeEventListener(event, listener);
        listeners.delete(event);

        if (listeners.size === 0) {
          this.state.eventListeners.delete(target);
        }
      }
    }
  }

  // Safe WebSocket management
  safeWebSocket(url: string, protocols?: string | string[]): WebSocket {
    const ws = new WebSocket(url, protocols);
    this.state.webSockets.add(ws);

    // Auto-cleanup on close
    ws.addEventListener("close", () => {
      this.state.webSockets.delete(ws);
    });

    return ws;
  }

  safeCloseWebSocket(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
    this.state.webSockets.delete(ws);
  }

  // Safe observer management
  safeIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.state.observers.add(observer);
    return observer;
  }

  safeMutationObserver(callback: MutationCallback): MutationObserver {
    const observer = new MutationObserver(callback);
    this.state.observers.add(observer);
    return observer;
  }

  safeResizeObserver(callback: ResizeObserverCallback): ResizeObserver {
    const observer = new ResizeObserver(callback);
    this.state.observers.add(observer);
    return observer;
  }

  safeDisconnectObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    observer.disconnect();
    this.state.observers.delete(observer);
  }

  // Safe AbortController management
  safeAbortController(): AbortController {
    const controller = new AbortController();
    this.state.abortControllers.add(controller);

    // Auto-cleanup on abort
    controller.signal.addEventListener("abort", () => {
      this.state.abortControllers.delete(controller);
    });

    return controller;
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    if (typeof window === "undefined") return;

    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.performPeriodicCleanup();
    }, 30000); // Check every 30 seconds
  }

  private checkMemoryUsage(): void {
    if (typeof window === "undefined" || !("performance" in window)) return;

    // @ts-ignore - performance.memory is available in Chrome
    const memory = window.performance.memory;
    if (memory && memory.usedJSHeapSize > this.memoryThreshold) {

      this.forceCleanup();
    }
  }

  private performPeriodicCleanup(): void {
    // Clean up closed WebSockets
    this.state.webSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.CLOSED) {
        this.state.webSockets.delete(ws);
      }
    });

    // Clean up aborted controllers
    this.state.abortControllers.forEach((controller) => {
      if (controller.signal.aborted) {
        this.state.abortControllers.delete(controller);
      }
    });
  }

  private setupGlobalCleanup(): void {
    if (typeof window === "undefined") return;

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      this.forceCleanup();
    });

    // Cleanup on visibility change (tab switch)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.performPeriodicCleanup();
      }
    });
  }

  // Force cleanup all resources
  forceCleanup(): void {

    // Clear all intervals
    this.state.intervals.forEach((interval) => clearInterval(interval));
    this.state.intervals.clear();

    // Clear all timeouts
    this.state.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.state.timeouts.clear();

    // Remove all event listeners
    this.state.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        target.removeEventListener(event, listener);
      });
    });
    this.state.eventListeners.clear();

    // Close all WebSockets
    this.state.webSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    });
    this.state.webSockets.clear();

    // Disconnect all observers
    this.state.observers.forEach((observer) => observer.disconnect());
    this.state.observers.clear();

    // Abort all controllers
    this.state.abortControllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.state.abortControllers.clear();

    // Clear monitoring interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

  }

  // Get resource statistics
  getResourceStats() {
    return {
      intervals: this.state.intervals.size,
      timeouts: this.state.timeouts.size,
      eventListeners: Array.from(this.state.eventListeners.values()).reduce(
        (total, listeners) => total + listeners.size,
        0
      ),
      webSockets: this.state.webSockets.size,
      observers: this.state.observers.size,
      abortControllers: this.state.abortControllers.size,
    };
  }
}

// React hooks for memory management
export function useMemoryManager() {
  const manager = GlobalMemoryManager.getInstance();

  return {
    safeSetInterval: manager.safeSetInterval.bind(manager),
    safeSetTimeout: manager.safeSetTimeout.bind(manager),
    safeClearInterval: manager.safeClearInterval.bind(manager),
    safeClearTimeout: manager.safeClearTimeout.bind(manager),
    safeAddEventListener: manager.safeAddEventListener.bind(manager),
    safeRemoveEventListener: manager.safeRemoveEventListener.bind(manager),
    safeWebSocket: manager.safeWebSocket.bind(manager),
    safeCloseWebSocket: manager.safeCloseWebSocket.bind(manager),
    safeIntersectionObserver: manager.safeIntersectionObserver.bind(manager),
    safeMutationObserver: manager.safeMutationObserver.bind(manager),
    safeResizeObserver: manager.safeResizeObserver.bind(manager),
    safeDisconnectObserver: manager.safeDisconnectObserver.bind(manager),
    safeAbortController: manager.safeAbortController.bind(manager),
    forceCleanup: manager.forceCleanup.bind(manager),
    getResourceStats: manager.getResourceStats.bind(manager),
  };
}

// Hook for automatic component cleanup
export function useAutoMemoryCleanup(componentName: string) {
  const manager = useMemoryManager();
  const resourcesRef = useRef<{
    intervals: Set<NodeJS.Timeout>;
    timeouts: Set<NodeJS.Timeout>;
    listeners: Array<{ target: EventTarget; event: string }>;
    observers: Set<any>;
  }>({
    intervals: new Set(),
    timeouts: new Set(),
    listeners: [],
    observers: new Set(),
  });

  useEffect(() => {

    return () => {

      // Cleanup component-specific resources
      resourcesRef.current.intervals.forEach((interval) => manager.safeClearInterval(interval));
      resourcesRef.current.timeouts.forEach((timeout) => manager.safeClearTimeout(timeout));
      resourcesRef.current.listeners.forEach(({ target, event }) => manager.safeRemoveEventListener(target, event));
      resourcesRef.current.observers.forEach((observer) => manager.safeDisconnectObserver(observer));
    };
  }, [componentName, manager]);

  // Wrapped methods that track resources per component
  const wrappedManager = {
    ...manager,
    safeSetInterval: useCallback(
      (callback: () => void, delay: number) => {
        const interval = manager.safeSetInterval(callback, delay);
        resourcesRef.current.intervals.add(interval);
        return interval;
      },
      [manager]
    ),

    safeSetTimeout: useCallback(
      (callback: () => void, delay: number) => {
        const timeout = manager.safeSetTimeout(callback, delay);
        resourcesRef.current.timeouts.add(timeout);
        return timeout;
      },
      [manager]
    ),

    safeAddEventListener: useCallback(
      (target: EventTarget, event: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => {
        manager.safeAddEventListener(target, event, listener, options);
        resourcesRef.current.listeners.push({ target, event });
      },
      [manager]
    ),
  };

  return wrappedManager;
}

// Export singleton instance
export const memoryManager = GlobalMemoryManager.getInstance();
