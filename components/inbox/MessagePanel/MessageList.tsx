"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown as ChevronDown, MessageCircle as MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { type OptimisticMessage } from "@/store/optimistic-updates";
import type { CustomerData, Message } from "@/types/entities/message";
import { OptimisticMessageComponent } from "../OptimisticUI/OptimisticMessage";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  customerData?: CustomerData | null;
  onRetryMessage?: (tempId: string) => void;
  onMessageObserve?: (messageId: string, isVisible: boolean) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const SCROLL_THRESHOLD = 100; // Distance from bottom to trigger auto-scroll
const LOAD_MORE_THRESHOLD = 200; // Distance from top to trigger load more

export function MessageList({
  messages,
  isLoading,
  customerData,
  onRetryMessage,
  onMessageObserve,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const nearBottom = distanceFromBottom < SCROLL_THRESHOLD;
    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    checkScrollPosition();

    // Load more messages when near top
    if (onLoadMore && hasMore && !isLoadingMore) {
      const container = messagesContainerRef.current;
      if (container && container.scrollTop < LOAD_MORE_THRESHOLD) {
        onLoadMore();
      }
    }
  }, [checkScrollPosition, onLoadMore, hasMore, isLoadingMore]);

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const newMessageCount = messages.length;
    const hasNewMessages = newMessageCount > lastMessageCount;

    if (hasNewMessages && isNearBottom) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    setLastMessageCount(newMessageCount);
    return undefined;
  }, [messages.length, isNearBottom, scrollToBottom, lastMessageCount]);

  // Auto-scroll when conversation is first opened
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, []);

  // Intersection observer for message visibility (read receipts)
  useEffect(() => {
    if (!onMessageObserve) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute("data-message-id");
          if (messageId) {
            onMessageObserve(messageId, entry.isIntersecting);
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all message elements
    const messageElements = messagesContainerRef.current?.querySelectorAll("[data-message-id]");
    messageElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, onMessageObserve]);

  // Lazy loading intersection observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Separate regular and optimistic messages
  const { regularMessages, optimisticMessages } = useMemo(() => {
    const regular: Message[] = [];
    const optimistic: Message[] = [];

    messages.forEach((message) => {
      if (message.is_optimistic && message.temp_id) {
        optimistic.push(message);
      } else {
        regular.push(message);
      }
    });

    return { regularMessages: regular, optimisticMessages: optimistic };
  }, [messages]);

  // Deduplicate regular messages to prevent React key errors
  const deduplicatedMessages = useMemo(() => {
    const seen = new Set<string>();
    const deduplicated: Message[] = [];

    for (const message of regularMessages) {
      if (!message.id) {
        continue;
      }

      if (!seen.has(String(message.id))) {
        seen.add(String(message.id));
        deduplicated.push(message);
      }
    }

    return deduplicated;
  }, [regularMessages]);

  // Helper function to determine if timestamp should be shown
  const shouldShowTimestamp = (message: Message, prevMessage: Message | null, nextMessage: Message | null): boolean => {
    if (!prevMessage) return true; // Always show for first message

    const messageDate = new Date(message.createdAt || message.created_at || 0).getTime();
    const prevMessageDate = new Date(prevMessage.createdAt || prevMessage.created_at || 0).getTime();
    const timeDiff = messageDate - prevMessageDate;
    return timeDiff > 5 * 60 * 1000; // Show if more than 5 minutes apart
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-spacing-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-foreground text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-spacing-lg" style={{ minHeight: "400px" }}>
        <div className="space-y-3 text-center">
          <Icon icon={MessageCircle} className="mx-auto h-12 w-12 text-neutral-300" />
          <div>
            <p className="text-foreground font-medium">No messages yet</p>
            <p className="text-sm text-[var(--fl-color-text-muted)]">Start the conversation!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages Container with Scrolling */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" ref={messagesContainerRef} onScroll={handleScroll}>
        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex h-4 items-center justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-ds-2 text-sm text-[var(--fl-color-text-muted)]">
                <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
                Loading earlier messages...
              </div>
            )}
          </div>
        )}

        {/* Regular Message List */}
        <div className="space-y-3">
          {deduplicatedMessages.map((message, index) => {
            const prevMessage = index > 0 ? (deduplicatedMessages[index - 1] ?? null) : null;
            const nextMessage =
              index < deduplicatedMessages.length - 1 ? (deduplicatedMessages[index + 1] ?? null) : null;
            const showTimestamp = shouldShowTimestamp(message, prevMessage, nextMessage);

            // Provide fallback customerData if not available
            const fallbackCustomerData: CustomerData = customerData || {
              id: "",
              name: "Unknown Customer",
              email: "",
              avatar: "",
              avatarUrl: "",
              avatar_url: "",
              created_at: "",
              updated_at: "",
              organization_id: "",
              verification_status: "unverified",
              metadata: {},
              location: {
                country: "",
                region: "",
                city: "",
                timezone: "",
              },
              location_info: {
                country: "",
                region: "",
                city: "",
                timezone: "",
              },
              lastSeen: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
              firstSeen: new Date().toISOString(),
              sessions: 0,
              deviceType: "desktop",
              browser_info: {
                userAgent: "",
                language: "",
                platform: "",
                cookieEnabled: false,
              },
              engagement_metrics: {
                total_messages: 0,
                avg_response_time: 0,
              },
            };

            // Ensure message has required properties
            const messageWithRequiredProps: Message = {
              ...message,
              conversationId: message.conversationId || message.conversation_id || "0",
              senderType: message.senderType || message.senderType || "customer",
              createdAt: message.createdAt || message.created_at || new Date().toISOString(),
            };

            return (
              <div key={message.id} data-message-id={message.id} className="message-item">
                <MessageItem
                  message={messageWithRequiredProps}
                  customerData={fallbackCustomerData}
                  showTimestamp={showTimestamp}
                />
              </div>
            );
          })}

          {/* Optimistic Messages */}
          {optimisticMessages.map((optimistic) => {
            // Provide fallback customerData if not available
            const fallbackCustomerData: CustomerData = customerData || {
              id: "",
              name: "Unknown Customer",
              email: "",
              avatar: "",
              avatarUrl: "",
              avatar_url: "",
              created_at: "",
              updated_at: "",
              organization_id: "",
              verification_status: "unverified" as const,
              metadata: {},
              location: {
                country: "",
                region: "",
                city: "",
                timezone: "",
              },
              location_info: {
                country: "",
                region: "",
                city: "",
                timezone: "",
              },
              lastSeen: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
              firstSeen: new Date().toISOString(),
              sessions: 0,
              deviceType: "desktop",
              browser_info: {
                userAgent: "",
                language: "",
                platform: "",
                cookieEnabled: false,
              },
              engagement_metrics: {
                total_messages: 0,
                avg_response_time: 0,
              },
            };

            // Ensure optimistic message has required properties
            const optimisticWithRequiredProps: Message = {
              ...optimistic,
              conversationId: optimistic.conversationId || optimistic.conversation_id || "0",
              senderType: optimistic.senderType || optimistic.senderType || "customer",
              createdAt: optimistic.createdAt || optimistic.created_at || new Date().toISOString(),
            };

            return (
              <div key={optimistic.temp_id || `opt-${Date.now()}`} className="message-item opacity-70">
                <MessageItem
                  message={optimisticWithRequiredProps}
                  customerData={fallbackCustomerData}
                  showTimestamp={true}
                  isOptimistic={true}
                  onRetry={() => {
                    if (optimistic.temp_id && onRetryMessage) {
                      onRetryMessage(optimistic.temp_id);
                    }
                  }}
                />
              </div>
            );
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </div>
      </div>

      {/* Scroll to Bottom Button - Now positioned relative to parent scrolling container */}
      {showScrollToBottom && (
        <div className="fixed bottom-20 right-6 z-10">
          <Button
            size="sm"
            className={cn(
              "rounded-ds-full bg-brand-blue-500 text-white shadow-lg hover:bg-blue-600",
              "transform transition-all duration-200 hover:scale-105"
            )}
            onClick={() => scrollToBottom()}
          >
            <Icon icon={ChevronDown} className="mr-1 h-4 w-4" />
            New messages
          </Button>
        </div>
      )}
    </div>
  );
}
