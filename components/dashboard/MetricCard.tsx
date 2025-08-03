'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InfoIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  target?: {
    value: number;
    label: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  target,
  status,
  icon,
  className,
  loading = false
}: MetricCardProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4" />;
      case 'down':
        return <TrendingDownIcon className="h-4 w-4" />;
      case 'neutral':
      default:
        return <MinusIcon className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error' | 'info') => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-[var(--brand-accent)]" />;
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info') => {
    switch (status) {
      case 'success':
        return 'border-[var(--brand-accent)] bg-[#E6F4F1]';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
      default:
        return 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100';
    }
  };

  const calculateProgress = () => {
    if (!target) return 0;
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return Math.min((numericValue / target.value) * 100, 100);
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format large numbers with appropriate suffixes
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      status && getStatusColor(status),
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-1">
          {status && getStatusIcon(status)}
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold" data-testid="metric-value">
            {formatValue(value)}
          </div>

          {/* Description */}
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}

          {/* Change Indicator */}
          {change && (
            <div className={cn(
              'flex items-center space-x-1 text-xs',
              getTrendColor(change.trend)
            )}>
              {getTrendIcon(change.trend)}
              <span className="font-medium">
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              <span className="text-muted-foreground">
                {change.period}
              </span>
            </div>
          )}

          {/* Progress Bar for Targets */}
          {target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{target.label}</span>
                <span className="font-medium">
                  {formatValue(value)} / {formatValue(target.value)}
                </span>
              </div>
              <Progress 
                value={calculateProgress()} 
                className="h-2"
                data-testid="metric-progress"
              />
              <div className="text-xs text-muted-foreground text-right">
                {calculateProgress().toFixed(1)}% of target
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Preset metric cards for common use cases
export function ResponseTimeMetric({ value, target = 2000, className }: { 
  value: number; 
  target?: number; 
  className?: string; 
}) {
  const status = value <= target ? 'success' : value <= target * 1.5 ? 'warning' : 'error';
  
  return (
    <MetricCard
      title="Avg Response Time"
      value={`${(value / 1000).toFixed(1)}s`}
      description="Average AI response time"
      target={{
        value: target / 1000,
        label: 'Target response time'
      }}
      status={status}
      className={className}
    />
  );
}

export function SatisfactionMetric({ value, className }: { 
  value: number; 
  className?: string; 
}) {
  const status = value >= 4.5 ? 'success' : value >= 3.5 ? 'warning' : 'error';
  
  return (
    <MetricCard
      title="Customer Satisfaction"
      value={`${value.toFixed(1)}/5`}
      description="Average rating from customers"
      status={status}
      className={className}
    />
  );
}

export function HandoffRateMetric({ value, className }: { 
  value: number; 
  className?: string; 
}) {
  const status = value <= 10 ? 'success' : value <= 25 ? 'warning' : 'error';
  
  return (
    <MetricCard
      title="AI Handoff Rate"
      value={`${value.toFixed(1)}%`}
      description="Percentage of conversations handed off to humans"
      status={status}
      className={className}
    />
  );
}

export function ResolutionRateMetric({ value, className }: { 
  value: number; 
  className?: string; 
}) {
  const status = value >= 90 ? 'success' : value >= 75 ? 'warning' : 'error';
  
  return (
    <MetricCard
      title="Resolution Rate"
      value={`${value.toFixed(1)}%`}
      description="Percentage of issues resolved"
      status={status}
      className={className}
    />
  );
}