/**
 * Redis Cache Service
 * 
 * Provides caching functionality for API responses, database queries,
 * and AI responses to improve performance.
 */

// For production, you would use Redis. For development, we'll use in-memory cache
interface CacheEntry {
  data: any;
  expiry: number;
  tags: string[];
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum number of entries

  set(key: string, data: any, ttlSeconds: number = 300, tags: string[] = []): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry, tags });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export class CacheService {
  private cache: InMemoryCache;

  constructor() {
    this.cache = new InMemoryCache();
  }

  /**
   * Cache API responses
   */
  async cacheApiResponse(
    endpoint: string,
    params: Record<string, any>,
    data: any,
    ttlSeconds: number = 300
  ): Promise<void> {
    const key = this.generateApiKey(endpoint, params);
    const tags = [`api:${endpoint}`, 'api'];
    this.cache.set(key, data, ttlSeconds, tags);
  }

  async getCachedApiResponse(
    endpoint: string,
    params: Record<string, any>
  ): Promise<any | null> {
    const key = this.generateApiKey(endpoint, params);
    return this.cache.get(key);
  }

  /**
   * Cache database query results
   */
  async cacheQuery(
    table: string,
    query: string,
    params: any[],
    data: any,
    ttlSeconds: number = 600
  ): Promise<void> {
    const key = this.generateQueryKey(table, query, params);
    const tags = [`table:${table}`, 'database'];
    this.cache.set(key, data, ttlSeconds, tags);
  }

  async getCachedQuery(
    table: string,
    query: string,
    params: any[]
  ): Promise<any | null> {
    const key = this.generateQueryKey(table, query, params);
    return this.cache.get(key);
  }

  /**
   * Cache AI responses
   */
  async cacheAIResponse(
    messageContent: string,
    organizationId: string,
    response: any,
    ttlSeconds: number = 1800 // 30 minutes
  ): Promise<void> {
    const key = this.generateAIKey(messageContent, organizationId);
    const tags = [`ai:${organizationId}`, 'ai'];
    this.cache.set(key, response, ttlSeconds, tags);
  }

  async getCachedAIResponse(
    messageContent: string,
    organizationId: string
  ): Promise<any | null> {
    const key = this.generateAIKey(messageContent, organizationId);
    return this.cache.get(key);
  }

  /**
   * Cache analytics data
   */
  async cacheAnalytics(
    organizationId: string,
    type: string,
    timeRange: string,
    data: any,
    ttlSeconds: number = 900 // 15 minutes
  ): Promise<void> {
    const key = `analytics:${organizationId}:${type}:${timeRange}`;
    const tags = [`analytics:${organizationId}`, 'analytics'];
    this.cache.set(key, data, ttlSeconds, tags);
  }

  async getCachedAnalytics(
    organizationId: string,
    type: string,
    timeRange: string
  ): Promise<any | null> {
    const key = `analytics:${organizationId}:${type}:${timeRange}`;
    return this.cache.get(key);
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTag(tag: string): void {
    this.cache.invalidateByTag(tag);
  }

  /**
   * Invalidate organization-specific cache
   */
  invalidateOrganization(organizationId: string): void {
    this.cache.invalidateByTag(`org:${organizationId}`);
    this.cache.invalidateByTag(`ai:${organizationId}`);
    this.cache.invalidateByTag(`analytics:${organizationId}`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return this.cache.getStats();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  private generateApiKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `api:${endpoint}:${this.hashString(sortedParams)}`;
  }

  private generateQueryKey(table: string, query: string, params: any[]): string {
    const paramString = JSON.stringify(params);
    return `query:${table}:${this.hashString(query + paramString)}`;
  }

  private generateAIKey(messageContent: string, organizationId: string): string {
    const content = messageContent.toLowerCase().trim();
    return `ai:${organizationId}:${this.hashString(content)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache middleware for API routes
export function withCache(
  handler: Function,
  ttlSeconds: number = 300,
  cacheKey?: (req: any) => string
) {
  return async (req: any, ...args: any[]) => {
    const key = cacheKey ? cacheKey(req) : `${req.url}:${JSON.stringify(req.query || {})}`;
    
    // Try to get from cache first
    const cached = cacheService.cache.get(key);
    if (cached) {
      return cached;
    }

    // Execute handler and cache result
    const result = await handler(req, ...args);
    cacheService.cache.set(key, result, ttlSeconds);
    
    return result;
  };
}

// Cache decorator for functions
export function cached(ttlSeconds: number = 300, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      const cached = cacheService.cache.get(key);
      if (cached) {
        return cached;
      }

      const result = await method.apply(this, args);
      cacheService.cache.set(key, result, ttlSeconds);
      
      return result;
    };
  };
}
