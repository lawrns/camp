/**
 * Session Timeout Warning Component
 *
 * Displays user-friendly session timeout warnings with options
 * to extend the session or logout gracefully
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, RefreshCw, LogOut, Shield, CheckCircle, X } from "lucide-react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { cn } from "@/lib/utils";

interface SessionTimeoutWarningProps {
  className?: string;
  variant?: "modal" | "banner" | "toast" | "sidebar";
  showProgress?: boolean;
  showActions?: boolean;
  autoHide?: boolean;
  onExtend?: () => void;
  onLogout?: () => void;
  onDismiss?: () => void;
}

export function SessionTimeoutWarning({
  className,
  variant = "modal",
  showProgress = true,
  showActions = true,
  autoHide = false,
  onExtend,
  onLogout,
  onDismiss,
}: SessionTimeoutWarningProps) {
  const { showWarning, timeRemaining, isExpired, refreshSession, logout, formatTimeRemaining } = useSessionTimeout();

  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-hide after user activity
  useEffect(() => {
    if (autoHide && !showWarning) {
      setIsDismissed(false);
    }
  }, [autoHide, showWarning]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await refreshSession();
      if (success) {
        onExtend?.();
        if (autoHide) {
          setIsDismissed(true);
        }
      }
    } catch (error) {

    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onLogout?.();
    } catch (error) {

    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if not warning, expired, or dismissed
  if (!showWarning || isExpired || isDismissed) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const progressValue = (timeRemaining / (5 * 60 * 1000)) * 100; // Assuming 5 min warning period

  const getUrgencyLevel = () => {
    if (minutes <= 1) return "critical";
    if (minutes <= 2) return "high";
    if (minutes <= 3) return "medium";
    return "low";
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case "critical":
        return "text-red-600 bg-red-50 border-[var(--fl-color-danger-muted)]";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-[var(--fl-color-warning-muted)]";
      default:
        return "text-blue-600 bg-blue-50 border-[var(--fl-color-border-interactive)]";
    }
  };

  const getProgressColor = () => {
    switch (urgencyLevel) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const renderContent = () => (
    <>
      <div className="mb-4 flex items-center space-x-3">
        <div
          className={cn(
            "rounded-ds-full spacing-2",
            urgencyLevel === "critical"
              ? "bg-red-100"
              : urgencyLevel === "high"
                ? "bg-orange-100"
                : urgencyLevel === "medium"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
          )}
        >
          {urgencyLevel === "critical" ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-blue-600" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {urgencyLevel === "critical" ? "Session Expiring Soon!" : "Session Timeout Warning"}
          </h3>
          <p className="text-foreground text-sm">
            Your session will expire in{" "}
            <span className="font-mono font-semibold">{formatTimeRemaining(timeRemaining)}</span>
          </p>
        </div>

        <Badge variant={urgencyLevel === "critical" ? "destructive" : "secondary"}>{urgencyLevel.toUpperCase()}</Badge>
      </div>

      {showProgress && (
        <div className="mb-4">
          <div className="text-foreground mb-2 flex items-center justify-between text-sm">
            <span>Time Remaining</span>
            <span>
              {minutes} minute{minutes !== 1 ? "s" : ""}
            </span>
          </div>
          <Progress
            value={progressValue}
            className="h-2"
            style={
              {
                "--progress-background": getProgressColor(),
              } as React.CSSProperties
            }
          />
        </div>
      )}

      <div className="text-foreground mb-4 text-sm">
        {urgencyLevel === "critical" ? (
          <p>⚠️ Your session is about to expire. Please extend your session or save your work.</p>
        ) : (
          <p>💡 You can extend your session to continue working without interruption.</p>
        )}
      </div>

      {showActions && (
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExtendSession}
            disabled={isExtending || isLoggingOut}
            className="flex-1"
            variant={urgencyLevel === "critical" ? "default" : "outline"}
          >
            {isExtending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Extend Session
              </>
            )}
          </Button>

          <Button onClick={handleLogout} disabled={isExtending || isLoggingOut} variant="outline" className="flex-1">
            {isLoggingOut ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>

          {variant !== "modal" && (
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="px-2">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </>
  );

  // Render based on variant
  switch (variant) {
    case "modal":
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 spacing-3">
          <Card className={cn("w-full max-w-md", getUrgencyColor(), className)}>
            <CardContent className="p-spacing-md">{renderContent()}</CardContent>
          </Card>
        </div>
      );

    case "banner":
      return <div className={cn("mb-4 border-l-4 spacing-4", getUrgencyColor(), className)}>{renderContent()}</div>;

    case "toast":
      return (
        <div className={cn("fixed right-4 top-4 z-50 w-96 rounded-ds-lg border shadow-lg", getUrgencyColor(), className)}>
          <div className="spacing-3">{renderContent()}</div>
        </div>
      );

    case "sidebar":
      return (
        <Card className={cn("border-l-4", getUrgencyColor(), className)}>
          <CardContent className="spacing-3">{renderContent()}</CardContent>
        </Card>
      );

    default:
      return null;
  }
}

// Compact version for status bars
export function SessionTimeoutIndicator({ className }: { className?: string }) {
  const { showWarning, timeRemaining, formatTimeRemaining } = useSessionTimeout();

  if (!showWarning) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const isUrgent = minutes <= 2;

  return (
    <div
      className={cn(
        "flex items-center space-x-2 rounded-ds-full px-3 py-1 text-sm",
        isUrgent ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700",
        className
      )}
    >
      <Clock className="h-4 w-4" />
      <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
      {isUrgent && <AlertTriangle className="h-4 w-4" />}
    </div>
  );
}

// Auto-extending session component for critical operations
export function SessionExtender({
  children,
  onCriticalOperation,
}: {
  children: React.ReactNode;
  onCriticalOperation?: () => void;
}) {
  const { refreshSession, showWarning } = useSessionTimeout();

  useEffect(() => {
    if (showWarning) {
      // Auto-extend session during critical operations
      refreshSession().then(() => {
        onCriticalOperation?.();
      });
    }
  }, [showWarning, refreshSession, onCriticalOperation]);

  return <>{children}</>;
}

// Hook for components that need session extension
export function useSessionExtender() {
  const { refreshSession, updateActivity } = useSessionTimeout();

  const extendOnAction = async (action: () => Promise<any> | any) => {
    updateActivity();
    try {
      const result = await action();
      updateActivity(); // Update again after successful action
      return result;
    } catch (error) {
      // Don't update activity on failed actions
      throw error;
    }
  };

  return {
    extendOnAction,
    refreshSession,
    updateActivity,
  };
}
