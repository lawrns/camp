/**
 * Widget Consolidation Design Tokens
 *
 * TypeScript utilities for accessing design tokens in components.
 * Provides type safety and IntelliSense for design system values.
 */

// ===== SPACING TOKENS =====
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px - base unit
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

// Semantic spacing aliases
export const spacingSemantic = {
  "1x": spacing[2], // 8px
  "2x": spacing[4], // 16px
  "3x": spacing[6], // 24px
  "4x": spacing[8], // 32px
  "5x": spacing[10], // 40px
  "6x": spacing[12], // 48px
  "8x": spacing[16], // 64px
} as const;

// ===== COLOR TOKENS =====
export const colors = {
  // Primary brand colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Main brand color
    600: "#2563eb",
    700: "#1d4ed8", // WCAG AA compliant on white
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Neutral colors - optimized for readability
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563", // WCAG AA compliant on light backgrounds
    700: "#374151", // WCAG AA compliant on white
    800: "#1f2937",
    900: "#111827",
  },

  // Semantic colors
  success: {
    50: "#ecfdf5",
    500: "#10b981",
    700: "#047857", // WCAG AA compliant
  },

  warning: {
    50: "#fffbeb",
    500: "#f59e0b",
    700: "#b45309", // WCAG AA compliant
  },

  error: {
    50: "#fef2f2",
    500: "#ef4444",
    700: "#b91c1c", // WCAG AA compliant
  },

  // Widget-specific colors
  widget: {
    bg: "#f9fafb",
    surface: "#ffffff",
    border: "#e5e7eb",
    text: "#374151",
    textMuted: "#4b5563",
  },
} as const;

// ===== TYPOGRAPHY TOKENS =====
export const typography = {
  fontFamily: {
    sans: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    display: '"Inter Tight", "Inter", "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    arabic: '"Inter", "Noto Sans Arabic", "Tahoma", sans-serif',
    hebrew: '"Inter", "Noto Sans Hebrew", "Arial Hebrew", sans-serif',
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

// ===== BORDER RADIUS TOKENS =====
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  base: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
} as const;

// Semantic radius aliases
export const borderRadiusSemantic = {
  card: borderRadius.lg,
  button: borderRadius.md,
  input: borderRadius.md,
  widget: borderRadius.xl,
} as const;

// ===== SHADOW TOKENS =====
export const shadows = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  base: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  md: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  lg: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
} as const;

// Semantic shadow aliases
export const shadowsSemantic = {
  cardBase: shadows.sm,
  cardHover: shadows.md,
  cardDeep: shadows.lg,
  modal: shadows.xl,
  widget: shadows.lg,
  focusPrimary: "0 0 0 3px rgb(59 130 246 / 0.1)",
  focusError: "0 0 0 3px rgb(239 68 68 / 0.1)",
} as const;

// ===== Z-INDEX TOKENS =====
export const zIndex = {
  base: 0,
  card: 10,
  overlay: 100,
  modal: 1000,
  tooltip: 1100,
  notification: 1200,
  widget: 2147483647, // Maximum z-index for widget
} as const;

// ===== TRANSITION TOKENS =====
export const transitions = {
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    extraSlow: "500ms",
  },

  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

// ===== WIDGET-SPECIFIC TOKENS =====
export const widget = {
  dimensions: {
    widthMobile: "320px",
    widthDesktop: "380px",
    heightMobile: "480px",
    heightDesktop: "600px",
    buttonSize: "60px",
  },

  positioning: {
    offsetBottom: "20px",
    offsetRight: "20px",
  },

  animations: {
    enter: `${transitions.duration.slow} ${transitions.easing.spring}`,
    exit: `${transitions.duration.fast} ${transitions.easing.in}`,
  },
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Get a CSS custom property value
 */
export function getCSSVar(property: string): string {
  return `var(--${property})`;
}

/**
 * Create a CSS custom property declaration
 */
export function setCSSVar(property: string, value: string): string {
  return `--${property}: ${value}`;
}

/**
 * Generate responsive spacing utilities
 */
export function responsiveSpacing(mobile: keyof typeof spacing, desktop?: keyof typeof spacing): string {
  const mobileValue = spacing[mobile];
  const desktopValue = desktop ? spacing[desktop] : mobileValue;

  if (mobile === desktop || !desktop) {
    return mobileValue;
  }

  return `${mobileValue} /* mobile */ ${desktopValue} /* desktop */`;
}

/**
 * Generate color with opacity
 */
export function colorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgb and add opacity
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgb(${r} ${g} ${b} / ${opacity})`;
}

/**
 * Generate focus ring styles
 */
export function focusRing(color: string = colors.primary[500]): string {
  return `0 0 0 3px ${colorWithOpacity(color, 0.1)}`;
}

/**
 * Generate transition styles
 */
export function transition(
  properties: string[] = ["all"],
  duration: keyof typeof transitions.duration = "normal",
  easing: keyof typeof transitions.easing = "out"
): string {
  const props = properties.join(", ");
  return `${props} ${transitions.duration[duration]} ${transitions.easing[easing]}`;
}

// ===== TYPE EXPORTS =====
export type SpacingKey = keyof typeof spacing;
export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type ZIndexKey = keyof typeof zIndex;
export type TransitionDurationKey = keyof typeof transitions.duration;
export type TransitionEasingKey = keyof typeof transitions.easing;
