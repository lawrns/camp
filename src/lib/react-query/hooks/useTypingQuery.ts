/**
 * React Query Hook for Typing Indicators
 * Handles real-time typing status with optimized performance
 */

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "../config";

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface TypingStatus {
  conversationId: string;
  typingUsers: TypingUser[];
}

// Typing timeout - remove user after 3 seconds of no activity
const TYPING_TIMEOUT = 3000;

// Hook for typing status
export function useTypingStatus(conversationId: string | null) {
  const queryClient = useQueryClient();
  const supabaseClient = supabase.browser();
  const { user } = useAuth();
  const cleanupTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Query for current typing users
  const query = useQuery({
    queryKey: queryKeys.typingStatus(conversationId || ""),
    queryFn: (): TypingStatus => ({
      conversationId: conversationId || "",
      typingUsers: [],
    }),
    enabled: !!conversationId,
    staleTime: Infinity, // Never consider stale, only update via mutations
    gcTime: 0, // Remove from cache immediately when component unmounts
  });

  // Clean up stale typing indicators
  const cleanupStaleTypingUsers = useCallback(() => {
    if (!conversationId) return;

    queryClient.setQueryData(queryKeys.typingStatus(conversationId), (old: TypingStatus | undefined) => {
      if (!old) return old;

      const now = Date.now();
      const activeUsers = old.typingUsers.filter((user: any) => now - user.timestamp < TYPING_TIMEOUT);

      return {
        ...old,
        typingUsers: activeUsers,
      };
    });
  }, [conversationId, queryClient]);

  // Set up cleanup timer
  useEffect(() => {
    if (!conversationId) return;

    // Run cleanup every second
    cleanupTimerRef.current = setInterval(cleanupStaleTypingUsers, 1000);

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [conversationId, cleanupStaleTypingUsers]);

  // Real-time subscription for typing events
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typingUsers: TypingUser[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id && presence.is_typing) {
              typingUsers.push({
                userId: presence.user_id,
                userName: presence.user_name || "Unknown",
                timestamp: Date.now(),
              });
            }
          });
        });

        queryClient.setQueryData(queryKeys.typingStatus(conversationId), {
          conversationId,
          typingUsers,
        });
      })
      .subscribe(async (status: any) => {
        if (status === "SUBSCRIBED") {
          // Track our own presence
          await channel.track({
            user_id: user.id,
            user_name: user.email?.split("@")[0] || "Agent",
            is_typing: false,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient, supabase]);

  return {
    typingUsers: query.data?.typingUsers || [],
    isLoading: query.isLoading,
  };
}

// Hook for sending typing status
export function useSendTypingStatus(conversationId: string | null) {
  const { user } = useAuth();
  const supabaseClient = supabase.browser();
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTypingRef = useRef<number>(0);

  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId || !user) return;

      const channel = supabase.channel(`typing:${conversationId}`);

      try {
        await channel.track({
          user_id: user.id,
          user_name: user.email?.split("@")[0] || "Agent",
          is_typing: isTyping,
        });
      } catch (error) {}
    },
    [conversationId, user, supabase]
  );

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    const now = Date.now();

    // Only send typing status if it's been more than 1 second since last send
    if (now - lastTypingRef.current > 1000) {
      sendTypingStatus(true);
      lastTypingRef.current = now;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, TYPING_TIMEOUT);
  }, [sendTypingStatus]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false);
  }, [sendTypingStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return {
    handleTyping,
    stopTyping,
  };
}
