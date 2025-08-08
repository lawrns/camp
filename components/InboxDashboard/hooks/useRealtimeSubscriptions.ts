import { useEffect, useState, useCallback, useMemo } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { broadcastToChannel } from "@/lib/realtime/standardized-realtime";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import { RealtimeLogger } from "@/lib/realtime/enhanced-monitoring";
import { supabase } from "@/lib/supabase";
import type { RealtimeMessagePayload } from "@/lib/realtime/constants";

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  role: string;
  avatarUrl?: string;
}

export interface UseRealtimeSubscriptionsConfig {
  organizationId?: string;
  conversationId?: string;
  userId?: string;
}

export interface UseRealtimeSubscriptionsReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: string;
  error: string | null;

  // Actions
  sendMessage: (content: string, senderType?: "agent" | "customer") => Promise<boolean>;
  broadcastTyping: (isTyping: boolean) => void;
  disconnect: () => void;
  updatePresence: (status: "online" | "away" | "offline") => Promise<void>;

  // Online users
  onlineUsers: OnlineUser[];
}

/**
 * Hook for managing real-time subscriptions and messaging
 * Separates real-time logic from the main component
 */
export function useRealtimeSubscriptions(config: UseRealtimeSubscriptionsConfig): UseRealtimeSubscriptionsReturn {
  const { organizationId, conversationId, userId } = config;
  
  // Real-time data using standardized hook with memoized config
  const realtimeConfig = useMemo(() => ({
    type: "dashboard" as const,
    organizationId,
    conversationId,
    userId,
  }), [organizationId, conversationId, userId]);

  const [realtimeState, realtimeActions] = useRealtime(realtimeConfig);
  
  // Extract values from realtime state
  const { isConnected, connectionStatus, error: realtimeError } = realtimeState;
  const { sendMessage: realtimeSendMessage, broadcastTyping, disconnect } = realtimeActions;

  // Enhanced send message with proper error handling and broadcasting
  const sendMessage = useCallback(async (content: string, senderType: "agent" | "customer" = "agent"): Promise<boolean> => {
    if (!organizationId || !conversationId || !content.trim()) {
      console.warn("[useRealtimeSubscriptions] Missing required parameters for sending message");
      return false;
    }

    try {
      // Use the realtime hook's send message function
      const success = await realtimeSendMessage(content, senderType);
      
      if (success) {
        console.log("[useRealtimeSubscriptions] Message sent successfully via realtime");
        return true;
      } else {
        console.error("[useRealtimeSubscriptions] Failed to send message via realtime");
        return false;
      }
    } catch (error) {
      console.error("[useRealtimeSubscriptions] Error sending message:", error);
      return false;
    }
  }, [organizationId, conversationId, realtimeSendMessage]);

  // Enhanced broadcast message for direct channel communication
  const broadcastMessage = useCallback(async (
    messageData: unknown,
    eventType: string = UNIFIED_EVENTS.MESSAGE_CREATED
  ): Promise<boolean> => {
    if (!organizationId || !conversationId) {
      console.warn("[useRealtimeSubscriptions] Missing required parameters for broadcasting");
      return false;
    }

    try {
      const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);
      const success = await broadcastToChannel(channelName, eventType, messageData);
      
      if (success) {
        RealtimeLogger.broadcast(channelName, eventType, true);
        console.log(`[useRealtimeSubscriptions] Broadcast successful: ${channelName}`);
      } else {
        RealtimeLogger.broadcast(channelName, eventType, false, "Broadcast failed");
        console.error(`[useRealtimeSubscriptions] Broadcast failed: ${channelName}`);
      }
      
      return success;
    } catch (error) {
      console.error("[useRealtimeSubscriptions] Error broadcasting message:", error);
      RealtimeLogger.error("message broadcast", error);
      return false;
    }
  }, [organizationId, conversationId]);

  // Real-time presence tracking
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Fetch initial online users
  useEffect(() => {
    if (!organizationId) return;

    const fetchOnlineUsers = async () => {
      try {
        // Guarded fetch: avoid throwing in UI; tolerate RLS or schema mismatch
        const client = supabase.browser();
        const query = client
          .from('profiles')
          .select('user_id, full_name, email, is_online, last_seen_at, role, avatar_url')
          .eq('organization_id', organizationId)
          .eq('is_online', true);
        const { data: profiles, error } = await query;

        if (error) {
          // Soft fail: do not spam console or break layout
          return;
        }

        const users: OnlineUser[] = (profiles || []).map((profile: any) => ({
          id: profile.user_id,
          name: profile.full_name || profile.email || 'Unknown User',
          email: profile.email,
          isOnline: Boolean(profile.is_online),
          lastSeenAt: profile.last_seen_at,
          role: profile.role || 'member',
          avatarUrl: profile.avatar_url || undefined,
        }));

        setOnlineUsers(users);
        console.log('[useRealtimeSubscriptions] Loaded online users:', users.length);
      } catch (_error) {
        // Swallow errors to avoid layout disruption
      }
    };

    fetchOnlineUsers();
  }, [organizationId]);

  // Subscribe to presence updates
  useEffect(() => {
    if (!organizationId) return;

    let unsubscribe: (() => void) | null = null;

    const setupPresenceSubscription = async () => {
      try {
        const { subscribeToChannel } = await import('@/lib/realtime/standardized-realtime');

        unsubscribe = subscribeToChannel(
          UNIFIED_CHANNELS.agentsPresence(organizationId),
          UNIFIED_EVENTS.PRESENCE_UPDATE,
          (payload: { userId?: string; status?: string; userName?: string; userEmail?: string; lastSeen?: string; role?: string; avatarUrl?: string }) => {
            console.log('[useRealtimeSubscriptions] Presence update:', payload);

            if (payload.userId && payload.status) {
              setOnlineUsers(prev => {
                const existingIndex = prev.findIndex(user => user.id === payload.userId);

                if (payload.status === 'offline') {
                  // Remove user from online list
                  return prev.filter(user => user.id !== payload.userId);
                } else {
                  // Add or update user
                  const updatedUser: OnlineUser = {
                    id: payload.userId,
                    name: payload.userName || 'Unknown User',
                    email: payload.userEmail || '',
                    isOnline: payload.status === 'online',
                    lastSeenAt: payload.lastSeen,
                    role: payload.role || 'member',
                    avatarUrl: payload.avatarUrl,
                  };

                  if (existingIndex >= 0) {
                    // Update existing user
                    const newUsers = [...prev];
                    newUsers[existingIndex] = updatedUser;
                    return newUsers;
                  } else {
                    // Add new user
                    return [...prev, updatedUser];
                  }
                }
              });
            }
          }
        );
      } catch (error) {
        console.error('[useRealtimeSubscriptions] Failed to setup presence subscription:', error);
      }
    };

    setupPresenceSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [organizationId]);

  // Update user presence via API to ensure unified storage and broadcast
  const updatePresence = useCallback(async (status: "online" | "away" | "offline") => {
    if (!organizationId || !userId) return;

    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[useRealtimeSubscriptions] Presence API error:', err?.error || res.statusText);
      }
    } catch (error) {
      console.error('[useRealtimeSubscriptions] Failed to update presence:', error);
    }
  }, [organizationId, userId]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error: realtimeError,

    // Actions
    sendMessage,
    broadcastTyping,
    disconnect,
    updatePresence,

    // Online users
    onlineUsers,
  };
}
