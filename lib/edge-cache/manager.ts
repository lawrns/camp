/**
 * Edge Cache Manager for Widget Performance
 * Implements KV store caching for FAQ and knowledge base queries
 * Includes circuit breaker for API rate limiting protection
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  version: string;
}

interface CacheKey {
  type: "faq" | "knowledge" | "config";
  organizationId: string;
  locale?: string;
  version: string;
}

interface CacheInvalidation {
  trigger: "faq-edit" | "kb-publish" | "config-update";
  pattern: string;
  regions: string[];
}

interface EdgeCacheConfig {
  provider: "memory" | "redis" | "cloudflare-kv";
  ttl: {
    faq: number;
    knowledge: number;
    config: number;
  };
  maxSize: number;
  enableCompression: boolean;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = "half-open";
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is open - too many failures");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = "closed";
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "open";
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export class EdgeCacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: EdgeCacheConfig;
  private circuitBreaker: CircuitBreaker;
  private compressionEnabled: boolean;

  constructor(config: Partial<EdgeCacheConfig> = {}) {
    this.config = {
      provider: "memory",
      ttl: {
        faq: 3600, // 1 hour
        knowledge: 1800, // 30 minutes
        config: 300, // 5 minutes
      },
      maxSize: 1000,
      enableCompression: true,
      ...config,
    };

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringWindow: 60000,
    });

    this.compressionEnabled = this.config.enableCompression;

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key from components
   */
  private generateKey(key: CacheKey): string {
    const parts = [key.type, key.organizationId];
    if (key.locale) parts.push(key.locale);
    parts.push(key.version);
    return parts.join(":");
  }

  /**
   * Compress data if enabled
   */
  private async compress(data: unknown): Promise<string> {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }

    // Simple compression using JSON + base64 (in production, use proper compression)
    const jsonString = JSON.stringify(data);
    if (typeof window !== "undefined") {
      return btoa(jsonString);
    }
    return Buffer.from(jsonString).toString("base64");
  }

  /**
   * Decompress data if needed
   */
  private async decompress(data: string): Promise<any> {
    if (!this.compressionEnabled) {
      return JSON.parse(data);
    }

    try {
      let jsonString: string;
      if (typeof window !== "undefined") {
        jsonString = atob(data);
      } else {
        jsonString = Buffer.from(data, "base64").toString();
      }
      return JSON.parse(jsonString);
    } catch (error) {
      // Fallback to direct parsing if decompression fails
      return JSON.parse(data);
    }
  }

  /**
   * Get cached data
   */
  async get(key: CacheKey): Promise<any | null> {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(cacheKey);
      return null;
    }

    try {
      return await this.decompress(entry.data);
    } catch (error) {

      this.cache.delete(cacheKey);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set(key: CacheKey, data: unknown): Promise<void> {
    const cacheKey = this.generateKey(key);

    try {
      const compressedData = await this.compress(data);
      const entry: CacheEntry = {
        data: compressedData,
        timestamp: Date.now(),
        ttl: this.config.ttl[key.type],
        version: key.version,
      };

      this.cache.set(cacheKey, entry);

      // Enforce max size
      if (this.cache.size > this.config.maxSize) {
        this.evictOldest();
      }
    } catch (error) {

    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(trigger: CacheInvalidation["trigger"], organizationId: string): Promise<void> {
    const patterns = {
      "faq-edit": `faq:${organizationId}:`,
      "kb-publish": `knowledge:${organizationId}:`,
      "config-update": `config:${organizationId}:`,
    };

    const pattern = patterns[trigger];
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

  }

  /**
   * Get cached FAQ entries with circuit breaker protection
   */
  async getFAQs(organizationId: string, locale: string = "en"): Promise<any[] | null> {
    return this.circuitBreaker.execute(async () => {
      const key: CacheKey = {
        type: "faq",
        organizationId,
        locale,
        version: "v1",
      };

      let faqs = await this.get(key);

      if (!faqs) {
        // Cache miss - fetch from database
        faqs = await this.fetchFAQsFromDB(organizationId, locale);
        if (faqs) {
          await this.set(key, faqs);
        }
      }

      return faqs;
    });
  }

  /**
   * Get cached knowledge base entries with circuit breaker protection
   */
  async getKnowledgeBase(organizationId: string, query?: string): Promise<any[] | null> {
    return this.circuitBreaker.execute(async () => {
      const key: CacheKey = {
        type: "knowledge",
        organizationId,
        version: query ? `search:${query.slice(0, 50)}` : "all",
      };

      let knowledge = await this.get(key);

      if (!knowledge) {
        // Cache miss - fetch from database
        knowledge = await this.fetchKnowledgeFromDB(organizationId, query);
        if (knowledge) {
          await this.set(key, knowledge);
        }
      }

      return knowledge;
    });
  }

  /**
   * Get cached organization config with circuit breaker protection
   */
  async getConfig(organizationId: string): Promise<any | null> {
    return this.circuitBreaker.execute(async () => {
      const key: CacheKey = {
        type: "config",
        organizationId,
        version: "v1",
      };

      let config = await this.get(key);

      if (!config) {
        // Cache miss - fetch from database
        config = await this.fetchConfigFromDB(organizationId);
        if (config) {
          await this.set(key, config);
        }
      }

      return config;
    });
  }

  /**
   * Database fetch functions (to be implemented with actual DB calls)
   */
  private async fetchFAQsFromDB(organizationId: string, locale: string): Promise<any[]> {
    // Placeholder - implement actual database query

    return [];
  }

  private async fetchKnowledgeFromDB(organizationId: string, query?: string): Promise<any[]> {
    // Placeholder - implement actual database query

    return [];
  }

  private async fetchConfigFromDB(organizationId: string): Promise<any> {
    // Placeholder - implement actual database query

    return null;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {

    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredCount++;
      }
      totalSize += JSON.stringify(entry).length;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      totalSizeBytes: totalSize,
      circuitBreakerState: this.circuitBreaker.getState(),
      hitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();

  }
}

// Global edge cache instance
export const globalEdgeCache = new EdgeCacheManager({
  provider: "memory",
  ttl: {
    faq: 3600, // 1 hour
    knowledge: 1800, // 30 minutes
    config: 300, // 5 minutes
  },
  maxSize: 1000,
  enableCompression: true,
});

// Export types for use in other modules
export type { CacheKey, CacheInvalidation, EdgeCacheConfig };
