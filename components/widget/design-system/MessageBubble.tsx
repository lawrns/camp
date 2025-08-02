/**
 * PIXEL-PERFECT MESSAGE BUBBLE COMPONENT
 * 
 * Meticulously designed chat bubble following Intercom standards
 * with perfect alignment, spacing, and typography
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACING, TYPOGRAPHY, COLORS, RADIUS, SHADOWS, ANIMATIONS } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface MessageBubbleProps {
  id: string;
  content: string;
  senderType: 'visitor' | 'agent' | 'system';
  senderName?: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  className?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onCopy?: (content: string) => void;
}

// ============================================================================
// PIXEL-PERFECT MESSAGE BUBBLE
// ============================================================================
export function MessageBubble({
  id,
  content,
  senderType,
  senderName,
  timestamp,
  status = 'delivered',
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  showStatus = true,
  className,
  onReact,
  onCopy,
}: MessageBubbleProps) {
  
  // Determine if this is a visitor message (always treat visitor as own)
  const isVisitorMessage = senderType === 'visitor' || isOwn;
  const isAgentMessage = senderType === 'agent';
  const isSystemMessage = senderType === 'system';

  // Get bubble styling based on sender type
  const getBubbleStyles = () => {
    const baseStyles = {
      maxWidth: '280px', // Exactly 70% of 400px widget width
      padding: SPACING.messagePadding,
      borderRadius: isVisitorMessage 
        ? RADIUS.messageBubble.visitor 
        : isAgentMessage 
        ? RADIUS.messageBubble.agent 
        : RADIUS.messageBubble.system,
      boxShadow: SHADOWS.messageBubble,
      fontSize: TYPOGRAPHY.messageText.fontSize,
      lineHeight: TYPOGRAPHY.messageText.lineHeight,
      fontWeight: TYPOGRAPHY.messageText.fontWeight,
      fontFamily: TYPOGRAPHY.messageText.fontFamily,
      wordBreak: 'break-word' as const,
      hyphens: 'auto' as const,
    };

    if (isVisitorMessage) {
      return {
        ...baseStyles,
        backgroundColor: COLORS.visitor.background,
        color: COLORS.visitor.text,
        border: `1px solid ${COLORS.visitor.border}`,
      };
    }

    if (isAgentMessage) {
      return {
        ...baseStyles,
        backgroundColor: COLORS.agent.background,
        color: COLORS.agent.text,
        border: `1px solid ${COLORS.agent.border}`,
      };
    }

    // System message
    return {
      ...baseStyles,
      backgroundColor: COLORS.system.background,
      color: COLORS.system.text,
      border: `1px solid ${COLORS.system.border}`,
      borderRadius: RADIUS.messageBubble.system,
    };
  };

  // Get timestamp styling
  const getTimestampStyles = () => {
    const baseStyles = {
      fontSize: TYPOGRAPHY.timestamp.fontSize,
      lineHeight: TYPOGRAPHY.timestamp.lineHeight,
      fontWeight: TYPOGRAPHY.timestamp.fontWeight,
      marginTop: SPACING.xs,
    };

    if (isVisitorMessage) {
      return {
        ...baseStyles,
        color: COLORS.visitor.timestamp,
      };
    }

    if (isAgentMessage) {
      return {
        ...baseStyles,
        color: COLORS.agent.timestamp,
      };
    }

    return {
      ...baseStyles,
      color: COLORS.system.timestamp,
    };
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!showStatus || !isVisitorMessage) return null;

    const iconStyle = {
      fontSize: '10px',
      marginLeft: SPACING.xs,
      opacity: 0.7,
    };

    switch (status) {
      case 'sending':
        return <span style={iconStyle}>⏳</span>;
      case 'sent':
        return <span style={iconStyle}>✓</span>;
      case 'delivered':
        return <span style={iconStyle}>✓✓</span>;
      case 'read':
        return <span style={{ ...iconStyle, color: COLORS.primary[500] }}>✓✓</span>;
      case 'failed':
        return <span style={{ ...iconStyle, color: '#ef4444' }}>⚠</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.messageEntry.duration) / 1000,
        ease: [0.0, 0.0, 0.2, 1], // easeOut
        delay: parseFloat(ANIMATIONS.messageEntry.delay) / 1000,
      }}
      className={cn(
        'flex w-full',
        isVisitorMessage ? 'justify-end' : 'justify-start',
        className
      )}
      style={{
        marginBottom: SPACING.messageMargin,
      }}
    >
      {/* Message container with perfect alignment */}
      <div
        className={cn(
          'flex flex-col',
          isVisitorMessage ? 'items-end' : 'items-start'
        )}
        style={{
          maxWidth: '100%',
        }}
      >
        {/* Sender name (for agent messages) */}
        {!isVisitorMessage && !isSystemMessage && senderName && (
          <div
            style={{
              fontSize: TYPOGRAPHY.senderName.fontSize,
              lineHeight: TYPOGRAPHY.senderName.lineHeight,
              fontWeight: TYPOGRAPHY.senderName.fontWeight,
              color: COLORS.agent.timestamp,
              marginBottom: SPACING.xs,
              paddingLeft: SPACING.sm,
            }}
          >
            {senderName}
          </div>
        )}

        {/* Message bubble */}
        <div
          style={getBubbleStyles()}
          className="relative group"
          onDoubleClick={() => onCopy?.(content)}
          data-campfire-message
          data-sender-type={senderType}
        >
          {/* Message content */}
          <div className="whitespace-pre-wrap">
            {content}
          </div>

          {/* Timestamp and status */}
          {(showTimestamp || showStatus) && (
            <div
              className={cn(
                'flex items-center',
                isVisitorMessage ? 'justify-end' : 'justify-start'
              )}
              style={getTimestampStyles()}
            >
              {showTimestamp && (
                <span>{formatTimestamp(timestamp)}</span>
              )}
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MESSAGE GROUP COMPONENT - For consecutive messages from same sender
// ============================================================================
export interface MessageGroupProps {
  messages: MessageBubbleProps[];
  className?: string;
}

export function MessageGroup({ messages, className }: MessageGroupProps) {
  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  const isVisitorGroup = firstMessage.senderType === 'visitor' || firstMessage.isOwn;

  return (
    <div
      className={cn('flex flex-col', className)}
      style={{
        marginBottom: SPACING.messageGroupGap,
      }}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          {...message}
          showAvatar={index === 0}
          showTimestamp={index === messages.length - 1}
          className={index > 0 ? 'mt-1' : undefined}
        />
      ))}
    </div>
  );
}
