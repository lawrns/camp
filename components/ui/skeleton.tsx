/**
 * Enhanced Skeleton Components
 *
 * Comprehensive skeleton loading components with animations,
 * responsive design, and accessibility features
 */

import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pulse" | "wave" | "shimmer";
  speed?: "slow" | "normal" | "fast";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  height?: string | number;
  width?: string | number;
}

function Skeleton({
  className,
  variant = "default",
  speed = "normal",
  rounded = "md",
  height,
  width,
  style,
  ...props
}: SkeletonProps) {
  const speedClasses = {
    slow: "animate-pulse [animation-duration:2s]",
    normal: "animate-pulse",
    fast: "animate-pulse [animation-duration:0.8s]",
  };

  const roundedClasses = {
    none: "radius-none",
    sm: "rounded-ds-sm",
    md: "rounded-ds-md",
    lg: "rounded-ds-lg",
    full: "rounded-ds-full",
  };

  const variantClasses = {
    default: "bg-muted",
    pulse:
      "bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
    wave: "bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-[wave_2s_ease-in-out_infinite]",
    shimmer:
      "relative bg-muted overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
  };

  const combinedStyle = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width,
    ...style,
  };

  return (
    <div
      className={cn("block", variantClasses[variant], speedClasses[speed], roundedClasses[rounded], className)}
      style={combinedStyle}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}

// Specialized skeleton components
function SkeletonText({
  lines = 1,
  className,
  lineHeight = "h-4",
  spacing = "space-y-2",
  lastLineWidth = "75%",
  ...props
}: {
  lines?: number;
  className?: string;
  lineHeight?: string;
  spacing?: string;
  lastLineWidth?: string;
} & Omit<SkeletonProps, "height" | "width">) {
  return (
    <div className={cn(spacing, className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(lineHeight, index === lines - 1 && lines > 1 ? `w-[${lastLineWidth}]` : "w-full")}
          {...props}
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
} & Omit<SkeletonProps, "height" | "width" | "rounded">) {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return <Skeleton className={cn(sizeClasses[size], className)} rounded="full" {...props} />;
}

function SkeletonButton({
  size = "md",
  className,
  ...props
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<SkeletonProps, "height" | "width">) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-28",
  };

  return <Skeleton className={cn(sizeClasses[size], className)} rounded="md" {...props} />;
}

function SkeletonCard({
  className,
  showHeader = true,
  showFooter = false,
  contentLines = 3,
  ...props
}: {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
} & Omit<SkeletonProps, "height" | "width">) {
  return (
    <div className={cn("space-y-4 rounded-ds-lg border spacing-6", className)}>
      {showHeader && (
        <div className="space-y-spacing-sm">
          <Skeleton className="h-6 w-3/4" {...props} />
          <Skeleton className="h-4 w-1/2" {...props} />
        </div>
      )}

      <div className="space-y-spacing-sm">
        <SkeletonText lines={contentLines} {...props} />
      </div>

      {showFooter && (
        <div className="flex items-center justify-between pt-4">
          <SkeletonButton size="sm" {...props} />
          <Skeleton className="h-4 w-16" {...props} />
        </div>
      )}
    </div>
  );
}

export { Skeleton, SkeletonAvatar, SkeletonButton, SkeletonCard, SkeletonText };
