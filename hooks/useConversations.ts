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

      const { data, error } = await supabase
        .browser()
        .from("conversations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[useConversations] Supabase error:", error);
        throw error;
      }

      console.log("[useConversations] Successfully fetched conversations:", data?.length || 0, "conversations");
      console.log("[useConversations] Organization ID used:", organizationId);
      return data;
    },
    enabled: !shouldSkipQuery, // Skip on homepage and when no organizationId
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set up real-time subscription
  useEffect(() => {
    if (shouldSkipQuery) return;

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

          queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
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

          queryClient.setQueryData(["conversations", organizationId], (old: any[] | undefined) => {
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
  }, [queryClient, shouldSkipQuery]);

  const createConversation = useCallback(async (data: any) => {
    const { data: newConversation, error } = await supabase
      .browser()
      .from("conversations")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return newConversation;
  }, []);

  const updateConversation = useCallback(async (id: any, updates: any) => {
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
