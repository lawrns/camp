"use client";

import { CheckCircle as Check, Checks as CheckCheck, Clock } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Icon } from "@/lib/ui/Icon";
// import { UnifiedAvatar } from "@/components/unified-ui/components/unified-avatar"; // Component doesn't exist, using Avatar
import { cn } from "@/lib/utils";
import type { CustomerData, Message } from "@/types/entities/message";

interface MessageItemProps {
  message: Message;
  customerData: CustomerData; // Customer data from conversation
  showTimestamp?: boolean;
  isOptimistic?: boolean;
  onRetry?: () => void;
}

function formatTime(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function getDeliveryIcon(message: Message) {
  switch (message.status) {
    case "read":
      return <Icon icon={CheckCheck} className="h-3 w-3 text-[var(--fl-color-info)]" />;
    case "delivered":
      return <Icon icon={Check} className="h-3 w-3 text-[var(--fl-color-text-muted)]" />;
    case "sent":
    default:
      return <Icon icon={Clock} className="h-3 w-3 text-gray-400" />;
  }
}

export function MessageItem({ message, customerData }: MessageItemProps) {
  // Handle both camelCase and snake_case sender types for compatibility
  const senderType = message.senderType || message.senderType;
  const isAgent = senderType === "agent" || senderType === "operator";
  const isCustomer = senderType === "customer" || senderType === "visitor";
  const isSystem = senderType === "system";

  // Improved system message styling
  if (isSystem) {
    return (
      <div className="my-4 flex justify-center">
        <div className="rounded-ds-full border border-amber-200 bg-amber-50 px-3 py-2 text-tiny text-amber-800">
          {message.content}
        </div>
      </div>
    );
  }

  // Build agent user object conditionally
  const agentUser = {
    name: message.senderName || message.senderName || "Agent",
    role: "agent",
    avatar: message.senderAvatarUrl || message.sender_avatar_url,
  };

  return (
    <div className="message-item mb-4 flex px-4 py-2">
      {/* Container with proper alignment */}
      <div className={cn("flex w-full items-end gap-3", isAgent ? "justify-end" : "justify-start")}>
        {/* Customer Avatar - Left side with Status */}
        {!isAgent && (
          <div className="mb-1 flex-shrink-0">
            <Avatar className="h-8 w-8">
              {customerData?.avatar && <AvatarImage {...(customerData.avatar && { src: customerData.avatar })} />}
              <AvatarFallback>{customerData?.name?.[0] || "C"}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message Content Container */}
        <div className={cn("flex max-w-[75%] space-y-1 md:max-w-[60%]", isAgent ? "items-end" : "items-start")}>
          {/* FIXED: Proper Speech Bubble with modern chat styling */}
          <div
            className={cn(
              "text-typography-base relative break-words px-4 py-3 leading-6 sm:px-6 sm:py-4",
              "shadow-sm transition-all duration-200 ease-out",
              // Customer messages (left-aligned, gray)
              isCustomer && [
                "border border-[var(--fl-color-border)] bg-neutral-100 text-neutral-900",
                "rounded-[18px_18px_18px_4px]", // Modern chat bubble shape
                "self-start",
              ],
              // Agent messages (right-aligned, blue)
              isAgent && [
                "bg-brand-blue-500 text-white",
                "rounded-[18px_18px_4px_18px]", // Modern chat bubble shape
                "self-end",
              ]
            )}
            style={{
              maxWidth: "100%",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>

          {/* Message Metadata */}
          <div
            className={cn(
              "text-typography-xs mt-1 flex items-center gap-2 opacity-70",
              isAgent ? "flex-row-reverse text-neutral-600" : "text-[var(--fl-color-text-muted)]"
            )}
          >
            <span>{formatTime(message.createdAt || new Date())}</span>
            {isAgent && <div className="flex items-center">{getDeliveryIcon(message)}</div>}
          </div>
        </div>

        {/* Agent Avatar - Right side with Status */}
        {isAgent && (
          <div className="mb-1 flex-shrink-0">
            <Avatar className="h-8 w-8">
              {agentUser?.avatar && <AvatarImage {...(agentUser.avatar && { src: agentUser.avatar })} />}
              <AvatarFallback>{agentUser?.name?.[0] || "A"}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
}
