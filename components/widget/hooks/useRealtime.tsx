"use client";

import { useRealtime as useStandardRealtime } from "@/hooks/useRealtime";
import { realtimeLogger } from "@/lib/utils/logger";
import { useEffect, useState } from "react";
import { z } from "zod";

// Define StandardMessage type locally
interface StandardMessage {
  id: string;
  content: string;
  conversationId: string;
  senderType: "visitor" | "agent" | "ai";
  timestamp: string;
  metadata: Record<string, any>;
}

// Validation schemas for widget parameters
const conversationIdSchema = z.string().uuid().optional();
const userIdSchema = z.string().min(1).optional();

// Legacy interface for backward compatibility
interface RealtimeMetrics {
  messageLatency: number;
  connectionUptime: number;
  messagesReceived: number;
  messagesSent: number;
}

interface UseRealtimeReturn {
  messages: StandardMessage[];
  sendMessage: (content: string) => Promise<void>;
  isConnected: boolean;
  isTyping: boolean;
  conversationId: string | null;
  metrics: RealtimeMetrics;
  startTyping: () => void;
  stopTyping: () => void;
}

/**
 * Widget-specific useRealtime hook
 * Now uses the standardized realtime implementation
 */
export function useRealtime(
  organizationId: string,
  providedConversationId?: string,
  providedUserId?: string
): UseRealtimeReturn {
  // Validate input parameters
  const validatedConversationId = conversationIdSchema.safeParse(providedConversationId);
  const validatedUserId = userIdSchema.safeParse(providedUserId);

  if (providedConversationId && !validatedConversationId.success) {
    realtimeLogger.warn("Invalid conversationId format, ignoring:", providedConversationId);
  }

  if (providedUserId && !validatedUserId.success) {
    realtimeLogger.warn("Invalid userId format, ignoring:", providedUserId);
  }
  const [conversationId, setConversationId] = useState<string | null>(
    (validatedConversationId.success ? validatedConversationId.data : null) || null
  );

  // Initialize conversation and authentication only if not provided
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        // Authenticate widget and get conversation ID
        const response = await fetch("/api/widget/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        });

        if (!response.ok) {
          throw new Error(`Auth failed: ${response.status}`);
        }

        const { conversationId: newConversationId, conversation } = await response.json();
        setConversationId(newConversationId);

        // Log shared conversation details for debugging
        console.log('[Widget Realtime] Using shared conversation:', {
          id: newConversationId,
          status: conversation?.status,
          priority: conversation?.priority
        });
      } catch (error) {
        realtimeLogger.error("Widget auth failed:", error);
      }
    };

    if (organizationId && !providedConversationId) {
      initializeWidget();
    }
  }, [organizationId, providedConversationId]);

  // Use standardized realtime hook
  const [state, actions] = useStandardRealtime({
    type: "widget",
    organizationId,
    conversationId: conversationId || undefined,
    userId: providedUserId,
  });

  // Mock data for backward compatibility (since the standardized hook doesn't provide these yet)
  const [messages, setMessages] = useState<StandardMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    messageLatency: 0,
    connectionUptime: 0,
    messagesReceived: 0,
    messagesSent: 0,
  });

  // Send message function that persists to database
  const sendMessage = async (content: string) => {
    if (!conversationId) {
      throw new Error("No conversation ID available");
    }

    try {
      // First, send message to API to persist in database
      const response = await fetch("/api/widget/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": organizationId,
        },
        body: JSON.stringify({
          conversationId,
          content,
          senderType: "visitor",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      console.log("[Widget] Message sent to API:", result);

      // Then broadcast via realtime
      const success = await actions.sendMessage({
        content,
        conversationId,
        senderType: "visitor",
        timestamp: new Date().toISOString(),
      });

      if (success) {
        // Add message to local state
        const newMessage: StandardMessage = {
          id: result.message?.id || `temp-${Date.now()}`,
          content,
          conversationId,
          senderType: "visitor",
          timestamp: new Date().toISOString(),
          metadata: {},
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error("[Widget] Failed to send message:", error);
      throw error;
    }
  };

  // Mock typing functions
  const startTyping = async () => {
    if (providedUserId && conversationId) {
      await actions.broadcastTyping(true);
    }
  };

  const stopTyping = async () => {
    if (providedUserId && conversationId) {
      await actions.broadcastTyping(false);
    }
  };

  return {
    messages,
    sendMessage,
    isConnected: state.isConnected,
    isTyping,
    conversationId,
    metrics,
    startTyping,
    stopTyping,
  };
}
