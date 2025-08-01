"use client";

import React, { useEffect, useState } from "react";

interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ showDetails = false, className = "" }) => {
  const [metrics, setMetrics] = useState({
    messageLatency: 0,
    connectionUptime: 0,
    messagesReceived: 0,
    messagesSent: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Simplified performance monitoring
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        connectionUptime: prev.connectionUptime + 1000,
        messageLatency: Math.random() * 100, // Simulated for now
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Performance status indicators
  const getLatencyStatus = () => {
    if (metrics.averageLatency < 100) return { color: "text-[var(--fl-color-success)]", label: "Excellent" };
    if (metrics.averageLatency < 300) return { color: "text-[var(--fl-color-warning)]", label: "Good" };
    return { color: "text-[var(--fl-color-danger)]", label: "Poor" };
  };

  const getConnectionStatus = () => {
    return metrics.isConnected
      ? { color: "text-[var(--fl-color-success)]", label: "Connected" }
      : { color: "text-[var(--fl-color-danger)]", label: "Disconnected" };
  };

  const getChannelUtilization = () => {
    if (metrics.channelUtilization < 50) return { color: "text-[var(--fl-color-success)]", label: "Low" };
    if (metrics.channelUtilization < 80) return { color: "text-[var(--fl-color-warning)]", label: "Medium" };
    return { color: "text-[var(--fl-color-danger)]", label: "High" };
  };

  if (!showDetails && process.env.NODE_ENV === "production") {
    return null; // Hide in production unless explicitly shown
  }

  const latencyStatus = getLatencyStatus();
  const connectionStatus = getConnectionStatus();
  const utilizationStatus = getChannelUtilization();

  return (
    <div className={`text-xs ${className}`}>
      {/* Compact Status Bar */}
      <div className="flex cursor-pointer items-center space-x-spacing-sm" onClick={() => setIsExpanded(!isExpanded)}>
        <div className={`h-2 w-2 rounded-ds-full ${connectionStatus.color.replace("text-", "bg-")}`} />
        <span className={connectionStatus.color}>{connectionStatus.label}</span>
        {metrics.averageLatency > 0 && (
          <>
            <span className="text-gray-400">•</span>
            <span className={latencyStatus.color}>{metrics.averageLatency}ms</span>
          </>
        )}
        <span className="text-gray-400">•</span>
        <span className="text-[var(--fl-color-text-muted)]">{metrics.channelCount} channels</span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 space-y-1 rounded border bg-[var(--fl-color-background-subtle)] p-spacing-sm text-tiny">
          <div className="grid grid-cols-2 gap-ds-2">
            <div>
              <span className="text-foreground">Latency:</span>
              <span className={`ml-1 ${latencyStatus.color}`}>
                {metrics.averageLatency}ms ({latencyStatus.label})
              </span>
            </div>
            <div>
              <span className="text-foreground">Channels:</span>
              <span className={`ml-1 ${utilizationStatus.color}`}>
                {metrics.channelCount}/50 ({utilizationStatus.label})
              </span>
            </div>
            <div>
              <span className="text-foreground">Connection:</span>
              <span className={`ml-1 ${connectionStatus.color}`}>{connectionStatus.label}</span>
            </div>
            <div>
              <span className="text-foreground">Active:</span>
              <span className="text-foreground ml-1">{metrics.activeConnections}</span>
            </div>
          </div>

          {/* Performance Warnings */}
          {metrics.averageLatency > 300 && (
            <div className="rounded bg-[var(--fl-color-danger-subtle)] spacing-1 text-red-600">
              ⚠️ High latency detected. Check connection.
            </div>
          )}

          {metrics.channelUtilization > 80 && (
            <div className="rounded bg-[var(--fl-color-warning-subtle)] spacing-1 text-yellow-600">
              ⚠️ High channel usage. Consider cleanup.
            </div>
          )}

          {!metrics.isConnected && (
            <div className="rounded bg-[var(--fl-color-danger-subtle)] spacing-1 text-red-600">
              ❌ Real-time connection lost. Retrying...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
