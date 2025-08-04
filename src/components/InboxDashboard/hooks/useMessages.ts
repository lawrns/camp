// Hook for managing messages with real-time updates

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { FileAttachment, Message, UseMessagesReturn } from "../types";

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
        // Fix sender_type to allowed union - match exact database constraints
        const allowedSenderTypes = ["agent", "visitor", "system", "ai_assistant", "tool"];
        let senderType: Message["sender_type"] = allowedSenderTypes.includes(message.sender_type)
          ? (message.sender_type as Message["sender_type"])
          : "visitor";  // Default to visitor if unknown type
        // Fix attachments to always be FileAttachment[]
        let attachments: FileAttachment[] = [];
        if (Array.isArray(message.attachments)) {
          attachments = message.attachments
            .filter((a: unknown) => a && typeof a === "object" && "id" in a && "name" in a && "size" in a && "type" in a)
            .map((a: unknown) => ({
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
        if (senderType === "agent" || senderType === "ai_assistant") {
          const now = new Date();
          const messageAge = now.getTime() - new Date(message.created_at).getTime();

          // Simulate read receipts based on message age
          if (messageAge > 60000) {
            // Messages older than 1 minute are "read"
            return { ...message, sender_type: senderType, attachments, read_status: "read" as const, read_at: new Date(now.getTime() - 30000).toISOString() };
          } else if (messageAge > 30000) {
            // Messages older than 30 seconds are "delivered"
            return {
              ...message,
              sender_type: senderType,
              attachments,
              read_status: "delivered" as const,
              delivered_at: new Date(now.getTime() - 15000).toISOString(),
            };
          } else {
            // Recent messages are just "sent"
            return { ...message, sender_type: senderType, attachments, read_status: "sent" as const };
          }
        }
        // For all other messages, always set read_status to 'sent'
        return { ...message, sender_type: senderType, attachments, read_status: "sent" as const };
      });

      setMessages(messagesWithReadReceipts);
    } catch (error) {
      console.error('[useMessages] Error processing messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
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

    // CRITICAL FIX: Minimal subscription to test bindings (no filters initially)
    const client = supabase.browser();
    const channelName = `db-changes-${conversationId}`;

    const channel = client.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",  // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "messages",
          // TEMPORARILY REMOVE FILTER to fix binding mismatch
          // filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[Realtime] Raw Payload:', payload);  // Debug: Inspect for binding clues

          // CRITICAL-001 FIX: Handle payload with proper type guards
          if (payload.new) {
            const message = payload.new as any;  // Properly type the database message

            // Filter on client side instead of server side (temporary fix)
            if (message.conversation_id !== conversationId) {
              console.log('[Realtime] Ignoring message from different conversation:', message.conversation_id);
              return;
            }

            console.log('[Realtime] Processing message for conversation:', conversationId);

            // CRITICAL-001 FIX: Properly handle sender_type field mapping
            const transformedMessage: Message = {
              ...message,  // Include all database columns
              senderName: message.sender_name || message.senderName || 'Anonymous',  // Handle both snake_case and camelCase
              attachments: Array.isArray(message.attachments) ? message.attachments : null,
              read_status: "sent",  // Legacy field
              // CRITICAL-001 FIX: Ensure sender_type is properly mapped from database
              sender_type: message.sender_type || "visitor",
            };

            // Avoid duplicates by checking if message already exists
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === transformedMessage.id);
              if (exists) {
                console.log('[Realtime] Duplicate message ignored:', transformedMessage.id);
                return prev;
              }
              console.log('[Realtime] Adding new message:', transformedMessage.id);
              return [...prev, transformedMessage];
            });
          }
        }
      )
      // CRITICAL FIX: Also listen for broadcast events from widget
      .on("broadcast", { event: "*" }, (payload) => {

        const { event, payload: data } = payload;

        // Handle new message broadcasts from widget
        if ((event === "new_message" || event === "message_created") && data?.message) {
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
        console.log(`[Messages] Channel status: ${status}`, error ? { error } : '');

        if (status === "SUBSCRIBED") {
          console.log(`[Messages] Successfully subscribed to conversation ${conversationId}`);
        }

        if (error) {
          console.error(`[Messages] Channel error:`, error);
          // Check for specific binding mismatch error
          if (error.message && error.message.includes('mismatch between server and client bindings')) {
            console.error('🚨 POSTGRESQL BINDING MISMATCH DETECTED! Publication may need recreation.');
          }
        }

        if (status === "CHANNEL_ERROR") {
          console.warn(`[Messages] Channel error for conversation ${conversationId}, Supabase will retry`);
          // Supabase handles reconnection automatically
        }

        if (status === "CLOSED") {
          console.warn(`[Messages] Channel closed for conversation ${conversationId}`);
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
  attachments?: unknown[]
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
      sender_type: senderType, // Use snake_case for database field
      senderName: senderName,
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
        .filter((a: unknown) => a && typeof a === "object" && "id" in a && "name" in a && "size" in a && "type" in a)
        .map((a: unknown) => ({
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
