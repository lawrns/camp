"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/unified-ui/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";

/**
 * LivePerformanceMonitor - Design System Compliant Version
 *
 * Migrated to use unified design tokens and components:
 * - Unified import patterns from @/components/unified-ui/
 * - Design token-based status colors and styling
 * - Consistent spacing and layout using design tokens
 * - Enhanced accessibility and responsive design
 * - Preserved real-time monitoring and alert functionality
 */
import { ArrowDown, ArrowUp, CheckCircle, Clock, Eye, Zap, Pulse, Target, TrendDown, TrendUp, AlertTriangle,  } from "lucide-react";

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  previous?: number;
  status: "excellent" | "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  change?: number;
  description?: string;
}

interface Alert {
  id: string;
  type: "performance" | "threshold" | "anomaly" | "system";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  metric?: string;
  actionRequired?: boolean;
}

interface LivePerformanceMonitorProps {
  metrics: PerformanceMetric[];
  alerts: Alert[];
  isLive?: boolean;
  onMetricClick?: (metric: PerformanceMetric) => void;
  onAlertDismiss?: (alertId: string) => void;
  className?: string;
}

const MetricCard = memo(function MetricCard({ metric, onClick }: { metric: PerformanceMetric; onClick?: () => void }) {
  const getStatusConfig = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "excellent":
        return {
          color: "text-[var(--fl-color-success)]",
          bgColor: "bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-200)]",
          icon: CheckCircle,
          badgeColor: "bg-[var(--fl-color-success-subtle)] text-[var(--fl-color-success)] border-[var(--fl-color-success-200)]",
        };
      case "good":
        return {
          color: "text-[var(--fl-color-info)]",
          bgColor: "bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-200)]",
          icon: Target,
          badgeColor: "bg-[var(--fl-color-info-subtle)] text-[var(--fl-color-info)] border-[var(--fl-color-info-200)]",
        };
      case "warning":
        return {
          color: "text-[var(--fl-color-warning)]",
          bgColor: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-200)]",
          icon: AlertTriangle,
          badgeColor: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] border-[var(--fl-color-warning-200)]",
        };
      case "critical":
        return {
          color: "text-[var(--fl-color-error)]",
          bgColor: "bg-[var(--fl-color-error-subtle)] border-[var(--fl-color-error-200)]",
          icon: AlertTriangle,
          badgeColor: "bg-[var(--fl-color-error-subtle)] text-[var(--fl-color-error)] border-[var(--fl-color-error-200)]",
        };
    }
  };

  const getTrendConfig = (trend: PerformanceMetric["trend"]) => {
    switch (trend) {
      case "up":
        return {
          icon: TrendUp,
          color: "text-[var(--fl-color-success)]",
          arrowIcon: ArrowUp,
        };
      case "down":
        return {
          icon: TrendDown,
          color: "text-[var(--fl-color-error)]",
          arrowIcon: ArrowDown,
        };
      case "stable":
        return {
          icon: Pulse,
          color: "text-[var(--fl-color-text-muted)]",
          arrowIcon: null,
        };
    }
  };

  const statusConfig = getStatusConfig(metric.status);
  const trendConfig = getTrendConfig(metric.trend);
  const StatusIcon = statusConfig.icon;
  const TrendIcon = trendConfig.icon;
  const ArrowIcon = trendConfig.arrowIcon;

  // Calculate progress percentage if target is provided
  const progressPercentage = metric.target ? Math.min((metric.value / metric.target) * 100, 100) : undefined;

  return (
    <OptimizedMotion.div layout whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          "cursor-pointer border transition-all duration-200",
          "hover:shadow-[var(--fl-shadow-md)]",
          statusConfig.bgColor,
          onClick && "hover:border-[var(--fl-color-border-strong)]"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-[var(--fl-spacing-3)]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--fl-color-text)] text-sm font-medium">{metric.name}</CardTitle>
            <div className="flex items-center gap-[var(--fl-spacing-2)]">
              <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
              <Badge
                variant="secondary"
                className={cn("text-xs border px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]", statusConfig.badgeColor)}
              >
                {metric.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Value and Unit */}
          <div className="mb-[var(--fl-spacing-2)] flex items-baseline justify-between">
            <div className="flex items-baseline gap-[var(--fl-spacing-1)]">
              <span className="text-3xl font-bold text-[var(--fl-color-text)]">
                {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
              </span>
              <span className="text-[var(--fl-color-text)] text-sm">{metric.unit}</span>
            </div>

            {/* Trend Indicator */}
            <div className={cn("flex items-center gap-[var(--fl-spacing-1)]", trendConfig.color)}>
              <TrendIcon className="h-4 w-4" />
              {ArrowIcon && <ArrowIcon className="h-3 w-3" />}
              {metric.change !== undefined && (
                <span className="text-xs font-medium">
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
              )}
            </div>
          </div>

          {/* Target Progress Bar */}
          {progressPercentage !== undefined && (
            <div className="space-y-[var(--fl-spacing-1)]">
              <div className="text-[var(--fl-color-text)] flex justify-between text-xs">
                <span>Progress to target</span>
                <span>
                  {metric.target?.toLocaleString()} {metric.unit}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className={cn(
                  "h-2",
                  metric.status === "excellent" && "[&>div]:bg-[var(--fl-color-success)]",
                  metric.status === "good" && "[&>div]:bg-[var(--fl-color-info)]",
                  metric.status === "warning" && "[&>div]:bg-[var(--fl-color-warning)]",
                  metric.status === "critical" && "[&>div]:bg-[var(--fl-color-error)]"
                )}
              />
            </div>
          )}

          {/* Description */}
          {metric.description && (
            <p className="leading-relaxed text-[var(--fl-color-text)] mt-[var(--fl-spacing-2)] text-xs">{metric.description}</p>
          )}
        </CardContent>
      </Card>
    </OptimizedMotion.div>
  );
});

