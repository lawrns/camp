"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  CheckCircle,
  Clock,
  Flag,
  Frown,
  Meh,
  MoreHorizontal,
  Smile,
  Star,
  TrendingUp,
  User,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import React, { memo, useCallback, useState, useMemo } from "react";

// Local type that extends the entity Conversation type with UI-specific fields
interface ConversationCardData {
  id: string | number;
  email_from: string;
  subject: string;
  preview: string;
  status: "open" | "assigned" | "escalated" | "waiting" | "closed";
  lastMessageAt: string;
  unread: boolean;
  priority: "high" | "medium" | "low";
  tags: string[];
  avatar?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  assignedTo?: string;
  aiEnabled?: boolean;
  customer?: {
    location?: string;
    localTime?: string;
  };
  urgency?: "critical" | "high" | "normal" | "low";
  sentiment?: "positive" | "neutral" | "negative";
  responseTime?: number;
  escalationRisk?: "high" | "medium" | "low";
}

interface ConversationCardProps {
  conversation: ConversationCardData;
  isSelected: boolean;
  onSelect: (conversation: ConversationCardData) => void;
  onBulkSelect?: (conversationId: string | number, selected: boolean) => void;
  isBulkSelectMode?: boolean;
}

// Simple class name utility function
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Memoized status color function for performance
const getStatusColor = (conversation: ConversationCardData) => {
  switch (conversation.status) {
    case "open":
      return "bg-green-500";
    case "assigned":
      return "bg-blue-500";
    case "escalated":
      return "bg-red-500";
    case "waiting":
      return "bg-yellow-500";
    case "closed":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

// Memoized sentiment icon component
const SentimentIcon = memo(({ sentiment }: { sentiment?: string }) => {
  if (sentiment === "positive") {
    return <Smile className="h-3.5 w-3.5 text-green-600" aria-label="Positive sentiment" />;
  } else if (sentiment === "negative") {
    return <Frown className="h-3.5 w-3.5 text-red-600" aria-label="Negative sentiment" />;
  } else {
    return <Meh className="h-3.5 w-3.5 text-gray-600" aria-label="Neutral sentiment" />;
  }
});

SentimentIcon.displayName = "SentimentIcon";

// Helper function to get customer display name
const getCustomerDisplay = (email: string) => {
  const name = email.split('@')[0];
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    initials: name.substring(0, 2).toUpperCase(),
  };
};

export const ConversationCard = memo(function ConversationCard({
  conversation,
  isSelected,
  onSelect,
  onBulkSelect,
  isBulkSelectMode = false,
}: ConversationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Memoized customer display data
  const customerDisplay = useMemo(() => {
    return getCustomerDisplay(conversation.email_from);
  }, [conversation.email_from]);

  // Memoized event handlers for performance
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isBulkSelectMode) {
        e.preventDefault();
        setIsChecked(!isChecked);
        onBulkSelect?.(conversation.id, !isChecked);
      } else {
        onSelect(conversation);
      }
    },
    [conversation, onSelect, isBulkSelectMode, isChecked, onBulkSelect]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      setIsChecked(e.target.checked);
      onBulkSelect?.(conversation.id, e.target.checked);
    },
    [conversation.id, onBulkSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick(e as unknown);
      }
    },
    [handleClick]
  );

  const handleQuickAction = useCallback(
    (action: string, e: React.MouseEvent) => {
      e.stopPropagation();
      console.log(`Quick action ${action} for conversation ${conversation.id}`);
      // Quick actions will be implemented when action system is ready
    },
    [conversation.id]
  );

  // Memoized priority badge variant
  const priorityVariant = useMemo(() => {
    switch (conversation.priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
      default:
        return "secondary";
    }
  }, [conversation.priority]);

  // Memoized response time display
  const responseTimeDisplay = useMemo(() => {
    if (!conversation.responseTime) return null;
    const hours = Math.floor(conversation.responseTime / 60);
    const minutes = conversation.responseTime % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [conversation.responseTime]);

  // Memoized time ago display
  const timeAgoDisplay = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  }, [conversation.lastMessageAt]);

  return (
    <div 
      className="group relative" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status border indicator */}
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0 w-1 rounded-l-lg transition-all duration-200",
          getStatusColor(conversation),
          isHovered && "w-1.5"
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative ml-1 cursor-pointer overflow-hidden p-0 transition-all duration-200 ease-out",
          "border border-gray-200 rounded-lg bg-white hover:border-gray-300",
          "hover:shadow-md",
          "hover:translate-x-0.5",
          isSelected && "border-blue-500 bg-blue-50 shadow-md",
          conversation.unread && "bg-gray-50"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Conversation with ${customerDisplay.name} - ${conversation.subject}`}
        aria-pressed={isSelected}
        data-testid={`conversation-card-${conversation.id}`}
      >
        <div className="p-3">
          {/* Header Section */}
          <div className="flex items-start gap-3">
            {/* Bulk selection checkbox */}
            {isBulkSelectMode && (
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select conversation with ${customerDisplay.name}`}
              />
            )}

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  {conversation.avatar ? (
                    <AvatarImage src={conversation.avatar} alt={customerDisplay.name} />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      {customerDisplay.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Online status indicator */}
                {conversation.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top row: Name, time, actions */}
              <div className="flex items-start justify-between gap-[var(--fl-spacing-2)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[var(--fl-spacing-2)]">
                    <h4 className="truncate text-sm font-medium text-gray-900">
                      {customerDisplay.name}
                    </h4>
                    {conversation.isVerified && (
                      <CheckCircle className="h-3.5 w-3.5 text-blue-600" aria-label="Verified customer" />
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {timeAgoDisplay}
                  </p>
                </div>

                {/* Quick actions */}
                {isHovered && !isBulkSelectMode && (
                  <div className="flex items-center gap-[var(--fl-spacing-1)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleQuickAction("star", e)}
                      aria-label="Star conversation"
                      className="h-6 w-6 p-0"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleQuickAction("flag", e)}
                      aria-label="Flag conversation"
                      className="h-6 w-6 p-0"
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleQuickAction("more", e)}
                      aria-label="More options"
                      className="h-6 w-6 p-0"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <h5 className="mt-1 truncate text-sm font-medium text-gray-900">
                {conversation.subject}
              </h5>

              {/* Preview */}
              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                {conversation.preview}
              </p>

              {/* Bottom row: Badges and metadata */}
              <div className="mt-2 flex items-center justify-between gap-[var(--fl-spacing-2)]">
                {/* Left side: Badges */}
                <div className="flex flex-wrap items-center gap-[var(--fl-spacing-1)]">
                  {/* Priority badge */}
                  <Badge variant={priorityVariant} className="text-xs rounded-full">
                    {conversation.priority}
                  </Badge>

                  {/* Status badge */}
                  {conversation.status === "assigned" ? (
                    <Badge variant="default" className="bg-blue-500 text-white text-xs rounded-full">
                      Human
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500 text-white text-xs rounded-full">
                      Open
                    </Badge>
                  )}

                  {/* Escalation risk */}
                  {conversation.escalationRisk === "high" && (
                    <Badge variant="destructive" className="flex items-center gap-[var(--fl-spacing-1)] text-xs rounded-full">
                      <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                      Risk
                    </Badge>
                  )}

                  {/* Tags (limited to 2) */}
                  {conversation.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs rounded-full">
                      {tag}
                    </Badge>
                  ))}

                  {conversation.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{conversation.tags.length - 2}</span>
                  )}
                </div>

                {/* Right side: Metadata */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  {/* Sentiment indicator */}
                  <SentimentIcon sentiment={conversation.sentiment} />

                  {/* Response time */}
                  {conversation.responseTime && (
                    <div className="flex items-center gap-[var(--fl-spacing-1)] text-xs text-gray-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>{responseTimeDisplay}</span>
                    </div>
                  )}

                  {/* Unread indicator */}
                  {conversation.unread && (
                    <div 
                      className="h-2 w-2 rounded-full bg-blue-600" 
                      aria-label="Unread messages"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hover state: Additional information */}
          {isHovered && !isBulkSelectMode && (
            <div
              className={cn(
                "mt-3 border-t border-gray-200 pt-3",
                "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                {/* Customer location and time */}
                {conversation.customer && (
                  <div className="flex items-center gap-3">
                    {conversation.customer.location && <span>{conversation.customer.location}</span>}
                    {conversation.customer.localTime && <span>Local: {conversation.customer.localTime}</span>}
                  </div>
                )}

                {/* View conversation hint */}
                <div className="flex items-center gap-[var(--fl-spacing-1)]">
                  <span>View conversation</span>
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ConversationCard.displayName = "ConversationCard";
