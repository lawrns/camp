/**
 * CAMPFIRE V2 DESIGN TOKENS - SINGLE SOURCE OF TRUTH
 * 
 * This file contains ALL design tokens that MUST be used throughout the application.
 * No hardcoded colors, spacing, or other design values should exist outside this system.
 * 
 * Goals:
 * - Unbreakable design consistency
 * - Zero layout breaks
 * - WCAG AA compliance
 * - Performance optimized
 * - AI handover seamlessness
 */

// ===== CORE DESIGN TOKENS =====

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Neutral colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Status colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Semantic colors
  background: '#ffffff',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  muted: '#f1f5f9',
} as const;

// ===== SPACING TOKENS (8px grid system) =====

export const spacing = {
  0: '0rem',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px - base unit
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
} as const;

// ===== BORDER RADIUS TOKENS =====

export const radius = {
  none: '0rem',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ===== TYPOGRAPHY TOKENS =====

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ===== SHADOW TOKENS =====

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ===== MOTION TOKENS =====

export const motion = {
  duration: {
    fast: '150ms',
    medium: '300ms',
    slow: '500ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // AI-specific motion tokens
  ai: {
    thinking: {
      duration: '1.5s',
      easing: 'ease-in-out',
    },
    typing: {
      duration: '300ms',
      easing: 'ease-out',
    },
    handover: {
      duration: '500ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// ===== BREAKPOINT TOKENS =====

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== Z-INDEX TOKENS =====

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ===== AI-SPECIFIC TOKENS =====

export const ai = {
  // AI state colors
  thinking: {
    background: colors.info[50],
    border: colors.info[200],
    text: colors.info[700],
  },
  confident: {
    background: colors.success[50],
    border: colors.success[200],
    text: colors.success[700],
  },
  uncertain: {
    background: colors.warning[50],
    border: colors.warning[200],
    text: colors.warning[700],
  },
  error: {
    background: colors.error[50],
    border: colors.error[200],
    text: colors.error[700],
  },
  
  // AI interaction patterns
  handover: {
    transition: motion.ai.handover,
    indicator: {
      size: spacing[4],
      color: colors.primary[500],
    },
  },
  
  typing: {
    indicator: {
      dots: 3,
      interval: '600ms',
      color: colors.neutral[400],
    },
  },
} as const;

// ===== COMPONENT-SPECIFIC TOKENS =====

export const components = {
  button: {
    height: {
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px
      lg: '3rem',    // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[3]} ${spacing[4]}`,
      lg: `${spacing[4]} ${spacing[6]}`,
    },
    radius: radius.md,
  },
  
  input: {
    height: '2.5rem', // 40px
    padding: `${spacing[2]} ${spacing[3]}`,
    radius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  
  card: {
    padding: spacing[6],
    radius: radius.lg,
    shadow: shadows.md,
  },
  
  modal: {
    padding: spacing[6],
    radius: radius.xl,
    shadow: shadows['2xl'],
  },
} as const;

// ===== EXPORT ALL TOKENS =====

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  motion,
  breakpoints,
  zIndex,
  ai,
  components,
} as const;

// ===== TYPE DEFINITIONS =====

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyToken = keyof typeof typography;
export type ShadowToken = keyof typeof shadows;
export type MotionToken = keyof typeof motion;
export type BreakpointToken = keyof typeof breakpoints;
export type ZIndexToken = keyof typeof zIndex;
export type AIToken = keyof typeof ai;
export type ComponentToken = keyof typeof components;

export type DesignToken = 
  | ColorToken 
  | SpacingToken 
  | RadiusToken 
  | TypographyToken 
  | ShadowToken 
  | MotionToken 
  | BreakpointToken 
  | ZIndexToken 
  | AIToken 
  | ComponentToken;

// ===== UTILITY FUNCTIONS =====

/**
 * Get a design token value by path
 * @param path - Dot-separated path to the token (e.g., 'colors.primary.500')
 * @returns The token value or the path if not found
 */
export function getToken(path: string): string {
  const keys = path.split('.');
  let value: any = tokens;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return path if token not found
    }
  }
  
  return typeof value === 'string' ? value : path;
}

/**
 * Generate CSS custom properties for all tokens
 * @returns CSS string with all design tokens as custom properties
 */
export function generateCSSVariables(): string {
  const cssVars: string[] = [];
  
  // Colors
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([shade, value]) => {
        cssVars.push(`--ds-color-${category}-${shade}: ${value};`);
      });
    } else {
      cssVars.push(`--ds-color-${category}: ${values};`);
    }
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars.push(`--ds-spacing-${key}: ${value};`);
  });
  
  // Radius
  Object.entries(radius).forEach(([key, value]) => {
    cssVars.push(`--ds-radius-${key}: ${value};`);
  });
  
  // Typography
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--ds-font-size-${key}: ${value};`);
  });
  
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`--ds-font-weight-${key}: ${value};`);
  });
  
  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars.push(`--ds-shadow-${key}: ${value};`);
  });
  
  // Motion
  Object.entries(motion.duration).forEach(([key, value]) => {
    cssVars.push(`--ds-motion-duration-${key}: ${value};`);
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate that a value is a valid design token
 * @param value - The value to validate
 * @returns True if the value is a valid design token
 */
export function isValidToken(value: string): boolean {
  return getToken(value) !== value;
}

/**
 * Get all available token paths
 * @returns Array of all available token paths
 */
export function getAllTokenPaths(): string[] {
  const paths: string[] = [];
  
  function traverse(obj: any, currentPath: string = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, newPath);
      } else {
        paths.push(newPath);
      }
    });
  }
  
  traverse(tokens);
  return paths;
}

export default tokens; 