// MessageRow component for individual messages

import { useAuth } from "@/hooks/useAuth";
import { getAvatarPath } from "@/lib/utils/avatar";
import { Clock, Download, Eye, Heart, MoreHorizontal, CornerUpLeft, Share, ThumbsUp } from "lucide-react";
import * as React from "react";
import { useState, memo } from "react";
import type { Message } from "../types";

interface MessageRowProps {
  message: Message;
  selectedConversation?: unknown;
  hoveredMessage?: string | null;
  setHoveredMessage: (id: string | null) => void;
  style?: React.CSSProperties;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, reaction: string) => void;
  onShare?: (message: Message) => void;
}

/**
 * Individual message row component with memoization for performance
 */
export const MessageRow: React.FC<MessageRowProps> = memo(({
  message,
  selectedConversation,
  hoveredMessage,
  setHoveredMessage,
  style,
  onReply,
  onReact,
  onShare,
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  // Determine message positioning based on sender_type
  const isFromAgent = message.senderType === 'agent' || message.senderType === 'operator';
  const isFromCustomer = message.senderType === 'customer' || message.senderType === 'visitor';
  const isFromAI = message.senderType === 'ai';
  const isHovered = hoveredMessage === message.id;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Handle file download
  const handleFileDownload = (attachment: unknown) => {
    if (attachment.url) {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render attachment
  const renderAttachment = (attachment: unknown) => (
    <div key={attachment.id} className="bg-background mt-2 rounded-ds-lg border border-[var(--fl-color-border)] p-3" data-testid="message-attachment">
      <div className="flex items-center gap-2" data-testid="attachment-header">
        <div className="flex-shrink-0">
          {attachment.type?.startsWith("image/") ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="h-12 w-12 rounded-ds-lg object-cover"
              data-testid="attachment-preview"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-gray-100" data-testid="attachment-icon">
              <Download className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1" data-testid="attachment-details">
          <p className="text-sm font-medium text-gray-900 truncate" data-testid="attachment-name">{attachment.name}</p>
          <p className="text-xs text-gray-500" data-testid="attachment-size">
            {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Unknown size"}
          </p>
        </div>
        <button
          onClick={() => handleFileDownload(attachment)}
          className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
          title="Download file"
          data-testid="attachment-download"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`flex gap-4 p-4 transition-colors hover:bg-[var(--fl-color-background-subtle)] ${
        isFromAgent ? "flex-row-reverse" : "flex-row"
      } ${isHovered ? "bg-blue-50" : ""}`}
      data-testid="message-row"
      onMouseEnter={() => setHoveredMessage(message.id)}
      onMouseLeave={() => setHoveredMessage(null)}
      style={style}
    >
      {/* Avatar */}
      {!isFromAgent && (
        <div className="flex-shrink-0" data-testid="message-avatar">
          <img
            src={getAvatarPath(message.senderName, "customer")}
            alt={message.senderName}
            className="h-8 w-8 rounded-ds-full object-cover"
          />
        </div>
      )}

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isFromAgent ? "text-right" : "text-left"}`} data-testid="message-content">
        {/* Message header */}
        <div className={`flex items-center gap-2 text-xs text-gray-500 mb-2 ${isFromAgent ? "justify-end" : "justify-start"}`} data-testid="message-header">
          <span className="font-sans font-medium" data-testid="message-sender">{message.senderName}</span>
          <span className="font-sans" data-testid="message-timestamp">{formatTimestamp(message.created_at)}</span>
        </div>

        {/* Message bubble with proper positioning */}
        <div
          className={`message-bubble mobile-message-bubble inline-block max-w-[85%] md:max-w-[70%] rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 text-sm ${
            isFromAgent
              ? "bg-blue-600 text-white border border-blue-700 ml-auto" // Agent: Blue bubble, right-aligned
              : isFromCustomer
              ? "bg-background border border-[var(--fl-color-border)] text-gray-900" // Customer: Gray bubble, left-aligned
              : "bg-blue-50 border border-blue-200 text-blue-900" // AI: Light blue bubble
          }`}
          data-testid="message-bubble"
        >
          <p className="font-sans whitespace-pre-wrap break-words leading-relaxed" data-testid="message-text">{message.content}</p>
        </div>

        {/* Message status indicator for agent messages */}
        {isFromAgent && (
          <div className="flex items-center justify-end mt-1">
            <span className="typography-metadata flex items-center gap-1 text-xs text-gray-500">
              {(message as unknown).read_status === 'sending' && <span className="animate-pulse">Sending...</span>}
              {(message as unknown).read_status === 'sent' && <span>✓</span>}
              {(message as unknown).read_status === 'delivered' && <span>✓✓</span>}
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Message reactions display */}
        {(message as unknown).reactions && (message as unknown).reactions.length > 0 && (
          <div className={`flex items-center gap-1 mt-1 ${isFromAgent ? "justify-end" : "justify-start"}`}>
            {(message as unknown).reactions.map((reaction: unknown, index: number) => (
              <button
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                onClick={() => onReact?.(message.id, reaction.type)}
              >
                <span>{reaction.emoji}</span>
                <span className="typography-metadata">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message actions */}
        <div className={`flex items-center gap-1 mt-1 ${isFromAgent ? "justify-end" : "justify-start"}`} data-testid="message-actions">
          <button
            onClick={() => onReply?.(message)}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="Reply"
            data-testid="message-reply"
          >
            <CornerUpLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => onReact?.(message.id, "like")}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="Like"
            data-testid="message-like"
          >
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onReact?.(message.id, "heart")}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="Heart"
            data-testid="message-heart"
          >
            <Heart className="h-3 w-3" />
          </button>
          <button
            onClick={() => onShare?.(message)}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="Share"
            data-testid="message-share"
          >
            <Share className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowMessageMenu(!showMessageMenu)}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="More options"
            data-testid="message-more"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>

        {/* Message reactions - disabled as reactions property doesn't exist on Message type */}
        {/* TODO: Add reactions support when Message type is updated */}

        {/* Message attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2" data-testid="message-attachments">{message.attachments.map(renderAttachment)}</div>
        )}

        {/* Message reactions panel */}
        {showReactions && (
          <div className="bg-background mt-2 rounded-ds-lg border border-[var(--fl-color-border)] p-3 shadow-card-base" data-testid="message-reactions-panel">
            <div className="flex items-center gap-2" data-testid="reactions-panel-header">
              <span className="text-sm font-medium text-gray-900">Add reaction</span>
              <button
                onClick={() => setShowReactions(false)}
                className="ml-auto hover:bg-background rounded p-1 text-gray-400 transition-colors"
                data-testid="close-reactions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2" data-testid="reactions-options">
              {["👍", "❤️", "😊", "🎉", "👏", "🔥"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowReactions(false);
                  }}
                  className="hover:bg-background rounded p-2 text-lg transition-colors"
                  data-testid={`reaction-option-${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message menu */}
        {showMessageMenu && (
          <div className="bg-background mt-2 rounded-ds-lg border border-[var(--fl-color-border)] p-3 shadow-card-base" data-testid="message-menu">
            <div className="space-y-1" data-testid="message-menu-options">
              <button
                onClick={() => {
                  onReply?.(message);
                  setShowMessageMenu(false);
                }}
                className="hover:bg-background rounded p-2 text-sm transition-colors w-full text-left"
                data-testid="menu-reply"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  onShare?.(message);
                  setShowMessageMenu(false);
                }}
                className="hover:bg-background rounded p-2 text-sm transition-colors w-full text-left"
                data-testid="menu-share"
              >
                Share
              </button>
              <button
                onClick={() => setShowMessageMenu(false)}
                className="hover:bg-background rounded p-2 text-sm transition-colors w-full text-left"
                data-testid="menu-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageRow.displayName = "MessageRow";

export default MessageRow;
