/**
 * Performance Monitor Component
 * Real-time performance monitoring and alerting
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Warning as AlertTriangle,
  CheckCircle,
  Clock,
  WifiHigh,
  Lightning as Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/unified-ui/components/Alert";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { errorReporter, type PerformanceMetric } from "@/lib/monitoring/error-reporter";
import { Icon } from "@/lib/ui/Icon";

interface PerformanceData {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  realTimeMetrics: {
    messagesPerSecond: number;
    reconnectCount: number;
    latency: number;
  };
}

interface PerformanceThresholds {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  lcp: number;
  fid: number;
  cls: number;
  messageLatency: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  pageLoadTime: 1000, // 1s
  apiResponseTime: 200, // 200ms
  memoryUsage: 80, // 80%
  lcp: 2500, // 2.5s
  fid: 100, // 100ms
  cls: 0.1, // 0.1
  messageLatency: 200, // 200ms
};

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Collect Core Web Vitals
  const collectCoreWebVitals = useCallback((): Promise<PerformanceData["coreWebVitals"]> => {
    return new Promise((resolve) => {
      const vitals = { lcp: 0, fid: 0, cls: 0 };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1]!;
          vitals.lcp = lastEntry.startTime;
        }
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown).hadRecentInput) {
            clsValue += (entry as unknown).value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ["layout-shift"] });

      // First Input Delay (approximated)
      vitals.fid = 0; // Would be measured on actual user interaction

      setTimeout(() => resolve(vitals), 2000);
    });
  }, []);

  // Measure page load time
  const measurePageLoadTime = useCallback((): number => {
    if (typeof window === "undefined") return 0;

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback((): number => {
    if (typeof window === "undefined" || !(performance as unknown).memory) return 0;

    const memory = (performance as unknown).memory;
    return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  }, []);

  // Measure connection quality
  const measureConnectionQuality = useCallback((): PerformanceData["connectionQuality"] => {
    if (typeof navigator === "undefined" || !(navigator as unknown).connection) return "good";

    const connection = (navigator as unknown).connection;
    const effectiveType = connection.effectiveType;

    switch (effectiveType) {
      case "4g":
        return "excellent";
      case "3g":
        return "good";
      case "2g":
        return "fair";
      default:
        return "poor";
    }
  }, []);

  // Collect all performance metrics
  const collectPerformanceData = useCallback(async (): Promise<void> => {
    try {
      const [coreWebVitals] = await Promise.all([collectCoreWebVitals()]);

      const data: PerformanceData = {
        pageLoadTime: measurePageLoadTime(),
        apiResponseTime: 0, // Would be measured from actual API calls
        memoryUsage: measureMemoryUsage(),
        connectionQuality: measureConnectionQuality(),
        coreWebVitals,
        realTimeMetrics: {
          messagesPerSecond: 0, // Would be measured from WebSocket
          reconnectCount: 0, // Would be tracked from connection events
          latency: 0, // Would be measured from ping/pong
        },
      };

      setPerformanceData(data);

      // Report metrics to Sentry
      reportMetricsToSentry(data);

      // Check for performance issues
      checkPerformanceAlerts(data);
    } catch (error) {

      errorReporter.reportError(error instanceof Error ? error : new Error("Performance monitoring failed"), {
        feature: "performance_monitor",
        action: "collect_data",
      });
    }
  }, [collectCoreWebVitals, measurePageLoadTime, measureMemoryUsage, measureConnectionQuality]);

  // Report metrics to Sentry
  const reportMetricsToSentry = useCallback((data: PerformanceData): void => {
    const metrics: PerformanceMetric[] = [
      {
        name: "page_load_time",
        value: data.pageLoadTime,
        unit: "ms",
        threshold: DEFAULT_THRESHOLDS.pageLoadTime,
      },
      {
        name: "memory_usage",
        value: data.memoryUsage,
        unit: "percentage",
        threshold: DEFAULT_THRESHOLDS.memoryUsage,
      },
      {
        name: "lcp",
        value: data.coreWebVitals.lcp,
        unit: "ms",
        threshold: DEFAULT_THRESHOLDS.lcp,
      },
      {
        name: "cls",
        value: data.coreWebVitals.cls,
        unit: "count",
        threshold: DEFAULT_THRESHOLDS.cls,
      },
    ];

    metrics.forEach((metric) => {
      errorReporter.reportPerformance(metric);
    });
  }, []);

  // Check for performance alerts
  const checkPerformanceAlerts = useCallback((data: PerformanceData): void => {
    const newAlerts: string[] = [];

    if (data.pageLoadTime > DEFAULT_THRESHOLDS.pageLoadTime) {
      newAlerts.push(`Page load time (${data.pageLoadTime}ms) exceeds threshold`);
    }

    if (data.memoryUsage > DEFAULT_THRESHOLDS.memoryUsage) {
      newAlerts.push(`Memory usage (${data.memoryUsage.toFixed(1)}%) is high`);
    }

    if (data.coreWebVitals.lcp > DEFAULT_THRESHOLDS.lcp) {
      newAlerts.push(`LCP (${data.coreWebVitals.lcp}ms) needs improvement`);
    }

    if (data.coreWebVitals.cls > DEFAULT_THRESHOLDS.cls) {
      newAlerts.push(`CLS (${data.coreWebVitals.cls.toFixed(3)}) indicates layout instability`);
    }

    setAlerts(newAlerts);
  }, []);

  // Start monitoring
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(collectPerformanceData, 30000); // Every 30 seconds
      collectPerformanceData(); // Initial collection

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isMonitoring, collectPerformanceData]);

  // Auto-start monitoring in production
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      setIsMonitoring(true);
    }
  }, []);

  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Icon icon={Activity} className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-2 border-fl-border border-t-fl-brand" />
              <p className="text-fl-text-muted">Collecting performance data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? "text-fl-success" : "text-fl-error";
  };

  const getStatusIcon = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? CheckCircle : AlertTriangle;
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <Icon icon={AlertTriangle} className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {alerts.map((alert, index) => (
                <div key={index}>{alert}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Core Metrics */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Page Load Time */}
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fl-text-muted">Page Load</p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(performanceData.pageLoadTime, DEFAULT_THRESHOLDS.pageLoadTime, true)}`}
                >
                  {performanceData.pageLoadTime}ms
                </p>
              </div>
              <Icon icon={Clock} className="h-8 w-8 text-fl-text-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-fl-text-muted">Memory Usage</p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(performanceData.memoryUsage, DEFAULT_THRESHOLDS.memoryUsage)}`}
                >
                  {performanceData.memoryUsage.toFixed(1)}%
                </p>
                <Progress value={performanceData.memoryUsage} className="mt-2" />
              </div>
              <Icon icon={Activity} className="h-8 w-8 text-fl-text-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Connection Quality */}
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fl-text-muted">Connection</p>
                <Badge variant={performanceData.connectionQuality === "excellent" ? "default" : "secondary"}>
                  {performanceData.connectionQuality}
                </Badge>
              </div>
              <Icon icon={WifiHigh} className="h-8 w-8 text-fl-text-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Core Web Vitals Score */}
        <Card>
          <CardContent className="spacing-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fl-text-muted">Web Vitals</p>
                <div className="flex items-center gap-1">
                  {React.createElement(getStatusIcon(performanceData.coreWebVitals.lcp, DEFAULT_THRESHOLDS.lcp, true), {
                    className: `h-4 w-4 ${getStatusColor(performanceData.coreWebVitals.lcp, DEFAULT_THRESHOLDS.lcp, true)}`,
                  })}
                  {React.createElement(getStatusIcon(performanceData.coreWebVitals.cls, DEFAULT_THRESHOLDS.cls, true), {
                    className: `h-4 w-4 ${getStatusColor(performanceData.coreWebVitals.cls, DEFAULT_THRESHOLDS.cls, true)}`,
                  })}
                </div>
              </div>
              <Icon icon={Zap} className="h-8 w-8 text-fl-text-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Largest Contentful Paint</span>
                <span
                  className={`text-sm ${getStatusColor(performanceData.coreWebVitals.lcp, DEFAULT_THRESHOLDS.lcp, true)}`}
                >
                  {performanceData.coreWebVitals.lcp}ms
                </span>
              </div>
              <Progress value={(performanceData.coreWebVitals.lcp / DEFAULT_THRESHOLDS.lcp) * 100} className="h-2" />
              <p className="mt-1 text-tiny text-fl-text-muted">Target: &lt; {DEFAULT_THRESHOLDS.lcp}ms</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">First Input Delay</span>
                <span
                  className={`text-sm ${getStatusColor(performanceData.coreWebVitals.fid, DEFAULT_THRESHOLDS.fid, true)}`}
                >
                  {performanceData.coreWebVitals.fid}ms
                </span>
              </div>
              <Progress value={(performanceData.coreWebVitals.fid / DEFAULT_THRESHOLDS.fid) * 100} className="h-2" />
              <p className="mt-1 text-tiny text-fl-text-muted">Target: &lt; {DEFAULT_THRESHOLDS.fid}ms</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Cumulative Layout Shift</span>
                <span
                  className={`text-sm ${getStatusColor(performanceData.coreWebVitals.cls, DEFAULT_THRESHOLDS.cls, true)}`}
                >
                  {performanceData.coreWebVitals.cls.toFixed(3)}
                </span>
              </div>
              <Progress value={(performanceData.coreWebVitals.cls / DEFAULT_THRESHOLDS.cls) * 100} className="h-2" />
              <p className="mt-1 text-tiny text-fl-text-muted">Target: &lt; {DEFAULT_THRESHOLDS.cls}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
