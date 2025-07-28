/**
 * Tiered cache implementation for performance optimization
 */

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface TieredCacheConfig {
  l1MaxSize: number;
  l2MaxSize: number;
  defaultTtl: number;
}

export class TieredCache<T> {
  private l1Cache = new Map<string, CacheItem<T>>();
  private l2Cache = new Map<string, CacheItem<T>>();
  private config: TieredCacheConfig;

  constructor(config: Partial<TieredCacheConfig> = {}) {
    this.config = {
      l1MaxSize: 100,
      l2MaxSize: 1000,
      defaultTtl: 300000, // 5 minutes
      ...config,
    };
  }

  get(key: string): T | undefined {
    // Check L1 cache first
    const l1Item = this.l1Cache.get(key);
    if (l1Item && !this.isExpired(l1Item)) {
      l1Item.hits++;
      return l1Item.value;
    }

    // Check L2 cache
    const l2Item = this.l2Cache.get(key);
    if (l2Item && !this.isExpired(l2Item)) {
      l2Item.hits++;
      // Promote to L1 cache
      this.promoteToL1(key, l2Item);
      return l2Item.value;
    }

    return undefined;
  }

  set(key: string, value: T, ttl?: number): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      hits: 0,
    };

    // Add to L1 cache
    this.l1Cache.set(key, item);
    this.evictIfNeeded(this.l1Cache, this.config.l1MaxSize);
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private promoteToL1(key: string, item: CacheItem<T>): void {
    this.l1Cache.set(key, item);
    this.l2Cache.delete(key);
    this.evictIfNeeded(this.l1Cache, this.config.l1MaxSize);
  }

  private evictIfNeeded(cache: Map<string, CacheItem<T>>, maxSize: number): void {
    if (cache.size <= maxSize) return;

    // Evict least recently used items
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    while (cache.size > maxSize && entries.length > 0) {
      const [key] = entries.shift()!;
      cache.delete(key);
    }
  }

  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  stats() {
    return {
      l1Size: this.l1Cache.size,
      l2Size: this.l2Cache.size,
      l1HitRate: this.calculateHitRate(this.l1Cache),
      l2HitRate: this.calculateHitRate(this.l2Cache),
    };
  }

  private calculateHitRate(cache: Map<string, CacheItem<T>>): number {
    let totalHits = 0;
    let totalItems = 0;

    for (const item of cache.values()) {
      totalHits += item.hits;
      totalItems++;
    }

    return totalItems > 0 ? totalHits / totalItems : 0;
  }
}

// Global cache instance
export const globalCache = new TieredCache();
