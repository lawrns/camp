"use client";

import { useState, useEffect, useCallback } from "react";
import { widgetLogger } from "@/lib/utils/logger";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface UseReactionsProps {
  organizationId: string;
  userId?: string;
}

export const useReactions = ({ organizationId, userId }: UseReactionsProps) => {
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(false);

  // Fetch reactions for a specific message
  const fetchReactions = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(`/api/widget/messages/${messageId}/reactions?organizationId=${organizationId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReactions((prev) => ({
            ...prev,
            [messageId]: data.reactions.map((r: any) => ({
              ...r,
              hasReacted: r.users.includes(userId || "anonymous"),
            })),
          }));
        }
      } catch (error) {
        widgetLogger.error("Error fetching reactions:", error);
      }
    },
    [organizationId, userId]
  );

  // Add a reaction to a message
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (loading) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/widget/messages/${messageId}/reactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emoji,
            organizationId,
            userId: userId || "anonymous",
          }),
        });

        if (response.ok) {
          // Optimistically update the UI
          setReactions((prev) => {
            const messageReactions = prev[messageId] || [];
            const existingReaction = messageReactions.find((r) => r.emoji === emoji);

            if (existingReaction) {
              // Update existing reaction
              return {
                ...prev,
                [messageId]: messageReactions.map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count + 1,
                        hasReacted: true,
                        users: [...r.users, userId || "anonymous"],
                      }
                    : r
                ),
              };
            } else {
              // Add new reaction
              return {
                ...prev,
                [messageId]: [
                  ...messageReactions,
                  {
                    emoji,
                    count: 1,
                    hasReacted: true,
                    users: [userId || "anonymous"],
                  },
                ],
              };
            }
          });
        } else {
          const error = await response.json();
          widgetLogger.error("Error adding reaction:", error);
        }
      } catch (error) {
        widgetLogger.error("Error adding reaction:", error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, userId, loading]
  );

  // Remove a reaction from a message
  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (loading) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/widget/messages/${messageId}/reactions?emoji=${emoji}&organizationId=${organizationId}&userId=${userId || "anonymous"}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // Optimistically update the UI
          setReactions((prev) => {
            const messageReactions = prev[messageId] || [];

            return {
              ...prev,
              [messageId]: messageReactions
                .map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: Math.max(0, r.count - 1),
                        hasReacted: false,
                        users: r.users.filter((u) => u !== (userId || "anonymous")),
                      }
                    : r
                )
                .filter((r) => r.count > 0), // Remove reactions with 0 count
            };
          });
        } else {
          const error = await response.json();
          widgetLogger.error("Error removing reaction:", error);
        }
      } catch (error) {
        widgetLogger.error("Error removing reaction:", error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, userId, loading]
  );

  // Get reactions for a specific message
  const getMessageReactions = useCallback(
    (messageId: string): Reaction[] => {
      return reactions[messageId] || [];
    },
    [reactions]
  );

  // Initialize reactions for messages
  const initializeReactions = useCallback(
    (messageIds: string[]) => {
      messageIds.forEach((messageId) => {
        if (!reactions[messageId]) {
          fetchReactions(messageId);
        }
      });
    },
    [reactions, fetchReactions]
  );

  return {
    reactions,
    addReaction,
    removeReaction,
    getMessageReactions,
    fetchReactions,
    initializeReactions,
    loading,
  };
};
