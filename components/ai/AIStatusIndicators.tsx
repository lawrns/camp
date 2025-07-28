// components/ai/AIStatusIndicators.tsx
"use client";

import React from "react";
import {
  Activity,
  Warning as AlertTriangle,
  Brain,
  CheckCircle as CheckCircle2,
  Clock,
  Eye,
  Spinner as Loader2,
  ChatCircle as MessageSquare,
  Pause,
  Play,
  Shield,
  Sparkle as Sparkles,
  Target,
  ThumbsUp,
  TrendUp as TrendingUp,
  User,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export type AIStatus =
  | "active" // AI is actively responding
  | "monitoring" // AI is monitoring but not responding
  | "learning" // AI is learning from conversation
  | "paused" // AI is paused/disabled
  | "escalated" // Escalated to human
  | "reviewing" // AI is reviewing for quality
  | "confident" // AI is confident in responses
  | "uncertain" // AI needs human oversight
  | "training" // AI is being trained on this conversation
  | "idle"; // No AI activity

export type AIConfidenceLevel = "high" | "medium" | "low";
export type AIMode = "autonomous" | "assisted" | "supervised" | "disabled";

export interface AIStatusData {
  status: AIStatus;
  mode: AIMode;
  confidence?: AIConfidenceLevel;
  lastActivity?: Date;
  responseCount?: number;
  accuracy?: number;
  interventionNeeded?: boolean;
  learningData?: {
    interactionsToday: number;
    improvementScore: number;
  };
}

interface AIStatusIndicatorProps {
  status: AIStatus;
  mode?: AIMode;
  confidence?: AIConfidenceLevel | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
}

interface AIStatusBadgeProps {
  aiData: AIStatusData;
  variant?: "compact" | "detailed" | "minimal";
  showConfidence?: boolean;
  showActivity?: boolean;
  className?: string;
}

interface AIConfidenceIndicatorProps {
  confidence: AIConfidenceLevel;
  accuracy?: number | undefined;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Get status configuration
const getStatusConfig = (status: AIStatus) => {
  const configs = {
    active: {
      icon: Brain,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-[var(--fl-color-success-muted)]",
      label: "AI Active",
      variant: "success" as const,
      animated: true,
    },
    monitoring: {
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-[var(--fl-color-border-interactive)]",
      label: "Monitoring",
      variant: "info" as const,
      animated: true,
    },
    learning: {
      icon: Sparkles,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      label: "Learning",
      variant: "secondary" as const,
      animated: true,
    },
    paused: {
      icon: Pause,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-[var(--fl-color-border-strong)]",
      label: "Paused",
      variant: "secondary" as const,
      animated: false,
    },
    escalated: {
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
      label: "Escalated",
      variant: "warning" as const,
      animated: false,
    },
    reviewing: {
      icon: CheckCircle2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-300",
      label: "Reviewing",
      variant: "info" as const,
      animated: true,
    },
    confident: {
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-300",
      label: "Confident",
      variant: "success" as const,
      animated: false,
    },
    uncertain: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-[var(--fl-color-warning-muted)]",
      label: "Needs Review",
      variant: "warning" as const,
      animated: true,
    },
    training: {
      icon: Activity,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      borderColor: "border-teal-300",
      label: "Training",
      variant: "info" as const,
      animated: true,
    },
    idle: {
      icon: Clock,
      color: "text-[var(--fl-color-text-muted)]",
      bgColor: "bg-[var(--fl-color-background-subtle)]",
      borderColor: "border-[var(--fl-color-border)]",
      label: "Idle",
      variant: "secondary" as const,
      animated: false,
    },
  };

  return configs[status] || configs.idle;
};

// Get mode configuration
const getModeConfig = (mode: AIMode) => {
  const configs = {
    autonomous: {
      icon: Zap,
      label: "Autonomous",
      color: "text-green-600",
      description: "AI handling independently",
    },
    assisted: {
      icon: User,
      label: "Assisted",
      color: "text-blue-600",
      description: "AI + Human collaboration",
    },
    supervised: {
      icon: Shield,
      label: "Supervised",
      color: "text-orange-600",
      description: "Human oversight required",
    },
    disabled: {
      icon: Pause,
      label: "Disabled",
      color: "text-[var(--fl-color-text-muted)]",
      description: "AI features disabled",
    },
  };

  return configs[mode] || configs.disabled;
};

// Get confidence configuration
const getConfidenceConfig = (confidence: AIConfidenceLevel) => {
  const configs = {
    high: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-[var(--fl-color-success-muted)]",
      label: "High",
      variant: "success" as const,
      percentage: ">85%",
    },
    medium: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-[var(--fl-color-warning-muted)]",
      label: "Medium",
      variant: "warning" as const,
      percentage: "60-85%",
    },
    low: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-[var(--fl-color-danger-muted)]",
      label: "Low",
      variant: "error" as const,
      percentage: "<60%",
    },
  };

  return configs[confidence];
};

// Simple status indicator component
export function AIStatusIndicator({
  status,
  mode,
  confidence,
  size = "md",
  showLabel = false,
  animated = true,
  className,
}: AIStatusIndicatorProps) {
  const statusConfig = getStatusConfig(status);
  const IconComponent = statusConfig.icon;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-ds-full spacing-1",
          statusConfig.bgColor,
          statusConfig.borderColor,
          "border",
          animated && statusConfig.animated && "animate-pulse"
        )}
      >
        <IconComponent className={cn(sizeClasses[size], statusConfig.color)} />
      </div>

      {showLabel && (
        <span className={cn("text-typography-xs font-medium", statusConfig.color)}>{statusConfig.label}</span>
      )}
    </div>
  );
}

