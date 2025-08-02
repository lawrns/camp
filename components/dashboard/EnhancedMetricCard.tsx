"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';

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

const colorClasses = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
  },
  yellow: {
    icon: 'text-yellow-600',
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    border: 'border-yellow-200',
    hover: 'hover:bg-yellow-100',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-100',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
  },
  red: {
    icon: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    hover: 'hover:bg-red-100',
  },
};

export function EnhancedMetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color,
  description,
  loading = false,
  error,
}: EnhancedMetricCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <Card className={`${colors.bg} ${colors.border} animate-pulse`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in-up">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span className="text-sm">Error loading data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <ArrowUp className="w-3 h-3 text-green-600" />;
    }
    if (trend === 'down') {
      return <ArrowDown className="w-3 h-3 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="animate-fade-in-up transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105">
      <Card className={`${colors.bg} ${colors.border} ${colors.hover} transition-all duration-200 cursor-pointer`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </CardTitle>
          <div className="transition-transform duration-200 hover:scale-110">
            <Icon className={`h-4 w-4 ${colors.icon}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div 
            key={value}
            className="text-2xl font-bold text-gray-900 dark:text-white animate-scale-in"
          >
            {value}
          </div>
          {(change || description) && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${getTrendColor()} animate-fade-in`}>
              {change && (
                <>
                  {getTrendIcon()}
                  {change}
                </>
              )}
              {description && (
                <span className="text-gray-500 dark:text-gray-400">
                  {description}
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 