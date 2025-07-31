"use client";

import { MessageItem } from "@/components/InboxDashboard/sub-components/MessagePanel/MessageItem";
import { Button } from "@/components/ui/Button-unified";
import { Avatar, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { MessageComposer } from "@/components/unified-ui/components/Composer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { useUIState } from "@/store/useInboxStore";
// Flame styles now handled by design-system.css
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import type { Message } from "@/types/entities/message";
import { DotsThreeVertical as MoreVertical, Sparkle as Sparkles, Note as StickyNote, UserPlus } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssignmentDialog } from "@/components/conversations/AssignmentDialog";

interface Conversation {
  id: string;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  organizationId?: string;
}

interface InboxMessagePanelProps {
  conversation: Conversation;
  messages: Message[];
  messageText: string;
  isSending: boolean;
  isLoadingMessages: boolean;
  onMessageTextChange: (text: string) => void;
  onSendMessage: (content: string) => void;
  onStatusChange: (status: "open" | "resolved" | "pending") => void;
  onAssignAgent?: (agentId: string) => void;
}

/**
 * InboxMessagePanel - Beautiful, focused message panel
 *
 * Features:
 * - Beautiful visual design with Flame UI
 * - Improved message composer integration
 * - Smooth animations and transitions
 * - Under 300 lines, focused responsibility
 */
