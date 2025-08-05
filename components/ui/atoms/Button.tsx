/**
 * Button Atom - Atomic Design System
 * 
 * The most fundamental interactive element in the design system.
 * Follows design tokens and provides consistent styling across the platform.
 */

'use client';

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md text-sm font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Primary - Main call-to-action
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'focus-visible:ring-primary',
          'shadow-sm',
        ],
        
        // Secondary - Secondary actions
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'focus-visible:ring-secondary',
          'border border-secondary',
        ],
        
        // Destructive - Dangerous actions
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'focus-visible:ring-destructive',
          'shadow-sm',
        ],
        
        // Outline - Subtle emphasis
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-ring',
        ],
        
        // Ghost - Minimal emphasis
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-ring',
        ],
        
        // Link - Text-like appearance
        link: [
          'text-primary underline-offset-4',
          'hover:underline',
          'focus-visible:ring-primary',
        ],
      },
      
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        xl: 'h-12 px-10 text-base',
        icon: 'h-10 w-10',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  }
);

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        <span className="truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, orientation = 'horizontal', size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          '[&>*:not(:first-child)]:border-l-0 [&>*:not(:first-child)]:rounded-l-none',
          '[&>*:not(:last-child)]:rounded-r-none',
          orientation === 'vertical' && [
            '[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-t-0',
            '[&>*:not(:first-child)]:rounded-l [&>*:not(:first-child)]:rounded-t-none',
            '[&>*:not(:last-child)]:rounded-r [&>*:not(:last-child)]:rounded-b-none',
          ],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: size || child.props.size,
              variant: variant || child.props.variant,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// ============================================================================
// ICON BUTTON COMPONENT
// ============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn('shrink-0', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// With icons
<Button leftIcon={<Plus className="h-4 w-4" />}>
  Add Item
</Button>

<Button rightIcon={<ArrowRight className="h-4 w-4" />}>
  Continue
</Button>

// Loading state
<Button loading loadingText="Saving...">
  Save
</Button>

// Icon button
<IconButton 
  icon={<Settings className="h-4 w-4" />} 
  aria-label="Settings"
  variant="ghost"
/>

// Button group
<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>

// Full width
<Button fullWidth>
  Full Width Button
</Button>

// As child (with Next.js Link)
<Button asChild>
  <Link href="/dashboard">
    Go to Dashboard
  </Link>
</Button>
*/
