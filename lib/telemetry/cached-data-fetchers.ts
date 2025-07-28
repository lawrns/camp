/**
 * Cached data fetchers for performance optimization
 */

import { globalCache } from "./tiered-cache";

interface FetchOptions {
  ttl?: number;
  force?: boolean;
}

interface DataFetcher<T> {
  fetch: () => Promise<T>;
  cacheKey: string;
  options?: FetchOptions;
}

export class CachedDataFetcher {
  private static instance: CachedDataFetcher;
  private pendingRequests = new Map<string, Promise<any>>();

  static getInstance(): CachedDataFetcher {
    if (!CachedDataFetcher.instance) {
      CachedDataFetcher.instance = new CachedDataFetcher();
    }
    return CachedDataFetcher.instance;
  }

  async fetch<T>(fetcher: DataFetcher<T>): Promise<T> {
    const { cacheKey, fetch, options = {} } = fetcher;

    // Check cache first unless forced
    if (!options.force) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    // Prevent duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Execute fetch
    const promise = fetch();
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;

      // Cache the result
      globalCache.set(cacheKey, result, options.ttl);

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Helper methods for common data types
  async fetchConversations(organizationId: string, options?: FetchOptions) {
    const fetcher: DataFetcher<never[]> = {
      cacheKey: `conversations:${organizationId}`,
      fetch: async () => {
        // Placeholder - would integrate with actual API
        return [];
      },
    };

    if (options !== undefined) {
      fetcher.options = options;
    }

    return this.fetch(fetcher);
  }

  async fetchUserProfile(userId: string, options?: FetchOptions) {
    const fetcher: DataFetcher<null> = {
      cacheKey: `user:${userId}`,
      fetch: async () => {
        // Placeholder - would integrate with actual API
        return null;
      },
    };

    if (options !== undefined) {
      fetcher.options = options;
    }

    return this.fetch(fetcher);
  }

  async fetchOrganizationSettings(organizationId: string, options?: FetchOptions) {
    const fetcher: DataFetcher<{}> = {
      cacheKey: `org-settings:${organizationId}`,
      fetch: async () => {
        // Placeholder - would integrate with actual API
        return {};
      },
    };

    if (options !== undefined) {
      fetcher.options = options;
    }

    return this.fetch(fetcher);
  }

  // Clear cache for specific patterns
  invalidatePattern(pattern: string): void {
    // This would implement pattern-based cache invalidation
  }

  // Get cache statistics
  getStats() {
    return {
      ...globalCache.stats(),
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Export singleton instance
export const cachedFetcher = CachedDataFetcher.getInstance();
