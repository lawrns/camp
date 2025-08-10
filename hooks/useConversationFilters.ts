/**
 * Conversation Filters Hook
 * Provides filtering logic for conversations in the dashboard
 */

import { useMemo } from 'react';

export interface ConversationFilter {
  id: string;
  label: string;
  count: number;
  filter: (conversations: any[]) => any[];
}

export function useConversationFilters(conversations: any[]) {
  const filters = useMemo(() => {
    if (!conversations) return [];

    const allCount = conversations.length;
    const unreadCount = conversations.filter(c => (c.unreadCount || 0) > 0).length;
    const unassignedCount = conversations.filter(c => !c.assigneeId).length;
    const aiManagedCount = conversations.filter(c => c.isAIManaged).length;
    const humanManagedCount = conversations.filter(c => !c.isAIManaged).length;
    const archivedCount = conversations.filter(c => c.status === 'archived').length;

    return [
      {
        id: 'all',
        label: 'All',
        count: allCount,
        filter: (convs: any[]) => convs,
      },
      {
        id: 'unread',
        label: 'Unread',
        count: unreadCount,
        filter: (convs: any[]) => convs.filter(c => (c.unreadCount || 0) > 0),
      },
      {
        id: 'unassigned',
        label: 'Unassigned',
        count: unassignedCount,
        filter: (convs: any[]) => convs.filter(c => !c.assigneeId),
      },
      {
        id: 'ai-managed',
        label: 'AI Managed',
        count: aiManagedCount,
        filter: (convs: any[]) => convs.filter(c => c.isAIManaged),
      },
      {
        id: 'human-managed',
        label: 'Human Managed',
        count: humanManagedCount,
        filter: (convs: any[]) => convs.filter(c => !c.isAIManaged),
      },
      {
        id: 'archived',
        label: 'Archived',
        count: archivedCount,
        filter: (convs: any[]) => convs.filter(c => c.status === 'archived'),
      },
    ];
  }, [conversations]);

  const applyFilter = (filterId: string, conversations: any[]) => {
    const filter = filters.find(f => f.id === filterId);
    return filter ? filter.filter(conversations) : conversations;
  };

  return {
    filters,
    applyFilter,
  };
}
