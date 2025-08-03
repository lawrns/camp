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
export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
  timestamp: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isDocument: boolean;
}

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
  // NEW: Advanced features
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  threadId?: string;
  isThreaded?: boolean;
  threadCount?: number;
  onReply?: (messageId: string) => void;
  onViewThread?: (threadId: string) => void;
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
  // NEW: Advanced features
  reactions,
  attachments,
  threadId,
  isThreaded,
  threadCount,
  onReply,
  onViewThread,
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          data-testid="message"
        >
          {/* Message content */}
          <div className="whitespace-pre-wrap">
            {content}
          </div>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="border border-gray-200 rounded-lg p-2 bg-gray-50"
                  data-testid="file-attachment"
                >
                  {attachment.isImage ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-full h-auto rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  ) : attachment.isVideo ? (
                    <video
                      src={attachment.url}
                      controls
                      className="max-w-full h-auto rounded"
                      style={{ maxHeight: '200px' }}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thread indicator */}
          {isThreaded && threadCount && threadCount > 0 && (
            <div
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={() => onViewThread?.(threadId!)}
            >
              💬 {threadCount} replies
            </div>
          )}

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

          {/* Reactions */}
          {reactions && reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {reactions.map((reaction, index) => (
                <button
                  key={`${reaction.emoji}-${index}`}
                  onClick={() => onReact?.(id, reaction.emoji)}
                  className={cn(
                    'px-2 py-1 rounded-full text-xs border transition-colors',
                    reaction.hasReacted
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  )}
                  data-testid="reaction"
                >
                  {reaction.emoji} {reaction.count}
                </button>
              ))}
            </div>
          )}

          {/* Message actions */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex space-x-1 p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => onReact?.(id, '👍')}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                title="React"
                aria-label="Add reaction"
                data-testid="reaction-button"
              >
                😊
              </button>
              <button
                onClick={() => onReply?.(id)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                title="Reply"
                aria-label="Reply to message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(content);
                    // Visual feedback for successful copy
                    const button = event?.target as HTMLElement;
                    if (button) {
                      const originalText = button.innerHTML;
                      button.innerHTML = '✓';
                      button.className = 'p-1.5 rounded bg-green-100 text-green-600 transition-all duration-150';
                      setTimeout(() => {
                        button.innerHTML = originalText;
                        button.className = 'p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150';
                      }, 1000);
                    }
                  } catch (err) {
                    console.error('Failed to copy text: ', err);
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = content;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                  }
                }}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                title="Copy"
                aria-label="Copy message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
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
  // NEW: Advanced features
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onViewThread?: (threadId: string) => void;
}

export function MessageGroup({ 
  messages, 
  className,
  // NEW: Advanced features
  onReact,
  onReply,
  onViewThread,
}: MessageGroupProps) {
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
          onReact={onReact}
          onReply={onReply}
          onViewThread={onViewThread}
        />
      ))}
    </div>
  );
}
