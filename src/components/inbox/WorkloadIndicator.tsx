"use client";

import { cn } from "@/lib/utils";

interface WorkloadIndicatorProps {
  current: number;
  capacity: number;
  status?: "available" | "busy" | "near-capacity";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WorkloadIndicator({
  current,
  capacity,
  status,
  showLabel = true,
  size = "md",
  className,
}: WorkloadIndicatorProps) {
  // Calculate percentage
  const percentage = capacity > 0 ? (current / capacity) * 100 : 0;

  // Determine status based on percentage if not provided
  const workloadStatus = status || (percentage >= 90 ? "busy" : percentage >= 70 ? "near-capacity" : "available");

  // Get color based on status
  const getStatusColor = () => {
    switch (workloadStatus) {
      case "available":
        return "bg-green-500";
      case "near-capacity":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "h-1.5",
          text: "text-xs",
        };
      case "lg":
        return {
          container: "h-3",
          text: "text-sm",
        };
      default:
        return {
          container: "h-2",
          text: "text-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn(sizeClasses.text, "text-gray-600")}>Workload</span>
          <span className={cn(sizeClasses.text, "font-medium text-neutral-900")}>
            {current}/{capacity}
          </span>
        </div>
      )}

      <div
        className={cn("w-full overflow-hidden rounded-ds-full bg-neutral-200", sizeClasses.container)}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`Workload: ${current} out of ${capacity} conversations`}
      >
        <div
          className={cn("h-full transition-all duration-300 ease-out", getStatusColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {showLabel && (
        <p className={cn(sizeClasses.text, "mt-1 text-neutral-500")}>
          {workloadStatus === "available" && "Available for new conversations"}
          {workloadStatus === "near-capacity" && "Approaching capacity"}
          {workloadStatus === "busy" && "At or over capacity"}
        </p>
      )}
    </div>
  );
}

// Mini version for inline display
export function WorkloadBadge({
  current,
  capacity,
  className,
}: {
  current: number;
  capacity: number;
  className?: string;
}) {
  const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
  const status = percentage >= 90 ? "busy" : percentage >= 70 ? "near-capacity" : "available";

  const statusColors = {
    available: "bg-green-100 text-green-700 border-[var(--fl-color-success-muted)]",
    "near-capacity": "bg-yellow-100 text-yellow-700 border-[var(--fl-color-warning-muted)]",
    busy: "bg-red-100 text-red-700 border-[var(--fl-color-danger-muted)]",
  };

  return (
    <span
      className={cn(
        "text-typography-xs inline-flex items-center gap-1.5 rounded-ds-full border px-2 py-0.5 font-medium",
        statusColors[status],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-ds-full",
          status === "available" && "bg-semantic-success",
          status === "near-capacity" && "bg-semantic-warning",
          status === "busy" && "bg-brand-mahogany-500"
        )}
      />
      {current}/{capacity}
    </span>
  );
}
