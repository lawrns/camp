// Unified conversation realtime hook (typing, presence) wrapper

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseConversationChannelReturn } from "../types";
import { shouldDisableRealtime } from "@/lib/utils/e2e";
import { useRealtime } from "@/hooks/useRealtime";

export const useConversationChannel = (
  conversationId?: string,
  organizationId?: string,
  userId?: string
): UseConversationChannelReturn => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Initialize unified realtime
  const [realtimeState, realtimeActions] = useRealtime({
    type: "dashboard",
    organizationId: organizationId || "",
    conversationId,
    userId,
    enablePresence: true,
  } as any);

  // Local typing throttle using unified broadcast
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (shouldDisableRealtime()) return;
      if (!organizationId || !conversationId || !userId) return;
      void realtimeActions.broadcastTyping(isTyping);
    },
    [organizationId, conversationId, userId, realtimeActions]
  );

  const handleTyping = useCallback(() => {
    if (!organizationId || !conversationId || !userId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (!isTypingRef.current) {
      broadcastTyping(true);
      isTypingRef.current = true;
    }
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
      isTypingRef.current = false;
    }, 3000);
  }, [organizationId, conversationId, userId, broadcastTyping]);

  const stopTyping = useCallback(() => {
    if (!organizationId || !conversationId || !userId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    broadcastTyping(false);
  }, [organizationId, conversationId, userId, broadcastTyping]);

  // Reflect typing/online from unified state when available
  useEffect(() => {
    const state: any = realtimeState || {};
    if (Array.isArray(state.typingUsers)) setTypingUsers(state.typingUsers);
    if (Array.isArray(state.onlineUsers)) setOnlineUsers(state.onlineUsers);
  }, [realtimeState]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
  }, []);

  return {
    typingUsers,
    onlineUsers,
    broadcastTyping,
    handleTyping,
    stopTyping,
  };
};
