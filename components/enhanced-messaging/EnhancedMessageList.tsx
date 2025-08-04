"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircle, ArrowDown, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EnhancedMessageBubble, MessageData } from './EnhancedMessageBubble';
import { EnhancedTypingIndicator, TypingUser } from './EnhancedTypingIndicator';

interface EnhancedMessageListProps {
  messages: MessageData[];
  typingUsers?: TypingUser[];
  isLoading?: boolean;
  hasMore?: boolean;
  currentUserId?: string;
  className?: string;
  
  // Virtualization settings
  enableVirtualization?: boolean;
  itemHeight?: number;
  overscan?: number;
  
  // Features
  enableAutoScroll?: boolean;
  enableScrollToBottom?: boolean;
  enableLoadMore?: boolean;
  enableGrouping?: boolean;
  groupTimeThreshold?: number; // minutes
  
  // Callbacks
  onLoadMore?: () => void;
  onMessageAction?: (action: string, messageId: string, data?: unknown) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  
  // Message actions
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

interface MessageGroup {
  id: string;
  messages: MessageData[];
  timestamp: string;
  senderType: string;
  senderName: string;
}

export function EnhancedMessageList({
  messages,
  typingUsers = [],
  isLoading = false,
  hasMore = false,
  currentUserId,
  className,
  enableVirtualization = true,
  itemHeight = 80,
  overscan = 5,
  enableAutoScroll = true,
  enableScrollToBottom = true,
  enableLoadMore = true,
  enableGrouping = true,
  groupTimeThreshold = 5,
  onLoadMore,
  onMessageAction,
  onScroll,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onCopy,
}: EnhancedMessageListProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(messages.length);
  
  const listRef = useRef<List>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group messages by sender and time
  const groupedMessages = useMemo(() => {
    if (!enableGrouping) {
      return messages.map(msg => ({
        id: msg.id,
        messages: [msg],
        timestamp: msg.timestamp,
        senderType: msg.senderType,
        senderName: msg.senderName,
      }));
    }

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach((message) => {
      const shouldGroup = currentGroup &&
        currentGroup.senderType === message.senderType &&
        currentGroup.senderName === message.senderName &&
        (new Date(message.timestamp).getTime() - new Date(currentGroup.timestamp).getTime()) < (groupTimeThreshold * 60 * 1000);

      if (shouldGroup) {
        currentGroup.messages.push(message);
      } else {
        currentGroup = {
          id: message.id,
          messages: [message],
          timestamp: message.timestamp,
          senderType: message.senderType,
          senderName: message.senderName,
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [messages, enableGrouping, groupTimeThreshold]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (enableAutoScroll && isNearBottom && messages.length > lastMessageCount) {
      scrollToBottom();
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, isNearBottom, enableAutoScroll]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (enableVirtualization && listRef.current) {
      listRef.current.scrollToItem(groupedMessages.length - 1, 'end');
    } else if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [enableVirtualization, groupedMessages.length]);

  // Handle scroll events
  const handleScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setIsNearBottom(isAtBottom);
    setShowScrollToBottom(!isAtBottom && enableScrollToBottom);

    // Load more messages when scrolled to top
    if (enableLoadMore && hasMore && scrollTop < 100 && onLoadMore) {
      onLoadMore();
    }

    onScroll?.(scrollTop, scrollHeight, clientHeight);
  }, [enableLoadMore, hasMore, enableScrollToBottom, onLoadMore, onScroll]);

  // Virtualized row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const group = groupedMessages[index];
    const isOwn = group.messages[0].senderType === 'user' || 
                  group.messages.some(msg => msg.metadata?.userId === currentUserId);

    return (
      <div style={style}>
        <div className="px-4 py-2">
          {group.messages.map((message, msgIndex) => (
            <EnhancedMessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={msgIndex === 0} // Only show avatar for first message in group
              showTimestamp={msgIndex === group.messages.length - 1} // Only show timestamp for last message in group
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              className={msgIndex > 0 ? 'mt-1' : ''}
            />
          ))}
        </div>
      </div>
    );
  }, [groupedMessages, currentUserId, onReact, onReply, onEdit, onDelete, onCopy]);

  // Non-virtualized message rendering
  const renderMessages = () => {
    return groupedMessages.map((group, index) => {
      const isOwn = group.messages[0].senderType === 'user' || 
                    group.messages.some(msg => msg.metadata?.userId === currentUserId);

      return (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="px-4 py-2"
        >
          {group.messages.map((message, msgIndex) => (
            <EnhancedMessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={msgIndex === 0}
              showTimestamp={msgIndex === group.messages.length - 1}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              className={msgIndex > 0 ? 'mt-1' : ''}
            />
          ))}
        </motion.div>
      );
    });
  };

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-8', className)}>
        <div className="text-center text-gray-500">
          <ChatCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-sm">Start the conversation by sending a message.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative flex-1 flex flex-col', className)}>
      {/* Loading indicator at top */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Spinner className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 relative">
        {enableVirtualization && groupedMessages.length > 50 ? (
          <List
            ref={listRef}
            height={400} // This should be dynamic based on container
            itemCount={groupedMessages.length}
            itemSize={itemHeight}
            overscanCount={overscan}
            onScroll={({ scrollOffset, scrollUpdateWasRequested }) => {
              if (!scrollUpdateWasRequested && containerRef.current) {
                const { scrollHeight, clientHeight } = containerRef.current;
                handleScroll(scrollOffset, scrollHeight, clientHeight);
              }
            }}
          >
            {Row}
          </List>
        ) : (
          <ScrollArea
            ref={scrollAreaRef}
            className="h-full"
            onScrollPositionChange={(position) => {
              const { scrollTop, scrollHeight, clientHeight } = position;
              handleScroll(scrollTop, scrollHeight, clientHeight);
            }}
          >
            <div className="space-y-1">
              {renderMessages()}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-2">
                  <EnhancedTypingIndicator typingUsers={typingUsers} />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-4 right-4"
          >
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="rounded-full shadow-lg"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator at bottom */}
      {isLoading && !hasMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Spinner className="h-4 w-4 animate-spin" />
            <span className="text-sm">Sending...</span>
          </div>
        </div>
      )}
    </div>
  );
}
