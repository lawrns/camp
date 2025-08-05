"use client";

import { CheckCircle, Clock, Eye, EyeSlash, Zap, Pause, Play, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export type StatusType =
  | "online"
  | "offline"
  | "active"
  | "inactive"
  | "error"
  | "warning"
  | "success"
  | "pending"
  | "paused"
  | "running"
  | "visible"
  | "hidden";

export type StatusSize = "small" | "medium" | "large";
export type StatusMode = "dot" | "badge" | "pill";

interface StatusIndicatorProps {
  status: StatusType;
  size?: StatusSize;
  mode?: StatusMode;
  label?: string;
  animated?: boolean;
  className?: string;
  showIcon?: boolean;
  customColor?: string;
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)] dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
    label: "Online",
  },
  offline: {
    color: "bg-gray-400",
    badgeVariant: "secondary" as const,
    badgeClass: "bg-[var(--fl-color-surface)] text-[var(--fl-color-text)] dark:bg-gray-800 dark:text-gray-300",
    icon: XCircle,
    label: "Offline",
  },
  active: {
    color: "bg-blue-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-primary-subtle)] text-[var(--fl-color-primary)] dark:bg-blue-900 dark:text-blue-300",
    icon: Play,
    label: "Active",
  },
  inactive: {
    color: "bg-gray-400",
    badgeVariant: "secondary" as const,
    badgeClass: "bg-[var(--fl-color-surface)] text-[var(--fl-color-text)] dark:bg-gray-800 dark:text-gray-300",
    icon: Pause,
    label: "Inactive",
  },
  error: {
    color: "bg-red-500",
    badgeVariant: "destructive" as const,
    badgeClass: "bg-[var(--fl-color-danger-subtle)] text-[var(--fl-color-danger)] dark:bg-red-900 dark:text-red-300",
    icon: XCircle,
    label: "Error",
  },
  warning: {
    color: "bg-yellow-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] dark:bg-yellow-900 dark:text-yellow-300",
    icon: AlertTriangle,
    label: "Warning",
  },
  success: {
    color: "bg-green-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)] dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
    label: "Success",
  },
  pending: {
    color: "bg-yellow-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] dark:bg-yellow-900 dark:text-yellow-300",
    icon: Clock,
    label: "Pending",
  },
  paused: {
    color: "bg-orange-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    icon: Pause,
    label: "Paused",
  },
  running: {
    color: "bg-green-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)] dark:bg-green-900 dark:text-green-300",
    icon: Zap,
    label: "Running",
  },
  visible: {
    color: "bg-blue-500",
    badgeVariant: "default" as const,
    badgeClass: "bg-[var(--fl-color-primary-subtle)] text-[var(--fl-color-primary)] dark:bg-blue-900 dark:text-blue-300",
    icon: Eye,
    label: "Visible",
  },
  hidden: {
    color: "bg-gray-400",
    badgeVariant: "secondary" as const,
    badgeClass: "bg-[var(--fl-color-surface)] text-[var(--fl-color-text)] dark:bg-gray-800 dark:text-gray-300",
    icon: EyeSlash,
    label: "Hidden",
  },
};

const sizeConfig = {
  small: {
    dot: "w-2 h-2",
    badge: "text-xs px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]",
    icon: "w-3 h-3",
  },
  medium: {
    dot: "w-3 h-3",
    badge: "text-sm px-2.5 py-1.5",
    icon: "w-4 h-4",
  },
  large: {
    dot: "w-4 h-4",
    badge: "text-base px-3 py-2",
    icon: "w-5 h-5",
  },
};

export function StatusIndicator({
  status,
  size = "medium",
  mode = "dot",
  label,
  animated = false,
  className,
  showIcon = false,
  customColor,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const displayLabel = label || config.label;

  if (mode === "dot") {
    return (
      <div className={cn("flex items-center gap-[var(--fl-spacing-2)] whitespace-nowrap", className)}>
        <div
          className={cn("rounded-ds-full flex-shrink-0", customColor || config.color, sizeStyles.dot, animated && "animate-pulse")}
          aria-label={displayLabel}
        />
        {label && <span className="text-sm text-muted-foreground truncate">{displayLabel}</span>}
      </div>
    );
  }

  if (mode === "badge") {
    return (
      <Badge
        variant={config.badgeVariant}
        className={cn(config.badgeClass, sizeStyles.badge, "flex items-center gap-[var(--fl-spacing-1)] whitespace-nowrap", className)}
      >
        {showIcon && <Icon icon={config.icon} className={cn(sizeStyles.icon, "flex-shrink-0")} />}
        <span className="truncate">{displayLabel}</span>
      </Badge>
    );
  }

  if (mode === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-[var(--fl-spacing-2)] rounded-ds-full px-[var(--fl-spacing-3)] py-[var(--fl-spacing-1)] whitespace-nowrap",
          config.badgeClass,
          sizeStyles.badge,
          className
        )}
      >
        <div className={cn("rounded-ds-full flex-shrink-0", customColor || config.color, sizeStyles.dot, animated && "animate-pulse")} />
        {showIcon && <Icon icon={config.icon} className={cn(sizeStyles.icon, "flex-shrink-0")} />}
        <span className="truncate">{displayLabel}</span>
      </div>
    );
  }

  return null;
}

// Preset components for common use cases
export function OnlineStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="online" />;
}

export function OfflineStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="offline" />;
}

export function ActiveStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="active" />;
}

export function ErrorStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="error" />;
}

export function SuccessStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="success" />;
}

export function PendingStatus(props: Omit<StatusIndicatorProps, "status">) {
  return <StatusIndicator {...props} status="pending" animated />;
}

// Animated status for real-time updates
export function LiveStatus(props: Omit<StatusIndicatorProps, "animated">) {
  return <StatusIndicator {...props} animated />;
}

// Status with automatic color based on boolean
export function BooleanStatus({
  value,
  trueStatus = "success",
  falseStatus = "error",
  ...props
}: Omit<StatusIndicatorProps, "status"> & {
  value: boolean;
  trueStatus?: StatusType;
  falseStatus?: StatusType;
}) {
  return <StatusIndicator {...props} status={value ? trueStatus : falseStatus} />;
}
