import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { safeMapConversations, mapDatabaseConversation } from "@/lib/data/conversationMapper";
import { cleanupRealtimeChannel } from "@/lib/realtime/cleanup-utils";
import { conversationDebug, performanceTimer } from "@/lib/utils/debug";
import { ComponentFetch } from "@/lib/utils/fetch-with-abort";
import { shouldDisableRealtime } from "@/lib/utils/e2e";

export interface ConversationFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
}

export interface UseConversationsOptions {
  limit?: number;
  filters?: ConversationFilters;
  enableInfiniteQuery?: boolean;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const { limit = 30, filters = {}, enableInfiniteQuery = false } = options;

  // Infinite query for pagination
  const infiniteQuery = useInfiniteQuery({
    queryKey: ["conversations-infinite", organizationId, { limit, ...filters }],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!organizationId) {
        throw new Error("Organization ID is required to fetch conversations");
      }

      try {
        conversationDebug.log(`Fetching page ${pageParam} with limit ${limit}`);

        // Build query with filters and pagination
        let queryBuilder = supabase
          .browser()
          .from("conversations")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false })
          .range(pageParam * limit, (pageParam + 1) * limit - 1);

        // Apply filters
        if (filters.status) {
          queryBuilder = queryBuilder.eq("status", filters.status);
        }
        if (filters.priority) {
          queryBuilder = queryBuilder.eq("priority", filters.priority);
        }
        if (filters.assignedTo) {
          queryBuilder = queryBuilder.eq("assigned_to_user_id", filters.assignedTo);
        }
        if (filters.search) {
          queryBuilder = queryBuilder.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,last_message_preview.ilike.%${filters.search}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) {
          conversationDebug.error("Failed to fetch conversations page:", error);
          throw error;
        }

        conversationDebug.log(`Successfully fetched page ${pageParam}:`, data?.length || 0, "conversations");

        // Transform database data to TypeScript types
        const transformedData = safeMapConversations(data || []);

        return {
          conversations: transformedData,
          nextCursor: data && data.length === limit ? pageParam + 1 : undefined,
        };
      } catch (error) {
        conversationDebug.error("Infinite query failed:", error);
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!organizationId && enableInfiniteQuery,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Build query key with filters for better cache invalidation
  const queryKey = useMemo(() => [
    "conversations",
    organizationId,
    { limit, ...filters }
  ], [organizationId, limit, filters]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required to fetch conversations");
      }

      try {
        conversationDebug.log("Fetching conversations with pagination and filters");

        // Build query with filters and pagination
        let queryBuilder = supabase
          .browser()
          .from("conversations")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false })
          .limit(limit);

        // Apply filters
        if (filters.status) {
          queryBuilder = queryBuilder.eq("status", filters.status);
        }
        if (filters.priority) {
          queryBuilder = queryBuilder.eq("priority", filters.priority);
        }
        if (filters.assignedTo) {
          queryBuilder = queryBuilder.eq("assigned_to_user_id", filters.assignedTo);
        }
        if (filters.search) {
          queryBuilder = queryBuilder.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,last_message_preview.ilike.%${filters.search}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) {
          conversationDebug.error("Failed to fetch conversations:", error);
          throw error;
        }

        conversationDebug.log("Successfully fetched conversations:", data?.length || 0, "conversations");

        // Transform database data to TypeScript types
        const transformedData = safeMapConversations(data || []);
        conversationDebug.log("Transformed conversations:", transformedData.length, "valid conversations");

        return transformedData;
      } catch (error) {
        conversationDebug.error("Query failed:", error);
        throw error;
      }
    },
    enabled: !!organizationId, // Only run query if organizationId is available
    staleTime: 1000 * 60 * 2, // 2 minutes - shorter for more frequent updates
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when available
  });



  // Set up real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    // Skip realtime in E2E mode to avoid WebSocket errors
    if (shouldDisableRealtime()) {
      return; // UI falls back to polling via queries
    }

    const channel = supabase
      .browser()
      .channel(`conversations:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          try {
            // Fetch the full conversation data (customer data is already in the conversations table)
            const { data: fullConversation } = await supabase
              .browser()
              .from("conversations")
              .select("*")
              .eq("id", payload.new.id)
              .single();

            if (fullConversation) {
              const newConversation = mapDatabaseConversation(fullConversation);

              queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
                if (!old) return [newConversation];
                return [newConversation, ...old];
              });
            } else {
              // Fallback: Use the payload data directly
              const fallbackConversation = mapDatabaseConversation(payload.new as unknown);

              queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
                if (!old) return [fallbackConversation];
                return [fallbackConversation, ...old];
              });
            }
          } catch (error) {
            console.warn("[useConversations] Realtime insert handling failed:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          try {
            // Fetch the full conversation data (customer data is already in the conversations table)
            const { data: fullConversation } = await supabase
              .browser()
              .from("conversations")
              .select("*")
              .eq("id", payload.new.id)
              .single();

            if (fullConversation) {
              const updatedConversation = mapDatabaseConversation(fullConversation);

              queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
                if (!old) return [updatedConversation];
                return old.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv));
              });
            } else {
              // Fallback: Use the payload data directly
              const fallbackConversation = mapDatabaseConversation(payload.new as unknown);

              queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
                if (!old) return [fallbackConversation];
                return old.map((conv) => (conv.id === fallbackConversation.id ? fallbackConversation : conv));
              });
            }
          } catch (error) {
            console.warn("[useConversations] Realtime update handling failed:", error);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
            if (!old) return [];
            return old.filter((conv) => conv.id !== payload.old.id);
          });
        }
      )
      .subscribe();

    return () => {
      cleanupRealtimeChannel(channel, { timeout: 1500, forceRemove: true, logErrors: false });
    };
  }, [queryClient, organizationId]);

  const createConversation = useCallback(async (data: unknown) => {
    const { data: newConversation, error } = await supabase
      .browser()
      .from("conversations")
      .insert(data)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    
    // Transform the created conversation
    return mapDatabaseConversation(newConversation);
  }, []);

  const updateConversation = useCallback(async (id: unknown, updates: unknown) => {
    const { data: updatedConversation, error } = await supabase
      .browser()
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    
    // Transform the updated conversation
    return mapDatabaseConversation(updatedConversation);
  }, []);

  // Memoize the conversations to prevent unnecessary re-renders
  const conversations = useMemo(() => {
    if (enableInfiniteQuery) {
      // Flatten all pages from infinite query
      return infiniteQuery.data?.pages.flatMap(page => page.conversations) || [];
    }
    return (query.data || []).filter(Boolean); // Filter out any null/undefined values
  }, [query.data, infiniteQuery.data, enableInfiniteQuery]);

  // Return appropriate query state based on query type
  if (enableInfiniteQuery) {
    return {
      conversations,
      isLoading: infiniteQuery.isLoading,
      error: infiniteQuery.error,
      refetch: infiniteQuery.refetch,
      fetchNextPage: infiniteQuery.fetchNextPage,
      hasNextPage: infiniteQuery.hasNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
      createConversation,
      updateConversation,
    };
  }

  return {
    conversations,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createConversation,
    updateConversation,
  };
}
