// Remove store import as we're not using it
/**
 * Typing Indicator Component - MASSUPGRADE.md Phase 3
 *
 * Connects to /api/realtime/typing endpoint
 * Provides real-time typing indicators using centralized ChannelManager
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { channelManager } from "@/lib/realtime/ChannelManager";
import { Icon } from "@/lib/ui/Icon";
import { useTypingUsers } from "@/store/memoized-selectors-improved";
import { MessageCircle as MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TypingUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  userType: "agent" | "visitor" | "ai";
  timestamp: string;
}

interface TypingEventPayload {
  eventType: string;
  payload: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    timestamp: string;
  };
}

interface TypingIndicatorProps {
  conversationId: string;
  organizationId: string;
  currentUserId?: string;
  className?: string;
}

export function TypingIndicator({
  conversationId,
  organizationId,
  currentUserId,
  className = "",
}: TypingIndicatorProps) {
  const typingUsers = useTypingUsers(conversationId);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Remove users dependency as it's not used

  // Clean up typing indicators older than 5 seconds
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      typingUsers.forEach((user: TypingUser) => {
        if (user.timestamp && now - new Date(user.timestamp).getTime() > 5000) {
          // Remove user from typingUsers
          // This is a placeholder implementation. You might want to update the state accordingly
        }
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, [typingUsers]);

  // Handle typing events from real-time channel
  const handleTypingEvent = useCallback(
    (event: unknown) => {
      const payload = event as TypingEventPayload;
      const { eventType, payload: data } = payload;

      if (eventType === "typing" && data?.conversationId === conversationId) {
        const { userId, isTyping, timestamp } = data;

        // Don't show typing indicator for current user
        if (userId === currentUserId) return;

        if (isTyping) {
          // Add or update typing user
          // This is a placeholder implementation. You might want to update the state accordingly
        } else {
          // Remove typing user
          // This is a placeholder implementation. You might want to update the state accordingly
        }
      }
    },
    [conversationId, currentUserId]
  );

  // Subscribe to presence channel for typing events
  useEffect(() => {
    let subId: string | null = null;

    const subscribe = async () => {
      try {
        subId = await channelManager.subscribeToPresence(
          organizationId,
          currentUserId || "anonymous",
          handleTypingEvent
        );
        setSubscriptionId(subId);
      } catch (error) {}
    };

    void subscribe();

    return () => {
      if (subId) {
        // channelManager.unsubscribe(subId);
        // Note: unsubscribe method doesn't exist on channelManager
        // This should be implemented or use a different cleanup method
      }
    };
  }, [organizationId, currentUserId, handleTypingEvent]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!currentUserId) return;

      try {
        channelManager.sendTyping(
          {
            organizationId,
            conversationId,
            userId: currentUserId,
          },
          isTyping
        );
      } catch (error) {}
    },
    [organizationId, conversationId, currentUserId]
  );

  // Expose typing function for parent components
  // Note: This should be properly implemented with forwardRef if needed

  // Don't render if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "agent":
        return "bg-blue-100 text-blue-800";
      case "ai":
        return "bg-purple-100 text-purple-800";
      case "visitor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "ai":
        return "🤖";
      case "agent":
        return "👨‍💼";
      case "visitor":
        return "👤";
      default:
        return "👤";
    }
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-ds-lg border bg-[var(--fl-color-background-subtle)] spacing-2 ${className}`}
    >
      <Icon icon={MessageCircle} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />

      <div className="flex items-center gap-ds-2">
        {typingUsers.map((user: TypingUser, index: number) => (
          <div key={user.userId} className="flex items-center gap-ds-2">
            {/* User Avatar */}
            <Avatar className="h-6 w-6">
              {user.userAvatar && <AvatarImage src={user.userAvatar} alt={user.userName} />}
              <AvatarFallback className="text-tiny">{getUserTypeIcon(user.userType)}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex items-center gap-1">
              <span className="text-foreground text-sm font-medium">{user.userName}</span>
              <Badge variant="outline" className={`text-xs ${getUserTypeColor(user.userType)}`}>
                {user.userType}
              </Badge>
            </div>

            {/* Separator */}
            {index < typingUsers.length - 1 && <span className="text-gray-400">•</span>}
          </div>
        ))}
      </div>

      {/* Typing Animation */}
      <div className="flex items-center gap-1">
        <span className="text-foreground text-sm">typing</span>
        <div className="flex gap-1">
          <div className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-400" style={{ animationDelay: "0ms" }} />
          <div className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-400" style={{ animationDelay: "150ms" }} />
          <div className="h-1 w-1 animate-bounce rounded-ds-full bg-neutral-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

/**
 * @deprecated This hook is deprecated. Use hooks/useRealtime.ts instead.
 */
// Hook for sending typing indicators from input components
export function useTypingIndicator(conversationId: string, organizationId: string, currentUserId?: string) {

  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!currentUserId) return;

      try {
        channelManager.sendTyping(
          {
            organizationId,
            conversationId,
            userId: currentUserId,
          },
          typing
        );
      } catch (error) {}
    },
    [organizationId, conversationId, currentUserId]
  );

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      void sendTyping(true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      void sendTyping(false);
    }, 3000);

    setTypingTimeout(timeout);
  }, [isTyping, typingTimeout, sendTyping]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      void sendTyping(false);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [isTyping, typingTimeout, sendTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (isTyping) {
        void sendTyping(false);
      }
    };
  }, [typingTimeout, isTyping, sendTyping]);

  return {
    startTyping,
    stopTyping,
    isTyping,
  };
}

export default TypingIndicator;
