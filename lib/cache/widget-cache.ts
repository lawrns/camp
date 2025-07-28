/**
 * Widget Performance Cache Layer
 * 
 * High-performance caching for widget API endpoints
 * Target: <500ms response times with 95%+ cache hit rate
 */

import { redis } from "@/lib/redis/client";

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  skipCache?: boolean;
  invalidatePattern?: string;
}

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  totalRequests: number;
}

class WidgetCache {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalRequests: 0
  };

  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly CONVERSATION_TTL = 60; // 1 minute for conversations
  private readonly MESSAGES_TTL = 30; // 30 seconds for messages

  /**
   * Cache conversation messages with optimized TTL
   */
  async cacheMessages(
    conversationId: string,
    organizationId: string,
    messages: any[],
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = this.MESSAGES_TTL } = options;
    const cacheKey = this.getMessagesKey(conversationId, organizationId);
    
    const cacheData = {
      messages,
      timestamp: Date.now(),
      count: messages.length,
      conversationId,
      organizationId
    };

    await redis.set(cacheKey, JSON.stringify(cacheData), { ttl });
  }

  /**
   * Retrieve cached messages with performance tracking
   */
  async getCachedMessages(
    conversationId: string,
    organizationId: string
  ): Promise<{ messages: any[]; cached: boolean; age: number } | null> {
    const startTime = performance.now();
    const cacheKey = this.getMessagesKey(conversationId, organizationId);
    
    try {
      const cached = await redis.get(cacheKey);
      const responseTime = performance.now() - startTime;
      
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        this.metrics.cacheHits++;
        this.updateMetrics(responseTime);
        
        return {
          messages: data.messages,
          cached: true,
          age
        };
      }
      
      this.metrics.cacheMisses++;
      this.updateMetrics(responseTime);
      return null;
    } catch (error) {

      this.metrics.cacheMisses++;
      return null;
    }
  }

  /**
   * Cache conversation metadata
   */
  async cacheConversation(
    conversationId: string,
    organizationId: string,
    conversation: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = this.CONVERSATION_TTL } = options;
    const cacheKey = this.getConversationKey(conversationId, organizationId);
    
    const cacheData = {
      conversation,
      timestamp: Date.now(),
      conversationId,
      organizationId
    };

    await redis.set(cacheKey, JSON.stringify(cacheData), { ttl });
  }

  /**
   * Retrieve cached conversation
   */
  async getCachedConversation(
    conversationId: string,
    organizationId: string
  ): Promise<{ conversation: any; cached: boolean; age: number } | null> {
    const cacheKey = this.getConversationKey(conversationId, organizationId);
    
    try {
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        return {
          conversation: data.conversation,
          cached: true,
          age
        };
      }
      
      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Invalidate cache when new message is added
   */
  async invalidateConversationCache(
    conversationId: string,
    organizationId: string
  ): Promise<void> {
    const messagesKey = this.getMessagesKey(conversationId, organizationId);
    const conversationKey = this.getConversationKey(conversationId, organizationId);
    
    await Promise.all([
      redis.del(messagesKey),
      redis.del(conversationKey)
    ]);
  }

  /**
   * Bulk cache invalidation for organization
   */
  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    // Note: In a real Redis implementation, we'd use SCAN with pattern
    // For now, we'll track keys to invalidate
    const pattern = `widget:${organizationId}:*`;
    
    // This would be implemented with Redis SCAN in production

  }

  /**
   * Preload frequently accessed conversations
   */
  async preloadConversations(
    organizationId: string,
    conversationIds: string[]
  ): Promise<void> {
    // Implement preloading logic for hot conversations

  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): PerformanceMetrics & { hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalRequests: 0
    };
  }

  // Private helper methods
  private getMessagesKey(conversationId: string, organizationId: string): string {
    return `widget:${organizationId}:conv:${conversationId}:messages`;
  }

  private getConversationKey(conversationId: string, organizationId: string): string {
    return `widget:${organizationId}:conv:${conversationId}:meta`;
  }

  private updateMetrics(responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }
}

// Export singleton instance
export const widgetCache = new WidgetCache();

// Export cache utilities
export const cacheUtils = {
  /**
   * Wrap API function with caching
   */
  withCache: async <T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; cached: boolean; responseTime: number }> => {
    const startTime = performance.now();
    const { ttl = 300, skipCache = false } = options;

    if (!skipCache) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const responseTime = performance.now() - startTime;
          return {
            data: JSON.parse(cached),
            cached: true,
            responseTime
          };
        }
      } catch (error) {

      }
    }

    // Fetch fresh data
    const data = await fetchFn();
    const responseTime = performance.now() - startTime;

    // Cache the result
    try {
      await redis.set(cacheKey, JSON.stringify(data), { ttl });
    } catch (error) {

    }

    return {
      data,
      cached: false,
      responseTime
    };
  }
};

export default widgetCache;
