"use client";

import React from "react";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AIConfidenceIndicatorProps {
  confidence: number;
  previousConfidence?: number;
  threshold?: number;
  className?: string;
  variant?: "minimal" | "detailed" | "progress" | "badge";
  showTrend?: boolean;
  showThreshold?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AIConfidenceIndicator({
  confidence,
  previousConfidence,
  threshold = 0.7,
  className,
  variant = "detailed",
  showTrend = true,
  showThreshold = true,
  size = "md",
}: AIConfidenceIndicatorProps) {
  const confidencePercent = Math.round(confidence * 100);
  const thresholdPercent = Math.round(threshold * 100);

  const isAboveThreshold = confidence >= threshold;
  const isNearThreshold = confidence >= threshold - 0.1 && confidence < threshold;
  const isBelowThreshold = confidence < threshold - 0.1;

  const trend =
    previousConfidence !== undefined
      ? confidence > previousConfidence
        ? "up"
        : confidence < previousConfidence
          ? "down"
          : "stable"
      : "stable";

  const getStatusColor = () => {
    if (isAboveThreshold) return "text-green-600";
    if (isNearThreshold) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = () => {
    if (isAboveThreshold) return CheckCircle;
    if (isNearThreshold) return Warning;
    return XCircle;
  };

  const getStatusText = () => {
    if (isAboveThreshold) return "High Confidence";
    if (isNearThreshold) return "Moderate Confidence";
    return "Low Confidence";
  };

  const getBadgeVariant = () => {
    if (isAboveThreshold) return "default";
    if (isNearThreshold) return "secondary";
    return "destructive";
  };

  const getProgressColor = () => {
    if (isAboveThreshold) return "bg-green-500";
    if (isNearThreshold) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          icon: "h-3 w-3",
          text: "text-xs",
          badge: "text-xs px-1.5 py-0.5",
        };
      case "lg":
        return {
          icon: "h-6 w-6",
          text: "text-base",
          badge: "text-sm px-[var(--fl-spacing-3)] py-[var(--fl-spacing-1)]",
        };
      default:
        return {
          icon: "h-4 w-4",
          text: "text-sm",
          badge: "text-xs px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-[var(--fl-spacing-1)]", className)}>
              <Icon icon={getStatusIcon()} className={cn(sizeClasses.icon, getStatusColor())} />
              <span className={cn("font-medium", sizeClasses.text, getStatusColor())}>{confidencePercent}%</span>
              {showTrend && previousConfidence !== undefined && trend !== "stable" && (
                <Icon
                  icon={trend === "up" ? TrendingUp : TrendingDown}
                  className={cn("h-3 w-3", trend === "up" ? "text-green-500" : "text-red-500")}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-tiny">
              <div>{getStatusText()}</div>
              <div>Confidence: {confidencePercent}%</div>
              {showThreshold && <div>Threshold: {thresholdPercent}%</div>}
              {previousConfidence !== undefined && <div>Previous: {Math.round(previousConfidence * 100)}%</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "badge") {
    return (
      <Badge variant={getBadgeVariant()} className={cn(sizeClasses.badge, className)}>
        <Icon icon={getStatusIcon()} className={cn(sizeClasses.icon, "mr-1")} />
        {confidencePercent}%
        {showTrend && previousConfidence !== undefined && trend !== "stable" && (
          <Icon icon={trend === "up" ? TrendingUp : TrendingDown} className="ml-1 h-3 w-3" />
        )}
      </Badge>
    );
  }

  if (variant === "progress") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-ds-2">
            <Icon icon={getStatusIcon()} className={cn(sizeClasses.icon, getStatusColor())} />
            <span className={cn("font-medium", sizeClasses.text)}>AI Confidence</span>
          </div>
          <div className="flex items-center gap-[var(--fl-spacing-1)]">
            <span className={cn("font-bold", sizeClasses.text, getStatusColor())}>{confidencePercent}%</span>
            {showTrend && previousConfidence !== undefined && trend !== "stable" && (
              <Icon
                icon={trend === "up" ? TrendingUp : TrendingDown}
                className={cn("h-3 w-3", trend === "up" ? "text-green-500" : "text-red-500")}
              />
            )}
          </div>
        </div>
        <div className="relative">
          <Progress value={confidencePercent} className="h-2" />
          {showThreshold && (
            <div
              className="absolute top-0 h-2 w-0.5 bg-gray-400"
              style={{ left: `${thresholdPercent}%` }}
              title={`Threshold: ${thresholdPercent}%`}
            />
          )}
        </div>
        <div className={cn("text-xs text-gray-600", sizeClasses.text)}>
          {getStatusText()}
          {showThreshold && ` (Threshold: ${thresholdPercent}%)`}
        </div>
      </div>
    );
  }

  // Default detailed variant
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-ds-2">
        <Icon icon={getStatusIcon()} className={cn(sizeClasses.icon, getStatusColor())} />
        <div>
          <div className={cn("font-medium", sizeClasses.text, getStatusColor())}>{confidencePercent}%</div>
          <div className={cn("text-xs text-gray-600")}>{getStatusText()}</div>
        </div>
      </div>

      {showTrend && previousConfidence !== undefined && (
        <div className="flex items-center gap-[var(--fl-spacing-1)]">
          {trend !== "stable" && (
            <Icon
              icon={trend === "up" ? TrendingUp : TrendingDown}
              className={cn("h-3 w-3", trend === "up" ? "text-green-500" : "text-red-500")}
            />
          )}
          <span className="text-foreground-muted text-tiny">
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            {Math.abs(confidencePercent - Math.round((previousConfidence || 0) * 100))}%
          </span>
        </div>
      )}

      {showThreshold && <div className="text-foreground-muted text-tiny">Threshold: {thresholdPercent}%</div>}
    </div>
  );
}
