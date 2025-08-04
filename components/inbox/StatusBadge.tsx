"use client";

import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Tag, Robot, User } from "@phosphor-icons/react";
import * as React from "react";
import { getStatusColors, getPriorityColors, getCompleteColorClasses } from "@/lib/design-system/accessibility-colors";
import {
  ConversationStatus,
  ConversationPriority,
  AIHandoverStatus,
  getStatusConfig,
  getPriorityConfig,
  getAIHandoverConfig,
} from "@/lib/constants/conversation-enums";

interface StatusBadgeProps {
  status: string;
  priority?: string;
  variant?: "default" | "compact" | "header";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

/**
 * Unified status badge component with consistent colors across all inbox components
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  variant = "default",
  size = "sm",
  className,
  showIcon = true,
}) => {
  // WCAG AA compliant color system using enums
  const getStatusConfiguration = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    // Check if it's an AI handover status
    if (normalizedStatus === AIHandoverStatus.AI_ACTIVE || normalizedStatus === "ai") {
      const config = getAIHandoverConfig(AIHandoverStatus.AI_ACTIVE);
      return {
        bg: config.colors.background,
        text: config.colors.text,
        border: config.colors.border,
        icon: Robot,
        label: config.label
      };
    }

    if (normalizedStatus === AIHandoverStatus.HUMAN_ACTIVE || normalizedStatus === "human") {
      const config = getAIHandoverConfig(AIHandoverStatus.HUMAN_ACTIVE);
      return {
        bg: config.colors.background,
        text: config.colors.text,
        border: config.colors.border,
        icon: User,
        label: config.label
      };
    }

    // Handle regular conversation statuses
    const config = getStatusConfig(normalizedStatus);
    return {
      bg: config.colors.background,
      text: config.colors.text,
      border: config.colors.border,
      icon: Tag,
      label: config.label
    };
  };

  // Priority color system using enums
  const getPriorityConfiguration = (priority?: string) => {
    if (!priority) {
      return {
        bg: "bg-gray-50",
        text: "text-gray-900",
        border: "border-gray-200"
      };
    }

    const config = getPriorityConfig(priority.toLowerCase());
    return {
      bg: config.colors.background,
      text: config.colors.text,
      border: config.colors.border
    };
  };

  const statusConfig = getStatusConfiguration(status);
  const priorityConfig = getPriorityConfiguration(priority);

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  // Variant classes
  const variantClasses = {
    default: "rounded-full border",
    compact: "rounded-md",
    header: "rounded-full border"
  };

  const baseClasses = cn(
    "inline-flex items-center gap-1 font-medium transition-colors",
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  return (
    <div className="flex items-center gap-1">
      {/* Status Badge */}
      <span
        className={cn(
          baseClasses,
          statusConfig.bg,
          statusConfig.text,
          variant === "default" && statusConfig.border
        )}
      >
        {showIcon && statusConfig.icon && (
          <Icon icon={statusConfig.icon} className="h-3 w-3" />
        )}
        {statusConfig.label}
      </span>

      {/* Priority Badge (if provided) */}
      {priority && (
        <span
          className={cn(
            baseClasses,
            priorityConfig.bg,
            priorityConfig.text,
            variant === "default" && priorityConfig.border
          )}
        >
          {priority}
        </span>
      )}
    </div>
  );
};

export default StatusBadge; 