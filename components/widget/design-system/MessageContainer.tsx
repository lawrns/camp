/**
 * PIXEL-PERFECT MESSAGE CONTAINER v2
 * 
 * Meticulously designed message list container with perfect scrolling,
 * spacing, and auto-scroll behavior following Intercom standards
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageBubble, MessageGroup, type MessageBubbleProps } from './MessageBubble';
import { SPACING, COLORS, ANIMATIONS, LAYOUT, SHADOWS } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface MessageContainerProps {
  messages: MessageBubbleProps[];
  isLoading?: boolean;
  typingUsers?: Array<{ id: string; name: string }>;
  enableAutoScroll?: boolean;
  enableGrouping?: boolean;
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onReachTop?: () => void;
  onReachBottom?: () => void;
  // NEW: Advanced features
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onViewThread?: (threadId: string) => void;
}

// ============================================================================
// TYPING INDICATOR COMPONENT
// ============================================================================
function TypingIndicator({ users }: { users: Array<{ id: string; name: string }> }) {
  if (users.length === 0) return null;

  const displayText = users.length === 1 
    ? `${users[0].name} is typing...`
    : users.length === 2
    ? `${users[0].name} and ${users[1].name} are typing...`
    : `${users[0].name} and ${users.length - 1} others are typing...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className="flex justify-start"
      style={{
        marginBottom: SPACING.messageMargin,
        paddingLeft: SPACING.containerPadding,
        paddingRight: SPACING.containerPadding,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.agent.background,
          border: `1px solid ${COLORS.agent.border}`,
          borderRadius: '16px 16px 16px 4px',
          padding: '8px 12px',
          maxWidth: '120px',
        }}
      >
        {/* Typing animation dots */}
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Typing text */}
        <div
          style={{
            fontSize: '11px',
            color: COLORS.agent.timestamp,
            marginTop: '4px',
            textAlign: 'center',
          }}
        >
          {displayText}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// LOADING INDICATOR
// ============================================================================
function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-center items-center"
      style={{
        padding: SPACING.xl,
      }}
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MESSAGE GROUPING LOGIC
// ============================================================================
function groupMessages(messages: MessageBubbleProps[]): MessageBubbleProps[][] {
  if (messages.length === 0) return [];

  const groups: MessageBubbleProps[][] = [];
  let currentGroup: MessageBubbleProps[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const previousMessage = messages[i - 1];
    
    // Group messages from same sender within 5 minutes
    const timeDiff = new Date(currentMessage.timestamp).getTime() - 
                    new Date(previousMessage.timestamp).getTime();
    const isSameSender = currentMessage.senderType === previousMessage.senderType &&
                        currentMessage.senderName === previousMessage.senderName;
    const isWithinTimeLimit = timeDiff < 5 * 60 * 1000; // 5 minutes

    if (isSameSender && isWithinTimeLimit) {
      currentGroup.push(currentMessage);
    } else {
      groups.push(currentGroup);
      currentGroup = [currentMessage];
    }
  }
  
  groups.push(currentGroup);
  return groups;
}

// ============================================================================
// PIXEL-PERFECT MESSAGE CONTAINER
// ============================================================================
export function MessageContainer({
  messages,
  isLoading = false,
  typingUsers = [],
  enableAutoScroll = true,
  enableGrouping = true,
  className,
  onScroll,
  onReachTop,
  onReachBottom,
  // NEW: Advanced features
  onReact,
  onReply,
  onViewThread,
}: MessageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Check if user is near bottom (within 100px)
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    
    // Update auto-scroll preference based on user behavior
    if (!nearBottom && shouldAutoScroll) {
      setShouldAutoScroll(false);
    } else if (nearBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true);
    }

    // Call external scroll handler
    onScroll?.(event);

    // Check for reach top/bottom
    if (scrollTop === 0) {
      onReachTop?.();
    }
    if (distanceFromBottom < 10) {
      onReachBottom?.();
    }
  }, [shouldAutoScroll, onScroll, onReachTop, onReachBottom]);

  // Auto-scroll effect with improved timing
  useEffect(() => {
    if (enableAutoScroll && shouldAutoScroll && isNearBottom) {
      // Use requestAnimationFrame for smoother scrolling
      const frame = requestAnimationFrame(() => {
        scrollToBottom(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [messages, enableAutoScroll, shouldAutoScroll, isNearBottom, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, []); // Only on mount

  // Group messages if enabled
  const messageGroups = enableGrouping ? groupMessages(messages) : messages.map(msg => [msg]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
        className
      )}
      style={{
        padding: `${SPACING.md} 0`,
        backgroundColor: COLORS.background,
        minHeight: LAYOUT.message.minHeight,
      }}
      onScroll={handleScroll}
    >
      {/* Loading indicator at top */}
      <AnimatePresence>
        {isLoading && <LoadingIndicator />}
      </AnimatePresence>

      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center"
          style={{
            padding: SPACING.xl,
            color: COLORS.agent.timestamp,
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: SPACING.sm,
              color: COLORS.agent.text,
            }}
          >
            Start a conversation!
          </div>
          <div
            style={{
              fontSize: '14px',
              opacity: 0.7,
            }}
          >
            We're here to help you with any questions.
          </div>
        </motion.div>
      )}

      {/* Message groups */}
      <AnimatePresence initial={false}>
        {messageGroups.map((group, index) => (
          enableGrouping ? (
            <MessageGroup
              key={`group-${index}-${group[0]?.id}`}
              messages={group}
              className="px-4"
              onReact={onReact}
              onReply={onReply}
              onViewThread={onViewThread}
            />
          ) : (
            <div key={group[0]?.id} className="px-4">
              <MessageBubble 
                {...group[0]} 
                onReact={onReact}
                onReply={onReply}
                onViewThread={onViewThread}
              />
            </div>
          )
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />

      {/* Scroll to bottom button - positioned relative to container */}
      <AnimatePresence>
        {!isNearBottom && messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="absolute z-10"
            style={{
              bottom: SPACING.lg,
              right: SPACING.lg,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: COLORS.primary[500],
              color: 'white',
              border: 'none',
              boxShadow: SHADOWS.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: parseFloat(ANIMATIONS.fast) / 1000,
              ease: [0.4, 0.0, 0.2, 1],
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13l3 3 7-7" />
              <path d="M12 3v9" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
