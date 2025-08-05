"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Reply, ArrowBendUpLeft, MessageCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EnhancedMessageBubble, MessageData } from './EnhancedMessageBubble';
import { EnhancedComposer } from './EnhancedComposer';
import { EnhancedTypingIndicator, TypingUser } from './EnhancedTypingIndicator';

interface MessageThreadProps {
  parentMessage: MessageData;
  replies: MessageData[];
  isOpen: boolean;
  onClose: () => void;
  onSendReply: (content: string, attachments?: File[]) => Promise<void>;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  currentUserId?: string;
  typingUsers?: TypingUser[];
  className?: string;
  maxHeight?: number;
}

export function MessageThread({
  parentMessage,
  replies,
  isOpen,
  onClose,
  onSendReply,
  onReact,
  onEdit,
  onDelete,
  currentUserId,
  typingUsers = [],
  className,
  maxHeight = 600,
}: MessageThreadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new replies are added
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [replies.length, isOpen]);

  // Handle reply submission
  const handleSendReply = async (content: string, attachments?: File[]) => {
    setIsLoading(true);
    try {
      await onSendReply(content, attachments);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format reply count
  const getReplyCountText = () => {
    const count = replies.length;
    if (count === 0) return 'No replies';
    if (count === 1) return '1 reply';
    return `${count} replies`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          'fixed right-0 top-0 h-full bg-background border-l shadow-xl z-50 flex flex-col',
          'w-96 md:w-[400px]',
          className
        )}
        style={{ maxHeight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Reply className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Thread</h3>
              <p className="text-sm text-gray-500">{getReplyCountText()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Parent Message */}
        <div className="border-b bg-gray-50/50 p-4">
          <div className="flex items-start gap-2 mb-2">
            <ArrowBendUpLeft className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
            <span className="text-sm text-gray-500 font-medium">Original message</span>
          </div>
          <EnhancedMessageBubble
            message={parentMessage}
            isOwn={parentMessage.senderType === 'user' || parentMessage.metadata?.userId === currentUserId}
            showAvatar={true}
            showTimestamp={true}
            enableActions={false}
            enableReactions={false}
            variant="compact"
            className="bg-white rounded-lg p-3 border"
          />
        </div>

        {/* Replies */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            {replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No replies yet</p>
                <p className="text-xs opacity-75">Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EnhancedMessageBubble
                      message={reply}
                      isOwn={reply.senderType === 'user' || reply.metadata?.userId === currentUserId}
                      showAvatar={true}
                      showTimestamp={true}
                      enableActions={true}
                      enableReactions={true}
                      enableReplies={false} // Disable nested replies for now
                      variant="compact"
                      onReact={onReact}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="mt-4">
                    <EnhancedTypingIndicator
                      typingUsers={typingUsers}
                      variant="compact"
                    />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Composer */}
          <div className="border-t p-4 bg-gray-50/50">
            <EnhancedComposer
              ref={composerRef}
              onSend={handleSendReply}
              placeholder="Reply to this thread..."
              disabled={isLoading}
              variant="compact"
              enableAttachments={true}
              enableEmoji={true}
              enableDrafts={false}
              maxLength={1000}
              className="bg-white"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Thread preview component for showing thread info in main chat
interface ThreadPreviewProps {
  parentMessage: MessageData;
  replyCount: number;
  lastReply?: MessageData;
  onClick: () => void;
  className?: string;
}

export function ThreadPreview({
  parentMessage,
  replyCount,
  lastReply,
  onClick,
  className,
}: ThreadPreviewProps) {
  if (replyCount === 0) return null;

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors',
        'flex items-center gap-3 mt-2',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-2 bg-blue-100 rounded-lg">
        <Reply className="h-4 w-4 text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-blue-900">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
          {lastReply && (
            <span className="text-xs text-blue-600">
              {formatTime(lastReply.timestamp)}
            </span>
          )}
        </div>
        
        {lastReply && (
          <p className="text-sm text-blue-700 truncate">
            <span className="font-medium">{lastReply.senderName}:</span>{' '}
            {lastReply.content}
          </p>
        )}
      </div>
      
      <ArrowBendUpLeft className="h-4 w-4 text-blue-600 flex-shrink-0" />
    </motion.button>
  );
}
