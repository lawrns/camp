/**
 * Dashboard Conversation View with Gold-Standard Typing Preview
 * Complete integration example following LiveChat/Intercom patterns
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { MessageComposer } from "@/components/unified-ui/components/Composer";
import { TypingBubble } from "@/components/unified-ui/components/TypingDots";
import { useTypingPreview } from "@/lib/realtime/useTypingPreview";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";

interface Message {
  id: string;
  content: string;
  senderType: "agent" | "visitor" | "ai";
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: Date;
  isRead?: boolean;
}

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  currentUserRole: "agent" | "visitor" | "ai";
  currentUserName?: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onMarkAsRead?: (messageIds: string[]) => Promise<void>;
  className?: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
  currentUserRole,
  currentUserName,
  messages,
  onSendMessage,
  onMarkAsRead,
  className,
}: ConversationViewProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Gold-standard typing preview
  const { typingUsers, isTyping } = useTypingPreview(conversationId);
  const isAnyoneTyping = isTyping || typingUsers.length > 0;

  // Auto-scroll to bottom when new messages arrive or typing starts
  useEffect(() => {
    if (isAtBottom) {
      const messagesContainer = document.getElementById(`messages-${conversationId}`);
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages.length, isAnyoneTyping, conversationId, isAtBottom]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (onMarkAsRead && messages.length > 0) {
      const unreadMessages = messages
        .filter((msg: Message) => !msg.isRead && msg.senderId !== currentUserId)
        .map((msg: Message) => msg.id);

      if (unreadMessages.length > 0) {
        onMarkAsRead(unreadMessages);
      }
    }
  }, [messages, currentUserId, onMarkAsRead]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === currentUserId;
    const isAgent = message.senderType === "agent";
    const isAI = message.senderType === "ai";

    return (
      <div key={message.id} className={cn("mb-4 flex gap-3", isOwn ? "justify-end" : "justify-start")}>
        {/* Avatar for others' messages */}
        {!isOwn && (
          <Avatar className="h-8 w-8 shrink-0">
            {message.senderAvatar && <AvatarImage src={message.senderAvatar} />}
            <AvatarFallback
              className={cn(
                "text-xs",
                isAgent ? "bg-status-info-light text-blue-600" : "bg-neutral-100 text-neutral-600"
              )}
            >
              {message.senderName?.[0] || (isAgent ? "A" : "U")}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message bubble */}
        <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "items-start")}>
          {/* Sender name and timestamp */}
          {!isOwn && (
            <div className="flex items-center gap-ds-2 px-1">
              <span className="text-foreground text-sm font-medium">
                {message.senderName || (isAgent ? "Agent" : "User")}
              </span>
              {isAI && (
                <Badge variant="secondary" className="px-1.5 py-0.5 text-tiny">
                  AI
                </Badge>
              )}
              <span className="text-tiny text-[var(--fl-color-text-muted)]">
                {formatDistanceToNow(message.createdAt, { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              "radius-2xl px-4 py-2",
              isOwn
                ? "rounded-br-md bg-brand-blue-500 text-white"
                : isAI
                  ? "rounded-bl-md bg-purple-100 text-purple-900"
                  : "rounded-bl-md bg-neutral-100 text-neutral-900"
            )}
          >
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          </div>

          {/* Timestamp for own messages */}
          {isOwn && (
            <div className="px-1 text-tiny text-[var(--fl-color-text-muted)]">
              {formatDistanceToNow(message.createdAt, { addSuffix: true })}
              {message.isRead && <span className="ml-1 text-[var(--fl-color-info)]">✓</span>}
            </div>
          )}
        </div>

        {/* Avatar for own messages */}
        {isOwn && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-[var(--fl-color-info-subtle)] text-tiny text-blue-600">
              {currentUserName?.[0] || "M"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const renderTypingIndicators = () => {
    if (!isAnyoneTyping) return null;

    const typingArray = typingUsers || [];

    return (
      <div className="mb-4 flex gap-3">
        {/* Show avatar of first typing user */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-background text-foreground text-tiny">
            {typingArray[0]?.userName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Typing bubble */}
        <div className="space-y-1">
          <div className="px-1 text-sm text-[var(--fl-color-text-muted)]">
            {typingUsers.length === 1
              ? `${typingArray[0]?.userName || "Someone"} is typing...`
              : `${typingUsers.length} people are typing...`}
          </div>
          <TypingBubble />
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      {/* Messages area */}
      <div id={`messages-${conversationId}`} className="flex-1 space-y-3 overflow-y-auto spacing-3" onScroll={handleScroll}>
        {messages.map(renderMessage)}
        {renderTypingIndicators()}
      </div>

      {/* Message composer */}
      <MessageComposer
        onSend={(content: string) => onSendMessage(content)}
        placeholder={`Message as ${currentUserRole}...`}
        enableAttachments={true}
        enableEmoji={true}
      />
    </div>
  );
}

/**
 * Example usage in a dashboard page
 */
export function DashboardConversationExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const conversationId = "conv-123";
  const currentUserId = "agent-456";

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      senderType: "agent",
      senderId: currentUserId,
      senderName: "Agent Smith",
      createdAt: new Date(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Here you would typically send to your API
    // await api.sendMessage(conversationId, content);
  };

  return (
    <div className="h-screen">
      <ConversationView
        conversationId={conversationId}
        currentUserId={currentUserId}
        currentUserRole="agent"
        currentUserName="Agent Smith"
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
