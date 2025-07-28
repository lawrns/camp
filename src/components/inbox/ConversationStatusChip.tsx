"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Icon } from "@/components/unified-ui/components/Icon";
import { cn } from "@/lib/utils";

type ConversationStatus = "human" | "ai" | "open" | "closed";

interface StatusConfig {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  bg: string;
  dark: string;
}

const statusMap: Record<ConversationStatus, StatusConfig> = {
  human: {
    label: "Human",
    icon: "User",
    bg: "bg-blue-100 text-blue-700",
    dark: "dark:bg-blue-900/30 dark:text-blue-300",
  },
  ai: {
    label: "AI",
    icon: "Robot",
    bg: "bg-emerald-100 text-emerald-700",
    dark: "dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  open: {
    label: "Open",
    icon: "Circle",
    bg: "bg-yellow-100 text-yellow-700",
    dark: "dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  closed: {
    label: "Closed",
    icon: "CheckCircle",
    bg: "bg-gray-200 text-gray-600",
    dark: "dark:bg-gray-700 dark:text-gray-300",
  },
};

interface ConversationStatusChipProps {
  status: ConversationStatus;
  className?: string;
}

export function ConversationStatusChip({ status, className }: ConversationStatusChipProps) {
  const [previousStatus, setPreviousStatus] = useState<ConversationStatus>(status);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const config = statusMap[status];

  // Handle status changes with animation
  useEffect(() => {
    if (previousStatus !== status) {
      setShouldAnimate(true);
      setPreviousStatus(status);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 200);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, previousStatus]);

  if (!config) {
    return null;
  }

  const isControlMode = status === "human" || status === "ai";
  const animationClass = shouldAnimate ? (isControlMode ? "animate-bounce-xs" : "animate-scaleIn") : "";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-typography-xs inline-flex items-center gap-1 font-medium",
        "transition-all duration-150 ease-out",
        config.bg,
        config.dark,
        animationClass,
        className
      )}
      aria-live="polite"
      aria-label={`Conversation status: ${config.label}`}
    >
      <Icon
        name={config.icon}
        size={16}
        className={cn("shrink-0 transition-transform duration-150", shouldAnimate && "animate-scaleIn")}
      />
      <span>{config.label}</span>
    </Badge>
  );
}