const AlertCard = memo(function AlertCard({ alert, onDismiss }: { alert: Alert; onDismiss?: () => void }) {
  const getSeverityConfig = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          color: "text-[var(--fl-color-error)]",
          bgColor: "bg-[var(--fl-color-error-subtle)] border-[var(--fl-color-error-200)]",
          badgeColor: "bg-[var(--fl-color-error-subtle)] text-[var(--fl-color-error)] border-[var(--fl-color-error-200)]",
        };
      case "high":
        return {
          color: "text-[var(--fl-color-warning)]",
          bgColor: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-200)]",
          badgeColor: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] border-[var(--fl-color-warning-200)]",
        };
      case "medium":
        return {
          color: "text-[var(--fl-color-warning)]",
          bgColor: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-200)]",
          badgeColor: "bg-[var(--fl-color-warning-subtle)] text-[var(--fl-color-warning)] border-[var(--fl-color-warning-200)]",
        };
      case "low":
        return {
          color: "text-[var(--fl-color-info)]",
          bgColor: "bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-200)]",
          badgeColor: "bg-[var(--fl-color-info-subtle)] text-[var(--fl-color-info)] border-[var(--fl-color-info-200)]",
        };
    }
  };

  const severityConfig = getSeverityConfig(alert.severity);

  return (
    <OptimizedMotion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={cn("rounded-[var(--fl-radius-lg)] border p-[var(--fl-spacing-4)]", severityConfig.bgColor)}
    >
      <div className="flex items-start justify-between gap-[var(--fl-spacing-3)]">
        <div className="flex-1">
          <div className="mb-[var(--fl-spacing-1)] flex items-center gap-[var(--fl-spacing-2)]">
            <AlertTriangle className={cn("h-4 w-4", severityConfig.color)} />
            <h4 className="text-sm font-semibold text-[var(--fl-color-text)]">{alert.title}</h4>
            <Badge
              variant="secondary"
              className={cn("text-xs border px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]", severityConfig.badgeColor)}
            >
              {alert.severity}
            </Badge>
          </div>

          <p className="leading-relaxed text-[var(--fl-color-text)] mb-[var(--fl-spacing-2)] text-sm">{alert.message}</p>

          <div className="text-[var(--fl-color-text)] flex items-center gap-[var(--fl-spacing-3)] text-xs">
            <span className="flex items-center gap-[var(--fl-spacing-1)]">
              <Clock className="h-3 w-3" />
              {alert.timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {alert.metric && (
              <span className="flex items-center gap-[var(--fl-spacing-1)]">
                <Target className="h-3 w-3" />
                {alert.metric}
              </span>
            )}
            {alert.actionRequired && (
              <Badge className="text-[var(--fl-color-error)] border-[var(--fl-color-error-200)] bg-[var(--fl-color-error-subtle)] px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] text-xs rounded-full">
                Action Required
              </Badge>
            )}
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-[var(--fl-color-text)] h-6 w-6 p-0 text-[var(--fl-color-text-muted)]"
            onClick={onDismiss}
          >
            ×
          </Button>
        )}
      </div>
    </OptimizedMotion.div>
  );
});

