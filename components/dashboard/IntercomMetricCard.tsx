"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { ArrowUpRight, ArrowDownLeft } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface IntercomMetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  icon: React.ComponentType<{ className?: string }>;
  color: 'warm' | 'success' | 'danger' | 'info';
  suffix?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorConfig = {
  warm: {
    icon: 'text-amber-600',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-100',
    cardBg: 'glass-card metric-warm',
    border: 'border-amber-200/50',
    trend: {
      up: 'text-amber-700 bg-amber-50',
      down: 'text-amber-600 bg-amber-50',
      stable: 'text-amber-600 bg-amber-50'
    }
  },
  success: {
    icon: 'text-blue-600',
    iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    cardBg: 'glass-card metric-success',
    border: 'border-blue-200/50',
    trend: {
      up: 'text-blue-700 bg-blue-50',
      down: 'text-blue-600 bg-blue-50',
      stable: 'text-blue-600 bg-blue-50'
    }
  },
  danger: {
    icon: 'text-red-600',
    iconBg: 'bg-gradient-to-br from-red-50 to-rose-100',
    cardBg: 'glass-card metric-danger',
    border: 'border-red-200/50',
    trend: {
      up: 'text-red-700 bg-red-50',
      down: 'text-red-600 bg-red-50',
      stable: 'text-red-600 bg-red-50'
    }
  },
  info: {
    icon: 'text-blue-600',
    iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    cardBg: 'glass-card metric-info',
    border: 'border-blue-200/50',
    trend: {
      up: 'text-blue-700 bg-blue-50',
      down: 'text-blue-600 bg-blue-50',
      stable: 'text-blue-600 bg-blue-50'
    }
  }
};

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
  color,
  suffix = '',
  loading = false,
  onClick,
  className
}: IntercomMetricCardProps) {
  const colors = colorConfig[color];
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <div className={cn("animate-fade-in-up", className)}>
        <Card className="glass-card animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
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
        "animate-fade-in-up hover-lift cursor-pointer group",
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
        "hover:shadow-xl hover:-translate-y-1",
        onClick && "cursor-pointer focus-visible:focus-brand"
      )}>
        {/* Glass overlay for extra depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 font-body">
            {label}
          </CardTitle>
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            colors.iconBg,
            isHovered && "scale-110 rotate-3"
          )}>
            <Icon className={cn("h-4 w-4", colors.icon)} />
          </div>
        </CardHeader>
        
        <CardContent className="pb-4 relative z-10">
          <div className="space-y-2">
            {/* Main metric value */}
            <div className="text-3xl font-bold text-gray-900 dark:text-white font-heading leading-none">
              {typeof value === 'number' ? (
                <CountUpNumber value={value} suffix={suffix} />
              ) : (
                <span className="font-numeric tabular-nums">{value}</span>
              )}
            </div>
            
            {/* Trend indicator */}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
                getTrendColor(),
                "animate-scale-in"
              )}>
                {getTrendIcon()}
                <span className="font-numeric tabular-nums">
                  {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Subtle bottom accent */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
          colors.iconBg.replace('bg-gradient-to-br', 'bg-gradient-to-r'),
          "opacity-0 group-hover:opacity-100"
        )} />
      </Card>
    </div>
  );
}
