"use client";

import { Card } from "@/components/ui/card";
import { Icon } from "@/lib/ui/Icon";
import {
  Activity,
  Monitor,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SystemMetrics } from "./types";
import { generatePerformanceData, getMetricStatus } from "./utils";

export function PerformanceWidget() {
  const [metrics, setMetrics] = useState<SystemMetrics>(generatePerformanceData());

  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = generatePerformanceData();
      Object.keys(newMetrics).forEach((key: unknown) => {
        const metric = newMetrics[key as keyof SystemMetrics];
        metric.status = getMetricStatus(metric);
      });
      setMetrics(newMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const criticalCount = Object.values(metrics).filter((m: unknown) => m.status === "critical").length;
  const warningCount = Object.values(metrics).filter((m: unknown) => m.status === "warning").length;

  return (
    <Card className="spacing-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-ds-2 text-sm font-medium">
          <Icon icon={Monitor} className="h-4 w-4" />
          System Health
        </h3>
        <div className="bg-semantic-success h-2 w-2 animate-pulse rounded-ds-full" />
      </div>

      <div className="space-y-spacing-sm">
        {criticalCount > 0 && (
          <div className="flex items-center gap-ds-2 text-red-600">
            <Icon icon={TrendingDown} className="h-3 w-3" />
            <span className="text-tiny">
              {criticalCount} critical issue{criticalCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {warningCount > 0 && (
          <div className="flex items-center gap-ds-2 text-orange-600">
            <Icon icon={Activity} className="h-3 w-3" />
            <span className="text-tiny">
              {warningCount} warning{warningCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {criticalCount === 0 && warningCount === 0 && (
          <div className="text-semantic-success-dark flex items-center gap-ds-2">
            <Icon icon={TrendingUp} className="h-3 w-3" />
            <span className="text-tiny">All systems healthy</span>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-ds-2 text-tiny text-muted-foreground">
          <div>CPU: {metrics.cpu.value.toFixed(1)}%</div>
          <div>Memory: {metrics.memory.value.toFixed(1)}%</div>
          <div>Response: {Math.round(metrics.responseTime.value)}ms</div>
          <div>Uptime: {metrics.uptime.value.toFixed(1)}%</div>
        </div>
      </div>
    </Card>
  );
}
