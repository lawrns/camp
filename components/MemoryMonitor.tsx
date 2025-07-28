"use client";

/**
 * Memory Monitor Component
 *
 * Visual component for displaying real-time memory usage
 * Can be added to any dashboard page for monitoring
 */

import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { useMemoryMonitor } from "@/hooks/useMemoryMonitor";
import { Icon } from "@/lib/ui/Icon";
import { ChartLine as Activity, Warning as AlertTriangle } from "@phosphor-icons/react";
import React from "react";

interface MemoryMonitorProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  compact = false,
  showDetails = true,
  className = "",
}) => {
  const { memoryStats, isWarning, isCritical } = useMemoryMonitor({
    interval: 2000,
    warningThreshold: 70,
    criticalThreshold: 85,
  });

  if (!memoryStats) {
    return null;
  }

  const getStatusColor = () => {
    if (isCritical) return "text-red-600 bg-[var(--fl-color-danger-subtle)]";
    if (isWarning) return "text-yellow-600 bg-[var(--fl-color-warning-subtle)]";
    return "text-green-600 bg-[var(--fl-color-success-subtle)]";
  };

  const getProgressColor = () => {
    if (isCritical) return "bg-red-600";
    if (isWarning) return "bg-yellow-600";
    return "bg-green-600";
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 rounded-ds-lg spacing-2 ${getStatusColor()} ${className}`}>
        <Icon icon={Activity} className="h-4 w-4" />
        <span className="text-sm font-medium">Memory: {memoryStats.percentUsed}</span>
      </div>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-ds-2 text-base">
          <Icon icon={Activity} className="h-5 w-5 text-blue-600" />
          Memory Monitor
          {isCritical && (
            <Badge variant="error" className="ml-auto">
              <Icon icon={AlertTriangle} className="mr-1 h-3 w-3" />
              Critical
            </Badge>
          )}
          {isWarning && !isCritical && (
            <Badge variant="secondary" className="ml-auto bg-[var(--fl-color-warning-subtle)] text-yellow-800">
              <Icon icon={AlertTriangle} className="mr-1 h-3 w-3" />
              Warning
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">Memory Usage</span>
            <span className="text-sm text-[var(--fl-color-text-muted)]">{memoryStats.percentUsed}</span>
          </div>
          <Progress value={parseFloat(memoryStats.percentUsed)} className={`h-3 ${getProgressColor()}`} />
        </div>

        {showDetails && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mb-1 text-tiny uppercase tracking-wide text-[var(--fl-color-text-muted)]">Used</div>
              <div className="text-sm font-semibold text-gray-900">{memoryStats.used}</div>
            </div>
            <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mb-1 text-tiny uppercase tracking-wide text-[var(--fl-color-text-muted)]">Total</div>
              <div className="text-sm font-semibold text-gray-900">{memoryStats.total}</div>
            </div>
            <div className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <div className="mb-1 text-tiny uppercase tracking-wide text-[var(--fl-color-text-muted)]">Limit</div>
              <div className="text-sm font-semibold text-gray-900">{memoryStats.limit}</div>
            </div>
          </div>
        )}

        {(isWarning || isCritical) && (
          <div className={`rounded-ds-lg spacing-3 ${getStatusColor()}`}>
            <div className="flex items-start gap-ds-2">
              <Icon icon={AlertTriangle} className="mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm font-medium">{isCritical ? "Critical Memory Usage" : "High Memory Usage"}</p>
                <p className="mt-1 text-tiny opacity-90">
                  Consider refreshing the page or closing unused tabs to free up memory.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Floating memory monitor for development
export const FloatingMemoryMonitor: React.FC = () => {
  const { memoryStats, isWarning, isCritical } = useMemoryMonitor({
    interval: 1000,
  });

  if (!memoryStats || process.env.NODE_ENV === "production") {
    return null;
  }

  const getBackgroundColor = () => {
    if (isCritical) return "bg-red-600";
    if (isWarning) return "bg-yellow-600";
    return "bg-green-600";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${getBackgroundColor()} flex items-center gap-2 rounded-ds-lg px-3 py-2 text-white shadow-lg`}>
        <Icon icon={Activity} className="h-4 w-4" />
        <span className="font-mono text-sm">
          {memoryStats.percentUsed} • {memoryStats.used}
        </span>
      </div>
    </div>
  );
};
