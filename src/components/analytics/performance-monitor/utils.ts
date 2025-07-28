import { PerformanceMetric, STATUS_CONFIG, SystemMetrics } from "./types";

export const generatePerformanceData = (): SystemMetrics => {
  return {
    cpu: {
      name: "CPU Usage",
      value: 35 + Math.random() * 30,
      unit: "%",
      status: "good",
      trend: Math.random() > 0.5 ? "up" : "down",
      change: (Math.random() - 0.5) * 10,
      threshold: { excellent: 30, good: 60, warning: 80 },
    },
    memory: {
      name: "Memory Usage",
      value: 45 + Math.random() * 25,
      unit: "%",
      status: "good",
      trend: Math.random() > 0.5 ? "up" : "down",
      change: (Math.random() - 0.5) * 8,
      threshold: { excellent: 40, good: 70, warning: 85 },
    },
    disk: {
      name: "Disk I/O",
      value: 15 + Math.random() * 20,
      unit: "MB/s",
      status: "excellent",
      trend: "stable",
      change: (Math.random() - 0.5) * 5,
      threshold: { excellent: 25, good: 50, warning: 75 },
    },
    network: {
      name: "Network",
      value: 125 + Math.random() * 75,
      unit: "Mbps",
      status: "excellent",
      trend: "up",
      change: Math.random() * 15,
      threshold: { excellent: 100, good: 50, warning: 25 },
    },
    responseTime: {
      name: "Avg Response",
      value: 120 + Math.random() * 80,
      unit: "ms",
      status: "good",
      trend: Math.random() > 0.5 ? "up" : "down",
      change: (Math.random() - 0.5) * 20,
      threshold: { excellent: 150, good: 300, warning: 500 },
    },
    uptime: {
      name: "Uptime",
      value: 99.8 + Math.random() * 0.15,
      unit: "%",
      status: "excellent",
      trend: "stable",
      change: Math.random() * 0.1,
      threshold: { excellent: 99.5, good: 98, warning: 95 },
    },
  };
};

export const getMetricStatus = (metric: PerformanceMetric): PerformanceMetric["status"] => {
  const { value, threshold } = metric;

  if (metric.name === "Avg Response") {
    // Lower is better for response time
    if (value <= threshold.excellent) return "excellent";
    if (value <= threshold.good) return "good";
    if (value <= threshold.warning) return "warning";
    return "critical";
  }

  if (metric.name === "Uptime") {
    // Higher is better for uptime
    if (value >= threshold.excellent) return "excellent";
    if (value >= threshold.good) return "good";
    if (value >= threshold.warning) return "warning";
    return "critical";
  }

  // For CPU, Memory, etc. - lower is generally better
  if (value <= threshold.excellent) return "excellent";
  if (value <= threshold.good) return "good";
  if (value <= threshold.warning) return "warning";
  return "critical";
};

export const formatValue = (value: number, unit: string) => {
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }
  if (unit === "ms") {
    return `${Math.round(value)}ms`;
  }
  if (unit === "MB/s") {
    return `${value.toFixed(1)} MB/s`;
  }
  if (unit === "Mbps") {
    return `${Math.round(value)} Mbps`;
  }
  return `${value.toFixed(2)} ${unit}`;
};

export const getStatusColor = (status: PerformanceMetric["status"]) => {
  const config = STATUS_CONFIG[status];
  return `${config.color} ${config.bgColor} ${config.borderColor}`;
};

export const getOverallStatus = (metrics: SystemMetrics): PerformanceMetric["status"] => {
  const statuses = Object.values(metrics).map((m: any) => m.status);
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  if (statuses.includes("good")) return "good";
  return "excellent";
};
