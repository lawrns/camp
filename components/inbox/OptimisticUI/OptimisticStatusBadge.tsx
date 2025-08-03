import React from "react";
import {
  Warning as AlertCircle,
  CheckCircle as Check,
  Clock,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface OptimisticStatusBadgeProps {
  status: "pending" | "success" | "error";
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const OptimisticStatusBadge: React.FC<OptimisticStatusBadgeProps> = ({ status, error, onRetry, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600 bg-[var(--fl-color-warning-subtle)]",
          text: "Updating...",
          pulse: true,
        };
      case "success":
        return {
          icon: Check,
          color: "text-green-600 bg-[var(--fl-color-success-subtle)]",
          text: "Updated",
          pulse: false,
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-600 bg-[var(--fl-color-danger-subtle)]",
          text: error || "Failed",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "text-typography-xs inline-flex items-center gap-1.5 rounded-ds-full px-2 py-1 font-medium",
        config.color,
        config.pulse && "animate-pulse",
        className
      )}
    >
      <IconComponent className="h-3 w-3" />
      <span>{config.text}</span>
      {status === "error" && onRetry && (
        <button onClick={onRetry} className="ml-1 transition-opacity hover:opacity-80" title="Retry">
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
