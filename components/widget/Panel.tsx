"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseClasses = 'rounded-ds-md bg-background';
    
    const variantClasses = {
      default: 'border border-border',
      bordered: 'border-2 border-border',
      elevated: 'shadow-lg border border-border'
    };
    
    const sizeClasses = {
      sm: 'spacing-3',
      md: 'spacing-4',
      lg: 'spacing-6'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export { Panel };
export default Panel;