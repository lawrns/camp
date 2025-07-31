"use client";

import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Tag, Robot, User } from "@phosphor-icons/react";
import * as React from "react";

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
  // Unified color system for status badges
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          icon: Tag,
          label: "Open"
        };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
          icon: Tag,
          label: "Pending"
        };
      case "resolved":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: Tag,
          label: "Resolved"
        };
      case "escalated":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          icon: Tag,
          label: "Escalated"
        };
      case "ai":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          border: "border-purple-200",
          icon: Robot,
          label: "AI"
        };
      case "human":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: User,
          label: "Human"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: Tag,
          label: status
        };
    }
  };

  // Priority color system
  const getPriorityConfig = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200"
        };
      case "high":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          border: "border-orange-200"
        };
      case "medium":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200"
        };
      case "low":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200"
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const priorityConfig = getPriorityConfig(priority);

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