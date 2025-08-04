"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import {
  Activity,
  Clock,
  Cpu,
  Database,
  HardDrive as HardDrives,
  Monitor,
  SimCard,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Icon } from "@/lib/ui/Icon";
import { ChartDataPoint, PerformanceMetric } from "./types";
import { formatValue, getStatusColor } from "./utils";

interface MetricCardProps {
  metric: PerformanceMetric;
  chartData?: ChartDataPoint[];
}

export function MetricCard({ metric, chartData }: MetricCardProps) {
  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case "CPU Usage":
        return <Icon icon={Cpu} className="h-5 w-5" />;
      case "Memory Usage":
        return <Icon icon={SimCard} className="h-5 w-5" />;
      case "Disk I/O":
        return <Icon icon={Database} className="h-5 w-5" />;
      case "Network":
        return <Icon icon={WifiHigh} className="h-5 w-5" />;
      case "Avg Response":
        return <Icon icon={Clock} className="h-5 w-5" />;
      case "Uptime":
        return <Icon icon={HardDrives} className="h-5 w-5" />;
      default:
        return <Icon icon={Monitor} className="h-5 w-5" />;
    }
  };

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-ds-lg border spacing-4 transition-all hover:shadow-sm ${getStatusColor(metric.status)}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-ds-2">
          {getMetricIcon(metric.name)}
          <h3 className="text-sm font-medium">{metric.name}</h3>
        </div>
        <Badge variant="outline">
          {metric.trend === "up" && <Icon icon={TrendingUp} className="mr-1 h-3 w-3" />}
          {metric.trend === "down" && <Icon icon={TrendingDown} className="mr-1 h-3 w-3" />}
          {metric.trend === "stable" && <Icon icon={Activity} className="mr-1 h-3 w-3" />}
          {metric.change >= 0 ? "+" : ""}
          {metric.change.toFixed(1)}
        </Badge>
      </div>

      <div className="space-y-spacing-sm">
        <div className="flex items-baseline gap-ds-2">
          <span className="text-3xl font-bold">{formatValue(metric.value, metric.unit)}</span>
          <span className="text-tiny capitalize text-muted-foreground">{metric.status}</span>
        </div>

        {/* Progress bar for percentage metrics */}
        {metric.unit === "%" && (
          <div className="space-y-1">
            <Progress value={metric.value} className="h-2" />
            <div className="flex justify-between text-tiny text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Mini chart visualization */}
        {chartData && chartData.length > 10 && (
          <div className="flex h-8 items-end gap-1">
            {chartData.slice(-20).map((point, index) => {
              const height = Math.max(4, (point.value / Math.max(...chartData.map((p: unknown) => p.value))) * 100);
              return (
                <div
                  key={index}
                  className="flex-1 rounded-ds-sm bg-current opacity-40"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${formatValue(point.value, metric.unit)}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </OptimizedMotion.div>
  );
}
