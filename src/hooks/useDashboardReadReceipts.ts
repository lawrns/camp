import { useState, useEffect, useCallback } from 'react';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { supabase } from '@/lib/supabase';

export interface DashboardReadReceiptStatus {
  messageId: string;
  isRead: boolean;
  isReadByCurrentUser: boolean;
  readBy: Array<{
    readerId: string;
    readerType: 'visitor' | 'agent' | 'system' | 'bot';
    readerName?: string;
    readerEmail?: string;
    readAt: string;
  }>;
  lastReadAt?: string;
  lastReadBy?: string;
  senderType?: string;
  senderName?: string;
}

export interface UseDashboardReadReceiptsReturn {
  readReceipts: Record<string, DashboardReadReceiptStatus>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  getReadStatus: (messageId: string) => DashboardReadReceiptStatus;
  getUnreadCount: () => number;
  isLoading: boolean;
  error: string | null;
  summary: {
    totalMessages: number;
    readMessages: number;
    unreadMessages: number;
    readByCurrentUser: number;
  };
}

import { useAuth } from '@/hooks/useAuth';

export function useDashboardReadReceipts(
  conversationId: string | undefined,
  userId: string | undefined
): UseDashboardReadReceiptsReturn {
  const { user } = useAuth();
  const orgId = user?.organizationId || '';
  const [readReceipts, setReadReceipts] = useState<Record<string, DashboardReadReceiptStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalMessages: 0,
    readMessages: 0,
    unreadMessages: 0,
    readByCurrentUser: 0
  });

  // Fetch read receipts for conversation
  const fetchReadReceipts = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/read-receipts?conversationId=${conversationId}&includeDetails=true`);

      if (!response.ok) {
        throw new Error(`Failed to fetch read receipts: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to local state format
      const receiptsMap: Record<string, DashboardReadReceiptStatus> = {};
      
      Object.entries(data.readReceipts || {}).forEach(([messageId, receipt]: [string, any]) => {
        receiptsMap[messageId] = {
          messageId,
          isRead: receipt.isRead || false,
          isReadByCurrentUser: receipt.isReadByCurrentUser || false,
          readBy: receipt.readBy || [],
          lastReadAt: receipt.lastReadAt,
          lastReadBy: receipt.lastReadBy,
          senderType: receipt.senderType,
          senderName: receipt.senderName
        };
      });

      setReadReceipts(receiptsMap);
      setSummary(data.summary || {
        totalMessages: 0,
        readMessages: 0,
        unreadMessages: 0,
        readByCurrentUser: 0
      });
    } catch (err) {
      console.error('[useDashboardReadReceipts] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch read receipts');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!conversationId || messageIds.length === 0) return;

    try {
      const response = await fetch('/api/dashboard/read-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds,
          conversationId,
          metadata: {
            source: 'dashboard',
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
          const existingReceipt = prev[messageId];
          
          updated[messageId] = {
            ...existingReceipt,
            messageId,
            isRead: true,
            isReadByCurrentUser: true,
            readBy: [
              ...(existingReceipt?.readBy || []),
              {
                readerId: receipt.readerId,
                readerType: receipt.readerType,
                readerName: receipt.readerName,
                readAt: receipt.readAt
              }
            ],
            lastReadAt: receipt.readAt,
            lastReadBy: receipt.readerId
          };
        });
        
        return updated;
      });

      // Update summary
      setSummary(prev => ({
        ...prev,
        readMessages: prev.readMessages + data.readReceipts?.length || 0,
        unreadMessages: Math.max(0, prev.unreadMessages - (data.readReceipts?.length || 0)),
        readByCurrentUser: prev.readByCurrentUser + (data.readReceipts?.length || 0)
      }));

    } catch (err) {
      console.error('[useDashboardReadReceipts] Mark as read error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark messages as read');
    }
  }, [conversationId]);

  // Get read status for a specific message
  const getReadStatus = useCallback((messageId: string): DashboardReadReceiptStatus => {
    return readReceipts[messageId] || {
      messageId,
      isRead: false,
      isReadByCurrentUser: false,
      readBy: [],
    };
  }, [readReceipts]);

  // Get count of unread messages
  const getUnreadCount = useCallback((): number => {
    return Object.values(readReceipts).filter(receipt => !receipt.isReadByCurrentUser).length;
  }, [readReceipts]);

  // Set up real-time subscription for read receipt updates
  useEffect(() => {
    if (!conversationId) return;

    const client = supabase.browser();
    
    // Subscribe to conversation-specific channel
    const conversationChannel = client
      .channel(UNIFIED_CHANNELS.conversation(orgId, conversationId))
      .on(
        'broadcast',
        { event: UNIFIED_EVENTS.READ_RECEIPT },
        (payload) => {
          console.log('[useDashboardReadReceipts] Read receipt update received:', payload);
          
          const receiptData = payload.payload;
          if (receiptData?.messageIds) {
            // Update read receipts from widget or other agents
            setReadReceipts(prev => {
              const updated = { ...prev };
              
              receiptData.messageIds.forEach((messageId: string) => {
                if (!updated[messageId]) {
                  updated[messageId] = {
                    messageId,
                    isRead: false,
                    isReadByCurrentUser: false,
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
                    readerEmail: receiptData.readerEmail,
                    readAt: receiptData.readAt
                  });
                  updated[messageId].isRead = true;
                  updated[messageId].lastReadAt = receiptData.readAt;
                  updated[messageId].lastReadBy = receiptData.readerId;
                  
                  // Check if current user read it
                  if (receiptData.readerId === userId) {
                    updated[messageId].isReadByCurrentUser = true;
                  }
                }
              });
              
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useDashboardReadReceipts] Cleaning up real-time subscription');
      client.removeChannel(conversationChannel);
    };
  }, [conversationId, userId, orgId]);

  // Initial fetch
  useEffect(() => {
    fetchReadReceipts();
  }, [fetchReadReceipts]);

  return {
    readReceipts,
    markAsRead,
    getReadStatus,
    getUnreadCount,
    isLoading,
    error,
    summary
  };
}

// Auto-mark messages as read when they come into view in dashboard
export function useAutoMarkAsReadDashboard(
  messageIds: string[],
  markAsRead: (messageIds: string[]) => Promise<void>,
  options: {
    enabled?: boolean;
    delay?: number; // Delay before marking as read (ms)
    threshold?: number; // Intersection threshold (0-1)
  } = {}
) {
  const { enabled = true, delay = 2000, threshold = 0.7 } = options;

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
          // Delay marking as read to ensure agent actually saw the message
          setTimeout(() => {
            markAsRead(visibleMessageIds);
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
  }, [messageIds, markAsRead, enabled, delay, threshold]);
}
