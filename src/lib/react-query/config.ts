/**
 * React Query Configuration
 * Central configuration for TanStack Query with optimized caching strategies
 */

import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Cache time constants
export const CACHE_TIMES = {
  CONVERSATIONS: 5 * 60 * 1000, // 5 minutes
  MESSAGES: 10 * 60 * 1000, // 10 minutes
  USER_PROFILE: 30 * 60 * 1000, // 30 minutes
  ORGANIZATION: 60 * 60 * 1000, // 1 hour
  DEFAULT: 5 * 60 * 1000, // 5 minutes
} as const;

// Refetch intervals
export const REFETCH_INTERVALS = {
  CONVERSATIONS: 30 * 1000, // 30 seconds
  MESSAGES: 60 * 1000, // 1 minute
  ACTIVE_CONVERSATION: 10 * 1000, // 10 seconds for active conversation
} as const;

// Query keys factory
export const queryKeys = {
  all: ["campfire"] as const,
  conversations: () => [...queryKeys.all, "conversations"] as const,
  conversationsList: (filters: Record<string, any>) => [...queryKeys.conversations(), { filters }] as const,
  conversationById: (id: string) => [...queryKeys.conversations(), id] as const,
  messages: () => [...queryKeys.all, "messages"] as const,
  messagesList: (conversationId: string, options?: { limit?: number; offset?: number }) =>
    [...queryKeys.messages(), conversationId, { options }] as const,
  customerProfile: (email: string) => [...queryKeys.all, "customer", email] as const,
  organizationData: (orgId: string) => [...queryKeys.all, "organization", orgId] as const,
  typingStatus: (conversationId: string) => [...queryKeys.all, "typing", conversationId] as const,
} as const;

// Create QueryClient with optimized defaults
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long until data is considered stale
        staleTime: CACHE_TIMES.DEFAULT,

        // Cache time - how long to keep data in cache after component unmounts
        gcTime: 30 * 60 * 1000, // 30 minutes

        // Retry configuration
        retry: (failureCount: unknown, error: unknown) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        },
        retryDelay: (attemptIndex: unknown) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Background refetch settings
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,

        // Network mode - allow offline functionality
        networkMode: "offlineFirst",
      },
      mutations: {
        // Retry configuration for mutations
        retry: 1,
        retryDelay: 1000,

        // Global error handler
        onError: (error: unknown) => {
          const message = error?.message || "An error occurred";
          toast.error(message);
        },
      },
    },
  });
}

// Prefetch helper
export async function prefetchConversations(queryClient: QueryClient, organizationId: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.conversationsList({ organizationId }),
    queryFn: async () => {
      const response = await fetch(`/api/conversations?organization_id=${organizationId}`);
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
    staleTime: CACHE_TIMES.CONVERSATIONS,
  });
}

// Cache invalidation helpers
export const invalidateQueries = {
  conversations: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.conversations() }),

  conversationMessages: (queryClient: QueryClient, conversationId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.messagesList(conversationId) }),

  allMessages: (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: queryKeys.messages() }),

  customerProfile: (queryClient: QueryClient, email: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.customerProfile(email) }),
};

// Optimistic update helpers
export const optimisticUpdates = {
  addMessage: (queryClient: QueryClient, conversationId: string, optimisticMessage: unknown) => {
    queryClient.setQueryData(queryKeys.messagesList(conversationId), (old: unknown) => {
      if (!old) return { messages: [optimisticMessage] };
      return {
        ...old,
        messages: [...(old.messages || []), optimisticMessage],
      };
    });
  },

  updateConversationPreview: (queryClient: QueryClient, conversationId: string, preview: string, timestamp: string) => {
    queryClient.setQueryData(queryKeys.conversations(), (old: unknown) => {
      if (!old) return old;
      const conversations = old.conversations || old;
      return {
        ...old,
        conversations: conversations.map((conv: unknown) =>
          conv.id === conversationId ? { ...conv, last_message_preview: preview, lastMessageAt: timestamp } : conv
        ),
      };
    });
  },
};
