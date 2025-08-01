/**
 * Performance Dashboard Component
 *
 * Real-time performance monitoring dashboard for widget consolidation:
 * - Frame rate visualization
 * - Memory usage tracking
 * - Core Web Vitals display
 * - Performance budget status
 * - Network condition monitoring
 * - Optimization recommendations
 */

import React, { useState, useEffect } from "react";
import usePerformanceMonitor from "@/hooks/usePerformanceMonitor";

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function PerformanceDashboard({ isVisible = false, onClose }: PerformanceDashboardProps) {
  const { metrics, getPerformanceSummary, isPerformanceGood } = usePerformanceMonitor({
    enableCoreWebVitals: true,
    enableMemoryTracking: true,
    enableNetworkTracking: true,
  });

  const [summary, setSummary] = useState(getPerformanceSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPerformanceSummary]);

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="bg-background border-ds-border fixed right-4 top-4 z-50 max-h-96 w-80 overflow-y-auto rounded-ds-lg border spacing-3 shadow-card-deep">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Performance Monitor</h3>
        <button
          onClick={onClose}
          className="hover:text-foreground text-gray-400 transition-colors"
          aria-label="Close performance dashboard"
        >
          ✕
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-background mb-4 rounded-ds-lg spacing-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm font-medium">Overall Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(summary.score)}`}>{summary.score}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-ds-full bg-gray-200">
          <div
            className={`h-2 rounded-ds-full transition-all duration-300 ${
              summary.score >= 90 ? "bg-green-500" : summary.score >= 70 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${summary.score}%` }}
          />
        </div>
      </div>

      {/* Frame Rate */}
      <div className="mb-4">
        <h4 className="text-foreground mb-2 text-sm font-medium">Frame Rate</h4>
        <div className="grid grid-cols-2 gap-ds-2 text-sm">
          <div>
            <span className="text-foreground">Current:</span>
            <span className={`ml-1 font-medium ${getMetricColor(metrics.fps || 60, 30)}`}>{metrics.fps || 60} fps</span>
          </div>
          <div>
            <span className="text-foreground">Average:</span>
            <span className={`ml-1 font-medium ${getMetricColor(metrics.averageFps || 60, 30)}`}>
              {(metrics.averageFps || 60).toFixed(1)} fps
            </span>
          </div>
        </div>
        {metrics.shouldReduceAnimations && (
          <div className="mt-1 rounded bg-orange-50 px-2 py-1 text-tiny text-orange-600">
            ⚡ Animations reduced for performance
          </div>
        )}
      </div>

      {/* Core Web Vitals */}
      <div className="mb-4">
        <h4 className="text-foreground mb-2 text-sm font-medium">Core Web Vitals</h4>
        <div className="space-y-spacing-sm text-sm">
          {metrics.lcp && (
            <div className="flex justify-between">
              <span className="text-foreground">LCP:</span>
              <span className={`font-medium ${getMetricColor(metrics.lcp, 4000, true)}`}>
                {metrics.lcp.toFixed(0)}ms
              </span>
            </div>
          )}
          {metrics.fid && (
            <div className="flex justify-between">
              <span className="text-foreground">FID:</span>
              <span className={`font-medium ${getMetricColor(metrics.fid, 100, true)}`}>
                {metrics.fid.toFixed(0)}ms
              </span>
            </div>
          )}
          {metrics.cls !== undefined && (
            <div className="flex justify-between">
              <span className="text-foreground">CLS:</span>
              <span className={`font-medium ${getMetricColor(metrics.cls, 0.1, true)}`}>{metrics.cls.toFixed(3)}</span>
            </div>
          )}
          {metrics.fcp && (
            <div className="flex justify-between">
              <span className="text-foreground">FCP:</span>
              <span className={`font-medium ${getMetricColor(metrics.fcp, 2000, true)}`}>
                {metrics.fcp.toFixed(0)}ms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Memory Usage */}
      {metrics.memoryUsage && (
        <div className="mb-4">
          <h4 className="text-foreground mb-2 text-sm font-medium">Memory Usage</h4>
          <div className="flex justify-between text-sm">
            <span className="text-foreground">JS Heap:</span>
            <span className={`font-medium ${getMetricColor(metrics.memoryUsage / (1024 * 1024), 100, true)}`}>
              {(metrics.memoryUsage / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}

      {/* Network */}
      <div className="mb-4">
        <h4 className="text-foreground mb-2 text-sm font-medium">Network</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground">Type:</span>
            <span className="font-medium">{metrics.connectionType || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground">Online:</span>
            <span className={`font-medium ${metrics.isOnline ? "text-green-600" : "text-red-600"}`}>
              {metrics.isOnline ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Issues and Recommendations */}
      {summary.issues.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-red-700">Issues</h4>
          <ul className="space-y-1 text-tiny text-red-600">
            {summary.issues.map((issue, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1 text-red-500">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-blue-700">Recommendations</h4>
          <ul className="space-y-1 text-tiny text-blue-600">
            {summary.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-ds-brand mr-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance Status */}
      <div
        className={`rounded spacing-2 text-center text-sm font-medium ${
          isPerformanceGood
            ? "border border-[var(--fl-color-success-muted)] bg-green-50 text-green-700"
            : "border border-[var(--fl-color-danger-muted)] bg-red-50 text-red-700"
        }`}
      >
        {isPerformanceGood ? "✅ Performance Good" : "⚠️ Performance Issues"}
      </div>
    </div>
  );
}

// Performance monitoring toggle button
export function PerformanceToggle() {
  const [showDashboard, setShowDashboard] = useState(false);
  const { currentFPS, shouldReduceAnimations } = usePerformanceMonitor();

  // Only show in development or when performance issues are detected
  const shouldShow = process.env.NODE_ENV === "development" || shouldReduceAnimations;

  if (!shouldShow) return null;

  return (
    <>
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className={`fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-ds-full font-bold text-white shadow-lg transition-all ${
          shouldReduceAnimations ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
        title={`Performance Monitor (${currentFPS}fps)`}
        aria-label="Toggle performance dashboard"
      >
        {shouldReduceAnimations ? "⚠️" : "📊"}
      </button>

      <PerformanceDashboard isVisible={showDashboard} onClose={() => setShowDashboard(false)} />
    </>
  );
}

// Hook for performance-aware component rendering
export function usePerformanceAwareRendering() {
  const { shouldReduceAnimations, metrics } = usePerformanceMonitor();

  return {
    shouldReduceAnimations,
    shouldSkipNonEssentialRenders: metrics.averageFps < 20,
    shouldUseSimpleAnimations: metrics.averageFps < 45,
    shouldPreferCSSAnimations: metrics.averageFps < 30,
    currentFPS: metrics.fps || 60,
    isSlowDevice: metrics.isSlowDevice || false,
  };
}

export default PerformanceDashboard;
