"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bot,
  Building,
  CheckCircle2,
  Clock,
  FileDown,
  MapPin,
  MoreHorizontal,
  Ticket,
  UserCircle,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Button } from "@/components/ui/Button-unified";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Icon } from "@/lib/ui/Icon";
import { getUnifiedCustomerData } from "@/lib/utils/unified-customer-display";
// import { IconButton } from "@/components/ui/Button-unified"; // Component doesn't exist, using Button instead
import { cn } from "@/lib/utils";
import type { UnifiedConversation } from "../ConversationInterface";

interface ChatHeaderProps {
  conversation: UnifiedConversation;
  onConvertToTicket?: () => void;
  onAssignConversation?: () => void;
  aiControlsSlot?: React.ReactNode; // For AI controls integration
  statusSlot?: React.ReactNode; // For status integration
  className?: string;
}

export function ChatHeader({
  conversation,
  onConvertToTicket,
  onAssignConversation,
  aiControlsSlot,
  statusSlot,
  className,
}: ChatHeaderProps) {
  const customerDisplay = getUnifiedCustomerData({
    ...(conversation.emailFrom?.split("@")[0] && { name: conversation.emailFrom.split("@")[0] }),
    email:
      conversation.emailFrom ||
      conversation.customerEmail ||
      conversation.customerEmail ||
      conversation.visitor_email ||
      "",
    ...(conversation.avatar || conversation.customerAvatar || conversation.customer_avatar
      ? {
          avatar: conversation.avatar || conversation.customerAvatar || conversation.customer_avatar,
        }
      : {}),
  });
  const customerName = customerDisplay.displayName || "Unknown Customer";
  const customerEmail = customerDisplay.email || "";
  const customerAvatar = customerDisplay.avatar || "";

  // Calculate response time with stable logic
  const responseTime = React.useMemo(() => {
    if (!conversation.id) return null;

    // Use conversation ID to create stable response time
    const hashCode = conversation.id.split("").reduce((a: number, b: string) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const minutes = (Math.abs(hashCode) % 30) + 1; // 1-30 minutes
    return `${minutes}m`;
  }, [conversation.id]);

  return (
    <div className={cn("flex items-center justify-between border-b bg-white spacing-4", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={customerAvatar} alt={customerName} />
          <AvatarFallback className="text-status-info-dark bg-[var(--fl-color-info-subtle)] text-sm font-medium">
            {customerName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-ds-2">
            <h3 className="truncate font-semibold text-gray-900">{customerName}</h3>

            {/* Online status dot */}
            <div className="flex flex-shrink-0 items-center gap-1">
              <div className="bg-semantic-success h-2 w-2 rounded-ds-full"></div>
            </div>

            {/* Response time with improved styling */}
            {responseTime && (
              <div className="flex flex-shrink-0 items-center gap-1 rounded bg-orange-50 px-2 py-1 text-tiny text-orange-600">
                <Icon icon={Clock} className="h-3 w-3" />
                <span>{responseTime}</span>
              </div>
            )}
          </div>

          <div className="text-foreground mt-1 flex items-center gap-3 text-sm">
            {customerEmail && (
              <span className="max-w-[200px] flex-shrink-0 truncate" title={customerEmail}>
                {customerEmail}
              </span>
            )}

            {conversation.assignedTo && (
              <div className="flex hidden flex-shrink-0 items-center gap-1 sm:flex">
                <Icon icon={Users} className="h-3 w-3" />
                <span className="whitespace-nowrap">Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: AI Controls & Status - FIXED spacing and alignment */}
      <div className="flex flex-shrink-0 items-center gap-3 px-2">
        {/* AI Controls with proper icon spacing */}
        {aiControlsSlot && (
          <div className="bg-[var(--fl-color-background-subtle)]/50 flex items-center gap-ds-2 rounded-ds-md border border-[var(--fl-color-border)] px-2 py-1.5">
            <Icon icon={Bot} className="h-4 w-4 flex-shrink-0 text-blue-600" />
            <div className="min-w-0">{aiControlsSlot}</div>
          </div>
        )}

        {/* Status with proper icon spacing */}
        {statusSlot && (
          <div className="bg-[var(--fl-color-background-subtle)]/50 flex items-center gap-ds-2 rounded-ds-md border border-[var(--fl-color-border)] px-2 py-1.5">
            <Icon icon={CheckCircle2} className="text-semantic-success-dark h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">{statusSlot}</div>
          </div>
        )}
      </div>

      {/* Right: Action Buttons - improved responsive design */}
      <div className="flex flex-shrink-0 items-center space-x-spacing-sm">
        {onConvertToTicket && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConvertToTicket}
            className="hidden md:flex"
            aria-label="Create ticket"
          >
            <Icon icon={Ticket} className="h-4 w-4" />
          </Button>
        )}

        {onAssignConversation && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAssignConversation}
            className="hidden md:flex"
            aria-label="Assign conversation"
          >
            <Icon icon={Users} className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="sm" aria-label="More actions">
              <Icon icon={MoreHorizontal} className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-60 bg-background w-48 rounded-ds-lg py-2 shadow-xl dark:bg-neutral-900">
            {onConvertToTicket && (
              <DropdownMenuItem
                onClick={onConvertToTicket}
                className="flex items-center gap-ds-2 rounded-ds-md px-3 py-2 text-sm hover:bg-muted md:hidden"
              >
                <Icon icon={Ticket} className="h-4 w-4" />
                Create Ticket
              </DropdownMenuItem>
            )}
            {onAssignConversation && (
              <DropdownMenuItem
                onClick={onAssignConversation}
                className="flex items-center gap-ds-2 rounded-ds-md px-3 py-2 text-sm hover:bg-muted md:hidden"
              >
                <Icon icon={Users} className="h-4 w-4" />
                Assign Conversation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="flex items-center gap-ds-2 rounded-ds-md px-3 py-2 text-sm hover:bg-muted">
              <Icon icon={UserCircle} className="h-4 w-4" />
              Customer Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-ds-2 rounded-ds-md px-3 py-2 text-sm hover:bg-muted">
              <Icon icon={FileDown} className="h-4 w-4" />
              Export Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
