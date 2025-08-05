import React, { useCallback, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Clock,
  ThumbsDown,
  ThumbsUp,
  User,
  Zap,
} from "lucide-react";
// import AutoSizer from "react-virtualized-auto-sizer"; // Package not installed
import { VariableSizeList as List, ListChildComponentProps, ListOnScrollProps } from "react-window";
import { Avatar, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Message } from "@/types/entities";

interface MessageStatus {
  status: "sending" | "sent" | "delivered" | "read" | "error";
  timestamp: number | null;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  messageStatuses: Map<string, MessageStatus>;
  onScroll?: (props: ListOnScrollProps) => void;
  className?: string;
}

interface MessageRowData {
  messages: Message[];
  messageStatuses: Map<string, MessageStatus>;
  setItemSize: (index: number, size: number) => void;
}

type MessageRowProps = ListChildComponentProps<MessageRowData>;

const MessageRow = ({ index, style, data }: MessageRowProps) => {
  const { messages, messageStatuses, setItemSize } = data;
  const message = messages[index];
  const rowRef = useRef<HTMLDivElement>(null);

  // Early return if message is undefined
  if (!message) {
    return (
      <div ref={rowRef} style={style} className="px-4 py-2">
        Message not found
      </div>
    );
  }

  useEffect(() => {
    if (rowRef.current) {
      const height = rowRef.current.getBoundingClientRect().height;
      setItemSize(index, height);
    }
  }, [index, setItemSize, message?.content]);

  const getMessageIcon = (senderType: string) => {
    switch (senderType) {
      case "system":
        return <Bot className="h-4 w-4" />;
      case "operator":
      case "agent":
        return <User className="h-4 w-4" />;
      case "customer":
      case "visitor":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDeliveryIcon = (messageId: string) => {
    const status = messageStatuses.get(messageId);
    if (!status) return null;

    switch (status.status) {
      case "sending":
        return <Clock className="h-3 w-3 animate-spin text-gray-400" />;
      case "sent":
        return <CheckCircle className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCircle className="h-3 w-3 text-blue-600" />;
      case "read":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div ref={rowRef} style={style} className="px-4 py-2">
      <div
        className={cn(
          "flex gap-3",
          (message?.senderType === "operator" || message?.senderType === "agent") && "flex-row-reverse"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback
            className={cn(
              message?.senderType === "system" && "bg-purple-100",
              (message?.senderType === "operator" || message?.senderType === "agent") &&
                "bg-[var(--fl-color-info-subtle)]",
              (message?.senderType === "customer" || message?.senderType === "visitor") && "bg-[var(--fl-color-surface)]"
            )}
          >
            {getMessageIcon(message?.senderType || "customer")}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            "max-w-xs flex-1 md:max-w-md lg:max-w-lg",
            (message?.senderType === "operator" || message?.senderType === "agent") && "text-right"
          )}
        >
          {/* Message Bubble */}
          <div
            className={cn(
              "inline-block rounded-ds-lg px-4 py-2",
              (message?.senderType === "operator" || message?.senderType === "agent") &&
                "ml-auto bg-blue-600 text-white",
              message?.senderType === "system" && "border border-purple-200 bg-purple-50 text-neutral-900",
              (message?.senderType === "customer" || message?.senderType === "visitor") &&
                "border border-[var(--fl-color-border)] bg-white text-gray-900"
            )}
          >
            <div className="whitespace-pre-wrap">{message?.content || ""}</div>

            {/* AI Metadata */}
            {message?.metadata && "ragUsed" in message.metadata && message.metadata.ragUsed && (
              <div className="mt-2 border-t border-white/20 pt-2">
                <div className="flex items-center gap-[var(--fl-spacing-1)] text-xs opacity-75">
                  <Zap className="h-3 w-3" />
                  AI Response
                  {message?.metadata &&
                    "confidence" in message.metadata &&
                    typeof message.metadata.confidence === "number" && (
                      <span>• {Math.round(message.metadata.confidence * 100)}% confident</span>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Message Footer */}
          <div
            className={cn(
              "text-xs mt-1 flex items-center gap-[var(--fl-spacing-2)] text-gray-500",
              (message?.senderType === "operator" || message?.senderType === "agent") && "justify-end"
            )}
          >
            <span>{formatDistanceToNow(new Date(message?.createdAt || new Date()), { addSuffix: true })}</span>
            {(message?.senderType === "operator" || message?.senderType === "agent") &&
              getDeliveryIcon(String(message?.id || ""))}
          </div>

          {/* Reaction Buttons */}
          {message?.senderType === "system" && (
            <div className="mt-2 flex gap-[var(--fl-spacing-1)]">
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function VirtualizedMessageList({
  messages,
  messageStatuses,
  onScroll,
  className,
}: VirtualizedMessageListProps) {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});

  // Estimate item height based on message content
  const getItemSize = useCallback(
    (index: number) => {
      if (sizeMap.current[index]) {
        return sizeMap.current[index];
      }

      const message = messages[index];
      if (!message) return 80; // Default height for undefined messages

      const baseHeight = 80; // Base height for a single-line message
      const charsPerLine = 50;
      const lines = Math.ceil((message?.content?.length || 0) / charsPerLine);
      const estimatedHeight = baseHeight + (lines - 1) * 20;

      // Add extra height for AI metadata
      if (message?.metadata && "ragUsed" in message.metadata && message.metadata.ragUsed) {
        return estimatedHeight + 40;
      }

      return estimatedHeight;
    },
    [messages]
  );

  // Set actual item size after render
  const setItemSize = useCallback((index: number, size: number) => {
    sizeMap.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, "end");
    }
  }, [messages.length]);

  const itemData: MessageRowData = {
    messages,
    messageStatuses,
    setItemSize,
  };

  return (
    <div className={cn("flex-1", className)}>
      {/* <AutoSizer> Package not installed */}
      <List
        ref={listRef}
        height={400} // Fixed height since AutoSizer unavailable
        width={400} // Fixed width since AutoSizer unavailable
        itemCount={messages.length}
        itemSize={getItemSize}
        itemData={itemData}
        onScroll={onScroll}
        overscanCount={5}
        className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
      >
        {MessageRow}
      </List>
      {/* </AutoSizer> */}
    </div>
  );
}
