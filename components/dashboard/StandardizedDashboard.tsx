"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Standardized Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: {
    value: number;
    period: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: unknown;
  variant?: "default" | "success" | "warning" | "error" | "info";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  chart?: ReactNode;
  target?: {
    value: number;
    label: string;
  };
  status?: "success" | "warning" | "error" | "info";
}

const metricCardVariants = cva(
  [
    "transition-all duration-200 ease-out",
    "rounded-[var(--fl-radius-lg)]",
    "border border-[var(--fl-color-border)]",
    "bg-[var(--fl-color-surface)]",
    "shadow-[var(--fl-shadow-sm)]",
    "hover:shadow-[var(--fl-shadow-md)]",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-[var(--fl-color-border)]",
          "bg-[var(--fl-color-surface)]",
        ],
        success: [
          "border-[var(--fl-color-success-muted)]",
          "bg-[var(--fl-color-success-subtle)]",
        ],
        warning: [
          "border-[var(--fl-color-warning-muted)]",
          "bg-[var(--fl-color-warning-subtle)]",
        ],
        error: [
          "border-[var(--fl-color-error-muted)]",
          "bg-[var(--fl-color-error-subtle)]",
        ],
        info: [
          "border-[var(--fl-color-info-muted)]",
          "bg-[var(--fl-color-info-subtle)]",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:scale-[1.02]",
          "active:scale-[0.98]",
          "transform-gpu",
          "will-change-transform",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
);

const variantStyles = {
  default: {
    icon: "text-[var(--fl-color-text-muted)]",
    value: "text-[var(--fl-color-text)]",
    title: "text-[var(--fl-color-text-muted)]",
  },
  success: {
    icon: "text-[var(--fl-color-success)]",
    value: "text-[var(--fl-color-success)]",
    title: "text-[var(--fl-color-success-muted)]",
  },
  warning: {
    icon: "text-[var(--fl-color-warning)]",
    value: "text-[var(--fl-color-warning)]",
    title: "text-[var(--fl-color-warning-muted)]",
  },
  error: {
    icon: "text-[var(--fl-color-error)]",
    value: "text-[var(--fl-color-error)]",
    title: "text-[var(--fl-color-error-muted)]",
  },
  info: {
    icon: "text-[var(--fl-color-info)]",
    value: "text-[var(--fl-color-info)]",
    title: "text-[var(--fl-color-info-muted)]",
  },
};

const trendStyles = {
  up: "text-[var(--fl-color-success)]",
  down: "text-[var(--fl-color-error)]",
  neutral: "text-[var(--fl-color-text-muted)]",
};

export function MetricCard({
  title,
  value,
  description,
  change,
  icon: IconComponent,
  variant = "default",
  loading = false,
  onClick,
  className,
  children,
  chart,
  target,
  status,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
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
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  const calculateProgress = () => {
    if (!target) return 0;
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    return Math.min((numericValue / target.value) * 100, 100);
  };

  if (loading) {
    return (
      <Card className={cn(metricCardVariants({ variant }), className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />
          {IconComponent && <div className="h-4 w-4 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />}
        </CardHeader>
        <CardContent>
          <div className="mb-2 h-8 w-16 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />
          {change && <div className="h-3 w-20 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />}
          {chart && <div className="mt-4 h-16 w-full animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        metricCardVariants({ variant, interactive: !!onClick }),
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", styles.title)}>{title}</CardTitle>
        {IconComponent && <Icon icon={IconComponent} className={cn("h-4 w-4", styles.icon)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", styles.value)}>{formatValue(value)}</div>

        {description && (
          <CardDescription className="mt-1 text-xs">
            {description}
          </CardDescription>
        )}

        {change && (
          <div className="mt-2 flex items-center">
            {change.trend !== "neutral" && (
              <span className={cn("mr-1 text-xs", getTrendIcon(change.trend))} />
            )}
            <span className={cn("text-xs font-medium", trendStyles[change.trend])}>
              {change.trend === "up" ? "+" : change.trend === "down" ? "-" : ""}
              {Math.abs(change.value)}%
            </span>
            <span className="ml-1 text-xs text-[var(--fl-color-text-muted)]">from {change.period}</span>
          </div>
        )}

        {target && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--fl-color-text-muted)]">{target.label}</span>
              <span className="font-medium">
                {formatValue(value)} / {formatValue(target.value)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--fl-color-background-subtle)]">
              <div
                className="h-full rounded-full bg-[var(--fl-color-primary)] transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="text-xs text-[var(--fl-color-text-muted)] text-right">
              {calculateProgress().toFixed(1)}% of target
            </div>
          </div>
        )}

        {chart && <div className="mt-4">{chart}</div>}

        {children}
      </CardContent>
    </Card>
  );
}

// Preset variants for common use cases
export function SuccessMetricCard(props: Omit<MetricCardProps, "variant">) {
  return <MetricCard {...props} variant="success" />;
}

export function WarningMetricCard(props: Omit<MetricCardProps, "variant">) {
  return <MetricCard {...props} variant="warning" />;
}

export function ErrorMetricCard(props: Omit<MetricCardProps, "variant">) {
  return <MetricCard {...props} variant="error" />;
}

export function InfoMetricCard(props: Omit<MetricCardProps, "variant">) {
  return <MetricCard {...props} variant="info" />;
}

// Loading skeleton for multiple cards
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCard key={i} title="" value="" loading={true} />
      ))}
    </>
  );
}

// Standardized Dashboard Grid Component
interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    },
    gap: {
      sm: "gap-[var(--fl-spacing-3)]",
      md: "gap-[var(--fl-spacing-4)]",
      lg: "gap-[var(--fl-spacing-6)]",
    },
  },
  defaultVariants: {
    columns: 4,
    gap: "md",
  },
});

export function DashboardGrid({ children, columns, gap, className }: DashboardGridProps) {
  return (
    <div className={cn(gridVariants({ columns, gap }), className)}>
      {children}
    </div>
  );
}

// Standardized Dashboard Section Component
interface DashboardSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function DashboardSection({ title, description, children, className, actions }: DashboardSectionProps) {
  return (
    <section className={cn("space-y-[var(--fl-spacing-4)]", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--fl-color-text)]">{title}</h2>
          {description && (
            <p className="text-sm text-[var(--fl-color-text-muted)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// Standardized Activity Feed Component
interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: unknown;
  status?: "success" | "warning" | "error" | "info";
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  className?: string;
}

export function ActivityFeed({ items, loading = false, className }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 py-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--fl-color-background-subtle)]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--fl-color-background-subtle)]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              {item.icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fl-color-background-subtle)]">
                  <Icon icon={item.icon} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--fl-color-text)]">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-[var(--fl-color-text-muted)]">{item.description}</p>
                )}
              </div>
              <span className="text-xs text-[var(--fl-color-text-muted)]">{item.timestamp}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Export all components
export {
  MetricCard as StatCard,
  MetricCardSkeleton as StatCardSkeleton,
}; 