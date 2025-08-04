import { supabase } from '@/lib/supabase/consolidated-exports';
// Remove direct import: // import { RealtimeChannel } from '@supabase/supabase-js';
// Use any for channel type if specific type not available in centralized exports
import { useCallback, useEffect, useState } from 'react';

interface QueueItem {
  id: string;
  priority: number;
  customerPriority: 'low' | 'medium' | 'high' | 'urgent';
  requiredSkills: string[];
  estimatedComplexity: number;
  attempts: number;
  waitTime: number;
  expiresIn: number;
  type: 'ticket' | 'conversation';
  targetId: string;
  status: 'pending' | 'assigned' | 'failed' | 'expired';
  createdAt: string;
  metadata?: unknown;
}

interface AssignmentSuggestion {
  agentId: string;
  agentName: string;
  agentEmail: string;
  currentWorkload: number;
  maxCapacity: number;
  utilizationRate: number;
  availabilityScore: number;
  skillMatchScore: number;
  performanceScore: number;
  totalScore: number;
  estimatedResponseTime: number;
  skills: string[];
  status: string;
  recommendation: string;
}

interface UseAssignmentQueueReturn {
  queueItems: QueueItem[];
  pendingCount: number;
  failedCount: number;
  highPriorityCount: number;
  loading: boolean;
  error: string | null;
  refreshQueue: () => Promise<void>;
  autoAssign: (itemId: string) => Promise<{ success: boolean; assignment?: unknown; error?: string }>;
  manualAssign: (itemId: string, agentId: string, reason?: string) => Promise<{ success: boolean; assignment?: unknown; error?: string }>;
  getSuggestions: (itemId: string) => Promise<AssignmentSuggestion[]>;
  removeFromQueue: (itemId: string) => Promise<void>;
}

