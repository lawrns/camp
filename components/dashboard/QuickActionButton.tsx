"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/unified-ui/components/Card';
import { Badge } from '@/components/unified-ui/components/Badge';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  // Legacy prop for backward compatibility
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}

// Design token-based variant styles
const variantStyles = {
  default: {
    card: 'border-[var(--fl-color-border)] bg-[var(--fl-color-surface)] hover:bg-[var(--fl-color-surface-hover)]',
    icon: 'text-[var(--fl-color-text)] bg-[var(--fl-color-background-subtle)]',
    title: 'text-[var(--fl-color-text)]',
    description: 'text-[var(--fl-color-text-muted)]',
  },
  primary: {
    card: 'border-[var(--fl-color-primary-200)] bg-[var(--fl-color-primary-50)] hover:bg-[var(--fl-color-primary-100)]',
    icon: 'text-[var(--fl-color-primary-600)] bg-[var(--fl-color-primary-100)]',
    title: 'text-[var(--fl-color-primary-900)]',
    description: 'text-[var(--fl-color-primary-700)]',
  },
  success: {
    card: 'border-[var(--fl-color-success-200)] bg-[var(--fl-color-success-50)] hover:bg-[var(--fl-color-success-100)]',
    icon: 'text-[var(--fl-color-success-600)] bg-[var(--fl-color-success-100)]',
    title: 'text-[var(--fl-color-success-900)]',
    description: 'text-[var(--fl-color-success-700)]',
  },
  warning: {
    card: 'border-[var(--fl-color-warning-200)] bg-[var(--fl-color-warning-50)] hover:bg-[var(--fl-color-warning-100)]',
    icon: 'text-[var(--fl-color-warning-600)] bg-[var(--fl-color-warning-100)]',
    title: 'text-[var(--fl-color-warning-900)]',
    description: 'text-[var(--fl-color-warning-700)]',
  },
  error: {
    card: 'border-[var(--fl-color-error-200)] bg-[var(--fl-color-error-50)] hover:bg-[var(--fl-color-error-100)]',
    icon: 'text-[var(--fl-color-error-600)] bg-[var(--fl-color-error-100)]',
    title: 'text-[var(--fl-color-error-900)]',
    description: 'text-[var(--fl-color-error-700)]',
  },
  info: {
    card: 'border-[var(--fl-color-info-200)] bg-[var(--fl-color-info-50)] hover:bg-[var(--fl-color-info-100)]',
    icon: 'text-[var(--fl-color-info-600)] bg-[var(--fl-color-info-100)]',
    title: 'text-[var(--fl-color-info-900)]',
    description: 'text-[var(--fl-color-info-700)]',
  },
};

// Size variants
const sizeStyles = {
  sm: {
    card: 'p-3',
    icon: 'w-4 h-4 p-1.5',
    title: 'text-xs font-medium',
    description: 'text-xs',
  },
  md: {
    card: 'p-4',
    icon: 'w-5 h-5 p-2',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  lg: {
    card: 'p-6',
    icon: 'w-6 h-6 p-2.5',
    title: 'text-base font-medium',
    description: 'text-sm',
  },
};

// Legacy color to variant mapping for backward compatibility
const legacyColorMap = {
  blue: 'primary',
  green: 'success',
  purple: 'info',
  orange: 'warning',
  red: 'error',
  yellow: 'warning',
} as const;

export function QuickActionButton({
  title,
  description,
  icon: Icon,
  href,
  variant = 'default',
  size = 'md',
  badge,
  onClick,
  className,
  disabled = false,
  color, // Legacy prop
}: QuickActionButtonProps) {
  const router = useRouter();

  // Support legacy color prop for backward compatibility
  const effectiveVariant = color ? legacyColorMap[color] : variant;
  const styles = variantStyles[effectiveVariant];
  const sizes = sizeStyles[size];

  const handleClick = () => {
    if (disabled) return;

    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quick_action_click', {
        action_title: title,
        action_href: href,
        action_variant: effectiveVariant,
        legacy_color: color, // Track legacy usage
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
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        !disabled && "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--fl-color-primary-500)]",
          "shadow-[var(--fl-shadow-sm)] hover:shadow-[var(--fl-shadow-md)]",
          styles.card,
          disabled && "cursor-not-allowed hover:shadow-[var(--fl-shadow-sm)]"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`${title}: ${description}`}
        aria-disabled={disabled}
      >
        <CardContent className={sizes.card}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-[var(--fl-spacing-3)]">
              {/* Icon Container */}
              <div
                className={cn(
                  "rounded-[var(--fl-radius-md)] transition-all duration-200",
                  "ring-1 ring-[var(--fl-color-border-subtle)]",
                  !disabled && "hover:scale-110",
                  styles.icon
                )}
              >
                <Icon className={sizes.icon} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[var(--fl-spacing-2)] mb-1">
                  <h3 className={cn(sizes.title, styles.title)}>
                    {title}
                  </h3>
                  {badge && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-[var(--fl-spacing-2)] py-[var(--fl-spacing-1)] rounded-full"
                    >
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className={cn(
                  sizes.description,
                  styles.description,
                  "line-clamp-2 leading-relaxed"
                )}>
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