"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtime } from "@/hooks/useRealtime";

interface TypingIndicatorProps {
  conversationId: string;
  organizationId: string;
  currentUserId?: string;
  className?: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  userType: "agent" | "customer" | "ai";
  startedAt: Date;
  previewText?: string;
}

export function AdvancedTypingIndicator({
  conversationId,
  organizationId,
  currentUserId,
  className = "",
}: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { subscribe } = useRealtime({ organizationId, conversationId });

  useEffect(() => {
    // Subscribe to typing events
    const unsubscribe = subscribe("typing_indicator", (payload: unknown) => {
      const { user_id, user_name, user_type, is_typing, preview_text } = payload;

      // Don't show typing indicator for current user
      if (user_id === currentUserId) return;

      setTypingUsers((prev) => {
        if (is_typing) {
          // Add or update typing user
          const existingIndex = prev.findIndex((u) => u.userId === user_id);
          const typingUser: TypingUser = {
            userId: user_id,
            userName: user_name || "Someone",
            userType: user_type || "agent",
            startedAt: new Date(),
            previewText: preview_text,
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = typingUser;
            return updated;
          } else {
            return [...prev, typingUser];
          }
        } else {
          // Remove typing user
          return prev.filter((u) => u.userId !== user_id);
        }
      });
    });

    // Cleanup stale typing indicators (after 10 seconds)
    const cleanupInterval = setInterval(() => {
      setTypingUsers((prev) => prev.filter((user) => Date.now() - user.startedAt.getTime() < 10000));
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [conversationId, organizationId, currentUserId, subscribe]);

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className={`typing-indicators ${className}`}>
      <AnimatePresence>
        {typingUsers.map((user) => (
          <TypingUserIndicator key={user.userId} user={user} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface TypingUserIndicatorProps {
  user: TypingUser;
}

function TypingUserIndicator({ user }: TypingUserIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      }}
      className="mb-2 flex items-center space-x-spacing-sm rounded-ds-lg border border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-3 py-2"
    >
      {/* Avatar */}
      <div className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-400 to-purple-500 text-tiny font-medium text-white">
        {user.userName.charAt(0).toUpperCase()}
      </div>

      {/* Typing content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-spacing-sm">
          <span className="text-foreground truncate text-sm font-medium">{user.userName}</span>
          <span className="text-tiny text-gray-400">is typing</span>
        </div>

        {/* Preview text if available */}
        {user.previewText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-1 truncate text-tiny text-[var(--fl-color-text-muted)]"
          >
            {user.previewText}
          </motion.div>
        )}
      </div>

      {/* Animated dots */}
      <TypingDots />
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="bg-primary h-2 w-2 rounded-ds-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Hook for managing typing state
export function useTypingIndicator(
  conversationId: string,
  organizationId: string,
  userId: string,
  userName: string,
  userType: "agent" | "customer" | "ai" = "customer"
) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { broadcast } = useRealtime({ organizationId, conversationId });

  const startTyping = (previewText?: string) => {
    if (!isTyping) {
      setIsTyping(true);
      broadcast("typing_indicator", {
        user_id: userId,
        userName: userName,
        userType: userType,
        isTyping: true,
        preview_text: previewText,
        conversation_id: conversationId,
        organization_id: organizationId,
        timestamp: new Date().toISOString(),
      });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000);

    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      broadcast("typing_indicator", {
        user_id: userId,
        userName: userName,
        userType: userType,
        isTyping: false,
        conversation_id: conversationId,
        organization_id: organizationId,
        timestamp: new Date().toISOString(),
      });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const updatePreview = (text: string) => {
    if (isTyping) {
      broadcast("typing_indicator", {
        user_id: userId,
        userName: userName,
        userType: userType,
        isTyping: true,
        preview_text: text.slice(0, 50), // Limit preview length
        conversation_id: conversationId,
        organization_id: organizationId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (isTyping) {
        broadcast("typing_indicator", {
          user_id: userId,
          userName: userName,
          userType: userType,
          isTyping: false,
          conversation_id: conversationId,
          organization_id: organizationId,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, []);

  return {
    isTyping,
    startTyping,
    stopTyping,
    updatePreview,
  };
}

// Simple typing dots component for basic use cases
export function SimpleTypingDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-ds-full bg-gray-400"
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