export function InboxMessagePanel({
  conversation,
  messages,
  messageText,
  isSending,
  isLoadingMessages,
  onMessageTextChange,
  onSendMessage,
  onStatusChange,
  onAssignAgent,
}: InboxMessagePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { showAIAssist, setShowAIAssist } = useUIState();

  // Handle scroll position and show/hide scroll button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceFromBottom < 100;

    setIsNearBottom(isNear);
    setShowScrollButton(!isNear && messages.length > 5);
  }, [messages.length]);

  // Smooth scroll to bottom with easing
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom, scrollToBottom]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Simulate typing indicator (in real app, this would come from WebSocket)
  useEffect(() => {
    if (isSending) {
      const timer = setTimeout(() => setIsTyping(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
    return undefined;
  }, [isSending]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]";
      case "resolved":
        return "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]";
      default:
        return "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]";
    }
  };

  // Group consecutive messages by sender
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      id: string;
      messages: typeof messages;
      sender_type: string;
      timestamp: Date;
    }> = [];

    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const createdAt = message.createdAt || message.created_at;
      const prevCreatedAt = prevMessage?.createdAt || prevMessage?.created_at;
      const senderType = message.senderType || message.sender_type;
      const prevSenderType = prevMessage?.senderType || prevMessage?.sender_type;

      const timeDiff =
        prevMessage && createdAt && prevCreatedAt
          ? new Date(createdAt).getTime() - new Date(prevCreatedAt).getTime()
          : Infinity;

      // Group messages if same sender and within 2 minutes
      if (prevMessage && prevSenderType === senderType && timeDiff < 2 * 60 * 1000) {
        groups[groups.length - 1]?.messages.push(message);
      } else {
        groups.push({
          id: `group-${message.id}`,
          messages: [message],
          sender_type: senderType || "unknown",
          timestamp: new Date(createdAt || new Date()),
        });
      }
    });

    return groups;
  }, [messages]);

  // Improved Typing indicator component
  const TypingIndicator = () => (
    <OptimizedMotion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      className="mb-4 flex justify-start gap-3"
    >
      <Avatar className="h-8 w-8 shadow-card-base ring-2 ring-white">
        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-tiny text-white">AI</AvatarFallback>
      </Avatar>
      <div className="relative">
        <div className="bg-background radius-2xl border border-[var(--fl-color-border)] px-4 py-3 shadow-card-base">
          <div className="flex items-center gap-ds-2">
            <span className="text-tiny font-medium text-[var(--fl-color-text-muted)]">AI Assistant is typing</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i: any) => (
                <OptimizedMotion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-ds-full bg-neutral-400"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute left-[-8px] top-3 h-0 w-0 border-b-[8px] border-r-[8px] border-t-[8px] border-b-transparent border-r-white border-t-transparent" />
      </div>
    </OptimizedMotion.div>
  );

  // Improved Message skeleton loader
  const MessageSkeleton = ({ index }: { index: number }) => (
    <OptimizedMotion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn("flex gap-3", index % 2 === 0 ? "justify-start" : "justify-end")}
    >
      {index % 2 === 0 && (
        <div className="h-8 w-8 animate-pulse rounded-ds-full bg-gradient-to-br from-gray-200 to-gray-300" />
      )}
      <div
        className={cn(
          "max-w-[70%] radius-2xl px-4 py-3",
          index % 2 === 0 ? "bg-gray-100" : "bg-[var(--fl-color-info-subtle)]"
        )}
      >
        <div className="space-y-spacing-sm">
          <div
            className={cn("h-3 animate-pulse rounded", index % 2 === 0 ? "bg-gray-300" : "bg-blue-300")}
            style={{ width: `${Math.random() * 150 + 100}px` }}
          />
          <div
            className={cn("h-3 animate-pulse rounded", index % 2 === 0 ? "bg-gray-300" : "bg-blue-300")}
            style={{ width: `${Math.random() * 100 + 50}px` }}
          />
        </div>
      </div>
      {index % 2 !== 0 && (
        <div className="h-8 w-8 animate-pulse rounded-ds-full bg-gradient-to-br from-blue-400 to-blue-500" />
      )}
    </OptimizedMotion.div>
  );

  // Date separator component
  const DateSeparator = ({ date }: { date: Date }) => (
    <OptimizedMotion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-6 flex items-center justify-center"
    >
      <div className="bg-background text-foreground rounded-ds-full px-3 py-1 text-tiny font-medium">
        {date && !isNaN(date.getTime()) ? formatDistanceToNow(date, { addSuffix: true }) : "Unknown"}
      </div>
    </OptimizedMotion.div>
  );

  return (
    <div
      className="flex h-full flex-col bg-gradient-to-b from-white via-gray-50/50 to-white"
      data-testid="inbox-message-panel"
    >
      {/* Header */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mobile-safe-area-top flex h-16 items-center justify-between overflow-hidden px-4 md:px-6",
          "border-b border-[var(--fl-color-border)]/50 backdrop-blur-xl",
          "bg-white/80 shadow-sm",
          "mobile-header"
        )}
        data-testid="inbox-header"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              className="touch-target h-10 w-10 shadow-card-base ring-2 ring-white"
              src={getAvatarUrl(conversation.customerEmail || conversation.customerName || "Unknown Customer")}
              name={conversation.customerName || conversation.customerEmail || "Unknown Customer"}
            >
              <AvatarFallback>
                {(conversation.customerName || conversation.customerEmail || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <OptimizedMotion.div
              initial={false}
              animate={{
                scale: conversation.status === "open" ? 1 : 0,
              }}
              className="bg-semantic-success absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-ds-full border-2 border-white"
            />
          </div>

          <div>
            <h3 className="max-w-[120px] truncate font-semibold text-gray-900 md:max-w-none">
              {conversation.customerName || conversation.customerEmail || "Unknown Customer"}
            </h3>
            <div className="flex items-center gap-ds-2">
              <Badge
                variant="outline"
                className={cn("text-typography-xs transition-colors", getStatusColor(conversation.status))}
              >
                {conversation.status || "active"}
              </Badge>
              <span className="max-w-[80px] truncate text-tiny text-[var(--fl-color-text-muted)] md:max-w-none">
                {conversation.customerEmail}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-ds-2">
          {/* Assignment Button - Opens Dialog */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAssignmentDialog(true)}
            className="touch-target text-neutral-600 transition-all hover:text-neutral-900"
            data-testid="assign-agent-button"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Assign conversation to agent"
          >
            <Icon icon={UserPlus} className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIAssist(!showAIAssist)}
            className={cn(
              "touch-target text-neutral-600 transition-all hover:text-neutral-900",
              showAIAssist && "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
            data-testid="ai-assist-toggle"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Icon icon={Sparkles} className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="touch-target text-foreground hover:text-gray-900"
                style={{ minWidth: 44, minHeight: 44 }}
                data-testid="header-menu-toggle"
              >
                <Icon icon={MoreVertical} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => onStatusChange("open")}>
                <div className="bg-semantic-success mr-2 h-2 w-2 rounded-ds-full" />
                Mark as Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("pending")}>
                <div className="bg-semantic-warning mr-2 h-2 w-2 rounded-ds-full" />
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("resolved")}>
                <div className="mr-2 h-2 w-2 rounded-ds-full bg-neutral-500" />
                Mark as Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </OptimizedMotion.div>

      {/* Messages Area with smooth scrolling */}
      <div
        ref={scrollContainerRef}
        className={cn("mobile-scroll flex-1 overflow-y-auto spacing-3 md:spacing-4")}
        data-testid="messages-area"
      >
        <OptimizedAnimatePresence mode="popLayout">
          {isLoadingMessages ? (
            <OptimizedMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 py-4"
            >
              {[0, 1, 2, 3].map((i: any) => (
                <MessageSkeleton key={i} index={i} />
              ))}
            </OptimizedMotion.div>
          ) : messages.length === 0 ? (
            <OptimizedMotion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <OptimizedMotion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 shadow-card-deep"
              >
                <Icon icon={Sparkles} className="h-10 w-10 text-purple-600" />
              </OptimizedMotion.div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Start the conversation</h3>
              <p className="max-w-sm text-[var(--fl-color-text-muted)]">
                Send the first message to begin chatting with this customer.
              </p>
            </OptimizedMotion.div>
          ) : (
            <div className="space-y-6 py-4">
              {groupedMessages.map((group, groupIndex) => {
                const isCustomerGroup = group.sender_type === "customer" || group.sender_type === "visitor";
                const isAgentGroup = group.sender_type === "agent";
                const isSystemGroup = group.sender_type === "internal_note";

                // Show date separator for first group or if significant time passed
                const showDateSeparator =
                  groupIndex === 0 ||
                  (groupIndex > 0 &&
                    group.timestamp.getTime() - (groupedMessages[groupIndex - 1]?.timestamp.getTime() || 0) >
                    30 * 60 * 1000);

                return (
                  <React.Fragment key={group.id}>
                    {showDateSeparator && <DateSeparator date={group.timestamp} />}

                    {isSystemGroup ? (
                      <OptimizedMotion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: groupIndex * 0.05,
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="my-3 flex justify-center"
                      >
                        <div className="flex items-center gap-ds-2 radius-2xl border border-amber-200/50 bg-amber-50 px-4 py-2 text-tiny text-amber-700 shadow-card-base">
                          <Icon icon={StickyNote} className="h-3 w-3" />
                          <span className="font-medium">Internal Note:</span>
                          {group.messages[0]?.content}
                        </div>
                      </OptimizedMotion.div>
                    ) : (
                      <OptimizedMotion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: groupIndex * 0.05 }}
                        className={cn("group flex gap-3", isAgentGroup ? "justify-end" : "justify-start")}
                      >
                        {isCustomerGroup && (
                          <OptimizedMotion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: groupIndex * 0.05 + 0.1,
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                            className="mt-auto flex-shrink-0"
                          >
                            <Avatar
                              className="h-8 w-8 shadow-card-base ring-2 ring-white"
                              src={
                                group.messages[0]?.sender_avatar_url ||
                                getAvatarUrl(
                                  group.messages[0]?.sender_email || group.messages[0]?.sender_name || "Customer"
                                )
                              }
                              name={group.messages[0]?.sender_name || "Customer"}
                            >
                              <AvatarFallback>
                                {(group.messages[0]?.sender_name || "C").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </OptimizedMotion.div>
                        )}

                        <div className="max-w-[70%] space-y-1.5">
                          {group.messages.map((message, messageIndex) => (
                            <OptimizedMotion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{
                                delay: groupIndex * 0.05 + messageIndex * 0.02,
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              }}
                              className="relative"
                            >
                              <MessageItem
                                message={message}
                                isAgent={isAgentGroup}
                                showTimestamp={messageIndex === group.messages.length - 1}
                              >
                                {/* Message tail for first message in group */}
                                {messageIndex === 0 && (
                                  <div
                                    className={cn(
                                      "absolute top-3 h-0 w-0",
                                      isAgentGroup
                                        ? "right-[-6px] border-b-[6px] border-l-[6px] border-t-[6px] border-b-transparent border-l-blue-600 border-t-transparent"
                                        : "left-[-6px] border-b-[6px] border-r-[6px] border-t-[6px] border-b-transparent border-r-white border-t-transparent"
                                    )}
                                    style={{
                                      filter: isCustomerGroup ? "drop-shadow(1px 0 1px rgba(0,0,0,0.05))" : undefined,
                                    }}
                                  />
                                )}
                              </MessageItem>

                              {/* Read receipts - only on last agent message */}
                              {isAgentGroup &&
                                groupIndex === groupedMessages.length - 1 &&
                                messageIndex === group.messages.length - 1 && (
                                  <OptimizedMotion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -bottom-5 right-0 flex items-center gap-1"
                                  >
                                    <OptimizedMotion.svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ duration: 0.3, delay: 0.6 }}
                                    >
                                      <OptimizedMotion.path
                                        d="M2 8L6 12L14 4"
                                        stroke="#3B82F6"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 0.6 }}
                                      />
                                      <OptimizedMotion.path
                                        d="M7 8L11 12L14 9"
                                        stroke="#3B82F6"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity="0.5"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 0.7 }}
                                      />
                                    </OptimizedMotion.svg>
                                    <span className="text-[10px] text-gray-400">Read</span>
                                  </OptimizedMotion.div>
                                )}
                            </OptimizedMotion.div>
                          ))}
                        </div>

                        {isAgentGroup && (
                          <OptimizedMotion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: groupIndex * 0.05 + 0.1,
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                            className="mt-auto flex-shrink-0"
                          >
                            <Avatar
                              className="h-8 w-8 shadow-card-base ring-2 ring-white"
                              src={getAvatarUrl("agent@company.com")}
                              name="Agent"
                            >
                              <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                          </OptimizedMotion.div>
                        )}
                      </OptimizedMotion.div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Typing indicator */}
              <OptimizedAnimatePresence>{isTyping && <TypingIndicator />}</OptimizedAnimatePresence>
            </div>
          )}
        </OptimizedAnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <OptimizedAnimatePresence>
        {showScrollButton && (
          <OptimizedMotion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToBottom()}
            className={cn(
              "absolute bottom-24 right-6 h-12 w-12 rounded-ds-full",
              "border border-[var(--fl-color-border)] bg-white shadow-lg",
              "flex items-center justify-center",
              "transition-shadow hover:shadow-xl"
            )}
          >
            <OptimizedMotion.svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </OptimizedMotion.svg>
          </OptimizedMotion.button>
        )}
      </OptimizedAnimatePresence>

      {/* Message Composer */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="message-composer-container border-[var(--fl-color-border)]/50 bg-background/80 flex-shrink-0 border-t backdrop-blur-xl"
        data-testid="message-composer-container"
      >
        <MessageComposer
          onSend={async (content: string, attachments?: File[]) => {
            // For now, just send as regular message
            // TODO: Update API to handle attachments, internal notes, mentions, and tags
            await onSendMessage(content);
          }}
          disabled={isSending}
          placeholder="Type a message..."
          enableAttachments={true}
          enableEmoji={true}
        />
      </OptimizedMotion.div>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        conversationId={conversation.id}
        currentAgentId={null}
        organizationId={conversation.organizationId || ""}
        onAssigned={(agentId) => {
          onAssignAgent?.(agentId);
          setShowAssignmentDialog(false);
        }}
      />
    </div>
  );
}
