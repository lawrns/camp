// 🔧 FIXED MESSAGE ROW - CAMPFIRE V2
// Updated to use unified types and camelCase properties

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Conversation, Message } from '@/types/unified';

interface MessageRowProps {
  message: Message;
  selectedConversation?: Conversation;
  hoveredMessage?: string | null;
  setHoveredMessage: (id: string | null) => void;
  style?: React.CSSProperties;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  selectedConversation,
  hoveredMessage,
  setHoveredMessage,
  style,
}) => {
  const isHovered = hoveredMessage === message.id;
  const isFromCustomer = message.senderType === 'customer' || message.senderType === 'visitor';
  const isFromAgent = message.senderType === 'agent' || message.senderType === 'user';
  const isFromAI = message.senderType === 'ai' || message.senderType === 'rag';

  // Get sender name - using camelCase properties
  const customerName = selectedConversation?.customerName || message.senderName || 'Customer';
  const customerEmail = selectedConversation?.customerEmail || message.senderEmail || 'customer@example.com';
  
  const senderName = isFromCustomer 
    ? customerName 
    : message.senderName || (isFromAI ? 'AI Assistant' : 'Agent');

  const senderEmail = isFromCustomer 
    ? customerEmail 
    : message.senderEmail || '';

  // Format timestamp
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on sender type
  const getAvatarColor = () => {
    if (isFromCustomer) return 'bg-blue-500';
    if (isFromAI) return 'bg-purple-500';
    return 'bg-green-500';
  };

  // Get message status badge
  const getStatusBadge = () => {
    if (message.readStatus === 'read') {
      return <Badge variant="secondary" className="text-xs">Read</Badge>;
    }
    if (message.readStatus === 'delivered') {
      return <Badge variant="outline" className="text-xs">Delivered</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Sent</Badge>;
  };

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
        isHovered && 'bg-blue-50',
        isFromCustomer ? 'justify-start' : 'justify-end'
      )}
      onMouseEnter={() => setHoveredMessage(message.id)}
      onMouseLeave={() => setHoveredMessage(null)}
      style={style}
      data-testid={`message-row-${message.id}`}
    >
      {/* Avatar */}
      <div className={cn('flex-shrink-0', isFromCustomer ? 'order-1' : 'order-2')}>
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={senderName} />
          <AvatarFallback className={getAvatarColor()}>
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 min-w-0', isFromCustomer ? 'order-2' : 'order-1')}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900" data-testid="message-sender-name">
            {senderName}
          </span>
          {senderEmail && (
            <span className="text-xs text-gray-500" data-testid="message-sender-email">
              {senderEmail}
            </span>
          )}
          <span className="text-xs text-gray-400" data-testid="message-timestamp">
            {formattedTime}
          </span>
        </div>

        <div className="space-y-2">
          {/* Message Text */}
          <div className="text-sm text-gray-900 whitespace-pre-wrap" data-testid="message-content">
            {message.content}
          </div>

          {/* Message Metadata */}
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            
            {message.aiConfidence && (
              <Badge variant="outline" className="text-xs">
                AI: {Math.round(message.aiConfidence * 100)}%
              </Badge>
            )}

            {message.messageType !== 'text' && (
              <Badge variant="outline" className="text-xs">
                {message.messageType}
              </Badge>
            )}

            {message.isDeleted && (
              <Badge variant="destructive" className="text-xs">
                Deleted
              </Badge>
            )}
          </div>

          {/* AI Sources */}
          {message.aiSources && message.aiSources.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <div className="text-xs font-medium text-gray-700 mb-1">AI Sources:</div>
              <div className="space-y-1">
                {message.aiSources.map((source: unknown, index: number) => (
                  <div key={index} className="text-xs text-gray-600">
                    • {source.title || source.url || 'Unknown source'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Metadata */}
          {message.metadata && Object.keys(message.metadata).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Metadata
              </summary>
              <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-auto">
                {JSON.stringify(message.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
