"use client";

import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

// Toggle detailed native Supabase realtime logs by setting
// NEXT_PUBLIC_ENABLE_NATIVE_SUPABASE_DEBUG=true in your .env.local
const DEBUG_NATIVE_SUPABASE = process.env.NEXT_PUBLIC_ENABLE_NATIVE_SUPABASE_DEBUG === "true";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debugLog(...args: unknown[]) {
  if (DEBUG_NATIVE_SUPABASE) {
    // eslint-disable-next-line no-console
  }
}

// Simple fallback for useCampfireStore
const useCampfireStore = () => ({
  updateConversationFromRealtime: (params?: unknown) => {
    // No-op fallback function that accepts parameters
  },
});

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error" | "reconnecting";
type MessagePayload = {
  new: unknown;
  old?: unknown;
  eventType: "INSERT" | "UPDATE" | "DELETE";
};

interface ConnectionHealth {
  status: ConnectionStatus;
  lastConnected: Date | null;
  reconnectAttempts: number;
  latency: number;
  messagesReceived: number;
  messagesSent: number;
}

interface UseNativeRealtimeOptions {
  onNewMessage?: (message: unknown) => void;
  onMessageStatusUpdate?: (statusUpdate: unknown) => void;
  onConversationUpdate?: (update: unknown) => void;
  onNewConversation?: (conversation: unknown) => void;
  onTypingStart?: (data: { userId: string; userName: string; conversationId: string }) => void;
  onTypingStop?: (data: { userId: string; conversationId: string }) => void;
  onPresenceUpdate?: (data: { userId: string; isOnline: boolean; lastSeen: string }) => void;
}

/**
 * Native Supabase Realtime Hook - Organization Level
 * Replaces lean-client with direct Supabase realtime subscriptions
 */
export function useNativeOrganizationRealtime(organizationId: string, options: UseNativeRealtimeOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    status: "disconnected",
    lastConnected: null,
    reconnectAttempts: 0,
    latency: 0,
    messagesReceived: 0,
    messagesSent: 0,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseClient = supabase.browser();
  const { updateConversationFromRealtime } = useCampfireStore();

  // Processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Auto-reconnect functionality
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const backoffDelay = Math.min(1000 * Math.pow(2, connectionHealth.reconnectAttempts), 30000);
    debugLog("🔄 [Native] Scheduling reconnect in", backoffDelay, "ms");

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionHealth((prev) => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
        status: "reconnecting",
      }));
      setConnectionStatus("reconnecting");
      connect();
    }, backoffDelay);
  }, [connectionHealth.reconnectAttempts]);

  // Connection health monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      const channel = channelRef.current;
      if (channel && connectionStatus === "connected") {
        const startTime = performance.now();

        // Send heartbeat and measure latency
        channel
          .send({
            type: "broadcast",
            event: "heartbeat",
            payload: { timestamp: Date.now() },
          })
          .then(() => {
            const latency = performance.now() - startTime;
            setConnectionHealth((prev) => ({
              ...prev,
              latency,
              status: "connected",
            }));
          })
          .catch(() => {
            debugLog("💔 [Native] Heartbeat failed, connection may be lost");
            setConnectionStatus("error");
            scheduleReconnect();
          });
      }
    }, 30000); // Heartbeat every 30 seconds
  }, [connectionStatus, scheduleReconnect]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Use ref for options to avoid re-subscriptions
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track if component is mounted to prevent state updates during cleanup
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!organizationId) {
      setConnectionStatus("disconnected");
      return;
    }

    debugLog("🔥 [Native] Setting up native Supabase realtime for:", organizationId);
    setConnectionStatus("connecting");

    // Create organization-scoped channel with enhanced config
    const channelName = `org:${organizationId}`;
    const channel = supabaseClient.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: `user_${Date.now()}` },
      },
    });

    // Define handlers inside useEffect to access current state
    const handleNewMessage = (payload: MessagePayload) => {
      const message = payload.new;
      debugLog("🔥 [Native] New message received:", message);

      // Prevent duplicate processing
      if (processedMessageIds.current.has(message.id)) {
        debugLog("🔥 [Native] Skipping duplicate message:", message.id);
        return;
      }
      processedMessageIds.current.add(message.id);

      // Update conversation with new message
      if (message.conversation_id) {
        updateConversationFromRealtime({
          conversationId: message.conversation_id,
          lastMessage: message,
          lastMessageAt: message.created_at,
          unreadCount: 1,
        });
      }

      // Call the callback with current options
      optionsRef.current.onNewMessage?.(message);
    };

    const handleConversationUpdate = (payload: MessagePayload) => {
      const conversation = payload.new;
      debugLog("🔥 [Native] Conversation updated:", conversation);

      // Update conversation in store
      updateConversationFromRealtime({
        conversationId: conversation.id,
        ...conversation,
      });

      // Call the callback with current options
      optionsRef.current.onConversationUpdate?.(conversation);
    };

    const handleNewConversation = (payload: MessagePayload) => {
      const conversation = payload.new;
      debugLog("🔥 [Native] New conversation created:", conversation);

      // Call the callback with current options
      optionsRef.current.onNewConversation?.(conversation);
    };

    const handleBroadcastEvent = (broadcastData: unknown) => {
      const { event, payload } = broadcastData;
      debugLog("🔥 [Native] Broadcast event received:", event, payload);

      switch (event) {
        case "typing:start":
          optionsRef.current.onTypingStart?.(payload);
          break;
        case "typing:stop":
          optionsRef.current.onTypingStop?.(payload);
          break;
        case "presence:update":
          optionsRef.current.onPresenceUpdate?.(payload);
          break;
        case "message:status":
          optionsRef.current.onMessageStatusUpdate?.(payload);
          break;
      }
    };

    // Listen for new conversations
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversations",
        filter: `organization_id=eq.${organizationId}`,
      },
      handleNewConversation
    );

    // TEMPORARILY DISABLED: Conversation postgres_changes subscription causing binding mismatch
    console.log('[Native] Conversation PostgreSQL subscription temporarily disabled due to binding mismatch');
    /*
    // Listen for conversation updates
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `organization_id=eq.${organizationId}`,
      },
      handleConversationUpdate
    );
    */

    // Listen for new messages (organization-wide)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `organization_id=eq.${organizationId}`,
      },
      handleNewMessage
    );

    // Listen for broadcast events
    channel.on("broadcast", { event: "*" }, handleBroadcastEvent);

    // Subscribe to the channel
    channel.subscribe((status: unknown) => {
      debugLog("🔥 [Native] Channel subscription status:", status);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      switch (status) {
        case "SUBSCRIBED":
          debugLog("🔥 [Native] Successfully subscribed to organization channel");
          setConnectionStatus("connected");
          setError(null);
          setConnectionHealth((prev) => ({
            ...prev,
            status: "connected",
            lastConnected: new Date(),
            reconnectAttempts: 0,
          }));
          startHeartbeat();
          break;
        case "CHANNEL_ERROR":
          debugLog("💥 [Native] Channel error, scheduling reconnect");
          setConnectionStatus("error");
          setError("Failed to subscribe to realtime channel");
          stopHeartbeat();
          scheduleReconnect();
          break;
        case "CLOSED":
          debugLog("🔌 [Native] Channel closed, scheduling reconnect");
          setConnectionStatus("disconnected");
          stopHeartbeat();
          scheduleReconnect();
          break;
        default:
          setConnectionStatus("connecting");
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      debugLog("🔥 [Native] Cleaning up native realtime");
      isMountedRef.current = false; // Mark as unmounted before cleanup

      // Clear timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      stopHeartbeat();

      // Clean up channel
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      processedMessageIds.current.clear();
    };
  }, [organizationId, supabaseClient, updateConversationFromRealtime]);

  return {
    connectionStatus,
    connectionHealth,
    error,
    channel: channelRef.current,
  };
}

