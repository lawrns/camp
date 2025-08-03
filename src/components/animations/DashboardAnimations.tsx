/**
 * Dashboard Animations
 * Beautiful animations for charts, KPIs, progress bars, and data visualizations
 */

"use client";

import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
// Lazy load heavy framer-motion utilities only when needed
const useLazyFramerMotion = () => {
  const [framerMotion, setFramerMotion] = useState<any>(null);

  useEffect(() => {
    import("framer-motion").then((module) => {
      setFramerMotion({
        animate: module.animate,
        useMotionValue: module.useMotionValue,
        useTransform: module.useTransform,
      });
    });
  }, []);

  return framerMotion;
};

// Animated number counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return controls.stop;
  }, [value, duration, motionValue]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// KPI Card with hover effects
interface KPICardProps {
  title: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, change, prefix, suffix, icon, className }: KPICardProps) {
  const isPositive = change && change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <OptimizedMotion.div
      className={cn("relative rounded-ds-xl border border-[var(--fl-color-border-subtle)] bg-white spacing-4 shadow-sm", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-spacing-sm">
          <p className="text-foreground text-sm">{title}</p>
          <div className="text-3xl font-bold">
            <AnimatedCounter value={value} prefix={prefix || ""} suffix={suffix || ""} />
          </div>
          {change !== undefined && (
            <OptimizedMotion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <TrendIcon className={cn("h-4 w-4", isPositive ? "text-semantic-success-dark" : "text-red-600")} />
              <span
                className={cn(
                  "text-typography-sm font-medium",
                  isPositive ? "text-semantic-success-dark" : "text-red-600"
                )}
              >
                {Math.abs(change)}%
              </span>
            </OptimizedMotion.div>
          )}
        </div>
        {icon && (
          <OptimizedMotion.div
            className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </OptimizedMotion.div>
        )}
      </div>
    </OptimizedMotion.div>
  );
}

// Animated progress bar
interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: string;
}

export function AnimatedProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
  color = "bg-blue-600",
}: AnimatedProgressBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium">
              <AnimatedCounter value={percentage} suffix="%" />
            </span>
          )}
        </div>
      )}
      <div className="relative h-2 overflow-hidden rounded-ds-full bg-gray-200">
        <OptimizedMotion.div
          className={cn("absolute left-0 top-0 h-full rounded-ds-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  );
}

// Chart entrance animation wrapper
interface ChartAnimationProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ChartAnimation({ children, delay = 0, className }: ChartAnimationProps) {
  return (
    <OptimizedMotion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <OptimizedMotion.div
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{
          duration: 1,
          delay: delay + 0.2,
          ease: "easeOut",
        }}
      >
        {children}
      </OptimizedMotion.div>
    </OptimizedMotion.div>
  );
}

// Animated stat grid
interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
}

interface AnimatedStatGridProps {
  stats: StatItem[];
  columns?: number;
  className?: string;
}

export function AnimatedStatGrid({ stats, columns = 4, className }: AnimatedStatGridProps) {
  return (
    <OptimizedMotion.div
      className={cn("grid gap-4", `grid-cols-${columns}`, className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {stats.map((stat, index) => (
        <OptimizedMotion.div
          key={stat.label}
          className="rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          <p className="text-foreground mb-1 text-sm">{stat.label}</p>
          <div className="flex items-baseline gap-ds-2">
            <span className="text-3xl font-bold">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix || ""}
                suffix={stat.suffix || ""}
                duration={1.5}
                decimals={stat.suffix === "%" ? 1 : 0}
              />
            </span>
            {stat.change !== undefined && (
              <span
                className={cn(
                  "text-typography-sm font-medium",
                  stat.change > 0 ? "text-semantic-success-dark" : "text-red-600"
                )}
              >
                {stat.change > 0 ? "+" : ""}
                {stat.change}%
              </span>
            )}
          </div>
        </OptimizedMotion.div>
      ))}
    </OptimizedMotion.div>
  );
}

// Data refresh animation
interface DataRefreshAnimationProps {
  isRefreshing: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DataRefreshAnimation({ isRefreshing, children, className }: DataRefreshAnimationProps) {
  return (
    <OptimizedMotion.div
      className={className}
      animate={isRefreshing ? { opacity: 0.5 } : { opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      {isRefreshing && (
        <OptimizedMotion.div
          className="bg-background/50 absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <OptimizedMotion.div
            className="flex items-center gap-ds-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            <Icon icon={Activity} className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Refreshing...</span>
          </OptimizedMotion.div>
        </OptimizedMotion.div>
      )}
    </OptimizedMotion.div>
  );
}

// Animated gauge chart
interface AnimatedGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function AnimatedGauge({ value, max = 100, size = 120, strokeWidth = 8, className }: AnimatedGaugeProps) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-200"
        />

        {/* Animated progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-blue-600"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold">
          <AnimatedCounter value={percentage} suffix="%" decimals={1} />
        </span>
      </div>
    </div>
  );
}
