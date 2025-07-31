"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Checks, Clock, Warning } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface WidgetMessage {
  id: string;
  content: string;
  senderType: 'user' | 'agent' | 'ai' | 'system';
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }>;
}

interface WidgetMessageBubbleProps {
  message: WidgetMessage;
  isOwn?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export function WidgetMessageBubble({
  message,
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  className,
}: WidgetMessageBubbleProps) {
  const [imageError, setImageError] = useState(false);

  // Format timestamp for widget (simpler than dashboard)
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Get status icon (simplified for widget)
  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
      case 'read':
        return <Checks className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <Warning className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Get bubble styling
  const getBubbleStyles = () => {
    const baseStyles = "max-w-[85%] rounded-2xl px-3 py-2 break-words text-sm";
    
    if (message.senderType === 'system') {
      return cn(baseStyles, "bg-gray-100 text-gray-600 text-center text-xs mx-auto max-w-[90%]");
    }

    if (isOwn) {
      return cn(
        baseStyles,
        "bg-blue-500 text-white ml-auto",
        message.status === 'failed' && "bg-red-500"
      );
    }

    switch (message.senderType) {
      case 'ai':
        return cn(baseStyles, "bg-purple-100 text-purple-900 border border-purple-200");
      case 'agent':
        return cn(baseStyles, "bg-green-100 text-green-900 border border-green-200");
      default:
        return cn(baseStyles, "bg-gray-100 text-gray-900");
    }
  };

  // Simple link detection and formatting
  const formatContent = (content: string) => {
    // Basic URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2 px-3 py-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && message.senderType !== 'system' && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback className="text-xs">
            {message.senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender Name (for non-own messages) */}
        {!isOwn && message.senderType !== 'system' && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-600">
              {message.senderName}
            </span>
            {message.senderType === 'ai' && (
              <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-xs font-medium">
                AI
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div className={getBubbleStyles()}>
          {/* Message Content */}
          <div className="whitespace-pre-wrap">
            {formatContent(message.content)}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>
                  {attachment.type === 'image' && !imageError ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-full h-auto rounded-lg max-h-48"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded text-xs">
                      <div className="font-medium">{attachment.name}</div>
                      {attachment.size && (
                        <div className="opacity-75">
                          {(attachment.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp & Status (for own messages) */}
          {isOwn && showTimestamp && (
            <div className="flex items-center gap-1 mt-1 justify-end">
              <span className="text-xs opacity-60">
                {formatTimestamp(message.timestamp)}
              </span>
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Timestamp for other messages */}
        {!isOwn && showTimestamp && message.senderType !== 'system' && (
          <span className="text-xs text-gray-400 mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Simple typing indicator for widget
export function WidgetTypingIndicator({ 
  isVisible, 
  userName = "Agent",
  className 
}: { 
  isVisible: boolean; 
  userName?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center gap-2 px-3 py-2', className)}
    >
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-gray-100 rounded-2xl px-3 py-2 flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="h-1 w-1 rounded-full bg-gray-400"
            animate={{ y: [-2, 0, -2], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
