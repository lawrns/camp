"use client";

import { motion } from 'framer-motion';
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
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
  },
  yellow: {
    icon: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    hover: 'hover:bg-yellow-100',
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span className="text-sm">Error loading data</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${colors.bg} ${colors.border} ${colors.hover} transition-all duration-200 cursor-pointer`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </CardTitle>
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={`h-4 w-4 ${colors.icon}`} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            key={value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {value}
          </motion.div>
          {(change || description) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`text-xs flex items-center gap-1 mt-1 ${getTrendColor()}`}
            >
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
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 