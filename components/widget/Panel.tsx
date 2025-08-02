"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'default' | 'flex' | 'sticky';
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, variant = 'default', size = 'md', layout = 'default', ...props }, ref) => {
    const baseClasses = 'rounded-lg bg-white';

    const variantClasses = {
      default: 'border border-gray-200',
      bordered: 'border-2 border-gray-300',
      elevated: 'shadow-lg border border-gray-200'
    };

    const sizeClasses = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const layoutClasses = {
      default: '',
      flex: 'flex flex-col',
      sticky: 'flex flex-col h-full overflow-hidden'
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          layoutClasses[layout],
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