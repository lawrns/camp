import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { ThreadList } from './ThreadList';
import { EmptyState } from './EmptyState';
import { BottomNavigation } from './BottomNavigation';
import { ThreadConversationView } from './ThreadConversationView';
import { useThreadInboxStore, selectSelectedThread } from '@/lib/state/thread-inbox-state';
import { cn } from '@/lib/utils';
import type { ThreadData } from '@/types/thread-inbox';

interface ThreadInboxViewProps {
  organizationId: string;
  onClose?: () => void;
  onSendMessage?: (content: string) => Promise<void>;
  onThreadSelect?: (threadId: string) => void;
  className?: string;
}

export function ThreadInboxView({
  organizationId,
  onClose,
  onSendMessage,
  onThreadSelect,
  className
}: ThreadInboxViewProps) {
  const {
    threads,
    selectedThreadId,
    isLoading,
    error,
    activeTab,
    selectThread,
    setActiveTab,
    setLoading,
    setError
  } = useThreadInboxStore();

  const selectedThread = useThreadInboxStore(selectSelectedThread);

  // Mock data for demonstration - will be replaced with real API calls
  useEffect(() => {
    const loadMockThreads = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
              isUnread: false
            },
            unreadCount: 0,
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            metadata: {}
          },
          {
            id: '2',
            title: 'Technical Issue',
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
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
              isUnread: true
            },
            unreadCount: 2,
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            metadata: {}
          }
        ];

        useThreadInboxStore.getState().setThreads(mockThreads);
      } catch (error) {
        setError('Failed to load threads');
        console.error('Failed to load threads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMockThreads();
  }, [organizationId, setLoading, setError]);

  const handleThreadSelect = (threadId: string) => {
    selectThread(threadId);
    // Call external callback if provided
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  const handleBackToList = () => {
    selectThread(null);
  };

  const handleSendThreadMessage = async (content: string) => {
    if (!selectedThread) return;

    try {
      // Mock API call - will be replaced with real implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the thread's last message
      useThreadInboxStore.getState().updateThreadLastMessage(selectedThread.id, {
        id: Date.now().toString(),
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

      // Call the parent onSendMessage if provided
      if (onSendMessage) {
        await onSendMessage(content);
      }
    } catch (error) {
      console.error('Failed to send thread message:', error);
      throw error;
    }
  };

  const handleTabChange = (tab: 'home' | 'messages' | 'help') => {
    setActiveTab(tab);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-white',
        'max-w-sm mx-auto w-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-white rounded-b-2xl">
        <AnimatePresence mode="wait">
          {selectedThread ? (
            <ThreadConversationView
              key={selectedThread.id}
              thread={selectedThread}
              onBack={handleBackToList}
              onSendMessage={handleSendThreadMessage}
            />
          ) : (
            <div className="h-full flex flex-col">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
                  {error}
                </div>
              )}
              
              <ThreadList
                threads={threads}
                selectedThreadId={selectedThreadId}
                isLoading={isLoading}
                onThreadSelect={handleThreadSelect}
                onSendMessage={onSendMessage}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </motion.div>
  );
} 