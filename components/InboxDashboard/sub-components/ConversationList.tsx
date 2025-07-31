// ConversationList component with virtualization

import { ChatCircle, MagnifyingGlass } from "@phosphor-icons/react";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
// Styles now handled by design-system.css
import type { Conversation } from "../types";
import { ConversationRow } from "./ConversationRow";

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
 * Virtualized conversation list component
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
        // Get the actual available height by subtracting the filter bar height
        const container = containerRef.current;
        const filterBar = container.querySelector('.filter-bar');
        const filterBarHeight = filterBar ? filterBar.clientHeight : 60; // Default filter bar height
        const availableHeight = container.clientHeight - filterBarHeight;
        setContainerHeight(Math.max(availableHeight, 400)); // Minimum height of 400px
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Local filter state for the new filter bar
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "unassigned" | "ai-managed" | "human-managed">(
    "all"
  );
  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.last_message_preview.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || conv.status === statusFilter;

      // Priority filter
      const matchesPriority = !priorityFilter || conv.priority === priorityFilter;

      // New filter bar filters
      const matchesActiveFilter = (() => {
        switch (activeFilter) {
          case "unread":
            return conv.unread_count > 0;
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
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }, [filteredConversations]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="border-b border-gray-100 p-spacing-md" data-testid="conversation-list-loading-item">
      <div className="animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="h-8 w-8 rounded-ds-full bg-gray-200" data-testid="conversation-loading-avatar"></div>
          <div className="flex-1 space-y-spacing-sm">
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
    <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground-muted" data-testid="conversation-list-empty-state">
      {searchQuery ? <MagnifyingGlass className="mb-4 h-12 w-12" data-testid="conversation-empty-search-icon" /> : <ChatCircle className="mb-4 h-12 w-12" data-testid="conversation-empty-chat-icon" />}
      <h3 className="mb-2 text-base font-medium" data-testid="conversation-empty-title">{searchQuery ? "No conversations found" : "No conversations yet"}</h3>
      <p className="max-w-sm text-center text-sm" data-testid="conversation-empty-message">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : "New conversations will appear here when customers reach out"}
      </p>
    </div>
  );

  // Row renderer for virtualization
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const conversation = sortedConversations[index];
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
    <div className="relative z-10 flex h-full min-h-0 flex-col border-r border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]" style={{ width: 'var(--width-sidebar, 24rem)' }} data-testid="conversation-list-container" ref={containerRef}>
      {/* Filter bar */}
      <div className="border-b border-[var(--ds-color-border)] p-ds-4 filter-bar">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "unassigned", label: "Unassigned" },
            { key: "ai-managed", label: "AI Managed" },
            { key: "human-managed", label: "Human Managed" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-3 py-1 rounded-ds-md text-sm font-medium transition-colors ${activeFilter === filter.key
                  ? "bg-[var(--ds-color-primary-500)] text-white"
                  : "bg-[var(--ds-color-surface)] text-[var(--ds-color-text)] hover:bg-[var(--ds-color-background-muted)]"
                }`}
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
