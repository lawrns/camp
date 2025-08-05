"use client";

import React, { useEffect, useState } from "react";
import { Bot as Bot, User } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
// import { Icon } from "@/components/unified-ui/components/Icon"; // Component doesn't exist

import { cn } from "@/lib/utils";

type ControlMode = "human" | "ai";

interface ControlModeConfig {
  label: string;
  icon: React.ReactNode;
  bg: string;
  dark: string;
}

const controlModeMap: Record<ControlMode, ControlModeConfig> = {
  human: {
    label: "Human",
    icon: <Icon icon={User} className="h-3 w-3" />,
    bg: "bg-blue-100 text-blue-700",
    dark: "dark:bg-blue-900/30 dark:text-blue-300",
  },
  ai: {
    label: "AI",
    icon: <Icon icon={Bot} className="h-3 w-3" />,
    bg: "bg-emerald-100 text-emerald-700",
    dark: "dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

interface ControlModeChipProps {
  mode: ControlMode;
  className?: string;
  onClick?: (newMode: ControlMode) => void;
}

export function ControlModeChip({ mode, className, onClick }: ControlModeChipProps) {
  const [previousMode, setPreviousMode] = useState<ControlMode>(mode);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const config = controlModeMap[mode];

  // Handle mode changes with animation
  useEffect(() => {
    if (previousMode !== mode) {
      setShouldAnimate(true);
      setPreviousMode(mode);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 300);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mode, previousMode]);

  if (!config) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      const newMode = mode === "human" ? "ai" : "human";
      onClick(newMode);
    }
  };

  return (
    <div
      className={cn(
        "text-typography-xs inline-flex items-center gap-1 rounded-ds-md px-2 py-0.5 font-medium",
        "transition-all duration-150 ease-out",
        config.bg,
        config.dark,
        shouldAnimate && "animate-bounce-xs",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={handleClick}
      aria-live="polite"
      aria-label={`Control mode: ${config.label}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={cn("shrink-0 transition-transform duration-150", shouldAnimate && "animate-bounce-xs")}>
        {config.icon}
      </div>
      <span>{config.label}</span>
    </div>
  );
}
