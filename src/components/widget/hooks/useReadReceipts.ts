import { useState, useEffect, useCallback } from 'react';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase';

export interface ReadReceiptStatus {
  messageId: string;
  isRead: boolean;
  readBy: Array<{
    readerId: string;
    readerType: 'visitor' | 'agent' | 'system' | 'bot';
    readerName?: string;
    readAt: string;
  }>;
  lastReadAt?: string;
}

export interface UseReadReceiptsReturn {
  readReceipts: Record<string, ReadReceiptStatus>;
  markAsRead: (messageIds: string[], readerId: string) => Promise<void>;
  getReadStatus: (messageId: string) => ReadReceiptStatus;
  isLoading: boolean;
  error: string | null;
}

export function useReadReceipts(
  conversationId: string | undefined,
  organizationId: string,
  readerId: string,
  getAuthHeaders?: () => Promise<Record<string, string>>
): UseReadReceiptsReturn {
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceiptStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch read receipts for conversation
  const fetchReadReceipts = useCallback(async () => {
    if (!conversationId || !organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/widget/read-receipts?conversationId=${conversationId}`, {
        headers: {
          'X-Organization-ID': organizationId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch read receipts: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to local state format
      const receiptsMap: Record<string, ReadReceiptStatus> = {};
      
      Object.entries(data.readReceipts || {}).forEach(([messageId, receipt]: [string, any]) => {
        receiptsMap[messageId] = {
          messageId,
          isRead: receipt.isRead || false,
          readBy: receipt.readBy || [],
          lastReadAt: receipt.lastReadAt
        };
      });

      setReadReceipts(receiptsMap);
    } catch (err) {
      console.error('[useReadReceipts] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch read receipts');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, organizationId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[], currentReaderId: string) => {
    if (!conversationId || !organizationId || messageIds.length === 0) return;

    try {
      // Get authorization headers from auth hook
      const authHeaders = getAuthHeaders ? await getAuthHeaders() : {};

      const response = await fetch('/api/widget/read-receipts', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          messageIds,
          conversationId,
          readerId: readerId,
          readerType: 'visitor',
          sessionId: `session-${Date.now()}`,
          deviceId: `device-${navigator.userAgent.slice(0, 20)}`,
          metadata: {
            source: 'widget',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state optimistically
      setReadReceipts(prev => {
        const updated = { ...prev };
        
        data.readReceipts?.forEach((receipt: unknown) => {
          const messageId = receipt.messageId;
          updated[messageId] = {
            messageId,
            isRead: true,
            readBy: [
              ...(prev[messageId]?.readBy || []),
              {
                readerId: receipt.readerId,
                readerType: receipt.readerType,
                readerName: receipt.readerName,
                readAt: receipt.readAt
              }
            ],
            lastReadAt: receipt.readAt
          };
        });
        
        return updated;
      });

    } catch (err) {
      console.error('[useReadReceipts] Mark as read error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark messages as read');
    }
  }, [conversationId, organizationId]);

  // Get read status for a specific message
  const getReadStatus = useCallback((messageId: string): ReadReceiptStatus => {
    return readReceipts[messageId] || {
      messageId,
      isRead: false,
      readBy: [],
    };
  }, [readReceipts]);

  // Set up real-time subscription for read receipt updates
  useEffect(() => {
    if (!conversationId || !organizationId) return;

    const client = supabase.widget();
    const channelName = UNIFIED_CHANNELS.conversation(organizationId, conversationId);

    console.log('[useReadReceipts] Setting up real-time subscription:', channelName);

    const channel = client
      .channel(channelName)
      .on(
        'broadcast',
        { event: UNIFIED_EVENTS.READ_RECEIPT },
        (payload) => {
          console.log('[useReadReceipts] Read receipt update received:', payload);
          
          const receiptData = payload.payload;
          if (receiptData?.messageIds && receiptData.source !== 'widget') {
            // Update read receipts from dashboard agents
            setReadReceipts(prev => {
              const updated = { ...prev };
              
              receiptData.messageIds.forEach((messageId: string) => {
                if (!updated[messageId]) {
                  updated[messageId] = {
                    messageId,
                    isRead: false,
                    readBy: []
                  };
                }
                
                // Add the new read receipt if not already present
                const existingReceipt = updated[messageId].readBy.find(
                  r => r.readerId === receiptData.readerId
                );
                
                if (!existingReceipt) {
                  updated[messageId].readBy.push({
                    readerId: receiptData.readerId,
                    readerType: receiptData.readerType,
                    readerName: receiptData.readerName,
                    readAt: receiptData.readAt
                  });
                  updated[messageId].isRead = true;
                  updated[messageId].lastReadAt = receiptData.readAt;
                }
              });
              
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useReadReceipts] Cleaning up real-time subscription');
      client.removeChannel(channel);
    };
  }, [conversationId, organizationId]);

  // Initial fetch
  useEffect(() => {
    fetchReadReceipts();
  }, [fetchReadReceipts]);

  return {
    readReceipts,
    markAsRead,
    getReadStatus,
    isLoading,
    error
  };
}

// Auto-mark messages as read when they come into view
export function useAutoMarkAsRead(
  messageIds: string[],
  readerId: string,
  markAsRead: (messageIds: string[], readerId: string) => Promise<void>,
  options: {
    enabled?: boolean;
    delay?: number; // Delay before marking as read (ms)
    threshold?: number; // Intersection threshold (0-1)
  } = {}
) {
  const { enabled = true, delay = 1000, threshold = 0.5 } = options;

  useEffect(() => {
    if (!enabled || messageIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleMessageIds: string[] = [];
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && messageIds.includes(messageId)) {
              visibleMessageIds.push(messageId);
            }
          }
        });

        if (visibleMessageIds.length > 0) {
          // Delay marking as read to ensure user actually saw the message
          setTimeout(() => {
            markAsRead(visibleMessageIds, readerId);
          }, delay);
        }
      },
      { threshold }
    );

    // Observe all message elements
    messageIds.forEach(messageId => {
      const element = document.querySelector(`[data-message-id="${messageId}"]`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [messageIds, readerId, markAsRead, enabled, delay, threshold]);
}
