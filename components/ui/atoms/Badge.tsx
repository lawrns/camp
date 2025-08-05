/**
 * Badge Atom - Atomic Design System
 * 
 * Small status and labeling component for displaying metadata,
 * categories, and status information with consistent styling.
 */

'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ============================================================================
// BADGE VARIANTS
// ============================================================================

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Default - Neutral appearance
        default: [
          'border-transparent bg-primary text-primary-foreground',
          'hover:bg-primary/80',
        ],
        
        // Secondary - Subtle emphasis
        secondary: [
          'border-transparent bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
        ],
        
        // Destructive - Error or warning states
        destructive: [
          'border-transparent bg-destructive text-destructive-foreground',
          'hover:bg-destructive/80',
        ],
        
        // Outline - Minimal emphasis
        outline: [
          'border-border text-foreground',
          'hover:bg-accent hover:text-accent-foreground',
        ],
        
        // Success - Positive states
        success: [
          'border-transparent bg-green-500 text-white',
          'hover:bg-green-600',
        ],
        
        // Warning - Caution states
        warning: [
          'border-transparent bg-yellow-500 text-white',
          'hover:bg-yellow-600',
        ],
        
        // Info - Informational states
        info: [
          'border-transparent bg-blue-500 text-white',
          'hover:bg-blue-600',
        ],
        
        // Muted - Low emphasis
        muted: [
          'border-transparent bg-muted text-muted-foreground',
          'hover:bg-muted/80',
        ],
      },
      
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-md',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'rounded',
    },
  }
);

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      children,
      leftIcon,
      rightIcon,
      removable = false,
      onRemove,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, shape }),
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Content */}
        <span className="truncate">
          {children}
        </span>
        
        {/* Right Icon */}
        {rightIcon && !removable && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
        
        {/* Remove Button */}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 ml-1 rounded-full',
              'hover:bg-black/10 focus:bg-black/10',
              'transition-colors duration-150',
              'disabled:cursor-not-allowed'
            )}
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'leftIcon'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'active' | 'inactive';
  showDot?: boolean;
}

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showDot = true, children, ...props }, ref) => {
    const statusConfig = {
      online: { variant: 'success' as const, label: 'Online', dotColor: 'bg-green-500' },
      offline: { variant: 'muted' as const, label: 'Offline', dotColor: 'bg-gray-400' },
      away: { variant: 'warning' as const, label: 'Away', dotColor: 'bg-yellow-500' },
      busy: { variant: 'destructive' as const, label: 'Busy', dotColor: 'bg-red-500' },
      pending: { variant: 'warning' as const, label: 'Pending', dotColor: 'bg-yellow-500' },
      active: { variant: 'success' as const, label: 'Active', dotColor: 'bg-green-500' },
      inactive: { variant: 'muted' as const, label: 'Inactive', dotColor: 'bg-gray-400' },
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        leftIcon={
          showDot ? (
            <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
          ) : undefined
        }
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// ============================================================================
// PRIORITY BADGE COMPONENT
// ============================================================================

interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const PriorityBadge = forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, children, ...props }, ref) => {
    const priorityConfig = {
      low: { variant: 'muted' as const, label: 'Low' },
      medium: { variant: 'info' as const, label: 'Medium' },
      high: { variant: 'warning' as const, label: 'High' },
      urgent: { variant: 'destructive' as const, label: 'Urgent' },
    };

    const config = priorityConfig[priority];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';

// ============================================================================
// COUNT BADGE COMPONENT
// ============================================================================

interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const CountBadge = forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        size="sm"
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = 'CountBadge';

// ============================================================================
// BADGE GROUP COMPONENT
// ============================================================================

interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  wrap?: boolean;
}

export const BadgeGroup = forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ children, className, spacing = 'normal', wrap = true, ...props }, ref) => {
    const spacingClasses = {
      tight: 'gap-1',
      normal: 'gap-2',
      loose: 'gap-3',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          spacingClasses[spacing],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic badges
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Status badges
<StatusBadge status="online" />
<StatusBadge status="away" />
<StatusBadge status="busy" />
<StatusBadge status="offline" />

// Priority badges
<PriorityBadge priority="low" />
<PriorityBadge priority="medium" />
<PriorityBadge priority="high" />
<PriorityBadge priority="urgent" />

// Count badges
<CountBadge count={5} />
<CountBadge count={150} max={99} />
<CountBadge count={0} showZero />

// With icons
<Badge leftIcon={<Star className="h-3 w-3" />}>
  Featured
</Badge>

<Badge rightIcon={<ArrowRight className="h-3 w-3" />}>
  Continue
</Badge>

// Removable badges
<Badge 
  removable 
  onRemove={() => console.log('Removed')}
>
  Removable Tag
</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>

// Different shapes
<Badge shape="square">Square</Badge>
<Badge shape="rounded">Rounded</Badge>

// Badge group
<BadgeGroup>
  <Badge>React</Badge>
  <Badge>TypeScript</Badge>
  <Badge>Next.js</Badge>
  <Badge>Tailwind</Badge>
</BadgeGroup>

// Custom styling
<Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
  Gradient Badge
</Badge>
*/
