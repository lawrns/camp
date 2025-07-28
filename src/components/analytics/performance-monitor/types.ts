export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: "excellent" | "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  change: number;
  threshold: {
    excellent: number;
    good: number;
    warning: number;
  };
}

export interface SystemMetrics {
  cpu: PerformanceMetric;
  memory: PerformanceMetric;
  disk: PerformanceMetric;
  network: PerformanceMetric;
  responseTime: PerformanceMetric;
  uptime: PerformanceMetric;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label: string;
}

export type TimeRange = "5m" | "1h" | "6h" | "24h";

export const STATUS_CONFIG = {
  excellent: {
    color: "text-green-600",
    bgColor: "bg-[var(--fl-color-success-subtle)]",
    borderColor: "border-[var(--fl-color-success-muted)]",
  },
  good: {
    color: "text-blue-600",
    bgColor: "bg-[var(--fl-color-info-subtle)]",
    borderColor: "border-[var(--fl-color-info-muted)]",
  },
  warning: {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  critical: {
    color: "text-red-600",
    bgColor: "bg-[var(--fl-color-danger-subtle)]",
    borderColor: "border-[var(--fl-color-danger-muted)]",
  },
} as const;
