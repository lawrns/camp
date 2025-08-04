/**
 * Performance Optimization Utilities
 * Provides constants and utilities for performance optimization
 */

export const OPTIMIZATION_CONSTANTS = {
  // Query optimization
  DEBOUNCE_DELAY: 300,
  CACHE_TIME: {
    SHORT: 1 * 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 15 * 60 * 1000, // 15 minutes
  },
  STALE_TIME: 1 * 60 * 1000, // 1 minute

  // Virtualization
  VIRTUAL_ITEM_SIZE: 50,
  VIRTUAL_OVERSCAN: 10,

  // Throttling
  THROTTLE_DELAY: 100,
  SCROLL_THROTTLE: 16, // 60fps

  // Chunking
  CHUNK_SIZE: 100,
  BATCH_SIZE: 50,

  // Memory limits
  MAX_CACHE_SIZE: 100,
  MAX_HISTORY_SIZE: 1000,
} as const;

export interface OptimizationConfig {
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableThrottling: boolean;
  enableDebouncing: boolean;
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableVirtualization: true,
  enableLazyLoading: true,
  enableCaching: true,
  enableThrottling: true,
  enableDebouncing: true,
};

/**
 * Debounce utility for search and input operations
 */
export function debounce<T extends (...args: unknown[]) => any>(
  func: T,
  delay: number = OPTIMIZATION_CONSTANTS.DEBOUNCE_DELAY
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle utility for frequent operations
 */
export function throttle<T extends (...args: unknown[]) => any>(
  func: T,
  delay: number = OPTIMIZATION_CONSTANTS.THROTTLE_DELAY
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Chunk array into smaller pieces for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number = OPTIMIZATION_CONSTANTS.CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Simple LRU cache implementation
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = OPTIMIZATION_CONSTANTS.MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Request animation frame wrapper for smooth animations
 */
export function requestAnimationFramePromise(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

/**
 * Intersection Observer utility for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Performance measurement utilities
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if ("memory" in performance) {
    return {
      used: (performance as unknown).memory.usedJSHeapSize,
      total: (performance as unknown).memory.totalJSHeapSize,
    };
  }
  return null;
}

/**
 * Optimize React component re-renders
 */
export function shallowEqual(obj1: unknown, obj2: unknown): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

export default {
  OPTIMIZATION_CONSTANTS,
  DEFAULT_OPTIMIZATION_CONFIG,
  debounce,
  throttle,
  chunkArray,
  LRUCache,
  requestAnimationFramePromise,
  createIntersectionObserver,
  PerformanceMonitor,
  getMemoryUsage,
  shallowEqual,
  batchDOMUpdates,
};
