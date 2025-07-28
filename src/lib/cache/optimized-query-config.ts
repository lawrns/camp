/**
 * Optimized React Query Configuration
 * 
 * This module provides optimized React Query configurations, cache strategies,
 * and prefetching utilities for improved application performance.
 */

import { optimizedFetch } from '@/lib/api/request-batching';
import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

// Optimized default configuration
const optimizedQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache times
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection

      // Retry configuration
      retry: (failureCount: any, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500) {
          return error?.status === 408 || error?.status === 429;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: any) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'online',

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,

      // Performance optimizations
      notifyOnChangeProps: 'tracked', // Only re-render when tracked props change
    },
    mutations: {
      // Retry configuration for mutations
      retry: (failureCount: any, error: any) => {
        // Don't retry client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: any) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online',
    },
  },
};

// Create optimized query client
export const createOptimizedQueryClient = () => {
  return new QueryClient(optimizedQueryConfig);
};

// Query key factories for consistent caching
export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
    settings: (userId: string) => [...queryKeys.user.all, 'settings', userId] as const,
  },

  // Organization-related queries
  organization: {
    all: ['organization'] as const,
    details: (orgId: string) => [...queryKeys.organization.all, 'details', orgId] as const,
    settings: (orgId: string) => [...queryKeys.organization.all, 'settings', orgId] as const,
    members: (orgId: string) => [...queryKeys.organization.all, 'members', orgId] as const,
    stats: (orgId: string) => [...queryKeys.organization.all, 'stats', orgId] as const,
    batch: (orgId: string) => [...queryKeys.organization.all, 'batch', orgId] as const,
  },

  // Conversation-related queries
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (conversationId: string) => [...queryKeys.conversations.detail(conversationId), 'messages'] as const,
  },

  // Knowledge base queries
  knowledge: {
    all: ['knowledge'] as const,
    articles: () => [...queryKeys.knowledge.all, 'articles'] as const,
    search: (query: string) => [...queryKeys.knowledge.all, 'search', query] as const,
  },

  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    performance: () => [...queryKeys.analytics.all, 'performance'] as const,
  },
} as const;

// Prefetching utilities
export class QueryPrefetcher {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Prefetch user data when authentication is successful
  async prefetchUserData(userId: string): Promise<void> {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.user.profile(userId),
      queryFn: () => optimizedFetch.get(`/api/user/${userId}`, {
        cache: {
          key: `user-profile-${userId}`,
          ttl: 5 * 60 * 1000,
          tags: ['user', userId]
        }
      }),
      staleTime: 5 * 60 * 1000,
    });
  }

  // Prefetch organization data when user data is loaded
  async prefetchOrganizationData(organizationId: string): Promise<void> {
    // Prefetch organization settings (most commonly needed)
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.organization.settings(organizationId),
      queryFn: () => optimizedFetch.get(`/api/organizations/${organizationId}/settings`, {
        cache: {
          key: `org-settings-${organizationId}`,
          ttl: 10 * 60 * 1000,
          tags: ['organization', organizationId]
        }
      }),
      staleTime: 10 * 60 * 1000,
    });

    // Prefetch organization stats for dashboard
    this.queryClient.prefetchQuery({
      queryKey: queryKeys.organization.stats(organizationId),
      queryFn: () => optimizedFetch.get(`/api/organizations/${organizationId}/stats`, {
        cache: {
          key: `org-stats-${organizationId}`,
          ttl: 2 * 60 * 1000,
          tags: ['organization', organizationId]
        }
      }),
      staleTime: 2 * 60 * 1000,
    });
  }

  // Prefetch conversations for inbox page
  async prefetchConversations(organizationId: string): Promise<void> {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.conversations.list({ organizationId }),
      queryFn: () => optimizedFetch.get(`/api/conversations?organizationId=${organizationId}`, {
        cache: {
          key: `conversations-${organizationId}`,
          ttl: 30 * 1000, // 30 seconds
          tags: ['conversations', organizationId]
        }
      }),
      staleTime: 30 * 1000,
    });
  }

  // Intelligent prefetching based on user navigation patterns
  async intelligentPrefetch(currentPath: string, organizationId: string): Promise<void> {
    // Prefetch based on current route
    if (currentPath.includes('/dashboard')) {
      await this.prefetchOrganizationData(organizationId);
    } else if (currentPath.includes('/inbox')) {
      await this.prefetchConversations(organizationId);
    } else if (currentPath.includes('/knowledge')) {
      // Prefetch knowledge base data
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.knowledge.articles(),
        queryFn: () => optimizedFetch.get('/api/knowledge/articles', {
          cache: {
            key: `knowledge-articles-${organizationId}`,
            ttl: 5 * 60 * 1000,
            tags: ['knowledge', organizationId]
          }
        }),
        staleTime: 5 * 60 * 1000,
      });
    }
  }
}

// Cache invalidation strategies
export class CacheInvalidator {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidate user-related data
  invalidateUserData(userId: string): void {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.user.all
    });

    // Also invalidate cache
    optimizedFetch.invalidateCache('user');
    optimizedFetch.invalidateCache(userId);
  }

  // Invalidate organization data
  invalidateOrganizationData(organizationId: string): void {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.organization.all
    });

    // Also invalidate cache
    optimizedFetch.invalidateCache('organization');
    optimizedFetch.invalidateCache(organizationId);
  }

  // Invalidate conversation data
  invalidateConversations(organizationId?: string): void {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.conversations.all
    });

    // Also invalidate cache
    optimizedFetch.invalidateCache('conversations');
    if (organizationId) {
      optimizedFetch.invalidateCache(organizationId);
    }
  }

  // Smart invalidation after mutations
  invalidateAfterMutation(mutationType: string, data: any): void {
    switch (mutationType) {
      case 'updateUserProfile':
        this.invalidateUserData(data.userId);
        break;
      case 'updateOrganizationSettings':
        this.invalidateOrganizationData(data.organizationId);
        break;
      case 'sendMessage':
      case 'updateConversation':
        this.invalidateConversations(data.organizationId);
        break;
      default:
        // For unknown mutations, invalidate everything
        this.queryClient.invalidateQueries();
    }
  }
}

// Background sync utilities
export class BackgroundSync {
  private queryClient: QueryClient;
  private syncInterval?: NodeJS.Timeout | undefined;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // DISABLED: Background sync polling - use real-time updates instead
  startSync(organizationId: string): void {

    // this.stopSync(); // Clear any existing sync

    // DISABLED: Polling replaced with real-time WebSocket updates
    // this.syncInterval = setInterval(() => {
    //   // Sync conversations every 30 seconds
    //   this.queryClient.invalidateQueries({
    //     queryKey: queryKeys.conversations.list({ organizationId }),
    //     exact: false
    //   });

    //   // Sync organization stats every 2 minutes
    //   if (Date.now() % (2 * 60 * 1000) < 30000) {
    //     this.queryClient.invalidateQueries({
    //       queryKey: queryKeys.organization.stats(organizationId)
    //     });
    //   }
    // }, 30000);
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }
}

// Export utilities
export { optimizedQueryConfig };
export type { QueryClientConfig };
