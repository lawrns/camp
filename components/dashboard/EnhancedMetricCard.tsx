"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { ArrowUp, ArrowDown } from "lucide-react";
import { MetricCard } from './StandardizedDashboard';

/**
 * @deprecated This component has been deprecated in favor of StandardizedDashboard.MetricCard
 *
 * Migration guide:
 * - Replace import: import { MetricCard } from './StandardizedDashboard'
 * - Change prop: color="blue" → variant="info"
 * - Map color values:
 *   - blue → info
 *   - green → success
 *   - orange → warning
 *   - red → error
 *   - yellow → warning
 *   - purple → info
 * - The trend, change, loading, and error props are fully supported
 *
 * Example migration:
 * ```tsx
 * // BEFORE
 * <EnhancedMetricCard
 *   title="Users"
 *   value={1000}
 *   color="blue"
 *   icon={Users}
 *   trend="up"
 *   change="+12%"
 * />
 *
 * // AFTER
 * <MetricCard
 *   title="Users"
 *   value={1000}
 *   variant="info"
 *   icon={Users}
 *   trend="up"
 *   change="+12%"
 * />
 * ```
 *
 * This file will be removed in the next major version.
 */

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'orange' | 'yellow' | 'green' | 'purple' | 'red';
  description?: string;
  loading?: boolean;
  error?: string;
}

// Legacy color to variant mapping for backward compatibility
const legacyColorMap = {
  blue: 'info',
  green: 'success',
  orange: 'warning',
  red: 'error',
  yellow: 'warning',
  purple: 'info',
} as const;

/**
 * EnhancedMetricCard - Deprecated wrapper component
 *
 * This component now forwards all props to StandardizedDashboard.MetricCard
 * with automatic color-to-variant mapping for backward compatibility.
 */

export function EnhancedMetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  color,
  description,
  loading = false,
  error,
}: EnhancedMetricCardProps) {
  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ EnhancedMetricCard is deprecated. Please use MetricCard from StandardizedDashboard instead.\n' +
      'Migration: color="' + color + '" → variant="' + legacyColorMap[color] + '"\n' +
      'See: components/dashboard/README.md for full migration guide'
    );
  }

  // Map legacy color prop to standardized variant
  const variant = legacyColorMap[color];

  // Map legacy change string to StandardizedDashboard.MetricCard change object
  const mappedChange = change ? {
    value: parseFloat(change.replace(/[^\d.-]/g, '')) || 0,
    period: 'from previous',
    trend: trend,
  } : undefined;

  // Forward all props to StandardizedDashboard.MetricCard with mapped variant
  return (
    <MetricCard
      title={title}
      value={value}
      description={description}
      variant={variant}
      icon={icon}
      change={mappedChange}
      loading={loading}
      // Note: StandardizedDashboard.MetricCard doesn't have an error prop
      // Error handling is done through loading state or other mechanisms
    />
  );
}