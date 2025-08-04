"use client";

import { ReactNode } from "react";
import { TrendDown, TrendUp } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: unknown;
  variant?: "default" | "success" | "warning" | "error";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  description?: string;
  chart?: ReactNode;
}

const variantStyles = {
  default: {
    card: "border-border bg-card",
    icon: "text-muted-foreground",
    value: "text-foreground",
    title: "text-muted-foreground",
  },
  success: {
    card: "border-[var(--fl-color-success-muted)] bg-[var(--fl-color-success-subtle)] dark:border-green-800 dark:bg-green-950",
    icon: "text-green-600 dark:text-green-400",
    value: "text-green-900 dark:text-green-100",
    title: "text-green-700 dark:text-green-300",
  },
  warning: {
    card: "border-[var(--fl-color-warning-muted)] bg-[var(--fl-color-warning-subtle)] dark:border-yellow-800 dark:bg-yellow-950",
    icon: "text-yellow-600 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-yellow-100",
    title: "text-yellow-700 dark:text-yellow-300",
  },
  error: {
    card: "border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)] dark:border-red-800 dark:bg-red-950",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-900 dark:text-red-100",
    title: "text-red-700 dark:text-red-300",
  },
};

const trendStyles = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

export function StatCard({
  title,
  value,
  change,
  icon: IconComponent,
  variant = "default",
  loading = false,
  onClick,
  className,
  children,
  description,
  chart,
}: StatCardProps) {
  const styles = variantStyles[variant];

  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      // Format large numbers with appropriate suffixes
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return TrendUp;
      case "down":
        return TrendDown;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={cn(styles.card, className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          {IconComponent && <div className="h-4 w-4 animate-pulse rounded bg-muted" />}
        </CardHeader>
        <CardContent>
          <div className="mb-2 h-8 w-16 animate-pulse rounded bg-muted" />
          {change && <div className="h-3 w-20 animate-pulse rounded bg-muted" />}
          {chart && <div className="mt-4 h-16 w-full animate-pulse rounded bg-muted" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(styles.card, onClick && "cursor-pointer transition-shadow hover:shadow-md", className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-typography-sm font-medium", styles.title)}>{title}</CardTitle>
        {IconComponent && <Icon icon={IconComponent} className={cn("h-4 w-4", styles.icon)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", styles.value)}>{formatValue(value)}</div>

        {description && <p className="mt-1 text-tiny text-muted-foreground">{description}</p>}

        {change && (
          <div className="mt-2 flex items-center">
            {change.trend !== "neutral" && (
              <Icon icon={getTrendIcon(change.trend)!} className={cn("mr-1 h-3 w-3", trendStyles[change.trend])} />
            )}
            <span className={cn("text-typography-xs font-medium", trendStyles[change.trend])}>
              {change.trend === "up" ? "+" : change.trend === "down" ? "-" : ""}
              {Math.abs(change.value)}%
            </span>
            <span className="ml-1 text-tiny text-muted-foreground">from {change.period}</span>
          </div>
        )}

        {chart && <div className="mt-4">{chart}</div>}

        {children}
      </CardContent>
    </Card>
  );
}

// Preset variants for common use cases
export function MetricCard(props: Omit<StatCardProps, "variant">) {
  return <StatCard {...props} variant="default" />;
}

export function SuccessCard(props: Omit<StatCardProps, "variant">) {
  return <StatCard {...props} variant="success" />;
}

export function WarningCard(props: Omit<StatCardProps, "variant">) {
  return <StatCard {...props} variant="warning" />;
}

export function ErrorCard(props: Omit<StatCardProps, "variant">) {
  return <StatCard {...props} variant="error" />;
}

// Loading skeleton for multiple cards
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <StatCard key={i} title="" value="" loading={true} />
      ))}
    </>
  );
}
