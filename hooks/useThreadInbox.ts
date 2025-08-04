import { useCallback } from 'react';
import { useThreadInboxStore } from '@/lib/state/thread-inbox-state';
import type { ThreadData } from '@/types/thread-inbox';

export function useThreadInbox(organizationId: string) {
  const {
    threads,
    selectedThreadId,
    isLoading,
    error,
    searchQuery,
    activeTab,
    selectThread,
    setSearchQuery,
    setActiveTab,
    setLoading,
    setError,
    addThread,
    updateThread,
    removeThread,
    updateThreadLastMessage,
    incrementUnreadCount,
    clearUnreadCount,
    reset
  } = useThreadInboxStore();

  const selectedThread = threads.find(thread => thread.id === selectedThreadId);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real API call
      const response = await fetch(`/api/widget/threads?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load threads');
      }
      
      const data = await response.json();
      useThreadInboxStore.getState().setThreads(data.threads);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load threads');
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, setLoading, setError]);

  const sendThreadMessage = useCallback(async (threadId: string, content: string) => {
    try {
      // TODO: Replace with real API call
      const response = await fetch(`/api/widget/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update the thread's last message
      updateThreadLastMessage(threadId, {
        id: data.messageId,
        content,
        sender: {
          id: 'visitor',
          name: 'You',
          email: 'visitor@example.com',
          avatar: null,
          role: 'customer'
        },
        timestamp: new Date().toISOString(),
        isUnread: false
      });

      return data;
    } catch (error) {
      console.error('Failed to send thread message:', error);
      throw error;
    }
  }, [organizationId, updateThreadLastMessage]);

  const createThread = useCallback(async (title: string, initialMessage: string) => {
    try {
      // TODO: Replace with real API call
      const response = await fetch('/api/widget/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          initialMessage,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      const data = await response.json();
      addThread(data.thread);
      
      return data.thread;
    } catch (error) {
      console.error('Failed to create thread:', error);
      throw error;
    }
  }, [organizationId, addThread]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      // TODO: Replace with real API call
      const response = await fetch(`/api/widget/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      removeThread(threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
      throw error;
    }
  }, [organizationId, removeThread]);

  const markThreadAsRead = useCallback((threadId: string) => {
    clearUnreadCount(threadId);
  }, [clearUnreadCount]);

  const searchThreads = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const switchTab = useCallback((tab: 'home' | 'messages' | 'help') => {
    setActiveTab(tab);
  }, [setActiveTab]);

  return {
    // State
    threads,
    selectedThread,
    selectedThreadId,
    isLoading,
    error,
    searchQuery,
    activeTab,
    
    // Actions
    loadThreads,
    selectThread,
    sendThreadMessage,
    createThread,
    deleteThread,
    markThreadAsRead,
    searchThreads,
    switchTab,
    reset,
    
    // Utility
    hasUnreadThreads: threads.some(thread => thread.unreadCount > 0),
    unreadCount: threads.reduce((total, thread) => total + thread.unreadCount, 0),
  };
} 