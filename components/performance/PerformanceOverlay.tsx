"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, CaretUp, CheckCircle, Clock, Cpu, Database, Globe, Pulse, TrendUp, AlertTriangle, X, XCircle,  } from "lucide-react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { inboxPerformanceMonitor } from "@/lib/performance/inbox-performance-monitor";
import { ReactPerformanceMetrics, reactPerformanceMonitor } from "@/lib/performance/react-performance-monitor";
import { MetricRating, WebVitalsMetrics, webVitalsMonitor } from "@/lib/performance/web-vitals-monitor";
import { cn } from "@/lib/utils";

interface PerformanceOverlayProps {
  enabled?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  defaultExpanded?: boolean;
}

export function PerformanceOverlay({
  enabled = process.env.NODE_ENV === "development",
  position = "bottom-right",
  defaultExpanded = false,
}: PerformanceOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<"vitals" | "react" | "inbox">("vitals");
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});
  const [reactMetrics, setReactMetrics] = useState<ReactPerformanceMetrics | null>(null);
  const [inboxMetrics, setInboxMetrics] = useState<any>(null);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Initialize monitors
    webVitalsMonitor.initialize();

    // Subscribe to updates
    const unsubscribeWebVitals = webVitalsMonitor.subscribe((metrics) => {
      setWebVitals(metrics);
      setPerformanceScore(webVitalsMonitor.getPerformanceScore());
    });

    const unsubscribeReact = reactPerformanceMonitor.subscribe((metrics) => {
      setReactMetrics(metrics);
    });

    const unsubscribeInbox = inboxPerformanceMonitor.subscribe(() => {
      setInboxMetrics(inboxPerformanceMonitor.getPerformanceSummary());
    });

    return () => {
      unsubscribeWebVitals();
      unsubscribeReact();
      unsubscribeInbox();
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const getMetricIcon = (rating: MetricRating) => {
    switch (rating) {
      case "good":
        return <CheckCircle className="text-semantic-success h-3 w-3" />;
      case "needs-improvement":
        return <AlertTriangle className="text-semantic-warning h-3 w-3" />;
      case "poor":
        return <XCircle className="text-brand-mahogany-500 h-3 w-3" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-[var(--fl-color-success-subtle)]";
    if (score >= 70) return "text-yellow-600 bg-[var(--fl-color-warning-subtle)]";
    return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
  };

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          "fixed z-[9999] rounded-ds-lg border border-[var(--fl-color-border)] bg-white shadow-2xl",
          positionClasses[position],
          isExpanded ? "w-96" : "w-48"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] spacing-3">
          <div className="flex items-center gap-ds-2">
            <Pulse className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Performance</span>
            <span
              className={cn("text-typography-xs rounded-ds-full px-2 py-0.5 font-medium", getScoreColor(performanceScore))}
            >
              {performanceScore}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-background rounded spacing-1 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="text-foreground h-4 w-4" />
              ) : (
                <CaretUp className="text-foreground h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="hover:bg-background rounded spacing-1 transition-colors"
            >
              <X className="text-foreground h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <OptimizedMotion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-[var(--fl-color-border)]">
              <button
                onClick={() => setActiveTab("vitals")}
                className={cn(
                  "text-typography-xs flex-1 px-3 py-2 font-medium transition-colors",
                  activeTab === "vitals"
                    ? "border-b-2 border-[var(--fl-color-brand)] text-blue-600"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                Web Vitals
              </button>
              <button
                onClick={() => setActiveTab("react")}
                className={cn(
                  "text-typography-xs flex-1 px-3 py-2 font-medium transition-colors",
                  activeTab === "react"
                    ? "border-b-2 border-[var(--fl-color-brand)] text-blue-600"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                React
              </button>
              <button
                onClick={() => setActiveTab("inbox")}
                className={cn(
                  "text-typography-xs flex-1 px-3 py-2 font-medium transition-colors",
                  activeTab === "inbox"
                    ? "border-b-2 border-[var(--fl-color-brand)] text-blue-600"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                Inbox
              </button>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 space-y-spacing-sm overflow-y-auto spacing-3">
              {activeTab === "vitals" && (
                <div className="space-y-spacing-sm">
                  {/* Core Web Vitals */}
                  <div className="space-y-1">
                    <h4 className="text-foreground text-tiny font-medium">Core Web Vitals</h4>

                    {webVitals.lcp !== undefined && (
                      <MetricRow
                        icon={<Globe className="h-3 w-3" />}
                        label="LCP"
                        value={`${webVitals.lcp.toFixed(0)}ms`}
                        rating={webVitalsMonitor.getRating("lcp", webVitals.lcp)}
                      />
                    )}

                    {webVitals.fid !== undefined && (
                      <MetricRow
                        icon={<Clock className="h-3 w-3" />}
                        label="FID"
                        value={`${webVitals.fid.toFixed(0)}ms`}
                        rating={webVitalsMonitor.getRating("fid", webVitals.fid)}
                      />
                    )}

                    {webVitals.inp !== undefined && (
                      <MetricRow
                        icon={<Clock className="h-3 w-3" />}
                        label="INP"
                        value={`${webVitals.inp.toFixed(0)}ms`}
                        rating={webVitalsMonitor.getRating("inp", webVitals.inp)}
                      />
                    )}

                    {webVitals.cls !== undefined && (
                      <MetricRow
                        icon={<TrendUp className="h-3 w-3" />}
                        label="CLS"
                        value={webVitals.cls.toFixed(3)}
                        rating={webVitalsMonitor.getRating("cls", webVitals.cls)}
                      />
                    )}
                  </div>

                  {/* Other Metrics */}
                  <div className="space-y-1">
                    <h4 className="text-foreground text-tiny font-medium">Other Metrics</h4>

                    {webVitals.fcp !== undefined && (
                      <MetricRow
                        icon={<Pulse className="h-3 w-3" />}
                        label="FCP"
                        value={`${webVitals.fcp.toFixed(0)}ms`}
                        rating={webVitalsMonitor.getRating("fcp", webVitals.fcp)}
                      />
                    )}

                    {webVitals.ttfb !== undefined && (
                      <MetricRow
                        icon={<Globe className="h-3 w-3" />}
                        label="TTFB"
                        value={`${webVitals.ttfb.toFixed(0)}ms`}
                        rating={webVitalsMonitor.getRating("ttfb", webVitals.ttfb)}
                      />
                    )}

                    {webVitals.longTasks !== undefined && (
                      <MetricRow
                        icon={<Cpu className="h-3 w-3" />}
                        label="Long Tasks"
                        value={webVitals.longTasks.toString()}
                        rating={
                          webVitals.longTasks > 5 ? "poor" : webVitals.longTasks > 2 ? "needs-improvement" : "good"
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === "react" && reactMetrics && (
                <div className="space-y-spacing-sm">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-ds-2">
                    <div className="rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm">
                      <p className="text-foreground text-tiny">Total Renders</p>
                      <p className="text-sm font-medium">{reactMetrics.totalRenders}</p>
                    </div>
                    <div className="rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm">
                      <p className="text-foreground text-tiny">Slow Renders</p>
                      <p className="text-sm font-medium">{reactMetrics.slowRenders.length}</p>
                    </div>
                  </div>

                  {/* Top Slow Components */}
                  {reactMetrics.slowRenders.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-foreground text-tiny font-medium">Recent Slow Renders</h4>
                      {reactMetrics.slowRenders
                        .slice(-3)
                        .reverse()
                        .map((render, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded bg-[var(--fl-color-danger-subtle)] px-2 py-1"
                          >
                            <span className="text-foreground flex-1 truncate text-tiny">{render.id}</span>
                            <span className="text-tiny font-medium text-red-600">
                              {render.actualDuration.toFixed(1)}ms
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Render Patterns */}
                  {reactMetrics.renderPatterns.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-foreground text-tiny font-medium">Performance Issues</h4>
                      {reactMetrics.renderPatterns.map((pattern, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded bg-[var(--fl-color-warning-subtle)] px-2 py-1"
                        >
                          <span className="text-foreground flex-1 truncate text-tiny">
                            {pattern.componentId} - {pattern.pattern.replace("-", " ")}
                          </span>
                          <span className="text-tiny font-medium text-yellow-600">{pattern.count}x</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-1">
                    <h4 className="text-foreground text-tiny font-medium">Recommendations</h4>
                    {reactPerformanceMonitor.getRecommendations().map((rec, index) => (
                      <p key={index} className="text-foreground text-tiny">
                        {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "inbox" && inboxMetrics && (
                <div className="space-y-spacing-sm">
                  {/* Performance Metrics */}
                  <div className="space-y-1">
                    <h4 className="text-foreground text-tiny font-medium">Performance Metrics</h4>

                    <MetricRow
                      icon={<Pulse className="h-3 w-3" />}
                      label="Message Render"
                      value={`${inboxMetrics.averageMessageRenderTime.toFixed(1)}ms`}
                      rating={
                        inboxMetrics.averageMessageRenderTime < 16
                          ? "good"
                          : inboxMetrics.averageMessageRenderTime < 50
                            ? "needs-improvement"
                            : "poor"
                      }
                    />

                    <MetricRow
                      icon={<Clock className="h-3 w-3" />}
                      label="Conversation Switch"
                      value={`${inboxMetrics.averageConversationSwitchTime.toFixed(0)}ms`}
                      rating={
                        inboxMetrics.averageConversationSwitchTime < 200
                          ? "good"
                          : inboxMetrics.averageConversationSwitchTime < 500
                            ? "needs-improvement"
                            : "poor"
                      }
                    />

                    <MetricRow
                      icon={<Database className="h-3 w-3" />}
                      label="Message Load"
                      value={`${inboxMetrics.averageMessageLoadTime.toFixed(0)}ms`}
                      rating={
                        inboxMetrics.averageMessageLoadTime < 500
                          ? "good"
                          : inboxMetrics.averageMessageLoadTime < 1000
                            ? "needs-improvement"
                            : "poor"
                      }
                    />

                    <MetricRow
                      icon={<Cpu className="h-3 w-3" />}
                      label="Input Latency"
                      value={`${inboxMetrics.averageInputLatency.toFixed(0)}ms`}
                      rating={
                        inboxMetrics.averageInputLatency < 50
                          ? "good"
                          : inboxMetrics.averageInputLatency < 100
                            ? "needs-improvement"
                            : "poor"
                      }
                    />
                  </div>

                  {/* Memory Usage */}
                  <div className="space-y-1">
                    <h4 className="text-foreground text-tiny font-medium">Memory Usage</h4>
                    <div className="rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm">
                      <p className="text-foreground text-tiny">Total Memory</p>
                      <p className="text-sm font-medium">{inboxMetrics.memoryUsage.toFixed(1)} MB</p>
                    </div>
                  </div>

                  {/* Budget Status */}
                  {inboxMetrics.budgetStatus && inboxMetrics.budgetStatus.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-foreground text-tiny font-medium">Performance Budgets</h4>
                      {inboxMetrics.budgetStatus.map((budget: unknown, index: number) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between rounded px-2 py-1",
                            budget.status === "pass"
                              ? "bg-[var(--fl-color-success-subtle)]"
                              : budget.status === "warning"
                                ? "bg-[var(--fl-color-warning-subtle)]"
                                : "bg-[var(--fl-color-danger-subtle)]"
                          )}
                        >
                          <span className="text-foreground text-tiny">{budget.metric}</span>
                          <div className="flex items-center gap-ds-2">
                            <span
                              className={cn(
                                "text-typography-xs font-medium",
                                budget.status === "pass"
                                  ? "text-semantic-success-dark"
                                  : budget.status === "warning"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              )}
                            >
                              {budget.actual?.toFixed(0)}ms / {budget.budget}ms
                            </span>
                            {getMetricIcon(
                              budget.status === "pass"
                                ? "good"
                                : budget.status === "warning"
                                  ? "needs-improvement"
                                  : "poor"
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </OptimizedMotion.div>
        )}
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  rating: MetricRating;
}

function MetricRow({ icon, label, value, rating }: MetricRowProps) {
  const getMetricIcon = (rating: MetricRating) => {
    switch (rating) {
      case "good":
        return <CheckCircle className="text-semantic-success h-3 w-3" />;
      case "needs-improvement":
        return <AlertTriangle className="text-semantic-warning h-3 w-3" />;
      case "poor":
        return <XCircle className="text-brand-mahogany-500 h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center justify-between rounded bg-[var(--fl-color-background-subtle)] px-2 py-1">
      <div className="flex items-center gap-ds-2">
        <span className="text-[var(--fl-color-text-muted)]">{icon}</span>
        <span className="text-foreground text-tiny">{label}</span>
      </div>
      <div className="flex items-center gap-ds-2">
        <span className="text-tiny font-medium">{value}</span>
        {getMetricIcon(rating)}
      </div>
    </div>
  );
}
