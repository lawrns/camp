import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreadItem } from './ThreadItem';
import { EmptyState } from './EmptyState';
import { useThreadInboxStore, selectFilteredThreads } from '@/lib/state/thread-inbox-state';
import type { ThreadData } from '@/types/thread-inbox';

interface ThreadListProps {
  threads: ThreadData[];
  selectedThreadId: string | null;
  isLoading: boolean;
  onThreadSelect: (threadId: string) => void;
  onSendMessage?: () => void;
  className?: string;
}

export function ThreadList({
  threads,
  selectedThreadId,
  isLoading,
  onThreadSelect,
  onSendMessage,
  className
}: ThreadListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const filteredThreads = useThreadInboxStore(selectFilteredThreads);

  // Auto-scroll to selected thread
  useEffect(() => {
    if (selectedThreadId && listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-thread-id="${selectedThreadId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedThreadId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-sm text-gray-500">Loading threads...</p>
      </div>
    );
  }

  if (filteredThreads.length === 0) {
    return <EmptyState onSendMessage={onSendMessage} />;
  }

  return (
    <div className={className} data-testid="thread-list">
      <div ref={listRef} className="overflow-y-auto h-full">
        <AnimatePresence>
          {filteredThreads.map((thread, index) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              data-thread-id={thread.id}
            >
              <ThreadItem
                thread={thread}
                isSelected={selectedThreadId === thread.id}
                onClick={() => onThreadSelect(thread.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 