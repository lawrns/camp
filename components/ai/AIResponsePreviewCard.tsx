"use client";

import React from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Warning as AlertCircle,
  Brain,
  CheckCircle,
  CaretRight as ChevronRight,
  Clock,
  Info,
  ChatCircle as MessageSquare,
  Shield,
  Sparkle as Sparkles,
  TrendUp as TrendingUp,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/unified-ui/components/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface AIResponsePreviewCardProps {
  id: string;
  text: string;
  confidence: number;
  category: "greeting" | "question" | "solution" | "empathy" | "closing";
  intent: string;
  preview: string;
  reasoning?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
  className?: string;
  showFullDetails?: boolean;
  metrics?: {
    responseTime?: number;
    relevanceScore?: number;
    sentimentImpact?: number;
  };
}

export function AIResponsePreviewCard({
  id,
  text,
  confidence,
  category,
  intent,
  preview,
  reasoning,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  className,
  showFullDetails = false,
  metrics,
}: AIResponsePreviewCardProps) {
  const [showDetails, setShowDetails] = React.useState(showFullDetails);

  const getCategoryIcon = () => {
    switch (category) {
      case "greeting":
        return "👋";
      case "question":
        return "❓";
      case "solution":
        return "💡";
      case "empathy":
        return "❤️";
      case "closing":
        return "👋";
      default:
        return "💬";
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "from-green-500 to-emerald-500";
    if (confidence >= 0.6) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-pink-500";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.9) return "Very High";
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={className}
    >
      <Card
        className={cn(
          "relative cursor-pointer overflow-hidden transition-all duration-300",
          "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
          "border-[var(--fl-color-border)]/50 dark:border-gray-700/50",
          "hover:border-[var(--fl-color-brand-hover)] hover:shadow-lg dark:hover:border-purple-600",
          isSelected && "border-purple-500 ring-2 ring-purple-500",
          isHovered && "shadow-md"
        )}
        onClick={onSelect}
      >
        {/* Confidence Gradient Bar */}
        <div className="absolute left-0 right-0 top-0 h-1">
          <OptimizedMotion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full bg-gradient-to-r", getConfidenceColor())}
          />
        </div>

        <div className="spacing-3">
          {/* Header */}
          <div className="mb-3 flex items-start gap-3">
            <OptimizedMotion.span
              animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 text-3xl"
            >
              {getCategoryIcon()}
            </OptimizedMotion.span>

            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-ds-2">
                  <Badge variant="secondary" className="text-tiny">
                    {intent.replace(/_/g, " ")}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            confidence >= 0.8 && "text-status-success-dark border-[var(--fl-color-success)] dark:text-green-300",
                            confidence >= 0.6 &&
                              confidence < 0.8 &&
                              "text-status-warning-dark border-yellow-500 dark:text-yellow-300",
                            confidence < 0.6 && "border-brand-mahogany-500 text-status-error-dark dark:text-red-300"
                          )}
                        >
                          <Icon icon={Sparkles} className="mr-1 h-3 w-3" />
                          {(confidence * 100).toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-tiny">
                          Confidence: {getConfidenceLabel()} ({(confidence * 100).toFixed(1)}%)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {isSelected && (
                  <OptimizedMotion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Icon icon={CheckCircle} className="h-4 w-4 text-purple-600" />
                  </OptimizedMotion.div>
                )}
              </div>

              {/* Response Text */}
              <p className="text-foreground mb-2 line-clamp-2 text-sm dark:text-neutral-300">{text}</p>

              {/* Preview */}
              <div className="text-foreground flex items-start gap-ds-2 text-tiny dark:text-gray-400">
                <Icon icon={Info} className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <p className="italic">{preview}</p>
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          <OptimizedAnimatePresence>
            {(showDetails || isHovered) && (reasoning || metrics) && (
              <OptimizedMotion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 border-t border-[var(--fl-color-border)] pt-3 dark:border-gray-700"
              >
                {reasoning && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center gap-1">
                      <Icon icon={Brain} className="h-3 w-3 text-purple-600" />
                      <span className="text-foreground text-tiny font-medium dark:text-neutral-300">AI Reasoning</span>
                    </div>
                    <p className="text-foreground pl-4 text-tiny dark:text-gray-400">{reasoning}</p>
                  </div>
                )}

                {metrics && (
                  <div className="grid grid-cols-3 gap-ds-2">
                    {metrics.responseTime && (
                      <div className="bg-background/50 rounded-ds-md p-spacing-sm text-center dark:bg-neutral-800/50">
                        <Icon icon={Clock} className="mx-auto mb-1 h-3 w-3 text-blue-600" />
                        <p className="text-tiny font-medium">{metrics.responseTime}ms</p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">Response</p>
                      </div>
                    )}
                    {metrics.relevanceScore && (
                      <div className="bg-background/50 rounded-ds-md p-spacing-sm text-center dark:bg-neutral-800/50">
                        <Icon icon={Zap} className="mx-auto mb-1 h-3 w-3 text-yellow-600" />
                        <p className="text-tiny font-medium">{(metrics.relevanceScore * 100).toFixed(0)}%</p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">Relevance</p>
                      </div>
                    )}
                    {metrics.sentimentImpact && (
                      <div className="bg-background/50 rounded-ds-md p-spacing-sm text-center dark:bg-neutral-800/50">
                        <Icon icon={TrendingUp} className="text-semantic-success-dark mx-auto mb-1 h-3 w-3" />
                        <p className="text-tiny font-medium">
                          {metrics.sentimentImpact > 0 ? "+" : ""}
                          {(metrics.sentimentImpact * 100).toFixed(0)}%
                        </p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">Impact</p>
                      </div>
                    )}
                  </div>
                )}
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>

          {/* Action Button */}
          <div className="mt-3 flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              className="text-tiny"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? "Hide" : "Show"} Details
              <Icon
                icon={ChevronRight}
                className={cn("ml-1 h-3 w-3 transition-transform", showDetails && "rotate-90")}
              />
            </Button>

            {isSelected && (
              <OptimizedMotion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-tiny font-medium text-purple-600 dark:text-purple-400"
              >
                Selected
              </OptimizedMotion.div>
            )}
          </div>
        </div>

        {/* Hover Glow Effect */}
        <OptimizedAnimatePresence>
          {isHovered && (
            <OptimizedMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </Card>
    </OptimizedMotion.div>
  );
}

// Grid component for multiple preview cards
export function AIResponsePreviewGrid({
  responses,
  selectedId,
  onSelect,
  className,
}: {
  responses: AIResponsePreviewCardProps[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <div className={cn("grid gap-4", className)}>
      {responses.map((response: unknown) => (
        <AIResponsePreviewCard
          key={response.id}
          {...response}
          isSelected={selectedId === response.id}
          isHovered={hoveredId === response.id}
          onSelect={() => onSelect?.(response.id)}
          onHover={(hovering) => setHoveredId(hovering ? response.id : null)}
        />
      ))}
    </div>
  );
}
