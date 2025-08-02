"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewMessagesIndicatorProps {
  show: boolean;
  messageCount?: number;
  onClick: () => void;
  className?: string;
}

/**
 * New Messages Indicator Component
 * 
 * Shows a floating indicator when user scrolls up and new messages arrive.
 * Provides Intercom-style UX for message navigation.
 */
export function NewMessagesIndicator({
  show,
  messageCount = 0,
  onClick,
  className
}: NewMessagesIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20",
            className
          )}
        >
          <button
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg",
              "hover:bg-blue-700 transition-all duration-200 hover:shadow-xl",
              "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2",
              "text-sm font-medium whitespace-nowrap"
            )}
          >
            {messageCount > 0 && (
              <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold min-w-[20px] text-center">
                {messageCount > 99 ? '99+' : messageCount}
              </span>
            )}
            <span>
              {messageCount > 0 
                ? `${messageCount} new message${messageCount > 1 ? 's' : ''}` 
                : 'New messages'
              }
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Typing Indicator Component
 * 
 * Shows when agent is typing with animated dots
 */
interface TypingIndicatorProps {
  show: boolean;
  agentName?: string;
  className?: string;
}

export function TypingIndicator({
  show,
  agentName = "Agent",
  className
}: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn("flex justify-start mb-3", className)}
        >
          <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{agentName} is typing</span>
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Connection Status Indicator
 * 
 * Shows connection status in widget header
 */
interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSeen?: Date | null;
  className?: string;
}

export function ConnectionStatus({
  status,
  lastSeen,
  className
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
        return 'bg-yellow-400';
      case 'disconnected':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        className={cn("w-2 h-2 rounded-full", getStatusColor())}
        animate={status === 'connecting' ? { scale: [1, 1.2, 1] } : {}}
        transition={status === 'connecting' ? { duration: 1, repeat: Infinity } : {}}
      />
      <span className="text-xs opacity-75">
        {getStatusText()}
      </span>
    </div>
  );
}

/**
 * Message Status Indicator
 * 
 * Shows delivery/read status for messages
 */
interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: Date;
  className?: string;
}

export function MessageStatus({
  status,
  timestamp,
  className
}: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <motion.div
            className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      case 'sent':
        return <div className="w-3 h-3 border border-gray-400 rounded-full" />;
      case 'delivered':
        return (
          <div className="flex">
            <div className="w-3 h-3 border border-blue-400 rounded-full" />
            <div className="w-3 h-3 border border-blue-400 rounded-full -ml-1" />
          </div>
        );
      case 'read':
        return (
          <div className="flex">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <div className="w-3 h-3 bg-blue-400 rounded-full -ml-1" />
          </div>
        );
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex items-center gap-1 text-xs opacity-70", className)}>
      {timestamp && (
        <span>{formatTime(timestamp)}</span>
      )}
      {getStatusIcon()}
    </div>
  );
}
