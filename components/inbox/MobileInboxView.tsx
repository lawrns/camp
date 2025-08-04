"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { DotsThree as MoreHorizontal, MagnifyingGlass as Search } from "@phosphor-icons/react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { MessageComposer } from "@/components/unified-ui/components/Composer";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/entities/message";
import { MessageList } from "./MessagePanel/MessageList";

interface ConversationResponse {
  id: string;
  customer_data?: { name?: string };
  customer_email?: string;
  last_message?: string;
  updated_at?: string;
  status?: string;
  unread_count?: number;
}

interface MobileInboxViewProps {
  conversations: ConversationResponse[];
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onBackToList: () => void;
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onAssignConversation?: (agentId: string) => void;
  onMessageObserve?: (messageId: string) => void;
  className?: string;
}

interface ConversationItemProps {
  conversation: ConversationResponse;
  isUnread: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isUnread, onClick }: ConversationItemProps) {
  const customerName = conversation.customer_data?.name || conversation.customerEmail || "Unknown";
  const lastMessage = conversation.last_message;
  const timeAgo =
    conversation.updated_at && !isNaN(new Date(conversation.updated_at).getTime())
      ? formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })
      : "";

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "open";
      case "closed":
        return "closed";
      case "ai":
        return "ai";
      default:
        return "open";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: unknown) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={cn("mobile-conversation-item", isUnread && "unread")} onClick={onClick}>
      <div className="mobile-conversation-avatar">{getInitials(customerName)}</div>

      <div className="mobile-conversation-content">
        <div className="mobile-conversation-header">
          <div className="mobile-conversation-name">{customerName}</div>
          <div className="mobile-conversation-time">{timeAgo}</div>
        </div>

        {lastMessage && <div className="mobile-conversation-preview">{lastMessage}</div>}

        <div className="mobile-conversation-meta">
          <div className={cn("mobile-conversation-status", getStatusColor(conversation.status || "open"))}>
            {conversation.status || "Open"}
          </div>
          {(conversation.unread_count || 0) > 0 && (
            <div className="text-tiny font-medium text-blue-600">{conversation.unread_count} new</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileInboxView({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onBackToList,
  messages,
  isLoadingMessages,
  onSendMessage,
  onAssignConversation,
  onMessageObserve,
  className,
}: MobileInboxViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conversation: unknown) => {
      const customerName = conversation.customer_data?.name || conversation.customerEmail || "";
      const lastMessage = conversation.last_message || "";

      return (
        customerName.toLowerCase().includes(query) ||
        lastMessage.toLowerCase().includes(query) ||
        conversation.customerEmail?.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  const handleSearchClick = () => {
    // Focus search input or show search modal
    const searchInput = document.querySelector(".mobile-search-input") as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  const customerName =
    selectedConversation?.customer_data?.name || selectedConversation?.customerEmail || "Unknown Customer";

  const customerStatus = selectedConversation?.status === "ai" ? "AI Assistant" : "Online";

  if (selectedConversationId && selectedConversation) {
    // Mobile Message View
    return (
      <div className={cn("mobile-message-view open", className)}>
        <MobileHeader
          title={customerName}
          subtitle={customerStatus}
          showBack={true}
          showNotifications={false}
          onMenuClick={onBackToList}
          rightAction={
            <div className="mobile-message-actions">
              <button className="mobile-header-button" aria-label="More options">
                <Icon icon={MoreHorizontal} size={20} />
              </button>
            </div>
          }
        />

        <div className="mobile-message-content">
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
            customerData={
              selectedConversation.customer_data
                ? {
                    id: selectedConversation.id,
                    name: selectedConversation.customer_data.name || customerName,
                    email: selectedConversation.customerEmail || "",
                    avatar_url: "",
                    created_at: "",
                    updated_at: "",
                    organization_id: "",
                    verification_status: "unverified" as const,
                  }
                : null
            }
            onMessageObserve={
              onMessageObserve ? (messageId: string, isVisible: boolean) => onMessageObserve(messageId) : () => {}
            }
          />
        </div>

        <div className="mobile-message-input-container">
          <div
            className="message-composer-container mobile-message-input-form"
            data-testid="message-composer-container"
          >
            <MessageComposer onSend={(content) => {}} />
          </div>
        </div>
      </div>
    );
  }

  // Mobile Conversation List
  return (
    <div className={cn("mobile-inbox-layout", className)}>
      <MobileHeader
        title="Inbox"
        subtitle={`${conversations.length} conversations`}
        showNotifications={true}
        showSearch={true}
        onSearchClick={handleSearchClick}
        notificationCount={conversations.reduce((total: unknown, conv: unknown) => total + (conv.unread_count || 0), 0)}
      />

      {/* Search Bar */}
      <div className="bg-background border-b border-[var(--fl-color-border)] spacing-3">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="mobile-search-input bg-background focus:bg-background w-full rounded-ds-lg border-0 px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mobile-conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <div className="bg-background mb-4 flex h-16 w-16 items-center justify-center rounded-ds-full">
              <Icon icon={Search} size={24} className="text-gray-400" />
            </div>
            <h3 className="mb-2 text-base font-medium text-gray-900">
              {searchQuery ? "No matching conversations" : "No conversations"}
            </h3>
            <p className="text-center text-[var(--fl-color-text-muted)]">
              {searchQuery
                ? `No conversations found matching "${searchQuery}"`
                : "When you receive messages, they'll appear here"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation: unknown) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isUnread={(conversation.unread_count || 0) > 0}
              onClick={() => onConversationSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default MobileInboxView;
