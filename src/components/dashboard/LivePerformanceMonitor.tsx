"use client";

import { memo, useEffect, useMemo, useState } from "react";
// PHOSPHOR ICONS: Updated to use Phosphor icons for consistency
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  Eye,
  Lightning,
  Pulse,
  Target,
  TrendDown,
  TrendUp,
  Warning,
} from "@phosphor-icons/react";

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
          color: "text-green-600",
          bgColor: "bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-muted)]",
          icon: CheckCircle,
          badgeColor: "bg-green-100 text-green-800 border-[var(--fl-color-success-muted)]",
        };
      case "good":
        return {
          color: "text-blue-600",
          bgColor: "bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-muted)]",
          icon: Target,
          badgeColor: "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]",
        };
      case "warning":
        return {
          color: "text-yellow-600",
          bgColor: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)]",
          icon: Warning,
          badgeColor: "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]",
        };
      case "critical":
        return {
          color: "text-red-600",
          bgColor: "bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]",
          icon: Warning,
          badgeColor: "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]",
        };
    }
  };

  const getTrendConfig = (trend: PerformanceMetric["trend"]) => {
    switch (trend) {
      case "up":
        return {
          icon: TrendUp,
          color: "text-green-600",
          arrowIcon: ArrowUp,
        };
      case "down":
        return {
          icon: TrendDown,
          color: "text-red-600",
          arrowIcon: ArrowDown,
        };
      case "stable":
        return {
          icon: Pulse,
          color: "text-gray-600",
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
          "cursor-pointer border transition-all duration-200 hover:shadow-md",
          statusConfig.bgColor,
          onClick && "hover:border-[var(--fl-color-border-interactive)]"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-sm font-medium">{metric.name}</CardTitle>
            <div className="flex items-center gap-ds-2">
              <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
              <Badge
                variant="secondary"
                className={cn("text-typography-xs border px-2 py-0.5", statusConfig.badgeColor)}
              >
                {metric.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Value and Unit */}
          <div className="mb-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
              </span>
              <span className="text-foreground text-sm">{metric.unit}</span>
            </div>

            {/* Trend Indicator */}
            <div className={cn("flex items-center gap-1", trendConfig.color)}>
              <TrendIcon className="h-4 w-4" />
              {ArrowIcon && <ArrowIcon className="h-3 w-3" />}
              {metric.change !== undefined && (
                <span className="text-tiny font-medium">
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
              )}
            </div>
          </div>

          {/* Target Progress Bar */}
          {progressPercentage !== undefined && (
            <div className="space-y-1">
              <div className="text-foreground flex justify-between text-tiny">
                <span>Progress to target</span>
                <span>
                  {metric.target?.toLocaleString()} {metric.unit}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className={cn(
                  "h-2",
                  metric.status === "excellent" && "[&>div]:bg-semantic-success",
                  metric.status === "good" && "[&>div]:bg-brand-blue-500",
                  metric.status === "warning" && "[&>div]:bg-semantic-warning",
                  metric.status === "critical" && "[&>div]:bg-brand-mahogany-500"
                )}
              />
            </div>
          )}

          {/* Description */}
          {metric.description && (
            <p className="leading-relaxed text-foreground mt-2 text-tiny">{metric.description}</p>
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
          color: "text-red-600",
          bgColor: "bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]",
          badgeColor: "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]",
        };
      case "high":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
          badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "medium":
        return {
          color: "text-yellow-600",
          bgColor: "bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)]",
          badgeColor: "bg-yellow-100 text-yellow-800 border-[var(--fl-color-warning-muted)]",
        };
      case "low":
        return {
          color: "text-blue-600",
          bgColor: "bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-info-muted)]",
          badgeColor: "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]",
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
      className={cn("rounded-ds-lg border spacing-4", severityConfig.bgColor)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-ds-2">
            <Warning className={cn("h-4 w-4", severityConfig.color)} />
            <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
            <Badge
              variant="secondary"
              className={cn("text-typography-xs border px-2 py-0.5", severityConfig.badgeColor)}
            >
              {alert.severity}
            </Badge>
          </div>

          <p className="leading-relaxed text-foreground mb-2 text-sm">{alert.message}</p>

          <div className="text-foreground flex items-center gap-3 text-tiny">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {alert.timestamp.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {alert.metric && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {alert.metric}
              </span>
            )}
            {alert.actionRequired && (
              <Badge className="text-red-600-dark border-status-error-light bg-[var(--fl-color-danger-subtle)] px-1.5 py-0.5 text-tiny">
                Action Required
              </Badge>
            )}
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-foreground h-6 w-6 p-0 text-[var(--fl-color-text-muted)]"
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
    const excellentCount = metrics.filter((m: any) => m.status === "excellent").length;
    const criticalCount = metrics.filter((m: any) => m.status === "critical").length;
    const warningCount = metrics.filter((m: any) => m.status === "warning").length;

    return {
      total: totalMetrics,
      excellent: excellentCount,
      critical: criticalCount,
      warning: warningCount,
      healthScore: totalMetrics > 0 ? Math.round((excellentCount / totalMetrics) * 100) : 0,
    };
  }, [metrics]);

  const handleAlertDismiss = (alertId: string) => {
    setVisibleAlerts((prev) => prev.filter((a: any) => a.id !== alertId));
    if (onAlertDismiss) {
      onAlertDismiss(alertId);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-ds-2 text-lg font-bold text-gray-900">
            <Pulse className="h-5 w-5 text-blue-600" />
            Live Performance Monitor
          </h2>
          <p className="text-foreground mt-1 text-sm">Real-time system health and performance metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Score */}
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{summaryStats.healthScore}%</div>
            <div className="text-foreground text-tiny">Health Score</div>
          </div>

          {/* Live Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-ds-lg border px-3 py-1.5",
              isLive
                ? "bg-status-success-light border-status-success-light text-status-success-dark"
                : "border-[var(--fl-color-border)] bg-neutral-50 text-neutral-600"
            )}
          >
            <div className={cn("h-2 w-2 rounded-ds-full", isLive ? "bg-semantic-success" : "bg-neutral-400")} />
            <span className="text-sm font-medium">{isLive ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">Total Metrics</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">Excellent</p>
                <p className="text-semantic-success-dark text-3xl font-bold">{summaryStats.excellent}</p>
              </div>
              <CheckCircle className="text-semantic-success-dark h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{summaryStats.warning}</p>
              </div>
              <Warning className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">Critical</p>
                <p className="text-3xl font-bold text-red-600">{summaryStats.critical}</p>
              </div>
              <Lightning className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <OptimizedAnimatePresence mode="popLayout">
          {metrics.map((metric: any) => (
            <MetricCard key={metric.id} metric={metric} onClick={() => onMetricClick?.(metric)} />
          ))}
        </OptimizedAnimatePresence>
      </div>

      {/* Alerts Section */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-ds-2 text-base font-semibold text-gray-900">
              <Warning className="h-5 w-5 text-red-600" />
              Active Alerts ({visibleAlerts.length})
            </h3>
            {visibleAlerts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleAlerts([])}
                className="text-foreground hover:text-gray-800"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <OptimizedAnimatePresence mode="popLayout">
              {visibleAlerts.map((alert: any) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={() => handleAlertDismiss(alert.id)} />
              ))}
            </OptimizedAnimatePresence>
          </div>
        </div>
      )}

      {/* Last Update Timestamp */}
      <div className="flex items-center justify-center border-t border-[var(--fl-color-border)] pt-4 text-tiny text-[var(--fl-color-text-muted)]">
        <Eye className="mr-1 h-3 w-3" />
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
