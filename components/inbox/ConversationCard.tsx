"use client";

import { AIActivityIndicator, AIStatusBadge, type AIStatusData } from "@/components/ai/AIStatusIndicators";
import { Button } from "@/components/ui/Button-unified";
import { AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card } from "@/components/unified-ui/components/Card";
import { SlaTimerChip } from "@/components/unified-ui/components/SlaTimerChip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { getCustomerDisplayFromConversation } from "@/lib/utils/unified-customer-display";
import {
  Archive,
  CheckCircle,
  ChevronRight,
  Clock,
  Flag,
  Frown,
  Meh,
  MoreHorizontal,
  Smile,
  Star,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import React, { memo, useCallback, useState } from "react";

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

  // Improved AI status data
  aiStatus?: AIStatusData;
  isAITyping?: boolean;
  aiTypingMessage?: string;
}

interface ConversationCardProps {
  conversation: ConversationCardData;
  isSelected: boolean;
  onSelect: (conversation: ConversationCardData) => void;
  onBulkSelect?: (conversationId: string | number, selected: boolean) => void;
  isBulkSelectMode?: boolean;
}

// Status indicator colors based on urgency and priority
const getStatusColor = (conversation: ConversationCardData) => {
  if (conversation.urgency === "critical" || conversation.priority === "high") {
    return "bg-fl-destructive";
  }
  if (conversation.escalationRisk === "high") {
    return "bg-fl-warning";
  }
  if (conversation.aiEnabled) {
    return "bg-fl-info";
  }
  if (conversation.status === "open" || conversation.status === "assigned") {
    return "bg-fl-success";
  }
  return "bg-fl-muted";
};

