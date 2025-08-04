// 🔧 DEFINITIVE CONVERSATION LIST - CAMPFIRE V2
// Single source of truth with sophisticated styling and design system integration

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageSquare, Search, Clock, Bot, Tag, User, CheckCircle } from 'lucide-react';
import { formatRelativeTimeShort } from '@/lib/utils/date';
import { StatusBadge } from '@/components/inbox/StatusBadge';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  isLoading: boolean;
}

/**
 * Definitive virtualized conversation list component with sophisticated styling
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  statusFilter,
  priorityFilter,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Measure container height for virtualization
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const filterBar = container.querySelector('.filter-bar');
        const filterBarHeight = filterBar ? filterBar.clientHeight : 80;
        const availableHeight = container.clientHeight - filterBarHeight;
        setContainerHeight(Math.max(availableHeight, 400));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Local filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "unassigned" | "ai-managed" | "human-managed">("all");

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || conv.status === statusFilter;

      // Priority filter
      const matchesPriority = !priorityFilter || conv.priority === priorityFilter;

      // Active filter bar
      const matchesActiveFilter = (() => {
        switch (activeFilter) {
          case "unread":
            return conv.unreadCount > 0;
          case "unassigned":
            return !conv.assigned_to_ai;
          case "ai-managed":
            return conv.assigned_to_ai === true;
          case "human-managed":
            return conv.assigned_to_ai === false;
          case "all":
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesPriority && matchesActiveFilter;
    });
  }, [conversations, searchQuery, statusFilter, priorityFilter, activeFilter]);

  // Sort conversations by last message time
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [filteredConversations]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="border-b border-gray-100 p-4" data-testid="conversation-list-loading-item">
      <div className="animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 rounded-full bg-gray-200" data-testid="conversation-loading-avatar"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200" data-testid="conversation-loading-name"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200" data-testid="conversation-loading-email"></div>
            <div className="h-3 w-full rounded bg-gray-200" data-testid="conversation-loading-preview"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center" data-testid="conversation-list-empty-state">
      <div className="text-center">
        <div className="mb-4">
          {searchQuery ? (
            <MagnifyingGlass className="mx-auto h-16 w-16 text-neutral-300" data-testid="conversation-empty-search-icon" />
          ) : (
            <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-testid="conversation-empty-chat-icon">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          )}
        </div>
        <h3 className="mb-2 text-lg font-medium text-neutral-300" data-testid="conversation-empty-title">
          {searchQuery ? "No conversations found" : "No conversations yet"}
        </h3>
        <p className="text-sm text-neutral-300 max-w-xs" data-testid="conversation-empty-message">
          {searchQuery
            ? "Try adjusting your search terms or filters"
            : "New conversations will appear here when customers reach out"}
        </p>
      </div>
    </div>
  );

  // Sophisticated conversation row component
  const ConversationRow = React.memo(({ conversation, selectedId, onSelect, style }: {
    conversation: Conversation;
    selectedId?: string;
    onSelect: (conversation: Conversation) => void;
    style: React.CSSProperties;
  }) => {
    const isSelected = conversation.id === selectedId;
    const isAIAssigned = conversation.assigned_to_ai;

    // Format timestamp with error handling
    const formatTime = (timestamp: string) => {
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "Unknown time";
        
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        
        if (diffInMs < 0 || diffInMs > 100 * 365 * 24 * 60 * 60 * 1000) {
          return "Unknown time";
        }

        return formatRelativeTimeShort(date);
      } catch (error) {
        return "Unknown time";
      }
    };

    return (
      <div style={style} className="relative">
        <div
          onClick={() => onSelect(conversation)}
          className={`conversation-item mobile-conversation-item ${isSelected ? 'selected' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''} flex cursor-pointer flex-col touch-target`}
          style={{
            minHeight: '176px',
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
          aria-label={`Conversation with ${conversation.customerName}${conversation.unreadCount > 0 ? ` (${conversation.unreadCount} unread)` : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(conversation);
            }
          }}
        >
          {/* Main content area */}
          <div className="flex flex-1 items-start justify-between gap-3">
            {/* Left side: Avatar and content */}
            <div className="flex min-w-0 flex-1 gap-3">
              {/* Avatar with enhanced display */}
              <div className="flex-shrink-0 relative">
                <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                  {conversation.customerAvatar ? (
                    <img
                      src={conversation.customerAvatar}
                      alt={conversation.customerName || conversation.customerEmail}
                      className="h-full w-full object-cover"
                      data-testid="conversation-avatar"
                    />
                  ) : (
                    <div className={`h-full w-full ${colors["info-subtle"]} flex items-center justify-center`}>
                      <span className={`${typography["label-md"]} font-semibold text-blue-700`}>
                        {(() => {
                          const name = conversation.customerName || conversation.customerEmail || "?";
                          return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Online status indicator */}
                  {conversation.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}

                  {/* Verified badge */}
                  {conversation.isVerified && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle className="h-4 w-4 text-blue-600 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                {/* Top section: Customer info and message preview */}
                <div className="min-w-0 flex-1 space-y-spacing-sm">
                  {/* Customer name and AI/Human indicator */}
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className={`${typography["title-sm"]} truncate`} data-testid="conversation-customer-name">
                      {conversation.customerName || conversation.customerEmail}
                    </h3>

                    {/* Enhanced AI/Human status badge */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {isAIAssigned ? (
                        <div className={`${components["badge-default"]} ${colors["info-subtle"]} flex items-center gap-1`}>
                          <Robot className="h-3 w-3" />
                          <span className="text-xs font-medium">AI</span>
                        </div>
                      ) : (
                        <div className={`${components["badge-default"]} ${colors["neutral-subtle"]} flex items-center gap-1`}>
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">Human</span>
                        </div>
                      )}

                      {/* VIP or priority indicators */}
                      {conversation.priority === "urgent" && (
                        <div className={`${components["badge-default"]} ${colors["error-subtle"]} text-xs`}>
                          Urgent
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <p className="typography-metadata truncate" data-testid="conversation-customer-email">{conversation.customerEmail}</p>

                  {/* Last message preview with enhanced styling */}
                  <div className="space-y-1">
                    <p className={`${typography["body-sm"]} ${conversation.unreadCount > 0 ? colors["text-primary"] : colors["text-secondary"]} line-clamp-2`} data-testid="conversation-message-preview">
                      {conversation.lastMessagePreview || (
                        <span className={`${colors["text-tertiary"]} italic`}>No messages yet</span>
                      )}
                    </p>

                    {/* Message metadata */}
                    {conversation.lastMessagePreview && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {conversation.lastMessageSender === "ai" ? "AI Assistant" :
                           conversation.lastMessageSender === "agent" ? "Support Agent" :
                           "Customer"}
                        </span>
                        {conversation.lastMessageSender && (
                          <>
                            <span>•</span>
                            <span>{formatTime(conversation.lastMessageAt)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
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
              <div className="conversation-meta">
                <Clock className="h-3 w-3" />
                <span className="typography-metadata">{formatTime(conversation.lastMessageAt)}</span>
              </div>

              {/* Unread count */}
              {conversation.unreadCount > 0 && (
                <span className="inline-flex min-w-[20px] min-h-[20px] items-center justify-center rounded-ds-full bg-blue-600 px-2 py-1 text-xs font-bold text-white transition-colors">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  ConversationRow.displayName = "ConversationRow";

  // Row renderer for virtualization
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const conversation = sortedConversations[index];
    if (!conversation) return null;
    
    return (
      <ConversationRow
        key={conversation.id}
        conversation={conversation}
        selectedId={selectedConversationId}
        onSelect={onSelectConversation}
        style={style}
      />
    );
  };

  return (
    <div 
      className="relative z-10 flex h-full min-h-0 flex-col border-r border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]" 
      style={{ width: 'var(--width-sidebar, 24rem)' }} 
      data-testid="conversation-list-container" 
      ref={containerRef}
    >
      {/* Sophisticated filter bar */}
      <div className="border-b border-[var(--ds-color-border)] p-2 sm:p-3 lg:p-ds-4 filter-bar">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "unassigned", label: "Unassigned" },
            { key: "ai-managed", label: "AI Managed" },
            { key: "human-managed", label: "Human Managed" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as unknown)}
              className={`flex-shrink-0 px-2 py-1.5 sm:px-3 sm:py-1.5 lg:px-3 lg:py-1 rounded-ds-md text-xs sm:text-sm font-medium transition-colors touch-target ${
                activeFilter === filter.key
                  ? "bg-[var(--ds-color-primary-500)] text-white shadow-sm"
                  : "bg-[var(--ds-color-surface)] text-[var(--ds-color-text)] hover:bg-[var(--ds-color-background-muted)] border border-[var(--ds-color-border)]"
              }`}
              style={{ 
                minWidth: "44px", 
                minHeight: "44px",
                whiteSpace: "nowrap"
              }}
              data-testid={`filter-${filter.key}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 spacing-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-full">
            <List
              height={containerHeight}
              itemCount={sortedConversations.length}
              itemSize={180}
              width="100%"
              className="conversation-list-virtualized"
              data-testid="conversation-list"
            >
              {Row}
            </List>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
