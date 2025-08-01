"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Checks,
  Clock,
  Copy,
  DotsThree,
  PencilSimple,
  ArrowBendLeftUp,
  Trash,
  Warning,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smiley
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
// Note: date-fns import removed to avoid dependency issues
// Using simple relative time formatting instead

export interface MessageData {
  id: string;
  content: string;
  senderType: 'user' | 'agent' | 'ai' | 'system';
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  isEdited?: boolean;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface EnhancedMessageBubbleProps {
  message: MessageData;
  isOwn?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  enableActions?: boolean;
  enableReactions?: boolean;
  enableEditing?: boolean;
  enableReplies?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  
  // Callbacks
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onAttachmentClick?: (attachment: MessageAttachment) => void;
}

export function EnhancedMessageBubble({
  message,
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  showStatus = true,
  enableActions = true,
  enableReactions = true,
  enableEditing = true,
  enableReplies = true,
  className,
  variant = 'default',
  onReact,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onAttachmentClick,
}: EnhancedMessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Intersection observer for read receipts
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`;
      }
    } catch {
      return 'Invalid time';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!showStatus || !isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-500" />;
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
    const baseStyles = "max-w-[70%] rounded-2xl px-4 py-2 break-words";
    
    if (message.senderType === 'system') {
      return cn(baseStyles, "bg-gray-100 text-gray-600 text-center text-sm mx-auto");
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

  // Handle reaction
  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactionPicker(false);
  };

  // Handle copy
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.(message.content);
  };

  // Quick reactions
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <TooltipProvider>
      <motion.div
        ref={messageRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'group flex gap-3 px-4 py-2 transition-colors',
          isOwn ? 'flex-row-reverse' : 'flex-row',
          isHovered && 'bg-gray-50',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        {showAvatar && !isOwn && message.senderType !== 'system' && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-xs">
              {message.senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Content */}
        <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
          {/* Sender Name & Timestamp */}
          {(!isOwn || variant === 'detailed') && message.senderType !== 'system' && (
            <div className={cn(
              'flex items-center gap-2 mb-1 text-xs text-gray-500',
              isOwn ? 'flex-row-reverse' : 'flex-row'
            )}>
              <span className="font-medium">{message.senderName}</span>
              {message.senderType === 'ai' && (
                <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-xs">
                  AI
                </span>
              )}
              {showTimestamp && (
                <span>{formatTimestamp(message.timestamp)}</span>
              )}
            </div>
          )}

          {/* Message Bubble */}
          <div className={getBubbleStyles()}>
            {/* Reply Context */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black bg-opacity-10 rounded text-sm opacity-75">
                <div className="text-xs opacity-75 mb-1">Replying to:</div>
                <div className="truncate">Previous message content...</div>
              </div>
            )}

            {/* Message Content */}
            <div className="whitespace-pre-wrap">
              {message.content}
              {message.isEdited && (
                <span className="text-xs opacity-60 ml-2">(edited)</span>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    onClick={() => onAttachmentClick?.(attachment)}
                    className="cursor-pointer"
                  >
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded">
                        <div className="text-sm font-medium">{attachment.name}</div>
                        {attachment.size && (
                          <div className="text-xs opacity-75">
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

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    'h-6 px-2 text-xs rounded-full',
                    reaction.hasReacted && 'bg-blue-100 text-blue-600'
                  )}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </div>
          )}

          {/* Actions (on hover) */}
          <AnimatePresence>
            {enableActions && isHovered && message.senderType !== 'system' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'flex items-center gap-1 mt-1',
                  isOwn ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Quick Reactions */}
                {enableReactions && (
                  <div className="flex items-center gap-1">
                    {quickReactions.map((emoji) => (
                      <Tooltip key={emoji}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(emoji)}
                            className="h-6 w-6 p-0 text-sm hover:scale-110 transition-transform"
                          >
                            {emoji}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>React with {emoji}</TooltipContent>
                      </Tooltip>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                      className="h-6 w-6 p-0"
                    >
                      <Smiley className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <DotsThree className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                    {enableReplies && (
                      <DropdownMenuItem onClick={() => onReply?.(message.id)}>
                        <ArrowBendLeftUp className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    {enableEditing && isOwn && (
                      <DropdownMenuItem onClick={() => onEdit?.(message.id)}>
                        <PencilSimple className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {isOwn && (
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(message.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
