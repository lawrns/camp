// Hook for managing conversations list with real-time updates

import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
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
      // Use the widget conversations API to get all conversations for the organization
      const response = await fetch(`/api/widget/conversations?organizationId=${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const result = await response.json();
      const data = result.conversations || [];

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

    // Set up real-time subscription using unified channel standards
    const client = supabase.browser();
    const channelName = UNIFIED_CHANNELS.conversations(organizationId);

    const channel = client.channel(channelName, {
      config: {
        presence: { key: "dashboard" },
        broadcast: { self: true },
      },
    });

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
      // Listen for broadcast events from widget using unified events
      .on("broadcast", { event: UNIFIED_EVENTS.CONVERSATION_UPDATED }, (payload) => {

        const { payload: data } = payload;

        // Handle conversation updated broadcasts from widget messages
        if (data?.conversationId) {
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

      })
      // Also listen for message events to update conversation previews
      .on("broadcast", { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload) => {
        const { payload: data } = payload;

        if (data?.message) {
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
                  unreadCount: message.senderType !== "agent" ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
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
      .update({ unread: false })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    if (error) {

    }
  } catch (err) {

  }
};
