"use client";

import React from "react";
import {
  PerformanceMonitor as RefactoredPerformanceMonitor,
  PerformanceWidget as RefactoredPerformanceWidget,
} from "./performance-monitor";

/**
 * Legacy wrapper for PerformanceMonitor - redirects to the refactored version
 * This maintains backward compatibility while the codebase transitions
 */
export function PerformanceMonitor() {
  return <RefactoredPerformanceMonitor />;
}

export function PerformanceWidget() {
  return <RefactoredPerformanceWidget />;
}

// Export types for backward compatibility
export type { PerformanceMetric, SystemMetrics, ChartDataPoint, TimeRange } from "./performance-monitor";

export default PerformanceMonitor;
