"use client";

import React from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Warning as AlertCircle, CheckCircle, Clock, User } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/unified-ui/components/tooltip";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface OperatorStatusBarProps {
  conversationId: string;
  operatorName?: string;
  operatorStatus?: "available" | "busy" | "away" | "offline";
  lastActivityTime?: Date;
  className?: string;
}

const OperatorStatusIndicator: React.FC<{ status?: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "away":
        return "bg-orange-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex items-center gap-ds-2">
      <div className={cn("h-2 w-2 rounded-ds-full", getStatusColor())} />
      <span className="text-tiny capitalize">{status || "Unknown"}</span>
    </div>
  );
};

export const OperatorStatusBar: React.FC<OperatorStatusBarProps> = ({
  conversationId,
  operatorName,
  operatorStatus,
  lastActivityTime,
  className,
}) => {
  return (
    <div className="flex items-center justify-between border-t bg-[var(--fl-color-background-subtle)] px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Operator Info */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <OptimizedMotion.div
                className="bg-background flex items-center gap-ds-2 rounded-ds-full border border-[var(--fl-color-border)] px-3 py-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Icon icon={User} className="text-foreground h-4 w-4" />
                <span className="text-sm font-medium">{operatorName || "Unassigned"}</span>
              </OptimizedMotion.div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-tiny">
                <p className="font-medium">Current operator</p>
                {operatorStatus && <OperatorStatusIndicator status={operatorStatus} />}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Status Indicator */}
        <OptimizedAnimatePresence>
          {operatorStatus && (
            <OptimizedMotion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-ds-md spacing-1.5 transition-all duration-200",
                        operatorStatus === "available" && "text-semantic-success-dark",
                        operatorStatus === "busy" && "text-yellow-600",
                        operatorStatus === "away" && "text-orange-600",
                        operatorStatus === "offline" && "text-gray-400"
                      )}
                    >
                      {operatorStatus === "available" && <Icon icon={CheckCircle} className="h-4 w-4" />}
                      {operatorStatus === "busy" && <Icon icon={Clock} className="h-4 w-4" />}
                      {operatorStatus === "away" && <Icon icon={AlertCircle} className="h-4 w-4" />}
                      {operatorStatus === "offline" && <Icon icon={AlertCircle} className="h-4 w-4" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-tiny">Status: {operatorStatus}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>

        {/* Last Activity */}
        {lastActivityTime && (
          <OptimizedMotion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-tiny text-[var(--fl-color-text-muted)]"
          >
            Last active: {formatRelativeTime(lastActivityTime)}
          </OptimizedMotion.div>
        )}
      </div>

      {/* Right side - Quick shortcuts hint */}
      <div className="flex items-center gap-ds-2 text-tiny text-[var(--fl-color-text-muted)]">
        <kbd className="bg-background rounded border border-[var(--fl-color-border)] px-1.5 py-0.5 font-mono">⌘K</kbd>
        <span>Quick actions</span>
      </div>
    </div>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default OperatorStatusBar;
