/**
 * Simple Broadcast Utility
 * Shared broadcasting functionality for widget and dashboard APIs
 */

import { createWidgetClient } from "@/lib/supabase/widget-client";

/**
 * Simple broadcast function for real-time communication
 * Uses standardized channel naming and payload format
 */
export async function simpleBroadcast(
  organizationId: string,
  conversationId: string,
  event: string,
  data: Record<string, unknown>
) {
  const supabase = createWidgetClient();

  // STANDARDIZED: Channel names using centralized conventions (specification compliant)
  const orgChannelName = `org:${organizationId}`;
  const convChannelName = `org:${organizationId}:conv:${conversationId}`;

  // CRITICAL FIX: Use Supabase's expected broadcast format
  const payload = {
    event,
    payload: {
      ...data,
      organizationId,
      conversationId,
      timestamp: new Date().toISOString(),
    },
  } as const;

  try {
    const orgChannel = supabase.channel(orgChannelName, {
      config: { broadcast: { ack: false, self: false } },
    });
    const convChannel = supabase.channel(convChannelName, {
      config: { broadcast: { ack: false, self: false } },
    });

    await Promise.allSettled([orgChannel.send(payload), convChannel.send(payload)]);

    // Detach channels immediately to prevent socket buildup
    supabase.removeChannel(orgChannel);
    supabase.removeChannel(convChannel);

  } catch (error) {

    throw error;
  }
}

/**
 * Broadcast typing indicator with content preview
 */
export async function broadcastTyping(
  organizationId: string,
  conversationId: string,
  typingData: {
    isTyping: boolean;
    userId: string;
    userName: string;
    content?: string;
  }
) {
  await simpleBroadcast(organizationId, conversationId, "typing", {
    ...typingData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast new message
 */
export async function broadcastMessage(
  organizationId: string,
  conversationId: string,
  messageData: Record<string, unknown>
) {
  await Promise.all([
    simpleBroadcast(organizationId, conversationId, "new_message", {
      message: messageData,
      conversationId,
      organizationId,
    }),
    simpleBroadcast(organizationId, conversationId, "message_created", {
      message: messageData,
      conversationId,
      organizationId,
    }),
  ]);
}

/**
 * Broadcast conversation update
 */
export async function broadcastConversationUpdate(
  organizationId: string,
  conversationId: string,
  updateData: Record<string, unknown>
) {
  await simpleBroadcast(organizationId, conversationId, "conversation_updated", {
    conversation: updateData,
    conversationId,
    organizationId,
  });
}

/**
 * Broadcast read receipt
 */
export async function broadcastReadReceipt(
  organizationId: string,
  conversationId: string,
  readReceiptData: {
    messageId: string;
    readBy: "visitor" | "agent";
    readAt: string;
    visitorId?: string;
    userId?: string;
  }
) {
  await simpleBroadcast(organizationId, conversationId, "read_receipt", {
    ...readReceiptData,
    conversationId,
    organizationId,
    timestamp: new Date().toISOString(),
  });
}
