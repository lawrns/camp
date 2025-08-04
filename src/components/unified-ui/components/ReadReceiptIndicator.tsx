/**
 * Read Receipt Indicator Component
 *
 * Shows read status for messages with visual indicators
 */

import React from "react";
import { Icon } from "./Icon";

export interface ReadReceiptProps {
  status: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  showTimestamp?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ReadReceiptIndicator: React.FC<ReadReceiptProps> = ({
  status,
  timestamp,
  showTimestamp = false,
  size = "sm",
  className = "",
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sent":
        return {
          icon: "check",
          color: "text-gray-400",
          title: "Sent",
        };
      case "delivered":
        return {
          icon: "check-check",
          color: "text-gray-500",
          title: "Delivered",
        };
      case "read":
        return {
          icon: "check-check",
          color: "text-blue-500",
          title: "Read",
        };
      case "failed":
        return {
          icon: "x-circle",
          color: "text-red-500",
          title: "Failed to send",
        };
      default:
        return {
          icon: "clock",
          color: "text-gray-300",
          title: "Sending...",
        };
    }
  };

  const { icon, color, title } = getStatusIcon();

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} title={title}>
      <Icon name={icon as unknown} className={`${sizeClasses[size]} ${color}`} />
      {showTimestamp && timestamp && (
        <span className="text-foreground-muted text-tiny">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
};

/**
 * Message Row with Read Receipt
 * Enhanced message component with read receipt indicator
 */
export interface MessageWithReceiptProps {
  message: {
    id: string;
    content: string;
    senderType: "visitor" | "agent" | "ai";
    senderName?: string;
    timestamp: string;
    readStatus?: "sent" | "delivered" | "read" | "failed";
  };
  showReadReceipt?: boolean;
  onMarkAsRead?: (messageId: string) => void;
  className?: string;
}

export const MessageWithReceipt: React.FC<MessageWithReceiptProps> = ({
  message,
  showReadReceipt = true,
  onMarkAsRead,
  className = "",
}) => {
  const isFromAgent = message.senderType === "agent";

  React.useEffect(() => {
    // Auto-mark as read when message comes into view (for visitor messages)
    if (message.senderType === "visitor" && onMarkAsRead && message.readStatus !== "read") {
      const timer = setTimeout(() => {
        onMarkAsRead(message.id);
      }, 1000); // Mark as read after 1 second of viewing

      return () => clearTimeout(timer);
    }
  }, [message.id, message.senderType, message.readStatus, onMarkAsRead]);

  return (
    <div className={`flex ${isFromAgent ? "justify-end" : "justify-start"} mb-4 ${className}`}>
      <div
        className={`max-w-xs rounded-ds-lg px-4 py-2 lg:max-w-md ${
          isFromAgent ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {/* Message content */}
        <div className="text-sm">{message.content}</div>

        {/* Timestamp and read receipt */}
        <div className="mt-1 flex items-center justify-between gap-ds-2">
          <span className={`text-xs ${isFromAgent ? "text-blue-100" : "text-gray-500"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* Show read receipt only for agent messages */}
          {showReadReceipt && isFromAgent && message.readStatus && (
            <ReadReceiptIndicator status={message.readStatus} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadReceiptIndicator;
