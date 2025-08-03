"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { Button } from '@/components/unified-ui/components/Button';
import {
  Warning,
  Info,
  Sparkle,
  X,
  ArrowRight
} from '@phosphor-icons/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'high' | 'medium' | 'positive';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
}

interface IntercomAlertStackProps {
  alerts: Alert[];
  title?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  }>;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

const alertConfig = {
  high: {
    icon: Warning,
    color: 'text-red-600',
    bg: 'bg-gradient-to-br from-red-50 to-rose-100',
    border: 'border-red-200/50',
    iconBg: 'bg-red-100',
    badge: 'bg-red-100 text-red-700'
  },
  medium: {
    icon: Info,
    color: 'text-amber-600',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    border: 'border-amber-200/50',
    iconBg: 'bg-amber-100',
    badge: 'bg-amber-100 text-amber-700'
  },
  positive: {
    icon: Sparkle,
    color: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200/50',
    iconBg: 'bg-blue-50',
    badge: 'bg-blue-50 text-blue-700'
  }
};

function AlertCard({ 
  alert, 
  index, 
  onDismiss 
}: { 
  alert: Alert; 
  index: number; 
  onDismiss?: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(alert.id);
    }, 300);
  };

  const handleAction = () => {
    if (alert.action?.onClick) {
      alert.action.onClick();
    } else if (alert.action?.href) {
      window.open(alert.action.href, '_blank');
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "animate-fade-in-up transition-all duration-300",
        "hover:-translate-y-0.5 hover:scale-[1.02]",
        !isVisible && "animate-fade-out opacity-0 scale-95"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "glass-card relative overflow-hidden p-4 rounded-xl border transition-all duration-300",
        config.bg,
        config.border,
        "hover:shadow-lg group"
      )}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Dismiss button */}
        {alert.dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              "absolute top-3 right-3 w-6 h-6 rounded-full transition-all duration-200",
              "flex items-center justify-center opacity-0 group-hover:opacity-100",
              "hover:bg-white/50 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1",
              config.color.replace('text-', 'focus:ring-')
            )}
            aria-label="Dismiss alert"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
        
        <div className="flex items-start gap-3 relative z-10">
          {/* Icon */}
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
            config.iconBg,
            isHovered && "scale-110 rotate-3"
          )}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                {alert.title}
              </h4>
              <Badge 
                variant="secondary" 
                className={cn("text-xs px-2 py-0.5 rounded-full", config.badge)}
              >
                {alert.priority}
              </Badge>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {alert.description}
            </p>
            
            {/* Action */}
            {alert.action && (
              <button
                onClick={handleAction}
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium transition-all duration-200",
                  "hover:gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-md px-1 py-0.5",
                  config.color,
                  config.color.replace('text-', 'focus:ring-'),
                  "hover:underline"
                )}
              >
                {alert.action.label}
                <ArrowRight className="w-3 h-3 transition-transform duration-200" />
              </button>
            )}
          </div>
        </div>
        
        {/* Bottom accent */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
          config.iconBg.replace('bg-', 'bg-gradient-to-r from-').replace(' ', ' to-transparent '),
          "opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100",
          "transform-gpu origin-left"
        )} />
      </div>
    </div>
  );
}

export function IntercomAlertStack({
  alerts,
  title = "AI Insights",
  actions = [],
  onDismiss,
  className
}: IntercomAlertStackProps) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);

  const handleDismiss = (alertId: string) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismiss?.(alertId);
  };

  // Sort alerts by priority
  const sortedAlerts = [...visibleAlerts].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 font-heading">
            <Sparkle className="w-5 h-5 text-purple-600" />
            {title}
            {sortedAlerts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sortedAlerts.length}
              </Badge>
            )}
          </CardTitle>
          
          {/* Header actions */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
              <Sparkle className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              No insights available at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={index}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
