import { QueryClient } from '@tanstack/react-query';

// Global timeout configuration to prevent infinite loading
const QUERY_TIMEOUT = 30000; // 30 seconds
const MUTATION_TIMEOUT = 15000; // 15 seconds
const NETWORK_TIMEOUT = 10000; // 10 seconds for network requests

// Create a query client with optimized default options and timeout protection
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until a query is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: how long before inactive data is garbage collected
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Global query timeout to prevent infinite loading
      meta: {
        timeout: QUERY_TIMEOUT,
      },
      
      // Retry configuration with timeout awareness
      retry: (failureCount: any, error: any) => {
        // Don't retry timeout errors
        if (error?.message?.includes('timeout') || error?.name === 'TimeoutError') {

          return false;
        }
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex: any) => Math.min(1000 * 2 ** attemptIndex, 5000),
      
      // Refetch configuration
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      refetchOnReconnect: 'always', // Always refetch on reconnect
      refetchOnMount: true, // Refetch on component mount
      
      // Network mode
      networkMode: 'online', // Only fetch when online
      
      // Enable query cancellation
      throwOnError: false, // Don't throw errors globally
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
      // Mutation timeout
      meta: {
        timeout: MUTATION_TIMEOUT,
      },
      
      // Network mode for mutations
      networkMode: 'online',
      
      // Don't retry timeout errors
      retryFn: (failureCount: number, error: any) => {
        if (error?.message?.includes('timeout') || error?.name === 'TimeoutError') {

          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// Query keys factory for consistent key generation
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    counts: (filters: { organizationId?: string | null; userId?: string | null }) =>
      [...queryKeys.conversations.all, 'counts', filters] as const,
  },
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) => [...queryKeys.messages.lists(), conversationId] as const,
  },
  rag: {
    all: ['rag'] as const,
    responses: () => [...queryKeys.rag.all, 'responses'] as const,
    response: (conversationId: string) => [...queryKeys.rag.responses(), conversationId] as const,
    snippets: () => [...queryKeys.rag.all, 'snippets'] as const,
    snippet: (query: string) => [...queryKeys.rag.snippets(), query] as const,
  },
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
  },
  organization: {
    all: ['organization'] as const,
    settings: (orgId: string) => [...queryKeys.organization.all, 'settings', orgId] as const,
  },
};

// Helper function to invalidate queries
export const invalidateQueries = async (keys: readonly unknown[]) => {
  await queryClient.invalidateQueries({ queryKey: keys });
};

// Helper function to prefetch queries
export const prefetchQuery = async (
  queryKey: readonly unknown[],
  queryFn: () => Promise<any>,
  staleTime?: number
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...(staleTime !== undefined && { staleTime }),
  });
};

// Helper function to get cached data
export const getCachedData = <T>(queryKey: readonly unknown[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};

// Helper function to set cached data
export const setCachedData = <T>(queryKey: readonly unknown[], data: T) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Create a timeout wrapper for promises to prevent infinite loading
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = QUERY_TIMEOUT,
  operationName: string = 'Query'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Improved query function wrapper with timeout and circuit breaker integration
 */
export function createTimeoutQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    timeout?: number;
    operationName?: string;
    retries?: number;
  } = {}
): () => Promise<T> {
  const {
    timeout = QUERY_TIMEOUT,
    operationName = 'Query',
    retries = 2
  } = options;

  return async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await withTimeout(queryFn(), timeout, operationName);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry timeout errors or final attempt
        if (error instanceof Error && error.name === 'TimeoutError') {

          throw error;
        }
        
        if (attempt === retries) {

          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
}

/**
 * Improved mutation function wrapper with timeout
 */
export function createTimeoutMutation<T, TVariables>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: {
    timeout?: number;
    operationName?: string;
  } = {}
): (variables: TVariables) => Promise<T> {
  const {
    timeout = MUTATION_TIMEOUT,
    operationName = 'Mutation'
  } = options;

  return async (variables: TVariables) => {
    try {
      return await withTimeout(mutationFn(variables), timeout, operationName);
    } catch (error) {

      throw error;
    }
  };
}

// Export timeout constants for use in other modules
export const TIMEOUT_CONFIG = {
  QUERY_TIMEOUT,
  MUTATION_TIMEOUT,
  NETWORK_TIMEOUT
} as const;