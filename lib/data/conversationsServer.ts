import { supabase } from "@/lib/supabase";
import { safeMapConversations } from "@/lib/data/conversationMapper";
import type { ConversationFilters } from "@/hooks/useConversations";

export interface ServerConversationsOptions {
  organizationId: string;
  limit?: number;
  offset?: number;
  filters?: ConversationFilters;
}

/**
 * Server-side function to fetch conversations
 * Can be used in Server Components for better SSR performance
 */
export async function fetchConversationsServer(options: ServerConversationsOptions) {
  const { organizationId, limit = 30, offset = 0, filters = {} } = options;

  try {
    console.log("[fetchConversationsServer] Fetching conversations server-side...");
    
    // Build query with filters and pagination
    let queryBuilder = supabase
      .server()
      .from("conversations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
      console.error("[fetchConversationsServer] Failed to fetch conversations:", error);
      throw error;
    }

    console.log("[fetchConversationsServer] Successfully fetched conversations:", data?.length || 0, "conversations");
    
    // Transform database data to TypeScript types
    const transformedData = safeMapConversations(data || []);
    
    return {
      conversations: transformedData,
      hasMore: data && data.length === limit,
      total: transformedData.length,
    };
  } catch (error) {
    console.error("[fetchConversationsServer] Query failed:", error);
    throw error;
  }
}

/**
 * Server-side function to get conversation count
 * Useful for pagination metadata
 */
export async function getConversationCountServer(organizationId: string, filters: ConversationFilters = {}) {
  try {
    let queryBuilder = supabase
      .server()
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

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

    const { count, error } = await queryBuilder;

    if (error) {
      console.error("[getConversationCountServer] Failed to get count:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("[getConversationCountServer] Query failed:", error);
    throw error;
  }
}

/**
 * Server-side function to prefetch conversations for React Query
 * Can be used in Server Components to populate the cache
 */
export async function prefetchConversationsServer(
  queryClient: unknown,
  options: ServerConversationsOptions
) {
  const queryKey = [
    "conversations", 
    options.organizationId, 
    { limit: options.limit, ...options.filters }
  ];

  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchConversationsServer(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
