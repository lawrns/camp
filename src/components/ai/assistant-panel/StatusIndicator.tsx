/**
 * AI Status Indicator Component
 */

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { CheckCircle, Clock, Bot as Robot, XCircle } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { AIStatus } from "./types";
import { getStatusColor } from "./utils";

interface AIStatusIndicatorProps {
  status: AIStatus;
  className?: string;
}

export const AIStatusIndicator = ({ status, className }: AIStatusIndicatorProps) => {
  const getIcon = () => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "processing":
      case "thinking":
      case "analyzing":
        return Clock;
      case "error":
        return XCircle;
      default:
        return Robot;
    }
  };

  const getLabel = () => {
    switch (status) {
      case "active":
        return "Active";
      case "processing":
        return "Processing";
      case "thinking":
        return "Thinking";
      case "analyzing":
        return "Analyzing";
      case "error":
        return "Error";
      case "ready":
        return "Ready";
      default:
        return "Idle";
    }
  };

  const isAnimated = ["processing", "thinking", "analyzing"].includes(status);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <OptimizedMotion.div
        animate={isAnimated ? { rotate: 360 } : {}}
        transition={isAnimated ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
        className={cn("flex items-center justify-center", getStatusColor(status))}
      >
        <Icon icon={getIcon()} className="h-4 w-4" />
      </OptimizedMotion.div>
      <span className={cn("text-typography-sm font-medium", getStatusColor(status))}>{getLabel()}</span>
    </div>
  );
};

interface ThinkingDotsProps {
  className?: string;
}

export const ThinkingDots = ({ className }: ThinkingDotsProps) => (
  <div className={cn("flex space-x-1", className)}>
    {[0, 1, 2].map((i) => (
      <OptimizedMotion.div
        key={i}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2,
        }}
        className="h-2 w-2 rounded-ds-full bg-brand-blue-500"
      />
    ))}
  </div>
);
