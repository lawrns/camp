// Hook for managing conversations list with real-time updates

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { Conversation, UseConversationsReturn } from "../types";
import { mapConversation } from "../utils/channelUtils";

/**
 * Custom hook for managing conversations with real-time updates
 * @param organizationId - Organization ID to filter conversations
 * @returns Conversations state and management functions
 */
export const useConversations = (organizationId?: string): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from database
  const loadConversations = useCallback(async () => {
    if (!organizationId) {
      console.log("[useConversations] No organizationId provided, skipping load");
      setConversations([]);
      setIsLoading(false);
      return;
    }

    console.log("[useConversations] Loading conversations for organization:", organizationId);
    setIsLoading(true);
    setError(null);

    try {
      const client = supabase.browser();

      // Query conversations with all needed fields
      const { data, error } = await client
        .from("conversations")
        .select("id, subject, status, customerName, customerEmail, lastMessageAt, status, priority, tags, metadata, assignedToUserId, customerId, customerVerified, customerOnline, customerBrowser, customerOs, customerDeviceType, ragEnabled, aiHandoverActive, aiPersona, aiConfidenceScore, assignmentMetadata, assignedAt, closedAt")
        .eq("organization_id", organizationId);

      if (error) {
        console.error("[useConversations] Error loading conversations:", error);
        setError(error.message);
        return;
      }

      console.log("[useConversations] Raw conversations data:", data);

      // Map raw data to typed conversations
      const mappedConversations = (data || []).map(mapConversation);

      // Sort conversations by lastMessageAt (most recent first), handling null values
      const sortedConversations = mappedConversations.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime; // Descending order (most recent first)
      });

      console.log("[useConversations] Sorted conversations:", sortedConversations);
      setConversations(sortedConversations);
    } catch (err) {

      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Reload function for manual refresh
  const reload = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!organizationId) {

      return;
    }

    // Initial load
    loadConversations();

    // ENHANCED: Set up real-time subscription with improved error handling
    const client = supabase.browser();
    const channelName = `conversations_${organizationId}_${Date.now()}`; // Unique channel name

    // CRITICAL FIX: Check if channel already exists to prevent conflicts
    let channel = client.getChannel(channelName);
    if (!channel) {
      channel = client.channel(channelName, {
        config: {
          presence: { key: "dashboard" },
          broadcast: { self: true },
        },
      });
    }

    // TEMPORARILY DISABLED: Conversation postgres_changes subscription causing binding mismatch
    // Will use polling fallback until v2 migration
    console.log('[Conversations] PostgreSQL subscription temporarily disabled due to binding mismatch');

    /*
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const newConversation = mapConversation(payload.new);
          setConversations((prev) => [newConversation, ...prev]);
        }
      )
    */

    channel
      // CRITICAL FIX: Listen for broadcast events from widget
      .on("broadcast", { event: "*" }, (payload) => {

        const { event, payload: data } = payload;
        console.log('[Conversations] Broadcast received:', { event, data });

        // PHASE 0: Handle conversation insert broadcasts from trigger
        if (event === "conv:insert" && data?.id) {
          console.log('[Conversations] New conversation via broadcast:', data);
          const newConversation = mapConversation(data);
          setConversations((prev) => {
            const exists = prev.some((conv) => conv.id === newConversation.id);
            if (exists) return prev;
            return [newConversation, ...prev];
          });
        }

        // PHASE 0: Handle conversation update broadcasts from trigger
        if (event === "conv:update" && data?.id) {
          console.log('[Conversations] Updated conversation via broadcast:', data);
          // Invalidate and reload conversations to get fresh data
          queryClient.invalidateQueries({ queryKey: ["conversations", organizationId] });
        }

        // Handle conversation updated broadcasts from widget messages
        if (event === "conversation_updated" && data?.conversationId) {
          // Reload the specific conversation to get updated lastMessageAt
          const updateConversation = async () => {
            const { data: updated } = await client
              .from("conversations")
              .select("*")
              .eq("id", data.conversationId)
              .eq("organization_id", organizationId)
              .single();

            if (updated) {
              const updatedConversation = mapConversation(updated);
              setConversations((prev) => {
                // Move updated conversation to top and update its data
                const filtered = prev.filter((conv) => conv.id !== updatedConversation.id);
                return [updatedConversation, ...filtered];
              });
            }
          };
          updateConversation();
        }

        // Handle new message broadcasts - update conversation list
        if ((event === "new_message" || event === "message_created") && data?.message) {
          const message = data.message;
          // Update the conversation's last message preview
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === message.conversation_id) {
                return {
                  ...conv,
                  lastMessageAt: message.created_at,
                  lastMessagePreview: message.content.substring(0, 100),
                  // Increment unread count if not from agent
                  unreadCount: message.sender_type !== "agent" ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
                };
              }
              return conv;
            })
          );
        }
      })
      .subscribe((status, error) => {

        if (status === "SUBSCRIBED") {

          setError(null); // Clear any previous errors
        }

        if (error) {

          setError(`Real-time connection failed: ${error.message || "Unknown error"}`);
        }

        if (status === "CHANNEL_ERROR") {

          // Supabase handles reconnection automatically, just log it
          setError("Connection interrupted, reconnecting...");
        }

        if (status === "CLOSED") {

          setError("Real-time connection closed");
        }
      });

    // ENHANCED: Cleanup subscription with proper error handling
    return () => {

      try {
        // CRITICAL FIX: Proper cleanup sequence to prevent CLOSED errors
        if (channel) {
          channel
            .unsubscribe()
            .then(() => {
              client.removeChannel(channel);
            })
            .catch((error) => {

              // Force remove even if unsubscribe fails
              client.removeChannel(channel);
            });
        }
      } catch (cleanupError) {

      }
    };
  }, [organizationId, loadConversations]);

  return {
    conversations,
    isLoading,
    error,
    reload,
  };
};

/**
 * Helper function to update a specific conversation in the list
 * @param conversations - Current conversations array
 * @param conversationId - ID of conversation to update
 * @param updates - Partial conversation updates
 * @returns Updated conversations array
 */
export const updateConversationInList = (
  conversations: Conversation[],
  conversationId: string,
  updates: Partial<Conversation>
): Conversation[] => {
  return conversations.map((conv) => (conv.id === conversationId ? { ...conv, ...updates } : conv));
};

/**
 * Helper function to mark conversation as read
 * @param conversationId - ID of conversation to mark as read
 * @param organizationId - Organization ID
 */
export const markConversationAsRead = async (conversationId: string, organizationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("conversations")
      .update({ unreadCount: 0 })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    if (error) {

    }
  } catch (err) {

  }
};
