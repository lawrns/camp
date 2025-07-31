// ConversationRow component for conversation list

import { Clock, Robot, Tag } from "@phosphor-icons/react";
import * as React from "react";
import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import type { ConversationRowProps } from "../types";

/**
 * Individual conversation row component with memoization for performance
 */
export const ConversationRow: React.FC<ConversationRowProps> = memo(({ conversation, selectedId, onSelect, style }) => {
  const isSelected = conversation.id === selectedId;
  const isAIAssigned = conversation.assigned_to_ai;

  // Format timestamp with improved error handling and relative time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Unknown time";
      }

      // Check for invalid dates (Unix epoch, etc.)
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      
      if (diffInMs < 0 || diffInMs > 100 * 365 * 24 * 60 * 60 * 1000) { // More than 100 years
        return "Unknown time";
      }

      // Use date-fns for better relative time formatting
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Get priority color using design system tokens
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Get status color using design system tokens
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-orange-600 bg-orange-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "escalated":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div style={style} className="relative">
      <div
        onClick={() => onSelect(conversation)}
        className={`conversation-item conversation-card relative z-10 flex cursor-pointer transition-all ${
          isSelected 
            ? "border-l-4 border-l-blue-600 bg-blue-50" 
            : "border-l-4 border-l-transparent hover:bg-gray-50"
        }`}
        style={{
          minHeight: '140px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: isSelected ? undefined : '#ffffff',
          padding: '16px'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
        data-testid="conversation"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(conversation);
          }
        }}
        aria-label={`Conversation with ${conversation.customer_name}`}
      >
        {/* Main content area with proper flex layout */}
        <div className="flex items-start gap-3 h-full">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={(() => {
                const { getAvatarPath } = require("@/lib/utils/avatar");
                const uniqueId = conversation.id?.toString() || conversation.customer_email || conversation.customer_name;
                return getAvatarPath(uniqueId, "customer");
              })()}
              alt={conversation.customer_name}
              className="rounded-full cursor-pointer transition-all hover:ring-2 hover:ring-blue-300"
              style={{
                height: '40px',
                width: '40px'
              }}
              data-testid="conversation-avatar"
            />
          </div>

          {/* Content area with proper flex distribution */}
          <div className="flex-1 min-w-0 flex flex-col h-full">
            {/* Top row: Name, badges, and timestamp */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="truncate font-medium text-gray-900 text-sm" data-testid="conversation-customer-name">
                  {conversation.customer_name}
                </h3>
                <div className="flex-shrink-0">
                  {isAIAssigned ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800" data-testid="conversation-ai-badge">
                      <Robot className="mr-1 h-3 w-3" data-testid="conversation-ai-icon" />
                      AI
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800" data-testid="conversation-human-badge">
                      <Tag className="mr-1 h-3 w-3" data-testid="conversation-human-icon" />
                      Human
                    </span>
                  )}
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(conversation.last_message_at)}
              </div>
            </div>

            {/* Email */}
            <p className="truncate text-xs text-gray-500 mb-2" data-testid="conversation-customer-email">
              {conversation.customer_email}
            </p>

            {/* Message preview */}
            <p className="line-clamp-2 text-sm text-gray-700 leading-relaxed mb-3 flex-1" data-testid="conversation-message-preview">
              {conversation.last_message_preview || "No messages yet"}
            </p>

            {/* Bottom row: Status badges and unread count */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              {/* Status and Priority badges */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(conversation.status)}`}>
                  {conversation.status}
                </span>
                {conversation.priority && (
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                    {conversation.priority}
                  </span>
                )}
              </div>

              {/* Unread count */}
              {conversation.unread_count > 0 && (
                <span className="inline-flex min-w-[20px] min-h-[20px] items-center justify-center rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                  {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConversationRow.displayName = "ConversationRow";

export default ConversationRow;