// Confidence indicator component
export function AIConfidenceIndicator({
  confidence,
  accuracy,
  showPercentage = false,
  size = "md",
  className,
}: AIConfidenceIndicatorProps) {
  const config = getConfidenceConfig(confidence);

  const sizeClasses = {
    sm: "h-1.5 w-8",
    md: "h-2 w-10",
    lg: "h-2.5 w-12",
  };

  const percentage = accuracy || (confidence === "high" ? 90 : confidence === "medium" ? 75 : 45);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Confidence bar */}
      <div className={cn("overflow-hidden rounded-ds-full bg-neutral-200", sizeClasses[size])}>
        <div
          className={cn("h-full transition-all duration-300", config.bgColor.replace("bg-", "bg-"))}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showPercentage && <span className={cn("text-typography-xs font-medium", config.color)}>{percentage}%</span>}
    </div>
  );
}

// Comprehensive AI status badge
export function AIStatusBadge({
  aiData,
  variant = "compact",
  showConfidence = true,
  showActivity = false,
  className,
}: AIStatusBadgeProps) {
  const statusConfig = getStatusConfig(aiData.status);
  const modeConfig = getModeConfig(aiData.mode);

  if (variant === "minimal") {
    return (
      <AIStatusIndicator
        status={aiData.status}
        mode={aiData.mode}
        confidence={aiData.confidence}
        size="sm"
        {...(className ? { className } : {})}
      />
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Badge variant={statusConfig.variant} size="sm" className="flex items-center gap-1">
          <statusConfig.icon className="h-2.5 w-2.5" />
          <span className="hidden sm:inline">{statusConfig.label}</span>
        </Badge>

        {showConfidence && aiData.confidence && (
          <AIConfidenceIndicator confidence={aiData.confidence} accuracy={aiData.accuracy} size="sm" />
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn("space-y-1", className)}>
      {/* Main status */}
      <div className="flex items-center justify-between">
        <Badge variant={statusConfig.variant} className="flex items-center gap-1.5">
          <statusConfig.icon className="h-3 w-3" />
          {statusConfig.label}
        </Badge>

        <Badge variant="outline" size="sm">
          {modeConfig.label}
        </Badge>
      </div>

      {/* Confidence and metrics */}
      {showConfidence && aiData.confidence && (
        <div className="flex items-center justify-between text-tiny">
          <span className="text-foreground">Confidence:</span>
          <AIConfidenceIndicator confidence={aiData.confidence} accuracy={aiData.accuracy} showPercentage size="sm" />
        </div>
      )}

      {/* Activity metrics */}
      {showActivity && aiData.responseCount !== undefined && (
        <div className="text-foreground flex items-center justify-between text-tiny">
          <span>Responses today:</span>
          <span className="font-medium">{aiData.responseCount}</span>
        </div>
      )}

      {/* Intervention needed warning */}
      {aiData.interventionNeeded && (
        <div className="flex items-center gap-1 text-tiny text-orange-600">
          <Icon icon={AlertTriangle} className="h-3 w-3" />
          Intervention needed
        </div>
      )}
    </div>
  );
}

// Live activity indicator for active AI
export function AIActivityIndicator({
  isActive,
  message = "AI is responding...",
  className,
}: {
  isActive: boolean;
  message?: string;
  className?: string;
}) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-ds-md px-2 py-1",
        "bg-gradient-to-r from-green-50 to-blue-50",
        "border-status-success-light border",
        "animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <Icon icon={Loader2} className="text-semantic-success-dark h-3 w-3 animate-spin" />
        <Icon icon={Brain} className="h-3 w-3 animate-pulse text-blue-600" />
      </div>
      <span className="text-green-600-dark text-tiny font-medium">{message}</span>
    </div>
  );
}

// AI mode selector for admin/agent views
export function AIModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
  className,
}: {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  disabled?: boolean;
  className?: string;
}) {
  const modes: AIMode[] = ["autonomous", "assisted", "supervised", "disabled"];

  return (
    <div className={cn("flex gap-1", className)}>
      {modes.map((mode) => {
        const config = getModeConfig(mode);
        const isActive = mode === currentMode;

        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            disabled={disabled}
            className={cn(
              "text-typography-xs flex items-center gap-1 rounded px-2 py-1 font-medium transition-all",
              isActive
                ? `${config.color} border border-current border-opacity-30 bg-current bg-opacity-10`
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800",
              disabled && "cursor-not-allowed opacity-50"
            )}
            title={config.description}
          >
            <config.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Export utility functions for external use
export const AIStatusUtils = {
  getStatusConfig,
  getModeConfig,
  getConfidenceConfig,

  // Helper to determine if AI needs attention
  needsAttention: (aiData: AIStatusData): boolean => {
    return (
      aiData.interventionNeeded ||
      aiData.status === "uncertain" ||
      aiData.confidence === "low" ||
      (aiData.accuracy !== undefined && aiData.accuracy < 60)
    );
  },

  // Helper to get priority level
  getPriority: (aiData: AIStatusData): "high" | "medium" | "low" => {
    if (aiData.interventionNeeded || aiData.status === "uncertain") return "high";
    if (aiData.confidence === "low" || aiData.status === "escalated") return "medium";
    return "low";
  },

  // Helper to format last activity
  formatLastActivity: (lastActivity?: Date): string => {
    if (!lastActivity) return "No recent activity";

    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Active now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },
};
