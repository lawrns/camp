"use client";

import React from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  Activity,
  Warning as AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Gauge,
  ChatCircle as MessageSquare,
  Shield,
  TrendUp as TrendingUp,
  XCircle,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card } from "@/components/unified-ui/components/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { cn } from "@/lib/utils";

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "inactive" | "processing" | "error";
  performance?: number; // 0-1
  lastUpdated?: Date;
  metrics?: {
    accuracy?: number;
    speed?: number;
    usage?: number;
  };
}

interface AICapabilityIndicatorsProps {
  capabilities: AICapability[];
  className?: string;
  variant?: "grid" | "list" | "compact";
  showMetrics?: boolean;
  onCapabilityClick?: (capability: AICapability) => void;
}

export function AICapabilityIndicators({
  capabilities,
  className,
  variant = "grid",
  showMetrics = true,
  onCapabilityClick,
}: AICapabilityIndicatorsProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const getStatusColor = (status: AICapability["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-400 dark:text-gray-600";
    }
  };

  const getStatusIcon = (status: AICapability["status"]) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "processing":
        return Activity;
      case "error":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getPerformanceColor = (performance?: number) => {
    if (!performance) return "from-gray-500 to-gray-600";
    if (performance >= 0.8) return "from-green-500 to-emerald-500";
    if (performance >= 0.6) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-pink-500";
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {capabilities.map((capability: any) => {
          const StatusIcon = getStatusIcon(capability.status);
          const Icon = capability.icon;

          return (
            <TooltipProvider key={capability.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <OptimizedMotion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-1.5 rounded-ds-lg px-2.5 py-1.5 transition-all",
                      "border border-[var(--fl-color-border)]/50 bg-neutral-100/50 dark:border-gray-700/50 dark:bg-neutral-800/50",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      capability.status === "active" && "border-[var(--fl-color-success)]/50",
                      capability.status === "error" && "border-brand-mahogany-500/50"
                    )}
                    onClick={() => onCapabilityClick?.(capability)}
                  >
                    <Icon className="text-foreground h-3.5 w-3.5 dark:text-gray-400" />
                    <span className="text-tiny font-medium">{capability.name}</span>
                    <StatusIcon className={cn("h-3 w-3", getStatusColor(capability.status))} />
                  </OptimizedMotion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{capability.name}</p>
                    <p className="text-tiny text-[var(--fl-color-text-muted)]">{capability.description}</p>
                    {capability.performance !== undefined && (
                      <p className="text-tiny">Performance: {(capability.performance * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {capabilities.map((capability: any) => {
          const StatusIcon = getStatusIcon(capability.status);
          const Icon = capability.icon;

          return (
            <OptimizedMotion.div
              key={capability.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 5 }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-ds-lg spacing-3 transition-all",
                "border border-[var(--fl-color-border)]/50 bg-white/50 dark:border-gray-700/50 dark:bg-neutral-900/50",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                hoveredId === capability.id && "shadow-md"
              )}
              onMouseEnter={() => setHoveredId(capability.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onCapabilityClick?.(capability)}
            >
              <div className="relative">
                <Icon className="text-foreground h-5 w-5 dark:text-gray-400" />
                <OptimizedMotion.div
                  animate={capability.status === "processing" ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-1 -right-1"
                >
                  <StatusIcon className={cn("h-3 w-3", getStatusColor(capability.status))} />
                </OptimizedMotion.div>
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-sm font-medium">{capability.name}</h4>
                  {capability.performance !== undefined && showMetrics && (
                    <span className="text-tiny text-[var(--fl-color-text-muted)]">
                      {(capability.performance * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-foreground text-tiny dark:text-gray-400">{capability.description}</p>
                {capability.performance !== undefined && showMetrics && (
                  <div className="mt-2">
                    <OptimizedMotion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-1 w-full overflow-hidden rounded-ds-full bg-gray-200 dark:bg-neutral-700"
                    >
                      <OptimizedMotion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${capability.performance * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn(
                          "h-full rounded-ds-full bg-gradient-to-r",
                          getPerformanceColor(capability.performance)
                        )}
                      />
                    </OptimizedMotion.div>
                  </div>
                )}
              </div>

              {showMetrics && capability.metrics && (
                <div className="flex gap-3 text-tiny">
                  {capability.metrics.accuracy !== undefined && (
                    <div className="text-center">
                      <p className="font-medium">{(capability.metrics.accuracy * 100).toFixed(0)}%</p>
                      <p className="text-[var(--fl-color-text-muted)]">Accuracy</p>
                    </div>
                  )}
                  {capability.metrics.speed !== undefined && (
                    <div className="text-center">
                      <p className="font-medium">{capability.metrics.speed}ms</p>
                      <p className="text-[var(--fl-color-text-muted)]">Speed</p>
                    </div>
                  )}
                </div>
              )}
            </OptimizedMotion.div>
          );
        })}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", className)}>
      {capabilities.map((capability, index) => {
        const StatusIcon = getStatusIcon(capability.status);
        const Icon = capability.icon;

        return (
          <OptimizedMotion.div
            key={capability.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onMouseEnter={() => setHoveredId(capability.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Card
              className={cn(
                "relative cursor-pointer overflow-hidden transition-all",
                "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
                "hover:shadow-md",
                capability.status === "active" && "border-[var(--fl-color-success)]/50",
                capability.status === "error" && "border-brand-mahogany-500/50",
                hoveredId === capability.id && "shadow-lg"
              )}
              onClick={() => onCapabilityClick?.(capability)}
            >
              {/* Performance bar at top */}
              {capability.performance !== undefined && (
                <div className="absolute left-0 right-0 top-0 h-0.5">
                  <OptimizedMotion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${capability.performance * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={cn("h-full bg-gradient-to-r", getPerformanceColor(capability.performance))}
                  />
                </div>
              )}

              <div className="spacing-3">
                <div className="mb-2 flex items-start justify-between">
                  <div className="relative">
                    <OptimizedMotion.div
                      animate={capability.status === "processing" ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </OptimizedMotion.div>
                    <div className="absolute -bottom-1 -right-1">
                      <StatusIcon className={cn("h-3.5 w-3.5", getStatusColor(capability.status))} />
                    </div>
                  </div>
                  <Badge variant={capability.status === "active" ? "default" : "secondary"} className="text-tiny">
                    {capability.status}
                  </Badge>
                </div>

                <h4 className="mb-1 text-sm font-medium">{capability.name}</h4>
                <p className="text-foreground line-clamp-2 text-tiny dark:text-gray-400">{capability.description}</p>

                {showMetrics && capability.metrics && (
                  <div className="mt-3 border-t border-[var(--fl-color-border)] pt-3 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-ds-2 text-tiny">
                      {capability.metrics.accuracy !== undefined && (
                        <div className="text-center">
                          <Icon icon={Gauge} className="mx-auto mb-1 h-3 w-3 text-[var(--fl-color-text-muted)]" />
                          <p className="font-medium">{(capability.metrics.accuracy * 100).toFixed(0)}%</p>
                        </div>
                      )}
                      {capability.metrics.speed !== undefined && (
                        <div className="text-center">
                          <Icon icon={Clock} className="mx-auto mb-1 h-3 w-3 text-[var(--fl-color-text-muted)]" />
                          <p className="font-medium">{capability.metrics.speed}ms</p>
                        </div>
                      )}
                      {capability.metrics.usage !== undefined && (
                        <div className="text-center">
                          <Icon icon={TrendingUp} className="mx-auto mb-1 h-3 w-3 text-[var(--fl-color-text-muted)]" />
                          <p className="font-medium">{capability.metrics.usage}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hover effect */}
              <OptimizedAnimatePresence>
                {hoveredId === capability.id && (
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
      })}
    </div>
  );
}

// Preset capability definitions
export const AI_CAPABILITIES: AICapability[] = [
  {
    id: "nlp",
    name: "Natural Language",
    description: "Understanding and processing human language",
    icon: MessageSquare,
    status: "active",
    performance: 0.92,
    metrics: { accuracy: 0.94, speed: 120, usage: 1250 },
  },
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Detecting emotions and sentiment in conversations",
    icon: Brain,
    status: "active",
    performance: 0.88,
    metrics: { accuracy: 0.89, speed: 85, usage: 890 },
  },
  {
    id: "intent",
    name: "Intent Recognition",
    description: "Understanding user intentions and goals",
    icon: Zap,
    status: "active",
    performance: 0.85,
    metrics: { accuracy: 0.87, speed: 95, usage: 1100 },
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    description: "Searching and retrieving relevant information",
    icon: Database,
    status: "active",
    performance: 0.91,
    metrics: { accuracy: 0.93, speed: 150, usage: 780 },
  },
  {
    id: "context",
    name: "Context Memory",
    description: "Maintaining conversation context across messages",
    icon: Cpu,
    status: "processing",
    performance: 0.76,
    metrics: { accuracy: 0.78, speed: 110, usage: 650 },
  },
  {
    id: "escalation",
    name: "Auto-Escalation",
    description: "Detecting when human intervention is needed",
    icon: Shield,
    status: "active",
    performance: 0.83,
    metrics: { accuracy: 0.85, speed: 75, usage: 320 },
  },
];

// Status indicator component
export function AIStatusIndicator({
  status,
  label,
  size = "default",
  showLabel = true,
  className,
}: {
  status: AICapability["status"];
  label?: string;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const StatusIcon = getStatusIcon(status);
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <OptimizedMotion.div
        animate={status === "processing" ? { rotate: 360 } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <StatusIcon className={cn(sizeClasses[size], getStatusColor(status))} />
      </OptimizedMotion.div>
      {showLabel && (
        <span
          className={cn(
            "font-medium capitalize",
            size === "sm" && "text-xs",
            size === "default" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {label || status}
        </span>
      )}
    </div>
  );

  function getStatusColor(status: AICapability["status"]) {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-400 dark:text-gray-600";
    }
  }

  function getStatusIcon(status: AICapability["status"]) {
    switch (status) {
      case "active":
        return CheckCircle;
      case "processing":
        return Activity;
      case "error":
        return XCircle;
      default:
        return AlertCircle;
    }
  }
}
