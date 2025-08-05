"use client";

import React, { useState } from "react";
import { AlertTriangle as AlertCircle, CheckCircle, ChevronDown as ChevronDown, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

type ConversationStatus = "open" | "in_progress" | "resolved" | "closed";

interface ConversationStatusDropdownProps {
  currentStatus: ConversationStatus;
  conversationId: string;
  onStatusChange?: (newStatus: ConversationStatus, reason?: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig = {
  open: {
    label: "Open",
    icon: AlertCircle,
    color: "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)] border-[var(--fl-color-success-muted)]",
    description: "Active conversation",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] border-[var(--fl-color-warning-muted)]",
    description: "Being worked on",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    color: "bg-[var(--fl-color-primary-subtle)] text-[var(--fl-color-primary)] border-[var(--fl-color-info-muted)]",
    description: "Issue resolved",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    color: "bg-[var(--fl-color-surface)] text-[var(--fl-color-text)] border-[var(--fl-color-border)]",
    description: "Conversation closed",
  },
};

export function ConversationStatusDropdown({
  currentStatus,
  conversationId,
  onStatusChange,
  disabled = false,
  size = "md",
  className,
}: ConversationStatusDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Map legacy status values to expected values
  const normalizeStatus = (status: string): ConversationStatus => {
    switch (status) {
      case "active":
        return "open";
      case "queued":
        return "in_progress";
      case "closed":
        return "closed";
      default:
        return status as ConversationStatus;
    }
  };

  const normalizedStatus = normalizeStatus(currentStatus);
  const currentConfig = statusConfig[normalizedStatus] || statusConfig.open;
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (newStatus === currentStatus || isLoading) return;

    setIsLoading(true);
    try {
      // Call the conversation status API
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reason: `Status changed from ${currentStatus} to ${newStatus}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const data = await response.json();

      // Call the callback if provided
      onStatusChange?.(newStatus, `Status changed from ${currentStatus} to ${newStatus}`);
    } catch (error) {
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "text-xs px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]",
    md: "text-sm px-[var(--fl-spacing-3)] py-[var(--fl-spacing-1)].5",
    lg: "text-base px-4 py-2",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isLoading}
        className={cn(
          "gap-[var(--fl-spacing-2)] border transition-all hover:shadow-sm",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          currentConfig.color,
          sizeClasses[size],
          isLoading && "cursor-not-allowed opacity-50",
          className
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <CurrentIcon className={cn(size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
        <span className="font-medium">{currentConfig.label}</span>
        <Icon icon={ChevronDown} className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4", "opacity-50")} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="z-60 bg-background w-48 rounded-ds-lg py-2 shadow-xl dark:bg-neutral-900">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const isSelected = status === currentStatus;

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status as ConversationStatus)}
              disabled={isSelected || isLoading}
              className={cn(
                "text-typography-sm flex cursor-pointer items-center gap-3 rounded-ds-md px-3 py-2 hover:bg-muted",
                isSelected && "cursor-default bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{config.label}</div>
                <div className="text-tiny text-muted-foreground">{config.description}</div>
              </div>
              {isSelected && (
                <Badge variant="secondary" className="text-tiny rounded-full">
                  Current
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ConversationStatusDropdown;
