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
        // CRITICAL-002 FIX: Use proper Supabase client method
        const { data: profiles, error } = await supabase.browser()
          .from('profiles')
          .select('user_id, fullName, email, isOnline, lastSeenAt, role, avatarUrl')
          .eq('organization_id', organizationId)
          .eq('isOnline', true);

        if (error) {
          console.error('[useRealtimeSubscriptions] Error fetching online users:', error);
          return;
        }

        const users: OnlineUser[] = (profiles || []).map(profile => ({
          id: profile.user_id,
          name: profile.fullName || profile.email || 'Unknown User',
          email: profile.email,
          isOnline: profile.isOnline,
          lastSeenAt: profile.lastSeenAt,
          role: profile.role || 'member',
          avatarUrl: profile.avatarUrl,
        }));

        setOnlineUsers(users);
        console.log('[useRealtimeSubscriptions] Loaded online users:', users.length);
      } catch (error) {
        console.error('[useRealtimeSubscriptions] Failed to fetch online users:', error);
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

  // Update user presence
  const updatePresence = useCallback(async (status: "online" | "away" | "offline") => {
    if (!organizationId || !userId) return;

    try {
      // Update presence in database
      const { error } = await supabase.client
        .from('profiles')
        .update({
          isOnline: status === 'online',
          lastSeenAt: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('[useRealtimeSubscriptions] Error updating presence:', error);
        return;
      }

      // Broadcast presence update
      await broadcastToChannel(
        UNIFIED_CHANNELS.agentsPresence(organizationId),
        UNIFIED_EVENTS.PRESENCE_UPDATE,
        {
          userId,
          status,
          lastSeen: new Date().toISOString(),
          organizationId,
          timestamp: new Date().toISOString(),
        }
      );

      console.log('[useRealtimeSubscriptions] Presence updated:', status);
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