// Sentiment icon component
const SentimentIcon = ({ sentiment }: { sentiment?: string }) => {
  switch (sentiment) {
    case "positive":
      return <Icon icon={Smile} className="h-3.5 w-3.5 text-fl-success" />;
    case "negative":
      return <Icon icon={Frown} className="text-fl-destructive h-3.5 w-3.5" />;
    case "neutral":
    case undefined:
    default:
      return <Icon icon={Meh} className="h-3.5 w-3.5 text-fl-text-subtle" />;
  }
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

  // Convert ConversationCardData to the format expected by getCustomerDisplayFromConversation
  const customerDisplay = getCustomerDisplayFromConversation({
    id: conversation.id.toString(),
    organizationId: "", // Required but not used in the function
    customerId: "", // Required but not used in the function
    customerEmail: conversation.email_from,
    customerName: null,
    subject: conversation.subject,
    status: conversation.status as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

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

  const handleQuickAction = useCallback(
    (action: string, e: React.MouseEvent) => {
      e.stopPropagation();
      // TODO: Implement quick actions
    },
    [conversation.id]
  );

  // Priority badge variant
  const getPriorityVariant = () => {
    switch (conversation.priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
      default:
        return "secondary";
    }
  };

  // Calculate response time display
  const getResponseTimeDisplay = () => {
    if (!conversation.responseTime) return null;
    const hours = Math.floor(conversation.responseTime / 60);
    const minutes = conversation.responseTime % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="group relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Status border indicator */}
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0 w-1 rounded-l-lg transition-all duration-200",
          getStatusColor(conversation),
          isHovered && "w-1.5"
        )}
      />

      <Card
        className={cn(
          "relative ml-1 cursor-pointer overflow-hidden p-0 transition-all duration-200 ease-out",
          "border border-fl-border hover:border-fl-border-strong",
          "hover:shadow-fl-shadow/5 hover:shadow-lg",
          "hover:translate-x-0.5",
          isSelected && ["border-fl-brand bg-fl-brand-subtle/50", "shadow-md shadow-fl-brand/10"],
          conversation.unread && "bg-fl-background-subtle/30"
        )}
        onClick={handleClick}
        data-testid={`conversation-card-${conversation.id}`}
      >
        <div className="spacing-3">
          {/* Header Section */}
          <div className="flex items-start gap-3">
            {/* Checkbox for bulk selection */}
            {isBulkSelectMode && (
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-fl-border text-fl-brand focus:ring-fl-brand"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Avatar with presence indicator */}
            <div className="relative flex-shrink-0">
              <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-ds-full ring-2 ring-fl-background">
                {customerDisplay.avatar && (
                  <AvatarImage src={customerDisplay.avatar} alt={customerDisplay.displayName} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-fl-brand to-fl-brand-hover font-semibold text-white">
                  {customerDisplay.displayName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </div>

              {/* Online indicator with pulse animation */}
              {conversation.isOnline && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative">
                    <div className="absolute inset-0 h-3.5 w-3.5 animate-ping rounded-ds-full bg-fl-success opacity-75" />
                    <div className="relative h-3.5 w-3.5 rounded-ds-full border-2 border-fl-background bg-fl-success" />
                  </div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Top row: Name, badges, time */}
              <div className="mb-1 flex items-start justify-between gap-ds-2">
                <div className="flex min-w-0 items-center gap-ds-2">
                  <h3 className="truncate font-semibold text-fl-text min-w-0">{customerDisplay.displayName}</h3>

                  {/* Customer badges */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {conversation.isVerified && <Icon icon={CheckCircle2} className="h-3.5 w-3.5 text-fl-info" />}
                    {conversation.tags.includes("VIP") && (
                      <Icon icon={Star} className="h-3.5 w-3.5 fill-fl-warning text-fl-warning" />
                    )}
                  </div>
                </div>

                {/* Time and quick actions */}
                <div className="flex flex-shrink-0 items-center gap-ds-2">
                  <span className="text-tiny text-fl-text-muted">
                    {conversation.lastMessageAt && !isNaN(new Date(conversation.lastMessageAt).getTime())
                      ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
                      : "Unknown"}
                  </span>

                  {/* Quick actions on hover */}
                  {isHovered && !isBulkSelectMode && (
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleQuickAction("star", e)}
                      >
                        <Icon icon={Star} className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleQuickAction("archive", e)}
                      >
                        <Icon icon={Archive} className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleQuickAction("more", e)}
                      >
                        <Icon icon={MoreHorizontal} className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject line */}
              {conversation.subject && (
                <h4 className="text-fl-text-primary mb-1 truncate text-sm font-medium min-w-0">{conversation.subject}</h4>
              )}

              {/* Message preview */}
              <p
                className={cn(
                  "text-typography-sm mb-2 line-clamp-2 min-w-0",
                  conversation.unread ? "font-medium text-fl-text" : "text-fl-text-muted"
                )}
              >
                {conversation.preview || <span className="italic text-fl-text-subtle">No preview available</span>}
              </p>

              {/* AI typing indicator */}
              {conversation.isAITyping && (
                <AIActivityIndicator
                  isActive={true}
                  message={conversation.aiTypingMessage || "AI is responding..."}
                  className="mb-2"
                />
              )}

              {/* Bottom section: Tags, status, metadata */}
              <div className="flex items-center justify-between">
                {/* Left side: Status badges and tags */}
                <div className="flex min-w-0 items-center gap-ds-2">
                  {/* Priority indicator */}
                  {conversation.priority !== "low" && (
                    <Badge variant={getPriorityVariant()} size="sm" className="flex items-center gap-1 max-w-[70px] overflow-hidden text-ellipsis">
                      <Icon icon={Flag} className="h-2.5 w-2.5" />
                      <span className="truncate">{conversation.priority}</span>
                    </Badge>
                  )}

                  {/* Improved AI status */}
                  {conversation.aiStatus ? (
                    <AIStatusBadge aiData={conversation.aiStatus} variant="compact" showConfidence={true} />
                  ) : conversation.aiEnabled ? (
                    <Badge variant="info" size="sm" className="flex items-center gap-1 max-w-[70px] overflow-hidden text-ellipsis">
                      <Icon icon={Zap} className="h-2.5 w-2.5" />
                      <span className="truncate">AI</span>
                    </Badge>
                  ) : conversation.assignedTo ? (
                    <Badge variant="success" size="sm" className="flex items-center gap-1 max-w-[70px] overflow-hidden text-ellipsis">
                      <Icon icon={User} className="h-2.5 w-2.5" />
                      <span className="truncate">Human</span>
                    </Badge>
                  ) : (
                    <Badge variant="info" size="sm" className="bg-brand-blue-500 text-white max-w-[70px] overflow-hidden text-ellipsis">
                      <span className="truncate">Open</span>
                    </Badge>
                  )}

                  {/* Escalation risk */}
                  {conversation.escalationRisk === "high" && (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1 max-w-[70px] overflow-hidden text-ellipsis">
                      <Icon icon={TrendingUp} className="h-2.5 w-2.5" />
                      <span className="truncate">Risk</span>
                    </Badge>
                  )}

                  {/* Tags (limited to 2) */}
                  {conversation.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" size="sm" className="text-fl-text-subtle max-w-[70px] overflow-hidden text-ellipsis">
                      <span className="truncate">{tag}</span>
                    </Badge>
                  ))}

                  {conversation.tags.length > 2 && (
                    <span className="text-tiny text-fl-text-subtle">+{conversation.tags.length - 2}</span>
                  )}
                </div>

                {/* Right side: Metadata */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  {/* Sentiment indicator */}
                  <SentimentIcon {...(conversation.sentiment && { sentiment: conversation.sentiment })} />

                  {/* Response time */}
                  {conversation.responseTime && (
                    <div className="flex items-center gap-1 text-tiny text-fl-text-subtle">
                      <Icon icon={Clock} className="h-3 w-3" />
                      {getResponseTimeDisplay()}
                    </div>
                  )}

                  {/* Unread indicator */}
                  {conversation.unread && <div className="h-2 w-2 rounded-ds-full bg-fl-brand" />}
                </div>
              </div>
            </div>
          </div>

          {/* Hover state: Additional information */}
          {isHovered && !isBulkSelectMode && (
            <div
              className={cn(
                "mt-3 border-t border-fl-border/50 pt-3",
                "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between text-tiny text-fl-text-muted">
                {/* Customer location and time */}
                {conversation.customer && (
                  <div className="flex items-center gap-3">
                    {conversation.customer.location && <span>{conversation.customer.location}</span>}
                    {conversation.customer.localTime && <span>Local: {conversation.customer.localTime}</span>}
                  </div>
                )}

                {/* View conversation hint */}
                <div className="flex items-center gap-1">
                  <span>View conversation</span>
                  <Icon icon={ChevronRight} className="h-3 w-3" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SLA timer for critical conversations */}
        {conversation.urgency === "critical" && (
          <div className="absolute right-2 top-2">
            <SlaTimerChip
              conversationId={conversation.id.toString()}
              conversationStatus={
                conversation.status === "escalated"
                  ? "pending"
                  : conversation.status === "assigned"
                    ? "active"
                    : conversation.status === "waiting"
                      ? "pending"
                      : conversation.status
              }
              lastMessageAt={conversation.lastMessageAt}
            />
          </div>
        )}
      </Card>
    </div>
  );
});

ConversationCard.displayName = "ConversationCard";
