/**
 * RESPONSIVE DESIGN HOOK
 * 
 * Custom hook for handling responsive design in the widget system
 * with proper breakpoint detection and mobile optimizations
 */

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  devicePixelRatio: number;
}

export interface ResponsiveBreakpoints {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getScreenDimensions() {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      isTouch: false,
      devicePixelRatio: 1,
      userAgent: '',
    };
  }
  
  return {
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
  };
}

function parseBreakpoint(breakpoint: string): number {
  return parseInt(breakpoint.replace('px', ''), 10);
}

// ============================================================================
// RESPONSIVE HOOK
// ============================================================================
export function useResponsive(): ResponsiveState & ResponsiveBreakpoints {
  const [dimensions, setDimensions] = useState(getScreenDimensions);
  const [deviceInfo] = useState(getDeviceInfo);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getScreenDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate breakpoints
  const breakpoints: ResponsiveBreakpoints = {
    xs: dimensions.width >= parseBreakpoint(BREAKPOINTS.xs),
    sm: dimensions.width >= parseBreakpoint(BREAKPOINTS.sm),
    md: dimensions.width >= parseBreakpoint(BREAKPOINTS.md),
    lg: dimensions.width >= parseBreakpoint(BREAKPOINTS.lg),
    xl: dimensions.width >= parseBreakpoint(BREAKPOINTS.xl),
    '2xl': dimensions.width >= parseBreakpoint(BREAKPOINTS['2xl']),
  };

  // Calculate device categories
  const isMobile = dimensions.width < parseBreakpoint(BREAKPOINTS.sm);
  const isTablet = dimensions.width >= parseBreakpoint(BREAKPOINTS.sm) && 
                   dimensions.width < parseBreakpoint(BREAKPOINTS.lg);
  const isDesktop = dimensions.width >= parseBreakpoint(BREAKPOINTS.lg);
  const isLargeScreen = dimensions.width >= parseBreakpoint(BREAKPOINTS.xl);

  // Calculate orientation
  const orientation: 'portrait' | 'landscape' = 
    dimensions.height > dimensions.width ? 'portrait' : 'landscape';

  return {
    // Device categories
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    
    // Screen info
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    orientation,
    
    // Device capabilities
    isTouch: deviceInfo.isTouch,
    devicePixelRatio: deviceInfo.devicePixelRatio,
    
    // Breakpoints
    ...breakpoints,
  };
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================
export function useWidgetDimensions() {
  const responsive = useResponsive();
  
  const getWidgetDimensions = (state: 'closed' | 'minimized' | 'open' | 'expanded') => {
    switch (state) {
      case 'closed':
        return {
          width: responsive.isMobile ? '56px' : '48px',
          height: responsive.isMobile ? '56px' : '48px',
        };
        
      case 'minimized':
        return {
          width: responsive.isMobile ? '288px' : '320px',
          height: '48px',
        };
        
      case 'expanded':
        if (responsive.isMobile) {
          return {
            width: 'calc(100vw - 1rem)',
            height: 'calc(100vh - 1rem)',
          };
        } else if (responsive.isTablet) {
          return {
            width: '90vw',
            height: '90vh',
            maxWidth: '768px',
            maxHeight: '700px',
          };
        } else {
          return {
            width: '90vw',
            height: '90vh',
            maxWidth: '1024px',
            maxHeight: '800px',
          };
        }
        
      default: // 'open'
        if (responsive.isMobile) {
          return {
            width: 'calc(100vw - 1rem)',
            height: 'calc(100vh - 2rem)',
            maxHeight: '600px',
          };
        } else if (responsive.isTablet) {
          return {
            width: '384px',
            height: 'calc(100vh - 2rem)',
            maxHeight: '600px',
          };
        } else {
          return {
            width: '448px',
            height: '640px',
          };
        }
    }
  };
  
  return { getWidgetDimensions, ...responsive };
}

// ============================================================================
// RESPONSIVE POSITIONING
// ============================================================================
export function useWidgetPosition(position: 'bottom-right' | 'bottom-left' = 'bottom-right') {
  const responsive = useResponsive();
  
  const getPositionStyles = (state: 'closed' | 'minimized' | 'open' | 'expanded') => {
    // For expanded state or mobile open state, center the widget
    if (state === 'expanded' || (state === 'open' && responsive?.isMobile)) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2147483647,
      };
    }
    
    // Standard positioning
    const margin = responsive.isMobile ? '8px' : '16px';
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 2147483647,
    };
    
    switch (position) {
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: margin,
          left: margin,
        };
        
      default: // 'bottom-right'
        return {
          ...baseStyles,
          bottom: margin,
          right: margin,
        };
    }
  };
  
  return { getPositionStyles, ...responsive };
}

// ============================================================================
// RESPONSIVE TYPOGRAPHY
// ============================================================================
export function useResponsiveTypography() {
  const responsive = useResponsive();
  
  const getTypographyScale = () => {
    if (responsive.isMobile) {
      return {
        messageText: '16px',
        timestamp: '12px',
        header: '16px',
        input: '16px', // Prevents zoom on iOS
        button: '16px',
      };
    } else {
      return {
        messageText: '14px',
        timestamp: '11px',
        header: '15px',
        input: '14px',
        button: '14px',
      };
    }
  };
  
  return { getTypographyScale, ...responsive };
}

// ============================================================================
// RESPONSIVE TOUCH TARGETS
// ============================================================================
export function useResponsiveTouchTargets() {
  const responsive = useResponsive();
  
  const getMinTouchTarget = () => {
    // iOS and Android guidelines recommend 44px minimum
    return responsive.isTouch ? '44px' : '40px';
  };
  
  const getTouchTargetPadding = (size: 'sm' | 'md' | 'lg' = 'md') => {
    if (responsive.isTouch) {
      switch (size) {
        case 'sm': return '8px 12px';
        case 'lg': return '16px 24px';
        default: return '12px 16px';
      }
    } else {
      switch (size) {
        case 'sm': return '6px 10px';
        case 'lg': return '12px 20px';
        default: return '8px 16px';
      }
    }
  };
  
  return { getMinTouchTarget, getTouchTargetPadding, ...responsive };
}