/**
 * Broadcast typing indicator start event
 */
export async function broadcastTypingStart(
  organizationId: string,
  conversationId: string,
  userId: string,
  userName: string
) {
  const channel = supabase.browser().channel(`org:${organizationId}`);

  await channel.send({
    type: "broadcast",
    event: "typing_start",
    payload: {
      conversationId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Broadcast typing indicator stop event
 */
export async function broadcastTypingStop(organizationId: string, conversationId: string, userId: string) {
  const channel = supabase.browser().channel(`org:${organizationId}`);

  await channel.send({
    type: "broadcast",
    event: "typing_stop",
    payload: {
      conversationId,
      userId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Broadcast presence update event
 */
export async function broadcastPresenceUpdate(organizationId: string, userId: string, isOnline: boolean) {
  const channel = supabase.browser().channel(`org:${organizationId}`);

  await channel.send({
    type: "broadcast",
    event: "presence_update",
    payload: {
      userId,
      isOnline,
      lastSeen: new Date().toISOString(),
    },
  });
}

/**
 * Native Supabase Realtime Hook - Conversation Level
 * For individual conversation subscriptions
 */
export function useNativeConversationRealtime(
  organizationId: string,
  conversationId?: string,
  options: { onNewMessage?: (message: unknown) => void } = {}
) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseClient = supabase.browser();

  const handleNewMessage = useCallback(
    (payload: MessagePayload) => {
      const message = payload.new;
      debugLog("🔥 [Native] New message for conversation:", conversationId, message);
      options.onNewMessage?.(message);
    },
    [conversationId, options]
  );

  useEffect(() => {
    if (!organizationId || !conversationId) {
      setConnectionStatus("disconnected");
      return;
    }

    debugLog("🔥 [Native] Setting up conversation realtime for:", conversationId);
    setConnectionStatus("connecting");

    // Create conversation-scoped channel
    const channelName = `org:${organizationId}:conversation:${conversationId}`;
    const channel = supabaseClient.channel(channelName);

    // Listen for new messages in this conversation
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      handleNewMessage
    );

    // Subscribe to the channel
    channel.subscribe((status: unknown) => {
      debugLog("🔥 [Native] Conversation channel status:", status);

      switch (status) {
        case "SUBSCRIBED":
          setConnectionStatus("connected");
          setError(null);
          break;
        case "CHANNEL_ERROR":
          setConnectionStatus("error");
          setError("Failed to subscribe to conversation realtime");
          break;
        case "CLOSED":
          setConnectionStatus("disconnected");
          break;
        default:
          setConnectionStatus("connecting");
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      debugLog("🔥 [Native] Cleaning up conversation realtime");
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus("disconnected");
    };
  }, [organizationId, conversationId, supabase, handleNewMessage]);

  return {
    connectionStatus,
    error,
    channel: channelRef.current,
  };
}

/**
 * Native Broadcasting Functions
 * Replace lean-server broadcasting with direct Supabase
 */
export const nativeBroadcast = {
  toOrganization: (organizationId: string, event: string, payload: unknown) => {
    const supabaseClient = supabase.browser();
    const channelName = `org:${organizationId}`;

    return supabaseClient.channel(channelName).send({
      type: "broadcast",
      event,
      payload,
    });
  },

  toConversation: (organizationId: string, conversationId: string, event: string, payload: unknown) => {
    const supabaseClient = supabase.browser();
    const channelName = `org:${organizationId}:conversation:${conversationId}`;

    return supabaseClient.channel(channelName).send({
      type: "broadcast",
      event,
      payload,
    });
  },
};
