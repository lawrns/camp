/**
 * TypingIndicator Component
 *
 * Shows real-time typing indicators with animated dots and user avatars
 * Supports multiple users typing simultaneously with smart layout
 */

import { supabase } from "@/lib/supabase";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";
import React, { useEffect, useState } from "react";

interface TypingUser {
  id: string;
  name: string;
  avatar?: string | undefined;
  color?: string | undefined;
}

interface TypingIndicatorProps {
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Show in compact mode (just dots) */
  compact?: boolean;
  /** Maximum users to show before "and X others" */
  maxUsers?: number;
  /** Custom className */
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  compact = false,
  maxUsers = 3,
  className = "",
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animate typing dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 400);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) {
    return null;
  }

  const visibleUsers = typingUsers.slice(0, maxUsers);
  const remainingCount = typingUsers.length - maxUsers;

  const formatTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]?.name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]?.name} and ${typingUsers[1]?.name} are typing`;
    } else if (typingUsers.length <= maxUsers) {
      const names = typingUsers
        .slice(0, -1)
        .map((u: unknown) => u.name)
        .join(", ");
      return `${names} and ${typingUsers[typingUsers.length - 1]?.name} are typing`;
    }
    const names = visibleUsers.map((u: unknown) => u.name).join(", ");
    return `${names} and ${remainingCount} other${remainingCount > 1 ? "s" : ""} are typing`;
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex space-x-0.5">
          {[0, 1, 2].map((dot: unknown) => (
            <div
              key={dot}
              className={`h-1.5 w-1.5 rounded-ds-full bg-fl-text-muted transition-opacity duration-200 ${
                animationPhase === dot ? "opacity-100" : "opacity-30"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-fl-bg-subtle flex items-center space-x-3 rounded-ds-lg border border-fl-border spacing-3 ${className}`}>
      {/* User Avatars */}
      <div className="flex -space-x-spacing-sm">
        {visibleUsers.map((user, index) => (
          <div key={user.id} className="relative" style={{ zIndex: visibleUsers.length - index }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="border-fl-bg-base h-6 w-6 rounded-ds-full border-2" />
            ) : (
              <div
                className="border-fl-bg-base flex h-6 w-6 items-center justify-center rounded-ds-full border-2 text-tiny font-medium text-white"
                style={{ backgroundColor: user.color || "#3D82F2" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Typing pulse indicator */}
            <div className="bg-fl-status-ok border-fl-bg-base absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-ds-full border-2">
              <div className="bg-fl-status-ok h-full w-full animate-pulse rounded-ds-full" />
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="border-fl-bg-base flex h-6 w-6 items-center justify-center rounded-ds-full border-2 bg-fl-text-muted text-tiny font-medium text-white">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Typing Text */}
      <div className="flex items-center space-x-spacing-sm text-sm text-fl-text-muted">
        <span>{formatTypingText()}</span>

        {/* Animated dots */}
        <div className="flex space-x-0.5">
          {[0, 1, 2].map((dot: unknown) => (
            <div
              key={dot}
              className={`h-1 w-1 rounded-ds-full bg-fl-text-muted transition-all duration-200 ${
                animationPhase === dot ? "scale-125 opacity-100" : "scale-100 opacity-40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * @deprecated OBSOLETE - This hook is deprecated and will be removed. Use hooks/useRealtime.ts instead.
 *
 * DO NOT USE - Use the standardized useRealtime hook for all realtime functionality.
 * This implementation uses outdated patterns and non-unified event names.
 */
export const useTypingIndicator = (conversationId: string, currentUserId: string) => {

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Send typing start/stop events
  const startTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing start event via tRPC
      try {
        const response = await fetch(`/api/trpc/mailbox.conversations.setTypingStatus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isTyping: true,
            senderType: "operator",
          }),
        });
      } catch (error) {

      }
    }
  };

  const stopTyping = async () => {
    if (isTyping) {
      setIsTyping(false);
      // Send typing stop event via tRPC
      try {
        const response = await fetch(`/api/trpc/mailbox.conversations.setTypingStatus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            isTyping: false,
            senderType: "operator",
          }),
        });
      } catch (error) {

      }
    }
  };

  // Auto-stop typing after inactivity
  useEffect(() => {
    if (!isTyping) return;

    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000); // Stop after 3 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [isTyping]);

  // Listen for typing events from other users
  useEffect(() => {
    // Subscribe to typing events via Supabase Realtime
    const supabase = supabase.admin();

    // UNIFIED STANDARD: Use unified channel naming pattern
    const organizationId = "default-org"; // TODO: Get from auth context
    const channel = supabase
      .channel(UNIFIED_CHANNELS.conversationTyping(organizationId, conversationId))
      .on("broadcast", { event: UNIFIED_EVENTS.TYPING_START }, (payload) => {
        const { userId, isTyping: userIsTyping, senderType } = payload.payload;

        // Don't show typing indicator for current user
        if (userId === currentUserId) return;

        setTypingUsers((prev) => {
          if (userIsTyping) {
            // Add user to typing list if not already there
            if (!prev.find((u) => u.id === userId)) {
              return [
                ...prev,
                {
                  id: userId,
                  name: `User ${userId.slice(0, 8)}`, // Truncated ID as name
                  color: "#10B981",
                },
              ];
            }
            return prev;
          } else {
            // Remove user from typing list
            return prev.filter((u) => u.id !== userId);
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  };
};
