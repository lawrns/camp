"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { ReactNode } from 'react';

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  badge?: string;
  onClick?: () => void;
}

const colorConfig = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900',
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900',
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-900',
  },
  orange: {
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    text: 'text-orange-900',
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
  },
  yellow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    text: 'text-yellow-900',
  },
};

export function QuickActionButton({
  title,
  description,
  icon: Icon,
  href,
  color,
  badge,
  onClick,
}: QuickActionButtonProps) {
  const router = useRouter();
  const colors = colorConfig[color];

  const handleClick = () => {
    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'quick_action_click', {
        action_title: title,
        action_href: href,
      });
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick();
    } else {
      // Navigate to href
      router.push(href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className="transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95"
    >
      <Card
        className={`${colors.bg} ${colors.border} cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${title}: ${description}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`p-2 rounded-lg ${colors.bg} ${colors.border} transition-transform duration-200 hover:scale-110`}
              >
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium text-sm ${colors.text}`}>
                    {title}
                  </h3>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 