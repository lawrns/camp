/**
 * PIXEL-PERFECT WIDGET TABS COMPONENT
 * 
 * Standardized tab navigation with consistent styling, animations,
 * and interactions following the design system
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACING, COLORS, RADIUS, LAYOUT, ANIMATIONS, TYPOGRAPHY } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface WidgetTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface WidgetTabsProps {
  tabs: WidgetTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

// ============================================================================
// TAB BADGE COMPONENT
// ============================================================================
function TabBadge({ 
  badge, 
  size = 'md' 
}: { 
  badge: number | string; 
  size?: 'sm' | 'md' | 'lg';
}) {
  const getBadgeSize = () => {
    switch (size) {
      case 'sm':
        return {
          fontSize: '10px',
          lineHeight: '12px',
          padding: '2px 4px',
          minWidth: '16px',
          height: '16px',
        };
      case 'md':
        return {
          fontSize: '11px',
          lineHeight: '14px',
          padding: '2px 6px',
          minWidth: '18px',
          height: '18px',
        };
      case 'lg':
        return {
          fontSize: '12px',
          lineHeight: '16px',
          padding: '3px 6px',
          minWidth: '20px',
          height: '20px',
        };
      default:
        return {
          fontSize: '11px',
          lineHeight: '14px',
          padding: '2px 6px',
          minWidth: '18px',
          height: '18px',
        };
    }
  };

  const badgeStyles = getBadgeSize();

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      style={{
        ...badgeStyles,
        backgroundColor: COLORS.primary[500],
        color: 'white',
        borderRadius: '50px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.xs,
      }}
    >
      {typeof badge === 'number' && badge > 99 ? '99+' : badge}
    </motion.span>
  );
}

// ============================================================================
// INDIVIDUAL TAB COMPONENT
// ============================================================================
function Tab({
  tab,
  isActive,
  variant,
  size,
  onClick,
}: {
  tab: WidgetTab;
  isActive: boolean;
  variant: 'default' | 'pills' | 'underline';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
}) {
  const getTabStyles = () => {
    const baseStyles = {
      fontFamily: TYPOGRAPHY.messageText.fontFamily,
      fontWeight: isActive ? '600' : '500',
      cursor: tab.disabled ? 'not-allowed' : 'pointer',
      transition: `all ${ANIMATIONS.fast} ${ANIMATIONS.easeOut}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      outline: 'none',
      border: 'none',
      background: 'none',
      position: 'relative' as const,
    };

    // Size-specific styles
    const sizeStyles = (() => {
      switch (size) {
        case 'sm':
          return {
            fontSize: '12px',
            lineHeight: '16px',
            padding: '6px 12px',
            minHeight: '32px',
          };
        case 'md':
          return {
            fontSize: '13px',
            lineHeight: '18px',
            padding: '8px 16px',
            minHeight: '40px',
          };
        case 'lg':
          return {
            fontSize: '14px',
            lineHeight: '20px',
            padding: '10px 20px',
            minHeight: '48px',
          };
        default:
          return {
            fontSize: '13px',
            lineHeight: '18px',
            padding: '8px 16px',
            minHeight: '40px',
          };
      }
    })();

    // Variant-specific styles
    const variantStyles = (() => {
      switch (variant) {
        case 'pills':
          return {
            borderRadius: RADIUS.full,
            backgroundColor: isActive ? COLORS.primary[500] : 'transparent',
            color: isActive ? 'white' : COLORS.agent.text,
          };
        
        case 'underline':
          return {
            borderRadius: '0',
            backgroundColor: 'transparent',
            color: isActive ? COLORS.primary[600] : COLORS.agent.text,
            borderBottom: `2px solid ${isActive ? COLORS.primary[500] : 'transparent'}`,
          };
        
        default: // 'default'
          return {
            borderRadius: RADIUS.button,
            backgroundColor: isActive ? COLORS.surface : 'transparent',
            color: isActive ? COLORS.primary[600] : COLORS.agent.text,
            border: `1px solid ${isActive ? COLORS.primary[300] : 'transparent'}`,
          };
      }
    })();

    // Disabled styles
    if (tab.disabled) {
      return {
        ...baseStyles,
        ...sizeStyles,
        ...variantStyles,
        opacity: 0.5,
        color: COLORS.agent.timestamp,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
    }

    return {
      ...baseStyles,
      ...sizeStyles,
      ...variantStyles,
    };
  };

  const getHoverStyles = () => {
    if (tab.disabled || isActive) return {};

    switch (variant) {
      case 'pills':
        return {
          backgroundColor: COLORS.hover,
        };
      
      case 'underline':
        return {
          backgroundColor: COLORS.hover,
          borderBottomColor: COLORS.primary[300],
        };
      
      default:
        return {
          backgroundColor: COLORS.hover,
          borderColor: COLORS.primary[200],
        };
    }
  };

  return (
    <motion.button
      whileHover={getHoverStyles()}
      whileTap={tab.disabled ? {} : { scale: 0.98 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      style={getTabStyles()}
      onClick={tab.disabled ? undefined : onClick}
      disabled={tab.disabled}
      aria-selected={isActive}
      role="tab"
    >
      {/* Tab icon */}
      {tab.icon && (
        <span style={{ 
          marginRight: tab.label ? SPACING.xs : '0',
          display: 'flex',
          alignItems: 'center',
        }}>
          {tab.icon}
        </span>
      )}

      {/* Tab label */}
      {tab.label && (
        <span>{tab.label}</span>
      )}

      {/* Tab badge */}
      <AnimatePresence>
        {tab.badge && (
          <TabBadge badge={tab.badge} size={size} />
        )}
      </AnimatePresence>

      {/* Active indicator for underline variant */}
      {variant === 'underline' && isActive && (
        <motion.div
          layoutId="activeIndicator"
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: COLORS.primary[500],
            borderRadius: '1px',
          }}
          transition={{
            duration: parseFloat(ANIMATIONS.normal) / 1000,
            ease: [0.0, 0.0, 0.2, 1],
          }}
        />
      )}
    </motion.button>
  );
}

