'use client';

import { unstable_cache } from 'next/cache';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Types for cache configuration and monitoring
interface CacheConfig {
  defaultTTL: number;
  maxMemoryUsage: number;
  enableOffline: boolean;
  enablePrefetch: boolean;
  enableWarming: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  memoryUsage: number;
  lastCleanup: number;
  prefetchCount: number;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface NavigationPattern {
  route: string;
  frequency: number;
  lastVisited: number;
  prefetchPriority: number;
}

interface CacheContextType {
  // Core caching methods
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  invalidate: (key: string | string[]) => Promise<void>;
  clear: () => Promise<void>;

  // Prefetching and warming
  prefetch: (key: string, fetcher: () => Promise<any>) => Promise<void>;
  warmCache: (keys: string[]) => Promise<void>;

  // Metrics and monitoring
  getMetrics: () => CacheMetrics;
  getMemoryUsage: () => number;

  // Configuration
  updateConfig: (config: Partial<CacheConfig>) => void;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  enableOffline: true,
  enablePrefetch: true,
  enableWarming: true,
};

// Create context
const NextCacheContext = createContext<CacheContextType | null>(null);

// Memory-aware cache storage
class MemoryAwareCache {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    memoryUsage: 0,
    lastCleanup: Date.now(),
    prefetchCount: 0,
  };
  private config: CacheConfig;
  private navigationPatterns = new Map<string, NavigationPattern>();

  constructor(config: CacheConfig) {
    this.config = config;
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.updateMemoryUsage();
      if (this.metrics.memoryUsage > this.config.maxMemoryUsage) {
        this.performMemoryCleanup();
      }
    }, 30000);
  }

  private updateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.metrics.memoryUsage = totalSize;
  }

  private performMemoryCleanup() {
    const entries = Array.from(this.cache.entries());

    // Sort by access frequency and age
    entries.sort(([, a], [, b]) => {
      const aScore = a.accessCount / (Date.now() - a.lastAccessed);
      const bScore = b.accessCount / (Date.now() - b.lastAccessed);
      return aScore - bScore;
    });

    // Remove least used entries until under memory limit
    let removedSize = 0;
    const targetReduction = this.metrics.memoryUsage * 0.3; // Remove 30%

    for (const [key, entry] of entries) {
      if (removedSize >= targetReduction) break;

      this.cache.delete(key);
      removedSize += entry.size;
    }

    this.metrics.lastCleanup = Date.now();
    this.updateMemoryUsage();
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update access patterns
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.hits++;

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.updateMemoryUsage();

    // Store in IndexedDB for offline access if enabled
    if (this.config.enableOffline) {
      await this.storeOffline(key, entry);
    }
  }

  async invalidate(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keyArray) {
      this.cache.delete(key);

      // Also remove from offline storage
      if (this.config.enableOffline) {
        await this.removeOffline(key);
      }
    }

    this.updateMemoryUsage();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.metrics.memoryUsage = 0;

    if (this.config.enableOffline) {
      await this.clearOffline();
    }
  }

  // Offline storage methods using IndexedDB
  private async storeOffline(key: string, entry: CacheEntry): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put({ key, ...entry });
    } catch (error) {

    }
  }

  private async removeOffline(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.delete(key);
    } catch (error) {

    }
  }

  private async clearOffline(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    } catch (error) {

    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NextCacheDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  // Navigation pattern tracking for intelligent prefetching
  trackNavigation(route: string) {
    const pattern = this.navigationPatterns.get(route) || {
      route,
      frequency: 0,
      lastVisited: 0,
      prefetchPriority: 0,
    };

    pattern.frequency++;
    pattern.lastVisited = Date.now();
    pattern.prefetchPriority = this.calculatePrefetchPriority(pattern);

    this.navigationPatterns.set(route, pattern);
  }

  private calculatePrefetchPriority(pattern: NavigationPattern): number {
    const recency = Math.max(0, 1 - (Date.now() - pattern.lastVisited) / (24 * 60 * 60 * 1000));
    const frequency = Math.min(1, pattern.frequency / 10);
    return recency * 0.6 + frequency * 0.4;
  }

  getPrefetchCandidates(): string[] {
    return Array.from(this.navigationPatterns.values())
      .filter(pattern => pattern.prefetchPriority > 0.5)
      .sort((a, b) => b.prefetchPriority - a.prefetchPriority)
      .slice(0, 5)
      .map(pattern => pattern.route);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<CacheConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Server-side caching utilities
export const createServerCache = <T,>(
  fetcher: () => Promise<T>,
  options: {
    tags?: string[];
    revalidate?: number | false;
  } = {}
) => {
  return unstable_cache(fetcher, undefined, {
    tags: options.tags,
    revalidate: options.revalidate,
  });
};

// Cache warming utilities
export const warmCriticalData = async (keys: string[]) => {
  const warmingPromises = keys.map(async (key) => {
    try {
      // Attempt to fetch and cache critical data
      const response = await fetch(`/api/cache/warm/${encodeURIComponent(key)}`);
      if (response.ok) {
        const data = await response.json();
        return { key, success: true, data };
      }
    } catch (error) {

    }
    return { key, success: false };
  });

  const results = await Promise.allSettled(warmingPromises);
  return results;
};

// Prefetching utilities with intelligent prediction
export const createPrefetcher = (cache: MemoryAwareCache) => {
  const prefetchQueue = new Set<string>();
  let isProcessing = false;

  const processPrefetchQueue = async () => {
    if (isProcessing || prefetchQueue.size === 0) return;

    isProcessing = true;
    const batch = Array.from(prefetchQueue).slice(0, 3); // Process 3 at a time

    for (const key of batch) {
      prefetchQueue.delete(key);
      try {
        const response = await fetch(`/api/prefetch/${encodeURIComponent(key)}`);
        if (response.ok) {
          const data = await response.json();
          await cache.set(key, data, 10 * 60 * 1000); // 10 minute TTL for prefetched data
        }
      } catch (error) {

      }
    }

    isProcessing = false;

    // Continue processing if more items were added
    if (prefetchQueue.size > 0) {
      setTimeout(processPrefetchQueue, 100);
    }
  };

  return {
    prefetch: (key: string) => {
      prefetchQueue.add(key);
      processPrefetchQueue();
    },

    prefetchRoute: (route: string) => {
      // Predict what data this route might need
      const predictedKeys = predictDataKeys(route);
      predictedKeys.forEach(key => prefetchQueue.add(key));
      processPrefetchQueue();
    },
  };
};

// Predict data keys based on route patterns
const predictDataKeys = (route: string): string[] => {
  const predictions: string[] = [];

  if (route.includes('/dashboard')) {
    predictions.push('dashboard-metrics', 'user-profile', 'recent-activity');
  }

  if (route.includes('/conversations')) {
    predictions.push('conversations-list', 'unread-count');
  }

  if (route.includes('/analytics')) {
    predictions.push('analytics-overview', 'performance-metrics');
  }

  return predictions;
};

// Service Worker integration for offline-first caching
export const registerCacheServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-cache.js')
      .then((registration) => {

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'CACHE_UPDATED') {
            // Notify components that cache was updated
            window.dispatchEvent(new CustomEvent('cacheUpdated', {
              detail: event.data.key
            }));
          }
        });
      })
      .catch((error) => {

      });
  }
};