export function LivePerformanceMonitor({
  metrics,
  alerts,
  isLive = true,
  onMetricClick,
  onAlertDismiss,
  className,
}: LivePerformanceMonitorProps) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update alerts when prop changes
  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  // Live update indicator
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalMetrics = metrics.length;
    const excellentCount = metrics.filter((m: unknown) => m.status === "excellent").length;
    const criticalCount = metrics.filter((m: unknown) => m.status === "critical").length;
    const warningCount = metrics.filter((m: unknown) => m.status === "warning").length;

    return {
      total: totalMetrics,
      excellent: excellentCount,
      critical: criticalCount,
      warning: warningCount,
      healthScore: totalMetrics > 0 ? Math.round((excellentCount / totalMetrics) * 100) : 0,
    };
  }, [metrics]);

  const handleAlertDismiss = (alertId: string) => {
    setVisibleAlerts((prev) => prev.filter((a: unknown) => a.id !== alertId));
    if (onAlertDismiss) {
      onAlertDismiss(alertId);
    }
  };

  return (
    <div className={cn("space-y-[var(--fl-spacing-6)]", className)}>
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-[var(--fl-spacing-2)] text-lg font-bold text-[var(--fl-color-text)]">
            <Pulse className="h-5 w-5 text-[var(--fl-color-primary)]" />
            Live Performance Monitor
          </h2>
          <p className="text-[var(--fl-color-text)] mt-[var(--fl-spacing-1)] text-sm">Real-time system health and performance metrics</p>
        </div>

        <div className="flex items-center gap-[var(--fl-spacing-3)]">
          {/* Health Score */}
          <div className="text-right">
            <div className="text-3xl font-bold text-[var(--fl-color-text)]">{summaryStats.healthScore}%</div>
            <div className="text-[var(--fl-color-text)] text-xs">Health Score</div>
          </div>

          {/* Live Indicator */}
          <div
            className={cn(
              "flex items-center gap-[var(--fl-spacing-2)] rounded-[var(--fl-radius-lg)] border px-[var(--fl-spacing-3)] py-[var(--fl-spacing-2)]",
              isLive
                ? "bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-200)] text-[var(--fl-color-success)]"
                : "border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] text-[var(--fl-color-text-muted)]"
            )}
          >
            <div className={cn("h-2 w-2 rounded-[var(--fl-radius-full)]", isLive ? "bg-[var(--fl-color-success)]" : "bg-[var(--fl-color-text-muted)]")} />
            <span className="text-sm font-medium">{isLive ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-[var(--fl-spacing-3)] md:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--fl-color-info)]">
          <CardContent className="p-[var(--fl-spacing-3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--fl-color-text)] text-sm font-medium">Total Metrics</p>
                <p className="text-3xl font-bold text-[var(--fl-color-text)]">{summaryStats.total}</p>
              </div>
              <Target className="h-8 w-8 text-[var(--fl-color-info)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[var(--fl-color-success)]">
          <CardContent className="p-[var(--fl-spacing-3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--fl-color-text)] text-sm font-medium">Excellent</p>
                <p className="text-[var(--fl-color-success)] text-3xl font-bold">{summaryStats.excellent}</p>
              </div>
              <CheckCircle className="text-[var(--fl-color-success)] h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[var(--fl-color-warning)]">
          <CardContent className="p-[var(--fl-spacing-3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--fl-color-text)] text-sm font-medium">Warnings</p>
                <p className="text-3xl font-bold text-[var(--fl-color-warning)]">{summaryStats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-[var(--fl-color-warning)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[var(--fl-color-error)]">
          <CardContent className="p-[var(--fl-spacing-3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--fl-color-text)] text-sm font-medium">Critical</p>
                <p className="text-3xl font-bold text-[var(--fl-color-error)]">{summaryStats.critical}</p>
              </div>
              <Zap className="h-8 w-8 text-[var(--fl-color-error)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-[var(--fl-spacing-3)] md:grid-cols-2 lg:grid-cols-3">
        <OptimizedAnimatePresence mode="popLayout">
          {metrics.map((metric: unknown) => (
            <MetricCard key={metric.id} metric={metric} onClick={() => onMetricClick?.(metric)} />
          ))}
        </OptimizedAnimatePresence>
      </div>

      {/* Alerts Section */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-[var(--fl-spacing-3)]">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-[var(--fl-spacing-2)] text-base font-semibold text-[var(--fl-color-text)]">
              <AlertTriangle className="h-5 w-5 text-[var(--fl-color-error)]" />
              Active Alerts ({visibleAlerts.length})
            </h3>
            {visibleAlerts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleAlerts([])}
                className="text-[var(--fl-color-text)] hover:text-[var(--fl-color-text)]"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-[var(--fl-spacing-3)]">
            <OptimizedAnimatePresence mode="popLayout">
              {visibleAlerts.map((alert: unknown) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={() => handleAlertDismiss(alert.id)} />
              ))}
            </OptimizedAnimatePresence>
          </div>
        </div>
      )}

      {/* Last Update Timestamp */}
      <div className="flex items-center justify-center border-t border-[var(--fl-color-border)] pt-[var(--fl-spacing-4)] text-xs text-[var(--fl-color-text-muted)]">
        <Eye className="mr-[var(--fl-spacing-1)] h-3 w-3" />
        Last updated:{" "}
        {lastUpdate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </div>
    </div>
  );
}
