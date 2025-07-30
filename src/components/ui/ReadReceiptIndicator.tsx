import React from 'react';
import { Check, CheckCheck, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReadReceiptData {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  isRead: boolean;
  readBy: Array<{
    readerId: string;
    readerType: 'visitor' | 'agent' | 'system' | 'bot';
    readerName?: string;
    readAt: string;
  }>;
  lastReadAt?: string;
  showDetails?: boolean;
}

interface ReadReceiptIndicatorProps {
  receipt: ReadReceiptData;
  variant?: 'widget' | 'dashboard';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ReadReceiptIndicator({ 
  receipt, 
  variant = 'dashboard',
  size = 'sm',
  className 
}: ReadReceiptIndicatorProps) {
  const { status, isRead, readBy, lastReadAt, showDetails } = receipt;

  // Determine icon and color based on status
  const getStatusIcon = () => {
    if (isRead && readBy.length > 0) {
      return <CheckCheck className={cn(
        'text-blue-500',
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5'
      )} />;
    }
    
    if (status === 'delivered') {
      return <Check className={cn(
        'text-gray-400',
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5'
      )} />;
    }
    
    if (status === 'sent') {
      return <Clock className={cn(
        'text-gray-300',
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5'
      )} />;
    }

    return null;
  };

  // Format read time
  const formatReadTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!isRead || readBy.length === 0) {
      return status === 'sent' ? 'Sent' : status === 'delivered' ? 'Delivered' : 'Not read';
    }

    if (readBy.length === 1) {
      const reader = readBy[0];
      const readerName = reader.readerName || reader.readerId;
      const timeAgo = formatReadTime(reader.readAt);
      return `Read by ${readerName} ${timeAgo}`;
    }

    return `Read by ${readBy.length} ${readBy.length === 1 ? 'person' : 'people'}`;
  };

  // Widget variant (simpler)
  if (variant === 'widget') {
    return (
      <div 
        className={cn(
          'inline-flex items-center gap-1',
          className
        )}
        title={getTooltipText()}
        data-testid="widget-read-receipt"
      >
        {getStatusIcon()}
        {showDetails && isRead && (
          <span className={cn(
            'text-xs text-gray-500',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            Read
          </span>
        )}
      </div>
    );
  }

  // Dashboard variant (more detailed)
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 group relative',
        className
      )}
      data-testid="dashboard-read-receipt"
    >
      {getStatusIcon()}
      
      {showDetails && (
        <div className={cn(
          'flex items-center gap-1',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {isRead ? (
            <>
              <Eye className={cn(
                'text-blue-500',
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-4 w-4',
                size === 'lg' && 'h-5 w-5'
              )} />
              <span className="text-blue-600 font-medium">
                {readBy.length}
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              Unread
            </span>
          )}
        </div>
      )}

      {/* Detailed tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
        <div className="space-y-1">
          <div className="font-medium">{getTooltipText()}</div>
          {isRead && readBy.length > 0 && (
            <div className="space-y-1">
              {readBy.slice(0, 3).map((reader, index) => (
                <div key={index} className="text-xs text-gray-300">
                  {reader.readerName || reader.readerId} • {formatReadTime(reader.readAt)}
                </div>
              ))}
              {readBy.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{readBy.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

// Bulk read receipt summary component
interface ReadReceiptSummaryProps {
  totalMessages: number;
  readMessages: number;
  unreadMessages: number;
  className?: string;
}

export function ReadReceiptSummary({ 
  totalMessages, 
  readMessages, 
  unreadMessages, 
  className 
}: ReadReceiptSummaryProps) {
  const readPercentage = totalMessages > 0 ? Math.round((readMessages / totalMessages) * 100) : 0;

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 bg-gray-50 rounded-lg',
        className
      )}
      data-testid="read-receipt-summary"
    >
      <div className="flex items-center gap-2">
        <CheckCheck className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">
          Read Receipts
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{readMessages} read</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>{unreadMessages} unread</span>
        </div>
        
        <div className="text-xs text-gray-500">
          {readPercentage}% read rate
        </div>
      </div>
    </div>
  );
}

// Message status badge component
interface MessageStatusBadgeProps {
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readCount?: number;
  className?: string;
}

export function MessageStatusBadge({ 
  status, 
  readCount = 0, 
  className 
}: MessageStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'read':
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          text: readCount > 1 ? `Read by ${readCount}` : 'Read',
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'delivered':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Delivered',
          color: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'sent':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'Sent',
          color: 'bg-gray-100 text-gray-700 border-gray-200'
        };
      case 'failed':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'Failed',
          color: 'bg-red-100 text-red-700 border-red-200'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'Unknown',
          color: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium',
        config.color,
        className
      )}
      data-testid="message-status-badge"
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
