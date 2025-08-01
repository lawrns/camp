// MessageList component with virtualization

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ChatCircle } from "@phosphor-icons/react";
import { VariableSizeList as List } from "react-window";
import type { Conversation, Message } from "../types";
import { getMessageItemSize } from "../utils/channelUtils";
import { MessageRow } from "./MessageRow";

interface MessageListProps {
  messages: Message[];
  selectedConversation?: Conversation;
  isLoading: boolean;
  typingUsers: string[];
  onlineUsers: string[];
}

/**
 * Virtualized message list component
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedConversation,
  isLoading,
  typingUsers,
  onlineUsers,
}) => {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        // On initial load, scroll to bottom without animation and mark as loaded
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollToItem(messages.length - 1, "end");
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
          }
          setIsInitialLoad(false);
        }, 100);
      } else if (messages.length > prevMessageCountRef.current) {
        // Only auto-scroll if new messages were added (not initial load)
        scrollToBottom();
      }
      prevMessageCountRef.current = messages.length;
    }
  }, [messages.length, isInitialLoad]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  // Scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, "end");
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
    setShowScrollToBottom(false);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="flex" style={{ gap: 'var(--ds-inbox-message-gap)' }}>
      <div className="animate-pulse">
        <div className="ds-inbox-avatar bg-gray-300"></div>
      </div>
      <div className="flex-1 animate-pulse" style={{ gap: 'var(--ds-spacing-2)', display: 'flex', flexDirection: 'column' }}>
        <div className="h-4 w-1/4 rounded bg-gray-300"></div>
        <div className="h-16 w-3/4 bg-gray-300" style={{ borderRadius: 'var(--ds-inbox-message-bubble-radius)' }}></div>
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-neutral-300">Start the conversation</h3>
        <p className="text-sm text-neutral-300">
          Send a message to {selectedConversation?.customerName} to begin the conversation.
        </p>
      </div>
    </div>
  );

  // Typing indicator component
  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="flex space-x-3 spacing-3">
        <div className="flex-shrink-0">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              selectedConversation?.customerName || "User"
            )}&size=32&background=e5e7eb&color=374151`}
            alt="Customer"
            className="h-8 w-8 rounded-ds-full"
          />
        </div>
        <div className="flex-1">
          <div className="bg-background max-w-xs rounded-ds-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400"></div>
              <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400" style={{ animationDelay: "0.1s" }}></div>
              <div className="h-2 w-2 animate-bounce rounded-ds-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
          <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
          </p>
        </div>
      </div>
    );
  };

  // Row renderer for virtualization
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    return (
      <MessageRow
        key={message.id}
        message={message}
        selectedConversation={selectedConversation}
        hoveredMessage={hoveredMessage}
        setHoveredMessage={setHoveredMessage}
        style={style}
      />
    );
  };

  // Determine if we should use virtualization
  const shouldVirtualize = messages.length > 100;

  return (
    <div className="ds-inbox-message-list relative flex min-h-0 flex-1 flex-col" style={{ background: 'var(--ds-color-background-muted)' }} data-testid="messages">
      {/* Connection status removed - was showing inappropriate warnings */}

      {/* Messages container */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
        {isLoading ? (
          <div style={{ gap: 'var(--ds-inbox-message-gap)', display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : shouldVirtualize ? (
          // Use virtualization for large message lists
          <List
            ref={listRef}
            height={Math.max(400, window.innerHeight - 400)} // Ensure minimum height with dynamic calculation
            width="100%" // Required prop for react-window
            itemCount={messages.length}
            itemSize={getMessageItemSize}
            itemData={messages}
            className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
          >
            {Row}
          </List>
        ) : (
          // Regular rendering for smaller lists
          <div className="overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
            <div className="space-y-0">
              {messages.map((message) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  selectedConversation={selectedConversation}
                  hoveredMessage={hoveredMessage}
                  setHoveredMessage={setHoveredMessage}
                />
              ))}
            </div>

            {/* Typing indicator */}
            <TypingIndicator />

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="ds-inbox-button ds-inbox-button-primary absolute bottom-4 right-4 z-10 rounded-full"
          style={{ padding: 'var(--ds-spacing-3)' }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;
