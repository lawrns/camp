// MessageRow component for individual messages

import { Check, Checks, Clock, Download, File, Image, Robot, Smiley, User, Warning } from "@phosphor-icons/react";
import * as React from "react";
import { memo, useEffect, useRef, useState } from "react";
import { quickReactionEmojis } from "../constants/messageTemplates";
import type { FileAttachment, MessageRowProps } from "../types";

/**
 * Individual message row component with memoization
 */
export const MessageRow: React.FC<MessageRowProps> = memo(
  ({ message, selectedConversation, hoveredMessage, setHoveredMessage, style }) => {
    const [showReactions, setShowReactions] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);
    const isAgent = message.sender_type === "agent";
    const isAI = message.sender_type === "ai";
    const isCustomer = message.sender_type === "customer" || message.sender_type === "visitor";

    // Initialize read receipts hook
    const readReceiptsHook = selectedConversation
      ? {
          getReadReceiptStatus: (messageId: string) => ({
            messageId,
            status: message.read_status || "sent",
            readBy: [],
          }),
          observeMessage: (element: HTMLElement, messageId: string) => () => {},
          isReadByUser: (messageId: string) => false,
        }
      : null;

    // Use read receipts hook if available (import dynamically to avoid issues)
    const { useReadReceipts } = React.useMemo(() => {
      try {
        return require("@/hooks/useReadReceipts");
      } catch {
        return { useReadReceipts: () => readReceiptsHook };
      }
    }, [readReceiptsHook]);

    const readReceipts = selectedConversation
      ? useReadReceipts({
          conversationId: selectedConversation.id,
          organizationId: selectedConversation.organizationId || "",
          autoMarkAsRead: isCustomer, // Only auto-mark customer messages as read
          enableRealtime: true,
        })
      : readReceiptsHook;

    // Format timestamp with error handling
    const formatTime = (timestamp: string) => {
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return "Invalid time";
        }
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch (error) {
        return "Invalid time";
      }
    };

    // Enhanced read receipt indicator with real-time updates
    const getReadReceiptIndicator = () => {
      if (!isAgent && !isAI) return null; // Only show for agent/AI messages

      // Get real-time read receipt status
      const receiptStatus = readReceipts?.getReadReceiptStatus?.(message.id.toString()) || {
        status: message.read_status || "sent",
        readBy: [],
      };

      const status = receiptStatus.status;
      const readByCount = receiptStatus.readBy?.length || 0;

      switch (status) {
        case "read":
          return (
            <div
              className="text-ds-brand flex items-center"
              title={`Read${readByCount > 0 ? ` by ${readByCount} user${readByCount > 1 ? "s" : ""}` : ""}`}
            >
              <Checks className="h-3 w-3" />
              {readByCount > 1 && <span className="ml-1 text-tiny font-medium">{readByCount}</span>}
            </div>
          );
        case "delivered":
          return (
            <div className="flex items-center text-gray-400" title="Delivered">
              <Check className="h-3 w-3" />
            </div>
          );
        default:
          return (
            <div className="flex items-center text-gray-300" title="Sent">
              <Clock className="h-3 w-3" />
            </div>
          );
      }
    };

    // Get sender avatar
    const getSenderAvatar = () => {
      if (isAI) {
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-purple-100">
            <Robot className="h-5 w-5 text-purple-600" />
          </div>
        );
      }

      if (isAgent) {
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
        );
      }

      // Customer avatar
      const customerName = selectedConversation?.customer_name || message.sender_name;
      const customerEmail = selectedConversation?.customer_email || message.sender_name;
      return (
        <img
          src={(() => {
            const { getAvatarPath } = require("@/lib/utils/avatar");
            return getAvatarPath(customerEmail || customerName, "customer");
          })()}
          alt={customerName}
          className="h-8 w-8 rounded-ds-full"
        />
      );
    };

    // Get message bubble styling
    const getBubbleStyle = () => {
      if (isAgent || isAI) {
        return "bg-blue-600 text-white ml-auto max-w-xs lg:max-w-md";
      }
      return "bg-gray-100 text-gray-900 mr-auto max-w-xs lg:max-w-md";
    };

    // Render file attachment
    const renderAttachment = (attachment: FileAttachment) => {
      const isImage = attachment.type.startsWith("image/");
      const isUploading = attachment.uploadStatus === "uploading";
      const hasError = attachment.uploadStatus === "error";

      return (
        <div key={attachment.id} className="bg-background mt-2 rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm" data-testid="message-attachment">
          <div className="flex items-center space-x-spacing-sm" data-testid="attachment-header">
            {isImage ? (
              <Image
                className={`h-5 w-5 ${hasError ? "text-[var(--fl-color-danger)]" : "text-[var(--fl-color-text-muted)]"}`}
                data-testid="attachment-image-icon"
              />
            ) : (
              <File
                className={`h-5 w-5 ${hasError ? "text-[var(--fl-color-danger)]" : "text-[var(--fl-color-text-muted)]"}`}
                data-testid="attachment-file-icon"
              />
            )}
            <div className="min-w-0 flex-1" data-testid="attachment-info">
              <p className="truncate text-sm font-medium text-gray-900" data-testid="attachment-name">{attachment.name}</p>
              <p className="text-tiny text-[var(--fl-color-text-muted)]" data-testid="attachment-size">{(attachment.size / 1024).toFixed(1)} KB</p>
            </div>

            {isUploading && <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-blue-600" data-testid="attachment-uploading"></div>}

            {hasError && (
              <div title="Upload failed" data-testid="attachment-error">
                <Warning className="h-4 w-4 text-[var(--fl-color-danger)]" />
              </div>
            )}

            {attachment.url && !isUploading && !hasError && (
              <button
                onClick={() => window.open(attachment.url, "_blank")}
                className="hover:text-foreground spacing-1 text-gray-400"
                aria-label="Download file"
                data-testid="attachment-download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Image preview */}
          {isImage && attachment.preview && (
            <div className="mt-2" data-testid="attachment-preview">
              <img
                src={attachment.preview}
                alt={attachment.name}
                className="h-auto max-h-48 max-w-full rounded-ds-lg object-cover"
                data-testid="attachment-image"
              />
            </div>
          )}
        </div>
      );
    };

    // Handle reaction click
    const handleReaction = (emoji: string) => {
      // In a real app, this would save the reaction to the database

      setShowReactions(false);
    };

    // Setup intersection observer for auto-marking as read
    useEffect(() => {
      if (messageRef.current && readReceipts?.observeMessage && isCustomer) {
        const cleanup = readReceipts.observeMessage(messageRef.current, message.id.toString());
        return cleanup;
      }
    }, [readReceipts, message.id, isCustomer]);

    return (
      <div style={style} data-testid="message-row">
        <div
          ref={messageRef}
          className={`flex space-x-3 spacing-4 transition-colors hover:bg-[var(--fl-color-background-subtle)] ${
            isAgent || isAI ? "flex-row-reverse space-x-reverse" : ""
          }`}
          onMouseEnter={() => setHoveredMessage(message.id)}
          onMouseLeave={() => setHoveredMessage(null)}
          data-testid="message-content"
        >
          {/* Avatar */}
          <div className="flex-shrink-0" data-testid="message-avatar">{getSenderAvatar()}</div>

          {/* Message content */}
          <div className="min-w-0 flex-1" data-testid="message-body">
            {/* Sender name and timestamp */}
            <div className={`mb-1 flex items-center space-x-2 ${isAgent || isAI ? "justify-end" : ""}`} data-testid="message-header">
              <span className="text-sm font-medium text-gray-900" data-testid="message-sender">
                {isAI ? "AI Assistant" : message.sender_name}
              </span>
              <span className="flex items-center gap-1 text-tiny text-[var(--fl-color-text-muted)]" data-testid="message-timestamp">
                {formatTime(message.created_at)}
                {getReadReceiptIndicator()}
              </span>
            </div>

            {/* Message bubble */}
            <div className={`rounded-ds-lg px-4 py-2 ${getBubbleStyle()}`} data-testid="message-bubble">
              <p className="whitespace-pre-wrap break-words text-sm" data-testid="message-text">{message.content}</p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-spacing-sm" data-testid="message-attachments">{message.attachments.map(renderAttachment)}</div>
              )}
            </div>

            {/* Message actions (show on hover) */}
            {hoveredMessage === message.id && (
              <div className={`mt-2 flex items-center space-x-2 ${isAgent || isAI ? "justify-end" : ""}`} data-testid="message-actions">
                {/* Quick reactions */}
                <div className="flex items-center space-x-1" data-testid="message-quick-reactions">
                  {quickReactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="rounded spacing-1 text-sm transition-colors hover:bg-gray-200"
                      title={`React with ${emoji}`}
                      data-testid={`message-reaction-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* More reactions button */}
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="hover:text-foreground rounded spacing-1 text-gray-400 transition-colors hover:bg-gray-200"
                    aria-label="More reactions"
                    data-testid="message-more-reactions"
                  >
                    <Smiley className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Extended reactions panel */}
            {showReactions && (
              <div className="bg-background mt-2 rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm shadow-card-base" data-testid="message-reactions-panel">
                <div className="grid grid-cols-8 gap-1" data-testid="message-reactions-grid">
                  {["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="hover:bg-background rounded p-spacing-sm text-base transition-colors"
                        title={`React with ${emoji}`}
                        data-testid={`message-extended-reaction-${emoji}`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageRow.displayName = "MessageRow";

export default MessageRow;
