import React from 'react';
import { motion } from 'framer-motion';
import { ChatCircle, ArrowRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onSendMessage?: () => void;
  className?: string;
}

export function EmptyState({ onSendMessage, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid="empty-state"
      className={cn(
        'flex flex-col items-center justify-center h-full px-4 py-16',
        className
      )}
    >
      {/* Chat Bubble Icon */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <ChatCircle className="w-8 h-8 text-gray-400" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-gray-900 mb-2"
      >
        No messages
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 text-center mb-8 max-w-xs"
      >
        Messages from the team will be shown here
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onSendMessage}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <span>Send us a message</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
} 