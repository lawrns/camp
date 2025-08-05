/**
 * Card Molecule - Atomic Design System
 * 
 * Flexible container component that combines multiple atoms
 * to create cohesive content blocks with consistent styling.
 */

'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

// ============================================================================
// CARD VARIANTS
// ============================================================================

const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-md',
        outlined: 'border-2 border-border shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
      },
      
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      
      interactive: {
        true: 'cursor-pointer hover:shadow-md hover:border-border/80',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      interactive: false,
    },
  }
);

// ============================================================================
// CARD COMPONENTS
// ============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// ============================================================================
// CARD HEADER
// ============================================================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between space-y-1.5 p-6 pb-4',
        className
      )}
      {...props}
    >
      <div className="flex-1 space-y-1.5">
        {children}
      </div>
      {actions && (
        <div className="flex items-center space-x-2 ml-4">
          {actions}
        </div>
      )}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE
// ============================================================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, as: Comp = 'h3', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT
// ============================================================================

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// ============================================================================
// SPECIALIZED CARD COMPONENTS
// ============================================================================

// Profile Card
interface ProfileCardProps {
  name: string;
  title?: string;
  avatar?: React.ReactNode;
  status?: 'online' | 'offline' | 'away' | 'busy';
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, title, avatar, status, actions, children, className, ...props }, ref) => (
    <Card ref={ref} className={cn('w-full', className)} {...props}>
      <CardHeader actions={actions}>
        <div className="flex items-center space-x-4">
          {avatar}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{name}</CardTitle>
            {title && (
              <CardDescription className="truncate">{title}</CardDescription>
            )}
            {status && (
              <Badge variant="outline" size="sm" className="mt-1">
                <div className={cn(
                  'w-2 h-2 rounded-full mr-1',
                  status === 'online' && 'bg-green-500',
                  status === 'offline' && 'bg-gray-400',
                  status === 'away' && 'bg-yellow-500',
                  status === 'busy' && 'bg-red-500'
                )} />
                {status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
);
ProfileCard.displayName = 'ProfileCard';

// Stat Card
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, description, trend, icon, className, ...props }, ref) => (
    <Card ref={ref} className={cn('w-full', className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn(
                'flex items-center',
                trend.direction === 'up' && 'text-green-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-muted-foreground'
              )}>
                {trend.direction === 'up' && '↗'}
                {trend.direction === 'down' && '↘'}
                {trend.direction === 'neutral' && '→'}
                {trend.value}% {trend.label}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
);
StatCard.displayName = 'StatCard';

// Action Card
interface ActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  ({ title, description, icon, primaryAction, secondaryAction, className, ...props }, ref) => (
    <Card ref={ref} className={cn('w-full', className)} {...props}>
      <CardHeader>
        <div className="flex items-start space-x-4">
          {icon && (
            <div className="flex-shrink-0 text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      {(primaryAction || secondaryAction) && (
        <CardFooter className="space-x-2">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              loading={primaryAction.loading}
              className="flex-1"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="flex-1"
            >
              {secondaryAction.label}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
);
ActionCard.displayName = 'ActionCard';

// Feature Card
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon, badge, href, onClick, className, ...props }, ref) => {
    const isInteractive = Boolean(href || onClick);
    
    const content = (
      <Card
        ref={ref}
        interactive={isInteractive}
        className={cn('w-full h-full', className)}
        onClick={onClick}
        {...props}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="flex-shrink-0 text-primary">
                  {icon}
                </div>
              )}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {badge}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    );

    if (href) {
      return (
        <a href={href} className="block">
          {content}
        </a>
      );
    }

    return content;
  }
);
FeatureCard.displayName = 'FeatureCard';

// Export all components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Profile card
<ProfileCard
  name="John Doe"
  title="Software Engineer"
  status="online"
  avatar={<Avatar src="/avatar.jpg" fallback="JD" />}
  actions={
    <Button variant="outline" size="sm">
      Message
    </Button>
  }
>
  <p>Additional profile information...</p>
</ProfileCard>

// Stat card
<StatCard
  title="Total Revenue"
  value="$45,231.89"
  description="from last month"
  trend={{
    value: 20.1,
    label: "from last month",
    direction: "up"
  }}
  icon={<DollarSign className="h-4 w-4" />}
/>

// Action card
<ActionCard
  title="Upgrade Plan"
  description="Get access to premium features and unlimited usage."
  icon={<Crown className="h-6 w-6" />}
  primaryAction={{
    label: "Upgrade Now",
    onClick: () => console.log("Upgrade clicked")
  }}
  secondaryAction={{
    label: "Learn More",
    onClick: () => console.log("Learn more clicked")
  }}
/>

// Feature card
<FeatureCard
  title="Real-time Chat"
  description="Engage with your customers instantly through our real-time chat system."
  icon={<MessageCircle className="h-6 w-6" />}
  badge={<Badge variant="success">New</Badge>}
  onClick={() => console.log("Feature clicked")}
/>

// Interactive card
<Card interactive onClick={() => console.log("Card clicked")}>
  <CardContent>
    <p>This card is clickable</p>
  </CardContent>
</Card>
*/
