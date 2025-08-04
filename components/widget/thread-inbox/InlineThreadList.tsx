import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreadList } from './ThreadList';
import { EmptyState } from './EmptyState';
import { useThreadInboxStore } from '@/lib/state/thread-inbox-state';
import { cn } from '@/lib/utils';
import type { ThreadData } from '@/types/thread-inbox';

interface InlineThreadListProps {
  organizationId: string;
  onThreadSelect?: (threadId: string) => void;
  onSendMessage?: (content: string) => Promise<void>;
  className?: string;
}

export function InlineThreadList({
  organizationId,
  onThreadSelect,
  onSendMessage,
  className
}: InlineThreadListProps) {
  const {
    threads,
    selectedThreadId,
    isLoading,
    error,
    setLoading,
    setError,
    addThread,
    selectThread
  } = useThreadInboxStore();

  // Load mock threads on mount
  useEffect(() => {
    const loadMockThreads = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock thread data
        const mockThreads: ThreadData[] = [
          {
            id: '1',
            title: 'General Support',
            participants: [
              {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                avatar: null,
                role: 'customer'
              }
            ],
            lastMessage: {
              id: '1',
              content: 'Hi, I need help with my account',
              sender: {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                avatar: null,
                role: 'customer'
              },
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
              isUnread: false
            },
            unreadCount: 0,
            status: 'active',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            metadata: {}
          },
          {
            id: '2',
            title: 'Billing Question',
            participants: [
              {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                avatar: null,
                role: 'customer'
              }
            ],
            lastMessage: {
              id: '2',
              content: 'The app is not working properly',
              sender: {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                avatar: null,
                role: 'customer'
              },
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
              isUnread: true
            },
            unreadCount: 2,
            status: 'active',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            metadata: {}
          },
          {
            id: '3',
            title: 'Feature Request',
            participants: [
              {
                id: '3',
                name: 'Bob Wilson',
                email: 'bob@example.com',
                avatar: null,
                role: 'customer'
              }
            ],
            lastMessage: {
              id: '3',
              content: 'Can you add dark mode?',
              sender: {
                id: '3',
                name: 'Bob Wilson',
                email: 'bob@example.com',
                avatar: null,
                role: 'customer'
              },
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              isUnread: false
            },
            unreadCount: 0,
            status: 'resolved',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            metadata: {}
          }
        ];

        // Add threads to store
        mockThreads.forEach(thread => {
          addThread(thread);
        });

      } catch (error) {
        console.error('Failed to load threads:', error);
        setError('Failed to load threads. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMockThreads();
  }, [organizationId, setLoading, setError, addThread]);

  const handleThreadSelect = (threadId: string) => {
    selectThread(threadId);
    // Call external callback if provided
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  return (
    <div className={cn('h-full flex flex-col bg-white', className)}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <div className="h-full flex flex-col">
            {threads.length === 0 && !isLoading ? (
              <EmptyState
                onSendMessage={onSendMessage}
              />
            ) : (
              <ThreadList
                threads={threads}
                selectedThreadId={selectedThreadId}
                isLoading={isLoading}
                onThreadSelect={handleThreadSelect}
                onSendMessage={onSendMessage}
              />
            )}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default InlineThreadList;