// ============================================================================
// PIXEL-PERFECT WIDGET TABS
// ============================================================================
export function WidgetTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}: WidgetTabsProps) {
  
  return (
    <div
      className={cn(
        'flex',
        fullWidth ? 'w-full' : 'w-auto',
        variant === 'underline' ? 'border-b border-gray-200' : '',
        className
      )}
      style={{
        gap: variant === 'pills' ? SPACING.xs : '0',
        padding: variant === 'underline' ? '0' : SPACING.xs,
        backgroundColor: variant === 'default' ? COLORS.surface : 'transparent',
        borderRadius: variant === 'default' ? RADIUS.button : '0',
      }}
      role="tablist"
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            flex: fullWidth ? '1' : 'none',
          }}
        >
          <Tab
            tab={tab}
            isActive={activeTab === tab.id}
            variant={variant}
            size={size}
            onClick={() => onTabChange(tab.id)}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// BOTTOM TAB BAR VARIANT
// ============================================================================
export interface WidgetBottomTabsProps extends Omit<WidgetTabsProps, 'variant' | 'fullWidth'> {
  position?: 'bottom' | 'top';
}

export function WidgetBottomTabs({
  tabs,
  activeTab,
  onTabChange,
  size = 'md',
  position = 'bottom',
  className,
}: WidgetBottomTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'bottom' ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.normal) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex w-full border-t bg-white',
        className
      )}
      style={{
        height: LAYOUT.tabBar.height,
        padding: LAYOUT.tabBar.padding,
        borderTopColor: COLORS.border,
        borderBottomLeftRadius: position === 'bottom' ? RADIUS.widget : '0',
        borderBottomRightRadius: position === 'bottom' ? RADIUS.widget : '0',
        borderTopLeftRadius: position === 'top' ? RADIUS.widget : '0',
        borderTopRightRadius: position === 'top' ? RADIUS.widget : '0',
      }}
      role="tablist"
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileHover={tab.disabled ? {} : { backgroundColor: COLORS.hover }}
          whileTap={tab.disabled ? {} : { scale: 0.95 }}
          transition={{
            duration: parseFloat(ANIMATIONS.fast) / 1000,
            ease: [0.4, 0.0, 0.2, 1],
          }}
          style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            padding: SPACING.xs,
            borderRadius: RADIUS.sm,
            border: 'none',
            background: 'none',
            cursor: tab.disabled ? 'not-allowed' : 'pointer',
            color: activeTab === tab.id ? COLORS.primary[600] : COLORS.agent.timestamp,
            fontSize: '11px',
            lineHeight: '14px',
            fontWeight: activeTab === tab.id ? '600' : '500',
            opacity: tab.disabled ? 0.5 : 1,
          }}
          onClick={tab.disabled ? undefined : () => onTabChange(tab.id)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {/* Tab icon */}
          {tab.icon && (
            <span style={{ 
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
              {tab.icon}
              {/* Badge for bottom tabs */}
              <AnimatePresence>
                {tab.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      backgroundColor: COLORS.primary[500],
                      color: 'white',
                      fontSize: '9px',
                      lineHeight: '12px',
                      fontWeight: '600',
                      padding: '1px 4px',
                      borderRadius: '6px',
                      minWidth: '12px',
                      height: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {typeof tab.badge === 'number' && tab.badge > 9 ? '9+' : tab.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          )}

          {/* Tab label */}
          <span>{tab.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
