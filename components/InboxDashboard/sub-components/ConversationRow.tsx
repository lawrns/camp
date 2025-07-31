// ConversationRow component for conversation list

import { Clock, Robot, Tag } from "@phosphor-icons/react";
import * as React from "react";
import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/inbox/StatusBadge";
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

  return (
    <div style={style} className="relative">
      <div
        onClick={() => onSelect(conversation)}
        className={`conversation-item conversation-card relative z-10 flex cursor-pointer flex-col transition-all ${isSelected ? "border-l-4 border-l-[var(--color-primary-600)] bg-[var(--color-primary-50)]" : ""
          }`}
        style={{
          minHeight: '176px', // Increased from 128px for better content fit
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: isSelected ? undefined : 'var(--color-surface)',
          padding: 'var(--spacing-4)'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--color-background-subtle)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
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
        {/* Main content area */}
        <div className="flex flex-1 items-start justify-between gap-3">
          {/* Left side: Avatar and content */}
          <div className="flex min-w-0 flex-1 gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={(() => {
                  const { getAvatarPath } = require("@/lib/utils/avatar");
                  // Use conversation ID as unique identifier to ensure different avatars
                  const uniqueId = conversation.id?.toString() || conversation.customer_email || conversation.customer_name;
                  return getAvatarPath(uniqueId, "customer");
                })()}
                alt={conversation.customer_name}
                className="rounded-ds-full transition-all"
                style={{
                  height: 'var(--spacing-10)', // 40px
                  width: 'var(--spacing-10)'
                }}
                data-testid="conversation-avatar"
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
              {/* Top section: Customer info and message preview */}
              <div className="min-w-0 flex-1 space-y-spacing-sm">
                {/* Customer name and AI indicator */}
                <div className="flex min-w-0 items-center gap-ds-2">
                  <h3 className="truncate font-medium text-[var(--color-text)]" style={{ fontSize: 'var(--font-size-sm)' }} data-testid="conversation-customer-name">{conversation.customer_name}</h3>
                  <div className="flex-shrink-0">
                    {isAIAssigned ? (
                      <StatusBadge 
                        status="ai" 
                        variant="compact" 
                        size="sm" 
                        className="flex-shrink-0"
                      />
                    ) : (
                      <StatusBadge 
                        status="human" 
                        variant="compact" 
                        size="sm" 
                        className="flex-shrink-0"
                      />
                    )}
                  </div>
                </div>

                {/* Email */}
                <p className="truncate text-tiny text-foreground-muted" data-testid="conversation-customer-email">{conversation.customer_email}</p>

                {/* Last message preview */}
                <p className="line-clamp-2 text-sm text-foreground leading-relaxed" data-testid="conversation-message-preview">
                  {conversation.last_message_preview || "No messages yet"}
                </p>
              </div>

              {/* Bottom section: Tags and Status badges */}
              <div className="flex-shrink-0 space-y-spacing-sm mt-3">
                {/* Tags */}
                {conversation.tags && conversation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {conversation.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-ds-full bg-background px-2 py-1 text-tiny font-medium text-gray-800 transition-colors"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                    {conversation.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{conversation.tags.length - 2}</span>
                    )}
                  </div>
                )}

                {/* Status and Priority badges using unified component */}
                <div className="flex items-center gap-1">
                  <StatusBadge 
                    status={conversation.status} 
                    priority={conversation.priority}
                    variant="compact"
                    size="sm"
                    showIcon={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Timestamp and unread count */}
          <div className="flex flex-col items-end justify-between h-full flex-shrink-0">
            {/* Timestamp */}
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="mr-1 h-3 w-3" />
              {formatTime(conversation.last_message_at)}
            </div>

            {/* Unread count */}
            {conversation.unread_count > 0 && (
              <span className="inline-flex min-w-[20px] min-h-[20px] items-center justify-center rounded-ds-full bg-blue-600 px-2 py-1 text-xs font-bold text-white transition-colors">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ConversationRow.displayName = "ConversationRow";

export default ConversationRow;
