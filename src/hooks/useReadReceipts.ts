/**
 * Read Receipts Hook
 *
 * Manages read receipt state and real-time updates for messages
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export interface ReadReceiptStatus {
  messageId: string;
  status: "sent" | "delivered" | "read";
  readBy?: string[];
  readAt?: string;
  deliveredAt?: string;
}

export interface ReadReceiptData {
  [messageId: string]: ReadReceiptStatus;
}

interface UseReadReceiptsOptions {
  conversationId: string;
  organizationId: string;
  autoMarkAsRead?: boolean;
  enableRealtime?: boolean;
}

export function useReadReceipts({
  conversationId,
  organizationId,
  autoMarkAsRead = true,
  enableRealtime = true,
}: UseReadReceiptsOptions) {
  const { user } = useAuth();
  const [readReceipts, setReadReceipts] = useState<ReadReceiptData>({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch initial read receipt data
  const fetchReadReceipts = useCallback(async () => {
    if (!conversationId || !organizationId) return;

    try {
      setLoading(true);
      const supabaseClient = supabase.browser();

      // Get read receipts for this conversation
      const { data: receipts, error } = await supabaseClient
        .from("message_read_status")
        .select(
          `
          message_id,
          user_id,
          read_at,
          messages!inner(id, created_at, sender_type)
        `
        )
        .eq("messages.conversation_id", conversationId)
        .eq("messages.organization_id", organizationId);

      if (error) {

        return;
      }

      // Transform data into read receipt format
      const receiptData: ReadReceiptData = {};

      receipts?.forEach((receipt: unknown) => {
        const messageId = receipt.message_id.toString();
        if (!receiptData[messageId]) {
          receiptData[messageId] = {
            messageId,
            status: "sent",
            readBy: [],
          };
        }

        if (receipt.read_at) {
          receiptData[messageId].status = "read";
          receiptData[messageId].readAt = receipt.read_at;
          receiptData[messageId].readBy?.push(receipt.user_id);
        }
      });

      setReadReceipts(receiptData);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, [conversationId, organizationId]);

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!user || !conversationId || !organizationId) return;

      try {
        const supabaseClient = supabase.browser();

        // Update read status in database
        const { error } = await supabaseClient.from("message_read_status").upsert({
          message_id: parseInt(messageId),
          user_id: user.id,
          read_at: new Date().toISOString(),
        });

        if (error) {

          return;
        }

        // Update local state
        setReadReceipts((prev) => ({
          ...prev,
          [messageId]: {
            messageId,
            status: "read",
            readAt: new Date().toISOString(),
            readBy: [...(prev[messageId]?.readBy || []), user.id],
          },
        }));

        // Broadcast read receipt
        try {
          const channel = supabaseClient.channel(`cf-org-conv-bcast-${organizationId}-${conversationId}`);
          await channel.send({
            type: "broadcast",
            event: "read_receipt",
            payload: {
              messageId,
              readBy: user.id,
              readAt: new Date().toISOString(),
              conversationId,
              organizationId,
            },
          });
        } catch (broadcastError) {

        }
      } catch (error) {

      }
    },
    [user, conversationId, organizationId]
  );

  // Mark multiple messages as read
  const markMultipleAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!user || !conversationId || !organizationId || messageIds.length === 0) return;

      try {
        const supabaseClient = supabase.browser();
        const readAt = new Date().toISOString();

        // Batch update read status
        const readStatuses = messageIds.map((messageId) => ({
          message_id: parseInt(messageId),
          user_id: user.id,
          read_at: readAt,
        }));

        const { error } = await supabaseClient.from("message_read_status").upsert(readStatuses);

        if (error) {

          return;
        }

        // Update local state
        setReadReceipts((prev) => {
          const updated = { ...prev };
          messageIds.forEach((messageId) => {
            updated[messageId] = {
              messageId,
              status: "read",
              readAt,
              readBy: [...(prev[messageId]?.readBy || []), user.id],
            };
          });
          return updated;
        });

        // Broadcast read receipts
        try {
          const channel = supabaseClient.channel(`cf-org-conv-bcast-${organizationId}-${conversationId}`);
          for (const messageId of messageIds) {
            await channel.send({
              type: "broadcast",
              event: "read_receipt",
              payload: {
                messageId,
                readBy: user.id,
                readAt,
                conversationId,
                organizationId,
              },
            });
          }
        } catch (broadcastError) {

        }
      } catch (error) {

      }
    },
    [user, conversationId, organizationId]
  );

  // Get read receipt status for a message
  const getReadReceiptStatus = useCallback(
    (messageId: string): ReadReceiptStatus => {
      return (
        readReceipts[messageId] || {
          messageId,
          status: "sent",
          readBy: [],
        }
      );
    },
    [readReceipts]
  );

  // Check if message is read by current user
  const isReadByUser = useCallback(
    (messageId: string): boolean => {
      const receipt = readReceipts[messageId];
      return receipt?.readBy?.includes(user?.id || "") || false;
    },
    [readReceipts, user]
  );

  // Setup intersection observer for auto-marking messages as read
  useEffect(() => {
    if (!autoMarkAsRead || !user) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleMessageIds: string[] = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            if (messageId && !isReadByUser(messageId)) {
              visibleMessageIds.push(messageId);
            }
          }
        });

        if (visibleMessageIds.length > 0) {
          // Debounce the marking to avoid too many API calls
          setTimeout(() => {
            markMultipleAsRead(visibleMessageIds);
          }, 1000);
        }
      },
      {
        threshold: 0.5, // Message must be 50% visible
        rootMargin: "0px",
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [autoMarkAsRead, user, isReadByUser, markMultipleAsRead]);

  // Setup real-time subscription
  useEffect(() => {
    if (!enableRealtime || !conversationId || !organizationId) return;

    const supabaseClient = supabase.browser();
    const channelName = `cf-org-conv-bcast-${organizationId}-${conversationId}`;

    channelRef.current = supabaseClient.channel(channelName);

    // Subscribe to read receipt events
    channelRef.current.on("broadcast", { event: "read_receipt" }, (payload: unknown) => {
      const { messageId, readBy, readAt } = payload.payload;

      setReadReceipts((prev) => ({
        ...prev,
        [messageId]: {
          messageId,
          status: "read",
          readAt,
          readBy: [...(prev[messageId]?.readBy || []), readBy],
        },
      }));
    });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [enableRealtime, conversationId, organizationId]);

  // Fetch initial data
  useEffect(() => {
    fetchReadReceipts();
  }, [fetchReadReceipts]);

  // Observe message elements for auto-read
  const observeMessage = useCallback(
    (element: HTMLElement, messageId: string) => {
      if (!observerRef.current || !autoMarkAsRead) return;

      element.setAttribute("data-message-id", messageId);
      observerRef.current.observe(element);

      return () => {
        if (observerRef.current) {
          observerRef.current.unobserve(element);
        }
      };
    },
    [autoMarkAsRead]
  );

  return {
    readReceipts,
    loading,
    markAsRead,
    markMultipleAsRead,
    getReadReceiptStatus,
    isReadByUser,
    observeMessage,
    refetch: fetchReadReceipts,
  };
}
