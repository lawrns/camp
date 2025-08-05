/**
 * Avatar Atom - Atomic Design System
 * 
 * Displays user profile images with fallbacks and status indicators.
 * Supports various sizes and states for consistent user representation.
 */

'use client';

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

// ============================================================================
// AVATAR VARIANTS
// ============================================================================

const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 overflow-hidden rounded-full',
    'bg-muted text-muted-foreground',
    'select-none',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        default: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
    },
    
    defaultVariants: {
      size: 'default',
    },
  }
);

const statusVariants = cva(
  [
    'absolute rounded-full border-2 border-background',
    'z-10',
  ],
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
      },
      
      size: {
        xs: 'h-2 w-2 bottom-0 right-0',
        sm: 'h-2.5 w-2.5 bottom-0 right-0',
        default: 'h-3 w-3 bottom-0 right-0',
        lg: 'h-3.5 w-3.5 bottom-0 right-0',
        xl: 'h-4 w-4 bottom-0 right-0',
        '2xl': 'h-5 w-5 bottom-0 right-0',
      },
    },
    
    defaultVariants: {
      status: 'offline',
      size: 'default',
    },
  }
);

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  loading?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      src,
      alt,
      fallback,
      status,
      showStatus = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const showImage = src && !imageError && !loading;
    const showFallback = !showImage;

    // Generate initials from fallback text
    const getInitials = (text?: string) => {
      if (!text) return '';
      return text
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const initials = getInitials(fallback || alt);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {/* Loading State */}
        {loading && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}

        {/* Image */}
        {showImage && (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className={cn(
              'h-full w-full object-cover',
              imageLoading && 'opacity-0'
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        )}

        {/* Fallback */}
        {showFallback && !loading && (
          <div className="flex h-full w-full items-center justify-center">
            {initials ? (
              <span className="font-medium leading-none">
                {initials}
              </span>
            ) : (
              <User className="h-1/2 w-1/2" />
            )}
          </div>
        )}

        {/* Status Indicator */}
        {showStatus && status && (
          <div
            className={cn(statusVariants({ status, size }))}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };

// ============================================================================
// AVATAR GROUP COMPONENT
// ============================================================================

interface AvatarGroupProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  spacing?: 'tight' | 'normal' | 'loose';
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, className, max = 5, size, spacing = 'normal', ...props }, ref) => {
    const avatars = React.Children.toArray(children);
    const visibleAvatars = max ? avatars.slice(0, max) : avatars;
    const hiddenCount = avatars.length - visibleAvatars.length;

    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <div
            key={index}
            className="ring-2 ring-background"
            style={{ zIndex: visibleAvatars.length - index }}
          >
            {React.isValidElement(avatar) && avatar.type === Avatar
              ? React.cloneElement(avatar, { size: size || avatar.props.size })
              : avatar}
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div
            className={cn(
              avatarVariants({ size }),
              'ring-2 ring-background bg-muted',
              'flex items-center justify-center',
              'text-xs font-medium text-muted-foreground'
            )}
            style={{ zIndex: 0 }}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

// ============================================================================
// AVATAR WITH BADGE COMPONENT
// ============================================================================

interface AvatarWithBadgeProps extends AvatarProps {
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const AvatarWithBadge = forwardRef<HTMLDivElement, AvatarWithBadgeProps>(
  ({ badge, badgePosition = 'top-right', className, ...props }, ref) => {
    const badgePositionClasses = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
    };

    return (
      <div ref={ref} className={cn('relative inline-block', className)}>
        <Avatar {...props} />
        
        {badge && (
          <div
            className={cn(
              'absolute z-10',
              badgePositionClasses[badgePosition]
            )}
          >
            {badge}
          </div>
        )}
      </div>
    );
  }
);

AvatarWithBadge.displayName = 'AvatarWithBadge';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic avatar with image
<Avatar 
  src="/avatars/user1.jpg" 
  alt="John Doe" 
  fallback="John Doe"
/>

// Avatar with initials fallback
<Avatar fallback="JD" />

// Avatar with status
<Avatar 
  src="/avatars/user1.jpg"
  fallback="John Doe"
  status="online"
  showStatus
/>

// Different sizes
<Avatar size="xs" fallback="XS" />
<Avatar size="sm" fallback="SM" />
<Avatar size="lg" fallback="LG" />
<Avatar size="xl" fallback="XL" />
<Avatar size="2xl" fallback="2XL" />

// Loading state
<Avatar loading />

// Avatar group
<AvatarGroup max={3}>
  <Avatar src="/avatars/user1.jpg" fallback="U1" />
  <Avatar src="/avatars/user2.jpg" fallback="U2" />
  <Avatar src="/avatars/user3.jpg" fallback="U3" />
  <Avatar src="/avatars/user4.jpg" fallback="U4" />
  <Avatar src="/avatars/user5.jpg" fallback="U5" />
</AvatarGroup>

// Avatar with badge
<AvatarWithBadge
  src="/avatars/user1.jpg"
  fallback="JD"
  badge={
    <div className="h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
      3
    </div>
  }
  badgePosition="top-right"
/>

// Avatar with custom status colors
<Avatar 
  fallback="AI"
  status="online"
  showStatus
  className="ring-2 ring-blue-500"
/>
*/
