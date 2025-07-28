"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Activity, Warning as AlertTriangle, CheckCircle, Clock, Lightning as Zap } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showFloating?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === "development",
  showFloating = false,
  onMetricsUpdate,
  className,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let observer: PerformanceObserver | null = null;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      const fcp = paint.find((entry) => entry.name === "first-contentful-paint")?.startTime || 0;
      const ttfb = navigation?.responseStart - navigation?.requestStart || 0;

      // Estimate memory usage (if available)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0; // MB

      // Estimate render time
      const renderTime = performance.now();

      const newMetrics: PerformanceMetrics = {
        lcp: 0, // Will be updated by observer
        fid: 0, // Will be updated by observer
        cls: 0, // Will be updated by observer
        fcp,
        ttfb,
        renderTime,
        memoryUsage,
        bundleSize: 0, // Would need to be calculated separately
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    };

    // Set up Performance Observer for Core Web Vitals
    if ("PerformanceObserver" in window) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          setMetrics((prev) => {
            if (!prev) return prev;

            const updated = { ...prev };

            switch (entry.entryType) {
              case "largest-contentful-paint":
                updated.lcp = entry.startTime;
                break;
              case "first-input":
                updated.fid = (entry as any).processingStart - entry.startTime;
                break;
              case "layout-shift":
                if (!(entry as any).hadRecentInput) {
                  updated.cls += (entry as any).value;
                }
                break;
            }

            onMetricsUpdate?.(updated);
            return updated;
          });
        }
      });

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"] });
      } catch (error) {}
    }

    // Initial measurement
    measurePerformance();
    setIsVisible(true);

    // Periodic updates
    const interval = setInterval(measurePerformance, 5000);

    return () => {
      clearInterval(interval);
      observer?.disconnect();
    };
  }, [enabled, onMetricsUpdate]);

  const getMetricStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.poor) return "needs-improvement";
    return "poor";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-[var(--fl-color-success-subtle)] border-[var(--fl-color-success-muted)]";
      case "needs-improvement":
        return "text-yellow-600 bg-[var(--fl-color-warning-subtle)] border-[var(--fl-color-warning-muted)]";
      case "poor":
        return "text-red-600 bg-[var(--fl-color-danger-subtle)] border-[var(--fl-color-danger-muted)]";
      default:
        return "text-gray-600 bg-[var(--fl-color-background-subtle)] border-[var(--fl-color-border)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return CheckCircle;
      case "needs-improvement":
        return Clock;
      case "poor":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  if (!enabled || !metrics) return null;

  const coreWebVitals = [
    {
      name: "LCP",
      label: "Largest Contentful Paint",
      value: metrics.lcp,
      unit: "ms",
      thresholds: { good: 2500, poor: 4000 },
      description: "Loading performance",
    },
    {
      name: "FID",
      label: "First Input Delay",
      value: metrics.fid,
      unit: "ms",
      thresholds: { good: 100, poor: 300 },
      description: "Interactivity",
    },
    {
      name: "CLS",
      label: "Cumulative Layout Shift",
      value: metrics.cls,
      unit: "",
      thresholds: { good: 0.1, poor: 0.25 },
      description: "Visual stability",
    },
  ];

  const additionalMetrics = [
    {
      name: "FCP",
      label: "First Contentful Paint",
      value: metrics.fcp,
      unit: "ms",
    },
    {
      name: "TTFB",
      label: "Time to First Byte",
      value: metrics.ttfb,
      unit: "ms",
    },
    {
      name: "Memory",
      label: "Memory Usage",
      value: metrics.memoryUsage,
      unit: "MB",
    },
  ];

  if (showFloating) {
    return (
      <OptimizedAnimatePresence>
        {isVisible && (
          <OptimizedMotion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <Card className="bg-background/95 border shadow-card-deep backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-ds-2">
                    <Icon icon={Activity} className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">Performance</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-6 w-6 p-0"
                  >
                    {isCollapsed ? "+" : "−"}
                  </Button>
                </div>
              </CardHeader>

              <OptimizedAnimatePresence>
                {!isCollapsed && (
                  <OptimizedMotion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-spacing-sm pt-0">
                      {coreWebVitals.map((metric: any) => {
                        const status = getStatusStatus(metric.value, metric.thresholds);
                        const StatusIcon = getStatusIcon(status);

                        return (
                          <div key={metric.name} className="flex items-center justify-between text-tiny">
                            <div className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              <span>{metric.name}</span>
                            </div>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
                              {metric.value.toFixed(metric.name === "CLS" ? 3 : 0)}
                              {metric.unit}
                            </Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </OptimizedMotion.div>
                )}
              </OptimizedAnimatePresence>
            </Card>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>
    );
  }

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2">
          <Icon icon={Zap} className="h-5 w-5 text-blue-600" />
          Performance Metrics
        </CardTitle>
        <CardDescription>Core Web Vitals and performance indicators for the Campfire inbox</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Core Web Vitals */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Core Web Vitals</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {coreWebVitals.map((metric: any) => {
              const status = getMetricStatus(metric.value, metric.thresholds);
              const StatusIcon = getStatusIcon(status);
              const percentage = Math.min((metric.value / metric.thresholds.poor) * 100, 100);

              return (
                <div key={metric.name} className={cn("rounded-ds-lg border spacing-3", getStatusColor(status))}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-ds-2">
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <Badge variant="outline">
                      {metric.value.toFixed(metric.name === "CLS" ? 3 : 0)}
                      {metric.unit}
                    </Badge>
                  </div>
                  <div className="mb-2 text-tiny text-muted-foreground">{metric.description}</div>
                  <Progress value={percentage} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Metrics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Additional Metrics</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {additionalMetrics.map((metric: any) => (
              <div key={metric.name} className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                <div className="text-tiny text-muted-foreground">{metric.label}</div>
                <div className="text-base font-semibold">
                  {metric.value.toFixed(1)}
                  {metric.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="text-tiny text-muted-foreground">
          <p>
            <strong>Good:</strong> Green metrics meet performance targets. <strong>Needs Improvement:</strong> Yellow
            metrics could be optimized. <strong>Poor:</strong> Red metrics need immediate attention.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to avoid duplication
function getStatusStatus(value: number, thresholds: { good: number; poor: number }) {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}
