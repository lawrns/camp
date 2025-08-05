"use client";

import React, { useState } from "react";
import { AlertTriangle as AlertTriangle, Clock, TrendUp as TrendingUp, Zap as Zap } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface PriorityManagementProps {
  conversationId: string;
  currentPriority: "low" | "medium" | "high" | "urgent";
  slaStatus?: "on_track" | "at_risk" | "overdue";
  timeRemaining?: number; // in milliseconds
  onPriorityChange: (priority: "low" | "medium" | "high" | "urgent", reason?: string) => void;
  className?: string;
}

const priorityConfig = {
  low: {
    label: "Low",
    color: "bg-gray-100 text-gray-800 border-[var(--fl-color-border)]",
    icon: Clock,
    slaHours: 48,
    description: "Non-urgent issues",
  },
  medium: {
    label: "Medium",
    color: "bg-blue-100 text-blue-800 border-[var(--fl-color-info-muted)]",
    icon: TrendingUp,
    slaHours: 24,
    description: "Standard priority",
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    slaHours: 8,
    description: "Important issues",
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-100 text-red-800 border-[var(--fl-color-danger-muted)]",
    icon: Zap,
    slaHours: 4,
    description: "Critical issues",
  },
};

const slaStatusConfig = {
  on_track: {
    label: "On Track",
    color: "text-green-600",
    bgColor: "bg-[var(--fl-color-success-subtle)]",
  },
  at_risk: {
    label: "At Risk",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-600",
    bgColor: "bg-[var(--fl-color-danger-subtle)]",
  },
};

export function PriorityManagement({
  conversationId,
  currentPriority,
  slaStatus = "on_track",
  timeRemaining,
  onPriorityChange,
  className,
}: PriorityManagementProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(currentPriority);

  const currentConfig = priorityConfig[currentPriority];
  const CurrentIcon = currentConfig.icon;

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Overdue";

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePriorityChange = async () => {
    if (selectedPriority === currentPriority) return;

    setIsChanging(true);
    try {
      await onPriorityChange(selectedPriority, `Priority changed from ${currentPriority} to ${selectedPriority}`);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
          <CurrentIcon className="h-4 w-4" />
          Priority Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Priority Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-ds-2">
            <Badge className={cn("text-typography-xs border px-2 py-1", currentConfig.color)}>
              {currentConfig.label}
            </Badge>
            <span className="text-foreground text-sm">SLA: {currentConfig.slaHours}h</span>
          </div>

          {/* SLA Status */}
          {slaStatus && (
            <div
              className={cn(
                "text-typography-xs rounded-ds-md px-2 py-1 font-medium",
                slaStatusConfig[slaStatus].color,
                slaStatusConfig[slaStatus].bgColor
              )}
            >
              {slaStatusConfig[slaStatus].label}
            </div>
          )}
        </div>

        {/* Time Remaining */}
        {timeRemaining !== undefined && (
          <div className="flex items-center gap-ds-2 text-sm">
            <Icon icon={Clock} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
            <span
              className={cn(
                "font-medium",
                timeRemaining <= 0
                  ? "text-red-600"
                  : timeRemaining < 2 * 60 * 60 * 1000
                    ? "text-orange-600"
                    : "text-gray-600"
              )}
            >
              {formatTimeRemaining(timeRemaining)}
            </span>
            <span className="text-[var(--fl-color-text-muted)]">remaining</span>
          </div>
        )}

        {/* Priority Change Controls */}
        <div className="space-y-3 border-t pt-2">
          <div className="space-y-spacing-sm">
            <label className="text-sm font-medium">Change Priority</label>
            <Select value={selectedPriority} onValueChange={(value: unknown) => setSelectedPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-ds-2">
                      <config.icon className="h-4 w-4" />
                      <Badge className={cn("text-xs", config.color)}>{config.label}</Badge>
                      <span className="text-foreground text-sm">({config.slaHours}h SLA)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPriority !== currentPriority && (
            <Button onClick={handlePriorityChange} disabled={isChanging} size="sm" className="w-full">
              {isChanging ? "Updating..." : `Update to ${priorityConfig[selectedPriority].label}`}
            </Button>
          )}
        </div>

        {/* Priority Guidelines */}
        <div className="space-y-1 border-t pt-2 text-tiny text-[var(--fl-color-text-muted)]">
          <div className="font-medium">Priority Guidelines:</div>
          {Object.entries(priorityConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-ds-2">
              <Badge className={cn("text-typography-xs px-1 py-0", config.color)}>{config.label}</Badge>
              <span>{config.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PriorityManagement;