// Main Provider Component
export const NextCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<CacheConfig>(DEFAULT_CONFIG);
  const [cache] = useState(() => new MemoryAwareCache(config));
  const [prefetcher] = useState(() => createPrefetcher(cache));

  // Initialize service worker on mount
  useEffect(() => {
    registerCacheServiceWorker();
  }, []);

  // Update cache config when config changes
  useEffect(() => {
    cache.updateConfig(config);
  }, [config, cache]);

  // Track navigation patterns
  useEffect(() => {
    const handleRouteChange = () => {
      cache.trackNavigation(window.location.pathname);

      // Intelligent prefetching based on navigation patterns
      if (config.enablePrefetch) {
        const candidates = cache.getPrefetchCandidates();
        candidates.forEach(route => prefetcher.prefetchRoute(route));
      }
    };

    // Listen for navigation changes
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange(); // Track initial route

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [cache, prefetcher, config.enablePrefetch]);

  // Performance monitoring
  useEffect(() => {
    const reportMetrics = () => {
      const metrics = cache.getMetrics();

      // Report to analytics or monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'cache_performance', {
          cache_hits: metrics.hits,
          cache_misses: metrics.misses,
          hit_ratio: metrics.hits / (metrics.hits + metrics.misses) || 0,
          memory_usage: metrics.memoryUsage,
        });
      }
    };

    const interval = setInterval(reportMetrics, 60000); // Report every minute
    return () => clearInterval(interval);
  }, [cache]);

  const contextValue = useMemo<CacheContextType>(() => ({
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    invalidate: cache.invalidate.bind(cache),
    clear: cache.clear.bind(cache),

    prefetch: async (key: string, fetcher: () => Promise<any>) => {
      try {
        const data = await fetcher();
        await cache.set(key, data);
        cache.getMetrics().prefetchCount++;
      } catch (error) {

      }
    },

    warmCache: async (keys: string[]) => {
      if (config.enableWarming) {
        await warmCriticalData(keys);
      }
    },

    getMetrics: () => cache.getMetrics(),
    getMemoryUsage: () => cache.getMetrics().memoryUsage,

    updateConfig: (newConfig: Partial<CacheConfig>) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    },
  }), [cache, config]);

  return (
    <NextCacheContext.Provider value={contextValue}>
      {children}
    </NextCacheContext.Provider>
  );
};

// Hook for using the cache
export const useNextCache = () => {
  const context = useContext(NextCacheContext);
  if (!context) {
    throw new Error('useNextCache must be used within a NextCacheProvider');
  }
  return context;
};

// Component wrapper for automatic memory tracking
export const withCache = <P extends object,>(
  Component: React.ComponentType<P>,
  cacheKey: string | ((props: P) => string),
  ttl?: number
) => {
  const WrappedComponent = (props: P) => {
    const cache = useNextCache();
    const [cachedData, setCachedData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const key = typeof cacheKey === 'function' ? cacheKey(props) : cacheKey;

    useEffect(() => {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const cached = await cache.get(key);
          if (cached) {
            setCachedData(cached);
          }
        } catch (error) {
          console.error('Failed to load cached data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [cache, key]);

    if (isLoading) {
      return <div>Loading...</div>; // Or your loading component
    }

    return <Component {...props} />;
  };

  return WrappedComponent;
};

// Hook for cached data with automatic invalidation
export const useCachedData = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) => {
  const cache = useNextCache();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { ttl, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get from cache first
        const cached = await cache.get<T>(key);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetcher();
        await cache.set(key, freshData, ttl);
        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cache, key, fetcher, ttl, enabled]);

  const invalidate = useCallback(() => {
    cache.invalidate(key);
  }, [cache, key]);

  return { data, isLoading, error, invalidate };
};

export default NextCacheProvider;