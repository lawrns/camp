import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ThreadData } from '@/types/thread-inbox';

interface ThreadItemProps {
  thread: ThreadData;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function ThreadItem({ thread, isSelected, onClick, className }: ThreadItemProps) {
  const lastMessage = thread.lastMessage;
  const participant = thread.participants[0]; // Primary participant

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      data-testid="thread-item"
      className={cn(
        'flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer transition-colors',
        isSelected && 'bg-blue-50 border-blue-200',
        'hover:bg-gray-50',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0" data-testid="thread-avatar">
        {participant.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {getInitials(participant.name)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-gray-900 truncate" data-testid="thread-participant">
            {participant.name}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0" data-testid="thread-timestamp">
            {formatTime(lastMessage.timestamp)}
          </span>
        </div>

        <p className="text-sm text-gray-600 truncate mb-1" data-testid="thread-last-message">
          {lastMessage.content}
        </p>

        <div className="flex items-center justify-between">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full',
            thread.status === 'active' && 'bg-green-100 text-green-700',
            thread.status === 'resolved' && 'bg-gray-100 text-gray-700',
            thread.status === 'archived' && 'bg-yellow-100 text-yellow-700'
          )} data-testid="thread-status">
            {thread.status}
          </span>

          {thread.unreadCount > 0 && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {thread.unreadCount}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 