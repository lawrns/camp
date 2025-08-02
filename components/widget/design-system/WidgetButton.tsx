/**
 * PIXEL-PERFECT WIDGET BUTTON COMPONENT
 * 
 * Standardized button component with consistent styling, hover states,
 * and interactions following the 8px grid system
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACING, COLORS, RADIUS, SHADOWS, ANIMATIONS, TYPOGRAPHY } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface WidgetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// LOADING SPINNER
// ============================================================================
function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
    </motion.div>
  );
}

// ============================================================================
// PIXEL-PERFECT WIDGET BUTTON
// ============================================================================
export function WidgetButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: WidgetButtonProps) {
  
  // Get variant styles
  const getVariantStyles = () => {
    const baseStyles = {
      fontFamily: TYPOGRAPHY.messageText.fontFamily,
      fontWeight: '500',
      borderRadius: RADIUS.button,
      transition: `all ${ANIMATIONS.fast} ${ANIMATIONS.easeOut}`,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      border: '1px solid',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      textDecoration: 'none',
      outline: 'none',
      position: 'relative' as const,
    };

    if (disabled || isLoading) {
      return {
        ...baseStyles,
        opacity: 0.6,
        backgroundColor: COLORS.border,
        borderColor: COLORS.border,
        color: COLORS.agent.timestamp,
        boxShadow: 'none',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: COLORS.primary[500],
          borderColor: COLORS.primary[500],
          color: 'white',
          boxShadow: SHADOWS.button,
        };
      
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          color: COLORS.agent.text,
          boxShadow: SHADOWS.button,
        };
      
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLORS.agent.text,
          boxShadow: 'none',
        };
      
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          color: 'white',
          boxShadow: SHADOWS.button,
        };
      
      default:
        return baseStyles;
    }
  };

  // Get hover styles
  const getHoverStyles = () => {
    if (disabled || isLoading) return {};

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary[600],
          borderColor: COLORS.primary[600],
          transform: 'translateY(-1px)',
          boxShadow: SHADOWS.md,
        };
      
      case 'secondary':
        return {
          backgroundColor: COLORS.background,
          borderColor: COLORS.primary[300],
          transform: 'translateY(-1px)',
          boxShadow: SHADOWS.md,
        };
      
      case 'ghost':
        return {
          backgroundColor: COLORS.hover,
        };
      
      case 'danger':
        return {
          backgroundColor: '#dc2626',
          borderColor: '#dc2626',
          transform: 'translateY(-1px)',
          boxShadow: SHADOWS.md,
        };
      
      default:
        return {};
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          padding: '4px 8px',
          fontSize: '12px',
          lineHeight: '16px',
          minHeight: '24px',
        };
      
      case 'sm':
        return {
          padding: SPACING.buttonPadding,
          fontSize: '13px',
          lineHeight: '18px',
          minHeight: '32px',
        };
      
      case 'md':
        return {
          padding: '8px 16px',
          fontSize: TYPOGRAPHY.messageText.fontSize,
          lineHeight: TYPOGRAPHY.messageText.lineHeight,
          minHeight: '40px',
        };
      
      case 'lg':
        return {
          padding: '12px 20px',
          fontSize: '16px',
          lineHeight: '24px',
          minHeight: '48px',
        };
      
      default:
        return {};
    }
  };

  // Get focus styles
  const getFocusStyles = () => ({
    outline: 'none',
    boxShadow: `0 0 0 2px ${COLORS.primary[300]}`,
  });

  const baseStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { ...getHoverStyles() }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      whileFocus={getFocusStyles()}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={cn(
        fullWidth && 'w-full',
        className
      )}
      style={{
        ...baseStyles,
        ...sizeStyles,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Left icon */}
      {leftIcon && !isLoading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <LoadingSpinner size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}

      {/* Button text */}
      <span style={{ 
        opacity: isLoading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.xs,
      }}>
        {children}
      </span>

      {/* Right icon */}
      {rightIcon && !isLoading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
}

// ============================================================================
// ICON BUTTON VARIANT
// ============================================================================
export interface WidgetIconButtonProps extends Omit<WidgetButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export function WidgetIconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}: WidgetIconButtonProps) {
  const getIconSize = () => {
    switch (size) {
      case 'xs': return '12px';
      case 'sm': return '16px';
      case 'md': return '20px';
      case 'lg': return '24px';
      default: return '20px';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'xs': return { width: '24px', height: '24px', padding: '4px' };
      case 'sm': return { width: '32px', height: '32px', padding: '6px' };
      case 'md': return { width: '40px', height: '40px', padding: '8px' };
      case 'lg': return { width: '48px', height: '48px', padding: '12px' };
      default: return { width: '40px', height: '40px', padding: '8px' };
    }
  };

  return (
    <WidgetButton
      variant={variant}
      size={size}
      className={cn('!p-0', className)}
      style={getButtonSize()}
      {...props}
    >
      <span style={{ 
        fontSize: getIconSize(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </span>
    </WidgetButton>
  );
}
