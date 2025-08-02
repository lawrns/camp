/**
 * CAMPFIRE WIDGET DESIGN SYSTEM TOKENS
 * 
 * Pixel-perfect design tokens following 8px grid system
 * Based on Intercom standards with meticulous attention to detail
 */

// ============================================================================
// SPACING SYSTEM - 8px Grid (Meticulously Calculated)
// ============================================================================
export const SPACING = {
  // Base unit: 8px
  xs: '4px',   // 0.5 * base
  sm: '8px',   // 1 * base  
  md: '12px',  // 1.5 * base
  lg: '16px',  // 2 * base
  xl: '24px',  // 3 * base
  '2xl': '32px', // 4 * base
  '3xl': '48px', // 6 * base
  
  // Message-specific spacing
  messagePadding: '12px 16px',     // Perfect for readability
  messageMargin: '8px',            // Between messages
  messageGroupGap: '16px',         // Between message groups
  containerPadding: '16px',        // Widget container
  inputPadding: '12px 16px',       // Input field
  buttonPadding: '8px 12px',       // Small buttons
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM - Optimized for Chat
// ============================================================================
export const TYPOGRAPHY = {
  // Message content
  messageText: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Timestamps
  timestamp: {
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '400',
    opacity: '0.7',
  },
  
  // Sender names
  senderName: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '500',
  },
  
  // Input text
  input: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
  },
  
  // Widget header
  header: {
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: '600',
  },
  
  // Status text
  status: {
    fontSize: '11px',
    lineHeight: '14px',
    fontWeight: '400',
  },
} as const;

// ============================================================================
// COLOR SYSTEM - Intercom-Inspired Palette
// ============================================================================
export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Message bubble colors
  visitor: {
    background: '#3b82f6',    // Primary blue
    text: '#ffffff',
    timestamp: 'rgba(255, 255, 255, 0.7)',
    border: 'transparent',
  },
  
  agent: {
    background: '#f3f4f6',    // Light gray
    text: '#111827',          // Dark gray
    timestamp: 'rgba(17, 24, 39, 0.6)',
    border: '#e5e7eb',
  },
  
  system: {
    background: '#fef3c7',    // Light yellow
    text: '#92400e',          // Dark yellow
    timestamp: 'rgba(146, 64, 14, 0.6)',
    border: '#fde68a',
  },
  
  // Status colors
  status: {
    online: '#10b981',
    away: '#f59e0b', 
    offline: '#6b7280',
    typing: '#3b82f6',
  },
  
  // UI colors
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  divider: '#f3f4f6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Interactive states
  hover: 'rgba(59, 130, 246, 0.05)',
  focus: 'rgba(59, 130, 246, 0.1)',
  active: 'rgba(59, 130, 246, 0.15)',
} as const;

// ============================================================================
// BORDER RADIUS - Consistent Rounded Corners
// ============================================================================
export const RADIUS = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
  
  // Message-specific radius
  messageBubble: {
    visitor: '16px 16px 4px 16px',    // Tail on bottom-right
    agent: '16px 16px 16px 4px',      // Tail on bottom-left
    system: '12px',                   // Fully rounded
  },
  
  // Widget elements
  widget: '16px',
  button: '8px',
  input: '8px',
  avatar: '50%',
} as const;

// ============================================================================
// SHADOWS - Subtle Depth
// ============================================================================
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Widget-specific shadows
  widget: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  messageBubble: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
} as const;

// ============================================================================
// LAYOUT CONSTRAINTS - Pixel-Perfect Sizing
// ============================================================================
export const LAYOUT = {
  // Widget dimensions
  widget: {
    minWidth: '320px',
    maxWidth: '400px',
    minHeight: '400px',
    maxHeight: '600px',
    defaultWidth: '384px',   // 24rem
    defaultHeight: '600px',  // 37.5rem
  },
  
  // Message constraints
  message: {
    maxWidth: '280px',       // 70% of widget width
    minHeight: '40px',       // Minimum touch target
    avatarSize: '32px',      // Standard avatar
    timestampHeight: '16px', // Consistent timestamp space
  },
  
  // Input area
  input: {
    minHeight: '44px',       // iOS touch target
    maxHeight: '120px',      // 6 lines max
    padding: '12px 16px',    // Comfortable padding
  },
  
  // Header
  header: {
    height: '64px',          // Standard header height
    padding: '16px',         // Consistent padding
  },
  
  // Tab bar
  tabBar: {
    height: '56px',          // Standard tab height
    padding: '8px',          // Tab padding
  },
} as const;

// ============================================================================
// ANIMATION TIMING - Smooth Interactions
// ============================================================================
export const ANIMATIONS = {
  // Duration
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  
  // Easing
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  // Message-specific
  messageEntry: {
    duration: '250ms',
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    delay: '50ms',
  },
  
  // Widget interactions
  widgetToggle: {
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS - Proper Stacking
// ============================================================================
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  widget: 2147483647,      // Maximum z-index for widget
} as const;

// ============================================================================
// BREAKPOINTS - Responsive Design
// ============================================================================
export const BREAKPOINTS = {
  xs: '475px',   // Large phones
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Laptops
  '2xl': '1536px', // Large screens
} as const;

// ============================================================================
// RESPONSIVE WIDGET SIZING
// ============================================================================
export const RESPONSIVE = {
  // Widget dimensions per breakpoint
  widget: {
    mobile: {
      width: 'calc(100vw - 1rem)',
      height: 'calc(100vh - 2rem)',
      maxHeight: '600px',
      margin: '8px',
    },
    tablet: {
      width: '384px',
      height: 'calc(100vh - 2rem)',
      maxHeight: '600px',
      margin: '16px',
    },
    desktop: {
      width: '448px',
      height: '640px',
      maxHeight: '800px',
      margin: '16px',
    },
  },

  // Button sizes per breakpoint
  button: {
    mobile: {
      minHeight: '44px',
      padding: '12px 16px',
      fontSize: '16px',
    },
    desktop: {
      minHeight: '40px',
      padding: '8px 16px',
      fontSize: '14px',
    },
  },

  // Typography scaling
  typography: {
    mobile: {
      messageText: '16px',
      timestamp: '12px',
      header: '16px',
    },
    desktop: {
      messageText: '14px',
      timestamp: '11px',
      header: '15px',
    },
  },
} as const;
