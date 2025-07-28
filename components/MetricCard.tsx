"use client";

import React, { useEffect, useState } from "react";
import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: "number" | "percentage" | "time";
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "accent" | "success" | "warning";
  className?: string;
  loading?: boolean;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = "number",
  icon,
  color = "primary",
  className,
  loading = false,
  change,
  trend,
}: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${val}%`;
      case "time":
        return `${val}s`;
      default:
        return val.toString();
    }
  };

  const getTrend = () => {
    if (!previousValue || previousValue === value) return null;
    const improvement = value > previousValue;
    const percentage = Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1);

    return {
      isUp: improvement,
      percentage,
      isGood: format === "time" ? !improvement : improvement, // For time metrics, lower is better
    };
  };

  const calculatedTrend = getTrend();

  const colorClasses = {
    primary: "from-campfire-primary to-campfire-primary-600",
    secondary: "from-campfire-secondary to-campfire-secondary",
    accent: "from-campfire-accent to-campfire-accent",
    success: "from-green-500 to-green-600",
    warning: "from-orange-500 to-orange-600",
  };

  return (
    <OptimizedMotion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={className}
    >
      <Card className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className={cn(
            "absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-ds-full bg-gradient-to-br opacity-5",
            colorClasses[color]
          )}
        />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon && <div className="text-3xl">{icon}</div>}
          </div>
        </CardHeader>

        <CardContent>
          {/* Value with animated number */}
          <div className="mb-3">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <OptimizedMotion.span
                className="text-3xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {formatValue(value)}
              </OptimizedMotion.span>
            )}
          </div>

          {/* Trend indicator */}
          {calculatedTrend && !loading && (
            <OptimizedMotion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-ds-2"
            >
              <OptimizedMotion.div
                animate={calculatedTrend.isUp ? { y: [-2, 0, -2] } : { y: [2, 0, 2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "text-typography-sm flex items-center gap-1",
                  calculatedTrend.isGood ? "text-semantic-success-dark" : "text-red-600"
                )}
              >
                {calculatedTrend.isUp ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />}
                <span className="font-medium">{calculatedTrend.percentage}%</span>
              </OptimizedMotion.div>
              <span className="text-tiny text-muted-foreground">vs last period</span>
            </OptimizedMotion.div>
          )}
        </CardContent>
      </Card>
    </OptimizedMotion.div>
  );
}

export default MetricCard;
