/**
 * Comprehensive Loading Components
 *
 * Loading indicators, progress bars, and loading states
 * with accessibility and responsive design
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/hooks/useLoadingState";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import React from "react";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

export function LoadingSpinner({ size = "md", variant = "default", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const variantClasses = {
    default: "text-gray-500",
    primary: "text-blue-600",
    secondary: "text-gray-400",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], variantClasses[variant], className)}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

export function LoadingDots({ size = "md", variant = "default", className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const variantClasses = {
    default: "bg-gray-500",
    primary: "bg-blue-600",
    secondary: "bg-gray-400",
  };

  return (
    <div className={cn("flex space-x-1", className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn("animate-pulse rounded-ds-full", sizeClasses[size], variantClasses[variant])}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );
}

interface LoadingProgressProps {
  progress: number;
  stage?: string;
  showPercentage?: boolean;
  showStage?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function LoadingProgress({
  progress,
  stage,
  showPercentage = true,
  showStage = true,
  variant = "default",
  className,
}: LoadingProgressProps) {
  const variantClasses = {
    default: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showStage && stage && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{stage}</span>
          {showPercentage && (
            <span className={cn("font-medium", variantClasses[variant])}>{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <Progress value={progress} className="h-2" aria-label={`Loading progress: ${Math.round(progress)}%`} />
    </div>
  );
}

interface LoadingStateDisplayProps {
  loadingState: LoadingState;
  showDuration?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function LoadingStateDisplay({
  loadingState,
  showDuration = true,
  showRetry = true,
  onRetry,
  className,
}: LoadingStateDisplayProps) {
  const { isLoading, progress, stage, error, duration } = loadingState;

  if (error) {
    return (
      <Card className={cn("border-[var(--fl-color-danger-muted)] bg-red-50", className)}>
        <CardContent className="spacing-3">
          <div className="flex items-center space-x-3">
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Operation Failed</p>
              <p className="mt-1 text-sm text-red-600">{(error instanceof Error ? error.message : String(error))}</p>
              {showDuration && duration > 0 && (
                <p className="mt-1 text-tiny text-red-500">Failed after {(duration / 1000).toFixed(1)}s</p>
              )}
            </div>
            {showRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-[var(--fl-color-danger-muted)] text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && progress === 100) {
    return (
      <Card className={cn("border-[var(--fl-color-success-muted)] bg-green-50", className)}>
        <CardContent className="spacing-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Completed Successfully</p>
              {showDuration && duration > 0 && (
                <p className="mt-1 text-tiny text-green-600">Completed in {(duration / 1000).toFixed(1)}s</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("border-[var(--fl-color-border-interactive)] bg-blue-50", className)}>
        <CardContent className="spacing-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="sm" variant="primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{stage}</p>
                {showDuration && duration > 0 && (
                  <p className="mt-1 text-tiny text-blue-600">{(duration / 1000).toFixed(1)}s elapsed</p>
                )}
              </div>
            </div>
            {progress > 0 && (
              <LoadingProgress progress={progress} showPercentage={true} showStage={false} variant="primary" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  stage?: string;
  progress?: number;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  stage = "Loading...",
  progress,
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <Card className="w-full max-w-sm">
            <CardContent className="p-spacing-md">
              <div className="space-y-3 text-center">
                <LoadingSpinner size="lg" variant="primary" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{stage}</p>
                  {progress !== undefined && (
                    <div className="mt-3">
                      <LoadingProgress progress={progress} showStage={false} showPercentage={true} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoadingButton({ isLoading, loadingText, children, disabled, className, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} className={className} {...props}>
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {isLoading ? loadingText || "Loading..." : children}
    </Button>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  stage?: string;
  progress?: number;
  duration?: number;
  className?: string;
}

export function LoadingCard({
  title = "Loading",
  description,
  stage,
  progress,
  duration,
  className,
}: LoadingCardProps) {
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" variant="primary" />
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {stage && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{stage}</span>
            {duration && duration > 0 && (
              <Badge variant="secondary" className="text-tiny">
                <Clock className="mr-1 h-3 w-3" />
                {(duration / 1000).toFixed(1)}s
              </Badge>
            )}
          </div>
        )}
        {progress !== undefined && <LoadingProgress progress={progress} showStage={false} showPercentage={true} />}
      </CardContent>
    </Card>
  );
}

interface LoadingListProps {
  items: Array<{
    id: string;
    label: string;
    status: "pending" | "loading" | "success" | "error";
    error?: string;
  }>;
  className?: string;
}

export function LoadingList({ items, className }: LoadingListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading":
        return <LoadingSpinner size="sm" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loading":
        return "text-blue-700 bg-blue-50";
      case "success":
        return "text-green-700 bg-green-50";
      case "error":
        return "text-red-700 bg-red-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn("flex items-center space-x-3 rounded-ds-lg border spacing-3", getStatusColor(item.status))}
        >
          {getStatusIcon(item.status)}
          <div className="flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            {item.error && item.status === "error" && <p className="mt-1 text-tiny text-red-600">{item.error}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading state for specific components
export function InboxLoadingState() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 rounded-ds-lg border spacing-3">
            <div className="h-10 w-10 animate-pulse rounded-ds-full bg-gray-200" />
            <div className="flex-1 space-y-spacing-sm">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-spacing-sm">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-spacing-md">
              <div className="space-y-spacing-sm">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    </div>
  );
}

// Export all loading components
export {
  DashboardLoadingState,
  InboxLoadingState,
  LoadingButton,
  LoadingCard,
  LoadingDots,
  LoadingList,
  LoadingOverlay,
  LoadingProgress,
  LoadingSpinner,
  LoadingStateDisplay,
};
