/**
 * Comprehensive Design System Utilities
 * Provides consistent styling patterns across the application
 */

import { spacing } from "@campfire/ui/tokens";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Design system spacing utilities
export const ds = {
  // Padding utilities
  padding: {
    none: "p-0",
    xs: "spacing-1", // 4px
    sm: "spacing-2", // 8px
    md: "spacing-4", // 16px
    lg: "spacing-6", // 24px
    xl: "spacing-8", // 32px
    "2xl": "p-12", // 48px
    
    // Directional padding
    x: {
      xs: "px-1",
      sm: "px-2", 
      md: "px-4",
      lg: "px-6",
      xl: "px-8",
      "2xl": "px-12",
    },
    y: {
      xs: "py-1",
      sm: "py-2",
      md: "py-4", 
      lg: "py-6",
      xl: "py-8",
      "2xl": "py-12",
    },
    
    // Component-specific padding
    card: "spacing-6",
    cardHeader: "px-6 py-4",
    cardContent: "px-6 pb-6",
    button: "px-4 py-2",
    input: "px-3 py-2",
    modal: "spacing-6",
    sidebar: "spacing-4",
    page: "spacing-6",
    section: "py-8",
  },

  // Margin utilities
  margin: {
    none: "m-0",
    xs: "m-1",
    sm: "m-2", 
    md: "m-4",
    lg: "m-6",
    xl: "m-8",
    "2xl": "m-12",
    
    // Directional margin
    x: {
      xs: "mx-1",
      sm: "mx-2",
      md: "mx-4", 
      lg: "mx-6",
      xl: "mx-8",
      "2xl": "mx-12",
    },
    y: {
      xs: "my-1",
      sm: "my-2",
      md: "my-4",
      lg: "my-6", 
      xl: "my-8",
      "2xl": "my-12",
    },
    
    // Auto margins
    auto: "m-auto",
    xAuto: "mx-auto",
    yAuto: "my-auto",
  },

  // Gap utilities for flex/grid
  gap: {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6", 
    xl: "gap-8",
    "2xl": "gap-12",
  },

  // Border radius
  radius: {
    none: "radius-none",
    sm: "radius-sm",
    md: "radius-md",
    lg: "radius-lg",
    xl: "radius-xl",
    "2xl": "radius-2xl",
    full: "radius-full",
  },

  // Shadows
  shadow: {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  },

  // Typography
  text: {
    // Sizes
    xs: "text-xs",
    sm: "text-sm", 
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    
    // Weights
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    
    // Colors
    primary: "text-gray-900",
    secondary: "text-gray-600",
    muted: "text-gray-500",
    accent: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  },

  // Layout utilities
  layout: {
    // Flexbox
    flex: "flex",
    flexCol: "flex flex-col",
    flexRow: "flex flex-row",
    flexCenter: "flex items-center justify-center",
    flexBetween: "flex items-center justify-between",
    flexStart: "flex items-center justify-start",
    flexEnd: "flex items-center justify-end",
    
    // Grid
    grid: "grid",
    gridCols1: "grid grid-cols-1",
    gridCols2: "grid grid-cols-2", 
    gridCols3: "grid grid-cols-3",
    gridCols4: "grid grid-cols-4",
    
    // Positioning
    relative: "relative",
    absolute: "absolute",
    fixed: "fixed",
    sticky: "sticky",
    
    // Width/Height
    full: "w-full h-full",
    wFull: "w-full",
    hFull: "h-full",
    screen: "w-screen h-screen",
  },

  // Component patterns
  components: {
    // Card patterns
    card: "bg-white rounded-lg border border-gray-200 shadow-sm",
    cardHover: "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow",

    // Button patterns
    buttonPrimary: "bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors",
    buttonSecondary: "bg-gray-100 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors",
    buttonOutline: "border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors",

    // Input patterns
    input: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    
    // Badge patterns
    badge: "inline-flex items-center px-2.5 py-0.5 radius-full text-xs font-medium",
    badgeSuccess: "inline-flex items-center px-2.5 py-0.5 radius-full text-xs font-medium bg-green-100 text-green-800",
    badgeWarning: "inline-flex items-center px-2.5 py-0.5 radius-full text-xs font-medium bg-yellow-100 text-yellow-800",
    badgeError: "inline-flex items-center px-2.5 py-0.5 radius-full text-xs font-medium bg-red-100 text-red-800",
    
    // Layout patterns
    page: "min-h-screen bg-gray-50",
    pageContent: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
    sidebar: "w-64 bg-white border-r border-gray-200 h-full",
    header: "bg-white border-b border-gray-200 px-6 py-4",
    
    // Notification patterns
    notification: "bg-white radius-lg border border-gray-200 shadow-lg spacing-4",
    notificationHeader: "flex items-center justify-between mb-2",
    notificationContent: "text-sm text-gray-600",
    notificationActions: "flex items-center gap-2 mt-3",
  },
};

// Responsive utilities
export const responsive = {
  // Breakpoint utilities
  mobile: "sm:",
  tablet: "md:",
  desktop: "lg:",
  wide: "xl:",
  ultrawide: "2xl:",
  
  // Common responsive patterns
  hideOnMobile: "hidden sm:block",
  showOnMobile: "block sm:hidden",
  stackOnMobile: "flex-col sm:flex-row",
  centerOnMobile: "text-center sm:text-left",
};

// Animation utilities
export const animations = {
  // Transitions
  transition: "transition-all duration-200 ease-in-out",
  transitionFast: "transition-all duration-100 ease-in-out",
  transitionSlow: "transition-all duration-300 ease-in-out",
  
  // Hover effects
  hoverScale: "hover:scale-105 transition-transform duration-200",
  hoverShadow: "hover:shadow-lg transition-shadow duration-200",
  hoverOpacity: "hover:opacity-80 transition-opacity duration-200",
  
  // Focus effects
  focusRing: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  focusVisible: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
};

// Utility functions for dynamic styling
export const utils = {
  // Conditional classes
  when: (condition: boolean, classes: string) => condition ? classes : "",
  
  // Variant selector
  variant: <T extends Record<string, string>>(variants: T, selected: keyof T) => variants[selected] || "",
  
  // Size selector
  size: (sizes: Record<string, string>, selected: string) => sizes[selected] || sizes.md || "",
};