export function useAssignmentQueue(organizationId: string): UseAssignmentQueueReturn {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Calculate derived values
  const pendingCount = queueItems.filter(item => item.status === 'pending').length;
  const failedCount = queueItems.filter(item => item.status === 'failed').length;
  const highPriorityCount = queueItems.filter(item =>
    item.status === 'pending' && item.priority >= 8
  ).length;

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/dashboard?organizationId=${organizationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch queue data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setQueueItems(data.assignmentQueue?.queue || []);
      } else {
        throw new Error(data.error || 'Failed to fetch queue data');
      }
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!organizationId) return;

    const client = supabase.browser();

    // Create channel for assignment queue updates
    const realtimeChannel: unknown = client.channel(`queue:${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assignment_queue',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('Assignment queue change:', payload);
        handleQueueChange(payload);
      })
      .on('broadcast', {
        event: 'queue_update'
      }, (payload) => {
        console.log('Queue update broadcast:', payload);
        handleQueueBroadcast(payload);
      })
      .subscribe();

    setChannel(realtimeChannel);

    // Initial data fetch
    fetchQueueData();

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [organizationId, fetchQueueData]);

  // Handle queue changes from database
  const handleQueueChange = useCallback((payload: unknown) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setQueueItems(prevItems => {
      let updatedItems = [...prevItems];

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const itemIndex = updatedItems.findIndex(item => item.id === newRecord.id);

        const updatedItem: QueueItem = {
          id: newRecord.id,
          priority: newRecord.priority || 1,
          customerPriority: newRecord.customer_priority || 'medium',
          requiredSkills: newRecord.required_skills || [],
          estimatedComplexity: newRecord.estimated_complexity || 1,
          attempts: newRecord.assignment_attempts || 0,
          waitTime: Date.now() - new Date(newRecord.created_at).getTime(),
          expiresIn: new Date(newRecord.expiresAt).getTime() - Date.now(),
          type: newRecord.ticket_id ? 'ticket' : 'conversation',
          targetId: newRecord.ticket_id || newRecord.conversation_id,
          status: newRecord.status,
          createdAt: newRecord.created_at,
          metadata: newRecord.metadata
        };

        if (itemIndex >= 0) {
          updatedItems[itemIndex] = updatedItem;
        } else {
          updatedItems.push(updatedItem);
        }
      } else if (eventType === 'DELETE' && oldRecord) {
        updatedItems = updatedItems.filter(item => item.id !== oldRecord.id);
      }

      // Sort by priority and creation time
      return updatedItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Older first
      });
    });
  }, []);

  // Handle queue broadcasts
  const handleQueueBroadcast = useCallback((payload: unknown) => {
    const { action, itemId, data } = payload.payload;

    if (action === 'refresh') {
      fetchQueueData();
    } else if (action === 'item_assigned' && itemId) {
      setQueueItems(prevItems =>
        prevItems.filter(item => item.id !== itemId)
      );
    }
  }, [fetchQueueData]);

  // Auto-assign function
  const autoAssign = useCallback(async (itemId: string) => {
    try {
      const queueItem = queueItems.find(item => item.id === itemId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      const response = await fetch('/api/assignment/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ticketId: queueItem.type === 'ticket' ? queueItem.targetId : undefined,
          conversationId: queueItem.type === 'conversation' ? queueItem.targetId : undefined,
          requiredSkills: queueItem.requiredSkills,
          priority: queueItem.priority,
          customerPriority: queueItem.customerPriority,
          estimatedComplexity: queueItem.estimatedComplexity
        })
      });

      if (!response.ok) {
        throw new Error(`Auto-assignment failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.assigned) {
        // Remove from queue on successful assignment
        setQueueItems(prevItems =>
          prevItems.filter(item => item.id !== itemId)
        );
      }

      return data;
    } catch (err) {
      console.error('Error in auto-assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [organizationId, queueItems]);

  // Manual assign function
  const manualAssign = useCallback(async (itemId: string, agentId: string, reason?: string) => {
    try {
      const queueItem = queueItems.find(item => item.id === itemId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      const endpoint = queueItem.type === 'ticket'
        ? `/api/tickets/${queueItem.targetId}/assign-manual`
        : `/api/conversations/${queueItem.targetId}/assign-manual`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          organizationId,
          reason: reason || `Manual assignment from queue`,
          validateCapacity: true,
          forceAssign: false
        })
      });

      if (!response.ok) {
        throw new Error(`Manual assignment failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove from queue on successful assignment
        setQueueItems(prevItems =>
          prevItems.filter(item => item.id !== itemId)
        );
      }

      return data;
    } catch (err) {
      console.error('Error in manual assignment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [organizationId, queueItems]);

  // Get assignment suggestions
  const getSuggestions = useCallback(async (itemId: string): Promise<AssignmentSuggestion[]> => {
    try {
      const queueItem = queueItems.find(item => item.id === itemId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      const params = new URLSearchParams({
        organizationId,
        requiredSkills: JSON.stringify(queueItem.requiredSkills),
        priority: queueItem.priority.toString(),
        limit: '5'
      });

      const response = await fetch(`/api/assignment/auto/suggestions?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.suggestions || [];
      } else {
        throw new Error(data.error || 'Failed to get suggestions');
      }
    } catch (err) {
      console.error('Error getting assignment suggestions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, [organizationId, queueItems]);

  // Remove from queue
  const removeFromQueue = useCallback(async (itemId: string) => {
    try {
      // This would typically call an API to remove the item
      // For now, we'll just remove it locally
      setQueueItems(prevItems =>
        prevItems.filter(item => item.id !== itemId)
      );
    } catch (err) {
      console.error('Error removing from queue:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Refresh queue manually
  const refreshQueue = useCallback(async () => {
    await fetchQueueData();
  }, [fetchQueueData]);

  return {
    queueItems,
    pendingCount,
    failedCount,
    highPriorityCount,
    loading,
    error,
    refreshQueue,
    autoAssign,
    manualAssign,
    getSuggestions,
    removeFromQueue
  };
}
