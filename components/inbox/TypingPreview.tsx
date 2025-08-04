import React from "react";
import { cn } from "@/lib/utils";

interface TypingUser {
  userId: string;
  userName: string;
  userType: "agent" | "visitor";
  timestamp: Date;
}

interface TypingPreviewProps {
  typingUsers: TypingUser[];
  className?: string;
  currentUserId?: string; // Don't show typing for current user
}

export function TypingPreview({ typingUsers, className, currentUserId }: TypingPreviewProps) {
  // Filter out current user and limit to 3 users
  const filteredUsers = typingUsers.filter((user: unknown) => user.userId !== currentUserId).slice(0, 3);

  if (filteredUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (filteredUsers.length === 1) {
      return `${filteredUsers[0]?.userName || "Someone"} is typing...`;
    } else if (filteredUsers.length === 2) {
      return `${filteredUsers[0]?.userName || "Someone"} and ${filteredUsers[1]?.userName || "someone"} are typing...`;
    } else {
      return `${filteredUsers[0]?.userName || "Someone"} and ${filteredUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div
      className={cn(
        "text-typography-sm flex items-center gap-2 rounded-ds-lg bg-muted/30 px-3 py-2 text-muted-foreground",
        "duration-300 animate-in fade-in-0 slide-in-from-bottom-2",
        className
      )}
    >
      {/* Animated typing dots */}
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-ds-full bg-primary [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-ds-full bg-primary [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-ds-full bg-primary" />
      </div>

      {/* Typing text */}
      <span className="text-tiny">{getTypingText()}</span>
    </div>
  );
}

// Widget-specific typing preview (smaller, different styling)
export function WidgetTypingPreview({ typingUsers, className }: TypingPreviewProps) {
  const agentUsers = typingUsers.filter((user: unknown) => user.userType === "agent");

  if (agentUsers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "text-typography-xs flex items-center gap-2 rounded bg-neutral-50 px-2 py-1 text-neutral-600",
        "duration-200 animate-in fade-in-0 slide-in-from-bottom-1",
        className
      )}
    >
      {/* Smaller animated dots for widget */}
      <div className="flex gap-0.5">
        <div className="h-1.5 w-1.5 animate-bounce rounded-ds-full bg-brand-blue-500 [animation-delay:-0.3s]" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-ds-full bg-brand-blue-500 [animation-delay:-0.15s]" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-ds-full bg-brand-blue-500" />
      </div>

      <span>Agent is typing...</span>
    </div>
  );
}
