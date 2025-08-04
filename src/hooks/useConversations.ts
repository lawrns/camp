import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import { usePathname } from "next/navigation";

export function useConversations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const pathname = usePathname();

  // Skip query on homepage to prevent unnecessary API calls
  const isHomepage = pathname === '/' || pathname === '/app';
  const shouldSkipQuery = isHomepage || !organizationId;

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
            const claims = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

          }
        } catch (e) {

        }
      }

      // First, fetch conversations
      const { data: conversationsData, error } = await supabase
        .browser()
        .from("conversations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Then, fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: lastMessage } = await supabase
            .browser()
            .from("messages")
            .select("content, created_at, sender_type")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            lastMessagePreview: lastMessage?.content?.substring(0, 100) || null,
            lastMessageAt: lastMessage?.created_at || conversation.updated_at,
          };
        })
      );

      return conversationsWithMessages;
    },
    enabled: !shouldSkipQuery, // Skip on homepage and when no organizationId
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // STEP 0: DISABLED - Real-time subscription causing binding mismatch
  useEffect(() => {
    if (shouldSkipQuery) return;

    console.log('[useConversations] PostgreSQL subscription disabled due to binding mismatch');

    /*
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
        (payload) => {

          queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
            if (!old) return payload.new ? [payload.new] : [];
            if (!payload.new) return old;
            return [payload.new, ...old];
          });
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
        (payload) => {

          queryClient.setQueryData(["conversations", organizationId], (old: unknown[] | undefined) => {
            if (!old) return payload.new ? [payload.new] : [];
            if (!payload.new) return old;
            return old.map((conv) => (conv.id === payload.new.id ? payload.new : conv));
          });
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
    */

    // Temporary: No realtime subscription to avoid binding mismatch

    return () => {

      supabase.browser().removeChannel(channel);
    };
  }, [organizationId, queryClient, shouldSkipQuery]);

  const createConversation = useCallback(async (data: unknown) => {
    const { data: newConversation, error } = await supabase
      .browser()
      .from("conversations")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newConversation;
  }, []);

  const updateConversation = useCallback(async (id: unknown, updates: unknown) => {
    const { data: updatedConversation, error } = await supabase
      .browser()
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updatedConversation;
  }, []);

  return {
    conversations: (query.data || []).filter(Boolean), // Filter out any null/undefined values
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createConversation,
    updateConversation,
  };
}
