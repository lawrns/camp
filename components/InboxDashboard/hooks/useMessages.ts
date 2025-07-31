// Hook for managing messages with real-time updates

import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { useCallback, useEffect, useState } from "react";
import type { FileAttachment, Message, UseMessagesReturn } from "../types";

interface RawAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

/**
 * Custom hook for managing messages in a conversation with real-time updates
 * @param conversationId - Conversation ID to load messages for
 * @param organizationId - Organization ID for filtering
 * @returns Messages state and management functions
 */
export const useMessages = (conversationId?: string, organizationId?: string): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from database
  const loadMessages = useCallback(async () => {
    if (!conversationId || !organizationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const client = supabase.browser();
      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {

        return;
      }

      // Add mock read receipt data for testing
      const messagesWithReadReceipts = (data || []).map((message, index) => {
        // Fix sender_type to allowed union
        const allowedSenderTypes = ["agent", "customer", "visitor", "ai"];
        const sender_type: Message["sender_type"] = allowedSenderTypes.includes(message.sender_type)
          ? (message.sender_type as Message["sender_type"])
          : "customer";
        // Fix attachments to always be FileAttachment[]
        let attachments: FileAttachment[] = [];
        if (Array.isArray(message.attachments)) {
          attachments = message.attachments
            .filter((a: unknown): a is RawAttachment =>
              a !== null && typeof a === "object" && "id" in a && "name" in a && "size" in a && "type" in a)
            .map((a: RawAttachment) => ({
              id: a.id,
              name: a.name,
              size: a.size,
              type: a.type,
              url: a.url,
              uploadStatus: a.uploadStatus,
              preview: a.preview,
            }) as FileAttachment);
        }
        // Simulate different read states for agent messages
        if (sender_type === "agent" || sender_type === "ai") {
          const now = new Date();
          const messageAge = now.getTime() - new Date(message.created_at).getTime();

          // Simulate read receipts based on message age
          if (messageAge > 60000) {
            // Messages older than 1 minute are "read"
            return { ...message, sender_type, attachments, read_status: "read" as const, read_at: new Date(now.getTime() - 30000).toISOString() };
          } else if (messageAge > 30000) {
            // Messages older than 30 seconds are "delivered"
            return {
              ...message,
              sender_type,
              attachments,
              read_status: "delivered" as const,
              delivered_at: new Date(now.getTime() - 15000).toISOString(),
            };
          } else {
            // Recent messages are just "sent"
            return { ...message, sender_type, attachments, read_status: "sent" as const };
          }
        }
        // For all other messages, always set read_status to 'sent'
        return { ...message, sender_type, attachments, read_status: "sent" as const };
      });

      setMessages(messagesWithReadReceipts);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  }, [conversationId, organizationId]);

  // Reload function for manual refresh
  const reload = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!conversationId || !organizationId) return;

    // Initial load
    loadMessages();

    // ENHANCED: Set up real-time subscription with unified channel naming standards
    const client = supabase.browser();
    const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);

    // Supabase client does not have getChannel; channel() is idempotent by name.
    const channel = client.channel(channelName, {
      config: {
        presence: { key: "dashboard_messages" },
        broadcast: { self: true },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {

          const newMessage = payload.new as Message;

          // Avoid duplicates by checking if message already exists
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      // Listen for broadcast events from widget using unified events
      .on("broadcast", { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload) => {

        const { payload: data } = payload;

        // Handle new message broadcasts from widget
        if (data?.message) {
          const newMessage = data.message as Message;

          // Only process messages for this conversation
          if (newMessage.conversation_id === conversationId) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;

              return [...prev, newMessage];
            });
          }
        }
      })
      .subscribe((status, error) => {

        if (status === "SUBSCRIBED") {

        }

        if (error) {

        }

        if (status === "CHANNEL_ERROR") {

          // Supabase handles reconnection automatically
        }

        if (status === "CLOSED") {

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
  }, [conversationId, organizationId, loadMessages]);

  return {
    messages,
    isLoading,
    reload,
    setMessages,
  };
};

/**
 * Helper function to add optimistic message
 * @param messages - Current messages array
 * @param tempMessage - Temporary message to add
 * @returns Updated messages array
 */
export const addOptimisticMessage = (
  messages: Message[],
  tempMessage: Omit<Message, "id"> & { tempId: string }
): Message[] => {
  const optimisticMessage: Message = {
    ...tempMessage,
    id: tempMessage.tempId, // Use temp ID until server responds
  };

  return [...messages, optimisticMessage];
};

/**
 * Helper function to replace optimistic message with real one
 * @param messages - Current messages array
 * @param tempId - Temporary ID to replace
 * @param realMessage - Real message from server
 * @returns Updated messages array
 */
export const replaceOptimisticMessage = (messages: Message[], tempId: string, realMessage: Message): Message[] => {
  return messages.map((msg) => (msg.id === tempId ? realMessage : msg));
};

/**
 * Helper function to remove failed optimistic message
 * @param messages - Current messages array
 * @param tempId - Temporary ID to remove
 * @returns Updated messages array
 */
export const removeOptimisticMessage = (messages: Message[], tempId: string): Message[] => {
  return messages.filter((msg) => msg.id !== tempId);
};

/**
 * Send a new message to the conversation
 * @param conversationId - Conversation ID
 * @param content - Message content
 * @param senderType - Type of sender
 * @param senderName - Name of sender
 * @param attachments - Optional file attachments
 * @returns Promise<Message | null> - Sent message or null if failed
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  senderType: Message["sender_type"],
  senderName: string,
  organizationId: string,
  attachments?: RawAttachment[]
): Promise<Message | null> => {
  try {
    // Validate message length
    if (content.length > 2000) {
      throw new Error("Message is too long. Please keep it under 2000 characters.");
    }

    // Prepare message data
    const messageData = {
      conversation_id: conversationId,
      organization_id: organizationId,
      content: content.trim(),
      sender_type: senderType,
      sender_name: senderName,
      created_at: new Date().toISOString(),
      attachments: attachments || [],
    };

    // Insert message
    const client = supabase.browser();
    const { data, error } = await client.from("messages").insert([messageData]).select().single();

    if (error) {

      throw error;
    }

    // Transform attachments to FileAttachment[] for type safety
    let safeAttachments: FileAttachment[] = [];
    if (Array.isArray(data.attachments)) {
      safeAttachments = data.attachments
        .filter((a: unknown): a is RawAttachment =>
          a !== null && typeof a === "object" && "id" in a && "name" in a && "size" in a && "type" in a)
        .map((a: RawAttachment) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          type: a.type,
          url: a.url,
          uploadStatus: a.uploadStatus,
          preview: a.preview,
        }) as FileAttachment);
    }
    return { ...data, attachments: safeAttachments } as Message;
  } catch (error) {

    return null;
  }
};
