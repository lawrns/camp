"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircle, ArrowDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { WidgetMessageBubble, WidgetMessage, WidgetTypingIndicator } from './WidgetMessageBubble';

interface WidgetMessageListProps {
  messages: WidgetMessage[];
  isTyping?: boolean;
  typingUserName?: string;
  isLoading?: boolean;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function WidgetMessageList({
  messages,
  isTyping = false,
  typingUserName = "Agent",
  isLoading = false,
  className,
  onLoadMore,
  hasMore = false,
}: WidgetMessageListProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(messages.length);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isNearBottom && messages.length > lastMessageCount) {
      scrollToBottom();
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, isNearBottom]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (isTyping && isNearBottom) {
      scrollToBottom();
    }
  }, [isTyping, isNearBottom]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll events
  const handleScroll = (position: any) => {
    const { scrollTop, scrollHeight, clientHeight } = position;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setIsNearBottom(isAtBottom);
    setShowScrollToBottom(!isAtBottom);

    // Load more messages when scrolled to top
    if (hasMore && scrollTop < 100 && onLoadMore) {
      onLoadMore();
    }
  };

  // Group messages by sender and time (simplified for widget)
  const groupedMessages = React.useMemo(() => {
    const groups: Array<{ messages: WidgetMessage[]; showAvatar: boolean }> = [];
    let currentGroup: WidgetMessage[] = [];
    let lastSender = '';
    let lastTime = 0;

    messages.forEach((message, index) => {
      const messageTime = new Date(message.timestamp).getTime();
      const timeDiff = messageTime - lastTime;
      const shouldGroup = 
        message.senderName === lastSender && 
        timeDiff < 5 * 60 * 1000 && // 5 minutes
        message.senderType !== 'system';

      if (shouldGroup && currentGroup.length > 0) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push({ messages: currentGroup, showAvatar: true });
        }
        currentGroup = [message];
        lastSender = message.senderName;
      }
      
      lastTime = messageTime;
    });

    if (currentGroup.length > 0) {
      groups.push({ messages: currentGroup, showAvatar: true });
    }

    return groups;
  }, [messages]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-6', className)}>
        <div className="text-center text-gray-500">
          <ChatCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-medium mb-1">Start a conversation</h3>
          <p className="text-sm">Send a message to get help from our team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative flex-1 flex flex-col', className)}>
      {/* Loading indicator at top */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-2">
          <div className="text-xs text-gray-500">Loading messages...</div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1"
        onScrollPositionChange={handleScroll}
      >
        <div className="space-y-1 pb-4">
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.messages.map((message, messageIndex) => (
                <WidgetMessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderType === 'user'}
                  showAvatar={messageIndex === 0 && group.showAvatar}
                  showTimestamp={messageIndex === group.messages.length - 1}
                />
              ))}
            </div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <WidgetTypingIndicator
                isVisible={isTyping}
                userName={typingUserName}
              />
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
              className="rounded-full shadow-lg h-8 w-8 p-0 bg-white text-gray-600 border hover:bg-gray-50"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Welcome message component for new conversations
export function WidgetWelcomeMessage({
  organizationName = "Our Team",
  className
}: {
  organizationName?: string;
  className?: string;
}) {
  const welcomeMessage: WidgetMessage = {
    id: 'welcome',
    content: `Hi! 👋 Welcome to ${organizationName}. How can we help you today?`,
    senderType: 'agent',
    senderName: 'Support Team',
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={className}
    >
      <WidgetMessageBubble
        message={welcomeMessage}
        isOwn={false}
        showAvatar={true}
        showTimestamp={true}
      />
    </motion.div>
  );
}
