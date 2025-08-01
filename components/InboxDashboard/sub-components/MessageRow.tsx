// MessageRow component for individual messages

import { useAuth } from "@/hooks/useAuth";
import { getAvatarPath } from "@/lib/utils/avatar";
import { Clock, Download, Eye, Heart, DotsThree, ArrowBendUpLeft, Share, ThumbsUp } from "@phosphor-icons/react";
import * as React from "react";
import { useState, memo } from "react";
import type { Message } from "../types";

interface MessageRowProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, reaction: string) => void;
  onShare?: (message: Message) => void;
}

/**
 * Individual message row component with memoization for performance
 */
export const MessageRow: React.FC<MessageRowProps> = memo(({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
  onReply,
  onReact,
  onShare,
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

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
  const handleFileDownload = (attachment: any) => {
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
  const renderAttachment = (attachment: any) => (
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
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
      data-testid="message-row"
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0" data-testid="message-avatar">
          <img
            src={getAvatarPath(message.sender_name, "customer")}
            alt={message.sender_name}
            className="h-8 w-8 rounded-ds-full object-cover"
          />
        </div>
      )}

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : "text-left"}`} data-testid="message-content">
        {/* Message header */}
        {showTimestamp && (
          <div className={`flex items-center gap-2 text-xs text-gray-500 mb-2 ${isOwnMessage ? "justify-end" : "justify-start"}`} data-testid="message-header">
            <span className="font-sans font-medium" data-testid="message-sender">{message.sender_name}</span>
            <Clock className="h-3 w-3" data-testid="message-time-icon" />
            <span className="font-sans" data-testid="message-timestamp">{formatTimestamp(message.created_at)}</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`message-bubble mobile-message-bubble inline-block max-w-[85%] md:max-w-[70%] rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 text-sm ${
            isOwnMessage
              ? "bg-blue-600 text-white border border-blue-700"
              : "bg-background border border-[var(--fl-color-border)]"
          }`}
          data-testid="message-bubble"
        >
          <p className="font-sans whitespace-pre-wrap break-words leading-relaxed" data-testid="message-text">{message.content}</p>
        </div>

        {/* Message status indicator */}
        {isOwnMessage && (
          <div className="flex items-center justify-end mt-1">
            <span className="typography-metadata flex items-center gap-1">
              {(message as any).status === 'sending' && <Clock className="h-3 w-3 animate-spin" />}
              {(message as any).status === 'delivered' && <span className="text-gray-500">✓</span>}
              {(message as any).status === 'read' && <span className="text-blue-500">✓✓</span>}
              {(message as any).status === 'failed' && <span className="text-red-500">✗</span>}
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Message reactions display */}
        {(message as any).reactions && (message as any).reactions.length > 0 && (
          <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
            {(message as any).reactions.map((reaction: any, index: number) => (
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
        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`} data-testid="message-actions">
          <button
            onClick={() => onReply?.(message)}
            className="hover:text-foreground rounded p-1 text-gray-400 transition-colors"
            title="Reply"
            data-testid="message-reply"
          >
            <ArrowBendUpLeft className="h-3 w-3" />
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
            <DotsThree className="h-3 w-3" />
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
                <DotsThree className="h-4 w-4" />
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
