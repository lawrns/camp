// 🔧 FIXED CONVERSATION ROW - CAMPFIRE V2
// Updated to use unified types and camelCase properties

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { Conversation } from '@/types/unified';

interface ConversationRowProps {
  conversation: Conversation;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  style?: React.CSSProperties;
}

export const ConversationRow: React.FC<ConversationRowProps> = ({
  conversation,
  selectedId,
  onSelect,
  style,
}) => {
  const isSelected = selectedId === conversation.id;
  const hasUnread = conversation.unreadCount > 0;

  // Format timestamp - using camelCase properties
  const formatTime = () => {
    if (!conversation.lastMessageAt) return '';
    try {
      return formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // CONVERSATION-UI FIX: Get avatar with cartoon character fallbacks
  const getAvatarFallback = (name: string) => {
    // Use cartoon character emojis as fallbacks for Anonymous Users
    const cartoonAvatars = ['🦉', '🍊', '🐱', '🐶', '🐸', '🦊', '🐼', '🐨'];
    const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avatarIndex = nameHash % cartoonAvatars.length;

    if (name === "Anonymous User") {
      return cartoonAvatars[avatarIndex];
    }

    // For named users, use initials
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status badge
  const getStatusBadge = () => {
    const statusColors = {
      open: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-blue-100 text-blue-800',
      escalated: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge 
        variant="secondary" 
        className={cn('text-xs', statusColors[conversation.status])}
        data-testid="conversation-status-badge"
      >
        {conversation.status}
      </Badge>
    );
  };

  // Get priority badge
  const getPriorityBadge = () => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs', priorityColors[conversation.priority])}
        data-testid="conversation-priority-badge"
      >
        {conversation.priority}
      </Badge>
    );
  };

  // CONVERSATION-UI FIX: Get assignment badge with "Human" tag
  const getAssignmentBadge = () => {
    if (conversation.assigned_to_ai) {
      return (
        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
          🤖 AI
        </Badge>
      );
    }
    if (conversation.assigneeId || conversation.assignedOperatorId) {
      return (
        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
          👤 Assigned
        </Badge>
      );
    }
    // CONVERSATION-UI FIX: Show "Human" tag for unassigned conversations
    return (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
        👤 Human
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
        isSelected && 'bg-blue-50 border-blue-200',
        hasUnread && 'bg-blue-50'
      )}
      onClick={() => onSelect(conversation)}
      style={style}
      data-testid={`conversation-row-${conversation.id}`}
    >
      {/* CONVERSATION-UI FIX: Avatar with cartoon character fallbacks */}
      <div className="flex-shrink-0 relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.customerAvatar || ''} alt={conversation.customerName} />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-lg">
            {getAvatarFallback(conversation.customerName)}
          </AvatarFallback>
        </Avatar>
        {/* STANDARD-003 FIX: Online status indicator */}
        {conversation.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span 
              className={cn(
                'text-sm font-medium truncate',
                hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
              )}
              data-testid="conversation-customer-name"
            >
              {conversation.customerName}
            </span>
            {hasUnread && (
              <Badge variant="destructive" className="text-xs">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
          {/* CONVERSATION-UI FIX: Add clock icon to timestamp */}
          <div className="flex items-center space-x-1 text-xs text-gray-400" data-testid="conversation-timestamp">
            <Clock className="h-3 w-3" />
            <span>{formatTime()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-1">
          <span 
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-gray-900' : 'text-gray-600'
            )}
            data-testid="conversation-customer-email"
          >
            {conversation.customerEmail}
          </span>
        </div>

        {/* Last message preview */}
        {conversation.lastMessagePreview && (
          <div className="flex items-center space-x-2 mb-2">
            <span 
              className={cn(
                'text-sm truncate',
                hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
              )}
              data-testid="conversation-last-message"
            >
              {conversation.lastMessagePreview}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          {getPriorityBadge()}
          {getAssignmentBadge()}

          {/* STANDARD-003 FIX: Display tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {conversation.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {conversation.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{conversation.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {conversation.hasAttachments && (
            <Badge variant="outline" className="text-xs">
              📎
            </Badge>
          )}

          {conversation.messageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {conversation.messageCount} messages
            </Badge>
          )}
        </div>

        {/* Subject */}
        {conversation.subject && (
          <div className="mt-1">
            <span className="text-xs text-gray-500" data-testid="conversation-subject">
              {conversation.subject}
            </span>
          </div>
        )}

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {conversation.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
