/**
 * 🔥 UNIFIED TYPING PREVIEW SYSTEM
 *
 * Connects all typing indicator components with standardized realtime channels
 * Provides 200ms throttling, live content preview, and AI simulation support
 */

import { useAuth } from "@/hooks/useAuth";
import { createApiClient } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import { broadcastTypingStart, broadcastTypingStop } from "./native-supabase";

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
  content?: string; // Live preview content
  senderType?: "agent" | "visitor" | "system";
}

interface UseTypingPreviewReturn {
  typingUsers: TypingUser[];
  broadcastTyping: (conversationId: string, content?: string) => void;
  stopTyping: (conversationId: string) => void;
  isTyping: boolean;
  updateTypingContent: (conversationId: string, content: string) => void;
}

/**
 * Enhanced typing preview hook with live content and database integration
 */
export function useTypingPreview(conversationId?: string): UseTypingPreviewReturn {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>("");

  // Clean up old typing indicators (users who stopped typing)
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(
        (prev) => prev.filter((user) => Date.now() - user.timestamp < 3000) // Remove after 3 seconds
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Throttled content update function (200ms throttle)
  const updateTypingContent = useCallback(
    (convId: string, content: string) => {
      if (!organizationId || !user || !convId) return;

      // Skip if content hasn't changed
      if (content === lastContentRef.current) return;
      lastContentRef.current = content;

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Throttle updates to 200ms
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          const supabase = createApiClient();

          // Update typing indicator with live content
          await supabase.from("typing_indicators").upsert({
            conversation_id: parseInt(convId),
            user_id: user.id,
            sender_type: "agent",
            is_typing: content.length > 0,
            content: content.substring(0, 500), // Limit content length
            updated_at: new Date().toISOString(),
          });

          // Broadcast via realtime channel
          const channelName = `org:${organizationId}:conversation:${convId}`;
          const supabaseClient = createApiClient();
          const channel = supabaseClient.channel(channelName);

          await channel.send({
            type: "broadcast",
            event: "typing_preview",
            payload: {
              userId: user.id,
              userName: user.email || "Agent",
              content: content.substring(0, 100), // Shorter for broadcast
              isTyping: content.length > 0,
              timestamp: Date.now(),
              senderType: "agent",
            },
          });
        } catch (error) {

        }
      }, 200);
    },
    [organizationId, user]
  );

  // Function to broadcast typing start
  const broadcastTyping = useCallback(
    (convId: string, content?: string) => {
      if (!organizationId || !user) return;

      setIsTyping(true);

      if (content !== undefined) {
        updateTypingContent(convId, content);
      } else {
        broadcastTypingStart(organizationId, convId, user.id, user.email || "Agent");
      }
    },
    [organizationId, user, updateTypingContent]
  );

  // Function to stop typing broadcast
  const stopTyping = useCallback(
    (convId: string) => {
      if (!organizationId || !user) return;

      setIsTyping(false);
      lastContentRef.current = "";

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      broadcastTypingStop(organizationId, convId, user.id);
    },
    [organizationId, user]
  );

  // Subscribe to realtime typing events
  useEffect(() => {
    if (!conversationId || !organizationId) return;

    const supabase = createApiClient();
    const channelName = `org:${organizationId}:conversation:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "typing_preview" }, (payload) => {
        const { userId, userName, content, isTyping: userIsTyping, senderType, timestamp } = payload.payload;

        // Don't show own typing
        if (userId === user?.id) return;

        if (userIsTyping) {
          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== userId);
            return [
              ...filtered,
              {
                userId,
                userName: userName || "Unknown User",
                content: content || "",
                senderType: senderType || "visitor",
                timestamp: timestamp || Date.now(),
              },
            ];
          });
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, organizationId, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    broadcastTyping,
    stopTyping,
    isTyping,
    updateTypingContent,
  };
}

/**
 * Display hook for typing previews (backward compatibility)
 */
export function useTypingPreviewDisplay(conversationId: string) {
  const { typingUsers } = useTypingPreview(conversationId);

  return {
    activePreviews: typingUsers,
    hasActivePreviews: typingUsers.length > 0,
  };
}
