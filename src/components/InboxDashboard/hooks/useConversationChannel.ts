// Hook for managing conversation real-time channel (typing, presence)

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UseConversationChannelReturn } from "../types";
import { getChannelName } from "../utils/channelUtils";

/**
 * Custom hook for managing conversation real-time features
 * @param conversationId - Conversation ID
 * @param organizationId - Organization ID
 * @param userId - Current user ID
 * @returns Real-time channel state and functions
 */
export const useConversationChannel = (
  conversationId?: string,
  organizationId?: string,
  userId?: string
): UseConversationChannelReturn => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs for managing timeouts and channel
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationChannelRef = useRef<any>(null);
  const isTypingRef = useRef<boolean>(false);

  // Broadcast typing status using the conversation channel
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {

      if (!conversationId || !userId || !conversationChannelRef.current) {

        return;
      }

      const payload = { user_id: userId, is_typing: isTyping };

      conversationChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload,
      });

    },
    [conversationId, userId]
  );

  // Handle typing with throttling to prevent spam
  const handleTyping = useCallback(() => {

    if (!conversationId || !userId) {

      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only send typing start if not already typing (throttle)
    if (!isTypingRef.current) {

      broadcastTyping(true);
      isTypingRef.current = true;
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {

      broadcastTyping(false);
      isTypingRef.current = false;
    }, 3000);
  }, [conversationId, userId, broadcastTyping]);

  // Stop typing immediately
  const stopTyping = useCallback(() => {
    if (!conversationId || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    broadcastTyping(false);
  }, [conversationId, userId, broadcastTyping]);

  // Set up real-time channel for conversation
  useEffect(() => {
    if (!conversationId || !organizationId || !userId) {

      setTypingUsers([]);
      setOnlineUsers([]);
      return;
    }

    // Validate organizationId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {

      return;
    }

    // Create conversation channel for both typing events and presence
    const client = supabase.browser();
    const channelName = getChannelName("conversation", organizationId, conversationId);

    // CRITICAL FIX: Check if channel already exists to prevent conflicts
    let conversationChannel = client.getChannel(channelName);
    if (!conversationChannel) {
      conversationChannel = client.channel(channelName);
    }

    conversationChannel
      .on("broadcast", { event: "typing" }, (payload) => {

        // FIXED: Handle both widget and dashboard typing payload formats
        const data = payload.payload;
        const typingUserId = data.user_id || data.sender_id || data.visitorId;
        const isTyping = data.is_typing !== undefined ? data.is_typing : data.isTyping;
        const content = data.content || "";

        if (typingUserId === userId) return; // Don't show own typing

        // Determine display name based on sender type
        let displayName = "Someone";
        if (data.sender_type === "visitor") {
          displayName = "Visitor";
        } else if (data.sender_type === "agent") {
          displayName = "Agent";
        } else {
          displayName = typingUserId?.slice(0, 8) || "Someone";
        }

        setTypingUsers((prev) => {
          if (isTyping) {
            // Use display name instead of user ID
            return [...prev.filter((u) => u !== displayName), displayName];
          } else {
            return prev.filter((u) => u !== displayName);
          }
        });
      })
      .on("broadcast", { event: "read_receipt" }, (payload) => {
        const { messageId, readBy, readAt, visitorId } = payload.payload;

        // Handle visitor read receipts (when visitor reads agent messages)
        if (readBy === "visitor" && messageId) {
          // Update UI to show message as read by visitor
          // This could trigger a state update to refresh message read status

          // You could emit an event here to update the message list
          // or use a callback prop to notify parent components
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = conversationChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {

      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {

      })
      .subscribe((status, error) => {

        if (status === "SUBSCRIBED") {
          // Store the channel reference for typing broadcasts
          conversationChannelRef.current = conversationChannel;

          // Track presence
          conversationChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });

        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          console.warn(`[ConversationChannel] Channel ${channelName} ${status}, attempting reconnection...`);

          // Attempt reconnection after delay with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          setTimeout(() => {
            if (reconnectAttempts < 5) {
              setReconnectAttempts(prev => prev + 1);
              setupChannel();
            }
          }, delay);
        }

        if (error) {
          console.error(`[ConversationChannel] Channel error:`, error);
          // Reset reconnect attempts on successful connection
          if (status === "SUBSCRIBED") {
            setReconnectAttempts(0);
          }
        }
      });

    // Cleanup function
    return () => {

      // Stop typing before cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // CRITICAL FIX: Proper cleanup sequence to prevent CLOSED errors
      if (conversationChannelRef.current) {
        try {
          conversationChannelRef.current.untrack();
          conversationChannelRef.current
            .unsubscribe()
            .then(() => {
              client.removeChannel(conversationChannelRef.current);
            })
            .catch((error) => {

              // Force remove even if unsubscribe fails
              client.removeChannel(conversationChannelRef.current);
            });
        } catch (error) {

        }
      }

      conversationChannelRef.current = null;

      // Reset state
      setTypingUsers([]);
      setOnlineUsers([]);
    };
  }, [conversationId, organizationId, userId]);

  return {
    typingUsers,
    onlineUsers,
    broadcastTyping,
    handleTyping,
    stopTyping,
  };
};

/**
 * Helper function to format typing users display
 * @param typingUsers - Array of user IDs who are typing
 * @param maxDisplay - Maximum number of users to display
 * @returns Formatted typing display string
 */
export const formatTypingUsers = (typingUsers: string[], maxDisplay: number = 3): string => {
  if (typingUsers.length === 0) return "";

  if (typingUsers.length === 1) {
    return `${typingUsers[0]} is typing...`;
  }

  if (typingUsers.length <= maxDisplay) {
    const lastUser = typingUsers[typingUsers.length - 1];
    const otherUsers = typingUsers.slice(0, -1).join(", ");
    return `${otherUsers} and ${lastUser} are typing...`;
  }

  const displayUsers = typingUsers.slice(0, maxDisplay).join(", ");
  const remainingCount = typingUsers.length - maxDisplay;
  return `${displayUsers} and ${remainingCount} others are typing...`;
};

/**
 * Helper function to check if user is online
 * @param userId - User ID to check
 * @param onlineUsers - Array of online user IDs
 * @returns Boolean indicating if user is online
 */
export const isUserOnline = (userId: string, onlineUsers: string[]): boolean => {
  return onlineUsers.includes(userId);
};
