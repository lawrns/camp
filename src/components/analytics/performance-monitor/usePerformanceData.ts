"use client";

import { useEffect, useState } from "react";
import { ChartDataPoint, SystemMetrics } from "./types";
import { generatePerformanceData, getMetricStatus } from "./utils";

export function usePerformanceData(isMonitoring: boolean, updateInterval = 3000) {
  const [metrics, setMetrics] = useState<SystemMetrics>(generatePerformanceData());
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({});

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetrics = generatePerformanceData();

      // Update metric status
      Object.keys(newMetrics).forEach((key: unknown) => {
        const metric = newMetrics[key as keyof SystemMetrics];
        metric.status = getMetricStatus(metric);
      });

      setMetrics(newMetrics);

      // Update chart data
      const timestamp = Date.now();
      setChartData((prev) => {
        const updated = { ...prev };

        Object.keys(newMetrics).forEach((key: unknown) => {
          const metric = newMetrics[key as keyof SystemMetrics];
          if (!updated[key]) updated[key] = [];

          updated[key] = [
            ...updated[key].slice(-59), // Keep last 60 points
            {
              timestamp,
              value: metric.value,
              label: new Date(timestamp).toLocaleTimeString(),
            },
          ];
        });

        return updated;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, updateInterval]);

  return { metrics, chartData };
}
