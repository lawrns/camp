import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./useAuth";
import { safeMapConversations, mapDatabaseConversation } from "@/lib/data/conversationMapper";

export function useConversations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const query = useQuery({
    queryKey: ["conversations", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required to fetch conversations");
      }

      // Get current session to debug JWT claims
      const { data: { session } } = await supabase.browser().auth.getSession();

      // Try to decode JWT to see claims
      if (session?.access_token) {
        try {
          const tokenParts = session.access_token.split('.');
          if (tokenParts.length === 3) {
            // JWT token is valid - we can proceed with the query
          }
        } catch (e) {
          // Ignore JWT decode errors
        }
      }

      try {
        // Query conversations directly - customer data is stored in the conversations table
        console.log("[useConversations] Fetching conversations with direct customer fields...");
        const { data, error } = await supabase
          .browser()
          .from("conversations")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("[useConversations] Failed to fetch conversations:", error);
          throw error;
        }

        console.log("[useConversations] Successfully fetched conversations:", data?.length || 0, "conversations");
        console.log("[useConversations] Organization ID used:", organizationId);
        
        // Log the actual data structure for debugging
        if (data && data.length > 0) {
          console.log("[useConversations] Sample conversation data:", data[0]);
          console.log("[useConversations] Sample conversation keys:", Object.keys(data[0]));
        }
        
        // Transform database data to TypeScript types
        const transformedData = safeMapConversations(data || []);
        console.log("[useConversations] Transformed conversations:", transformedData.length, "valid conversations");
        
        return transformedData;
      } catch (error) {
        console.error("[useConversations] All query strategies failed:", error);
        throw error;
      }
    },
    enabled: !!organizationId, // Only run query if organizationId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });



  // Set up real-time subscription
  useEffect(() => {
    if (!organizationId) return;

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

              queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
                if (!old) return [newConversation];
                return [newConversation, ...old];
              });
            } else {
              // Fallback: Use the payload data directly
              const fallbackConversation = mapDatabaseConversation(payload.new as any);

              queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
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

              queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
                if (!old) return [updatedConversation];
                return old.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv));
              });
            } else {
              // Fallback: Use the payload data directly
              const fallbackConversation = mapDatabaseConversation(payload.new as any);

              queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
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
          queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
            if (!old) return [];
            return old.filter((conv) => conv.id !== payload.old.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.browser().removeChannel(channel);
    };
  }, [queryClient, organizationId]);

  const createConversation = useCallback(async (data: any) => {
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

  const updateConversation = useCallback(async (id: any, updates: any) => {
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
    return (query.data || []).filter(Boolean); // Filter out any null/undefined values
  }, [query.data]);

  return {
    conversations,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createConversation,
    updateConversation,
  };
}
