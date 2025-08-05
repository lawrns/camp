"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * IntercomMetricCard - Design System Compliant Version
 *
 * Migrated to use design tokens while preserving Intercom-specific features:
 * - CountUpNumber animation
 * - Glass effect styling (using design tokens)
 * - Hover interactions
 * - Trend indicators
 */

interface IntercomMetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  suffix?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  // Legacy prop for backward compatibility
  color?: 'warm' | 'success' | 'danger' | 'info';
}

// Design token-based variant styles with glass effect support
const variantStyles = {
  default: {
    icon: 'text-[var(--fl-color-text)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-background-subtle)] to-[var(--fl-color-background-muted)]',
    cardBg: 'bg-[var(--fl-color-surface)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-border)]',
    accent: 'from-[var(--fl-color-background-subtle)] to-[var(--fl-color-background-muted)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-text-muted)] bg-[var(--fl-color-background-subtle)]'
    }
  },
  primary: {
    icon: 'text-[var(--fl-color-primary-600)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-primary-50)] to-[var(--fl-color-primary-100)]',
    cardBg: 'bg-[var(--fl-color-primary-subtle)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-primary-200)]',
    accent: 'from-[var(--fl-color-primary-50)] to-[var(--fl-color-primary-100)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-primary-600)] bg-[var(--fl-color-primary-subtle)]'
    }
  },
  success: {
    icon: 'text-[var(--fl-color-success-600)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-success-50)] to-[var(--fl-color-success-100)]',
    cardBg: 'bg-[var(--fl-color-success-subtle)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-success-200)]',
    accent: 'from-[var(--fl-color-success-50)] to-[var(--fl-color-success-100)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-success-600)] bg-[var(--fl-color-success-subtle)]'
    }
  },
  warning: {
    icon: 'text-[var(--fl-color-warning-600)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-warning-50)] to-[var(--fl-color-warning-100)]',
    cardBg: 'bg-[var(--fl-color-warning-subtle)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-warning-200)]',
    accent: 'from-[var(--fl-color-warning-50)] to-[var(--fl-color-warning-100)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-warning-600)] bg-[var(--fl-color-warning-subtle)]'
    }
  },
  error: {
    icon: 'text-[var(--fl-color-error-600)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-error-50)] to-[var(--fl-color-error-100)]',
    cardBg: 'bg-[var(--fl-color-error-subtle)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-error-200)]',
    accent: 'from-[var(--fl-color-error-50)] to-[var(--fl-color-error-100)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-error-600)] bg-[var(--fl-color-error-subtle)]'
    }
  },
  info: {
    icon: 'text-[var(--fl-color-info-600)]',
    iconBg: 'bg-gradient-to-br from-[var(--fl-color-info-50)] to-[var(--fl-color-info-100)]',
    cardBg: 'bg-[var(--fl-color-info-subtle)] backdrop-blur-sm',
    border: 'border-[var(--fl-color-info-200)]',
    accent: 'from-[var(--fl-color-info-50)] to-[var(--fl-color-info-100)]',
    trend: {
      up: 'text-[var(--fl-color-success)] bg-[var(--fl-color-success-subtle)]',
      down: 'text-[var(--fl-color-error)] bg-[var(--fl-color-error-subtle)]',
      stable: 'text-[var(--fl-color-info-600)] bg-[var(--fl-color-info-subtle)]'
    }
  }
};

// Legacy color to variant mapping for backward compatibility
const legacyColorMap = {
  warm: 'warning',
  success: 'success',
  danger: 'error',
  info: 'info',
} as const;

const CountUpNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    let start = 0;
    const end = value;
    const duration = 800; // ms
    const increment = end / (duration / 16); // 16ms per frame
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
        setIsAnimating(false);
      } else {
        setDisplayValue(Math.round(start));
      }
    }, 16);

    return () => {
      clearInterval(timer);
      setIsAnimating(false);
    };
  }, [value]);

  return (
    <span className={cn(
      "font-numeric font-bold tabular-nums transition-all duration-300",
      isAnimating && "animate-count-up"
    )}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
};

export function IntercomMetricCard({
  label,
  value,
  trend,
  icon: Icon,
  variant = 'default',
  suffix = '',
  loading = false,
  onClick,
  className,
  color, // Legacy prop
}: IntercomMetricCardProps) {
  // Support legacy color prop for backward compatibility
  const effectiveVariant = color ? legacyColorMap[color] : variant;
  const colors = variantStyles[effectiveVariant];
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <div className={cn("animate-fade-in-up", className)}>
        <Card className={cn(
          "bg-[var(--fl-color-surface)] backdrop-blur-sm animate-pulse",
          "border-[var(--fl-color-border)] shadow-[var(--fl-shadow-sm)]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="h-4 bg-[var(--fl-color-background-muted)] rounded w-24"></div>
            <div className="h-5 w-5 bg-[var(--fl-color-background-muted)] rounded"></div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-8 bg-[var(--fl-color-background-muted)] rounded w-20 mb-2"></div>
            <div className="h-3 bg-[var(--fl-color-background-muted)] rounded w-16"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!trend || trend.direction === 'stable') return null;
    return trend.direction === 'up' ? (
      <ArrowUpRight className="w-3 h-3" />
    ) : (
      <ArrowDownLeft className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return colors.trend[trend.direction];
  };

  return (
    <div
      className={cn(
        "animate-fade-in-up group transition-all duration-200 ease-out",
        !onClick && "cursor-default",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Card className={cn(
        colors.cardBg,
        colors.border,
        "transition-all duration-300 relative overflow-hidden",
        "shadow-[var(--fl-shadow-sm)] hover:shadow-[var(--fl-shadow-lg)]",
        "ring-1 ring-[var(--fl-color-border-subtle)]",
        onClick && "focus-visible:ring-2 focus-visible:ring-[var(--fl-color-primary-500)] focus-visible:ring-offset-2"
      )}>
        {/* Glass overlay for extra depth - using design tokens */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "from-[var(--fl-color-surface)]/20 to-transparent"
        )} />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--fl-spacing-3)] relative z-10">
          <CardTitle className={cn(
            "text-sm font-medium font-body",
            "text-[var(--fl-color-text-muted)]"
          )}>
            {label}
          </CardTitle>
          <div className={cn(
            "p-[var(--fl-spacing-2)] rounded-[var(--fl-radius-md)] transition-all duration-300",
            "ring-1 ring-[var(--fl-color-border-subtle)]",
            colors.iconBg,
            isHovered && "scale-110 rotate-3"
          )}>
            <Icon className={cn("h-4 w-4", colors.icon)} />
          </div>
        </CardHeader>

        <CardContent className="pb-[var(--fl-spacing-4)] relative z-10">
          <div className="space-y-[var(--fl-spacing-2)]">
            {/* Main metric value */}
            <div className={cn(
              "text-3xl font-bold font-heading leading-none",
              "text-[var(--fl-color-text)]"
            )}>
              {typeof value === 'number' ? (
                <CountUpNumber value={value} suffix={suffix} />
              ) : (
                <span className="font-numeric tabular-nums">{value}</span>
              )}
            </div>

            {/* Trend indicator */}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-[var(--fl-spacing-1)]",
                "px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)]",
                "rounded-[var(--fl-radius-full)] text-xs font-medium",
                "transition-all duration-300 animate-scale-in",
                "ring-1 ring-[var(--fl-color-border-subtle)]",
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span className="font-numeric tabular-nums">
                  {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Subtle bottom accent using design tokens */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
          "bg-gradient-to-r opacity-0 group-hover:opacity-100",
          colors.accent
        )} />
      </Card>
    </div>
  );
}
