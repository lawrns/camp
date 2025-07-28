/**
 * Comprehensive Responsive Breakpoint System
 * Mobile-first approach with consistent breakpoints across the application
 */

// Core breakpoint values (in pixels)
export const BREAKPOINTS = {
  xs: 320, // Small mobile
  sm: 640, // Large mobile
  md: 768, // Tablet
  lg: 1024, // Desktop
  xl: 1280, // Large desktop
  "2xl": 1536, // Wide screens
} as const;

// Semantic breakpoint aliases
export const SEMANTIC_BREAKPOINTS = {
  mobile: BREAKPOINTS.xs,
  mobileLarge: BREAKPOINTS.sm,
  tablet: BREAKPOINTS.md,
  desktop: BREAKPOINTS.lg,
  desktopLarge: BREAKPOINTS.xl,
  wide: BREAKPOINTS["2xl"],
} as const;

// Media query strings for CSS
export const MEDIA_QUERIES = {
  // Min-width queries (mobile-first)
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]}px)`,

  // Max-width queries (for specific overrides)
  xsMax: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  smMax: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  mdMax: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  lgMax: `(max-width: ${BREAKPOINTS.xl - 1}px)`,
  xlMax: `(max-width: ${BREAKPOINTS["2xl"] - 1}px)`,

  // Range queries
  xsOnly: `(min-width: ${BREAKPOINTS.xs}px) and (max-width: ${BREAKPOINTS.sm - 1}px)`,
  smOnly: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  mdOnly: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  lgOnly: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  xlOnly: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS["2xl"] - 1}px)`,

  // Semantic queries
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  mobileOnly: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  desktopLarge: `(min-width: ${BREAKPOINTS.xl}px)`,

  // Orientation queries
  landscape: "(orientation: landscape)",
  portrait: "(orientation: portrait)",
  mobileLandscape: `(max-width: ${BREAKPOINTS.md - 1}px) and (orientation: landscape)`,

  // High DPI displays
  retina: "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
  highDpi: "(-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi)",

  // Print
  print: "print",
  screen: "screen",

  // Reduced motion
  reducedMotion: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",

  // Color scheme
  darkMode: "(prefers-color-scheme: dark)",
  lightMode: "(prefers-color-scheme: light)",

  // Touch capability
  touch: "(hover: none) and (pointer: coarse)",
  mouse: "(hover: hover) and (pointer: fine)",

  // Container queries (for components)
  containerSm: "(min-width: 384px)",
  containerMd: "(min-width: 512px)",
  containerLg: "(min-width: 768px)",
} as const;

// Type definitions
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type SemanticBreakpointKey = keyof typeof SEMANTIC_BREAKPOINTS;
export type MediaQueryKey = keyof typeof MEDIA_QUERIES;

// Helper functions
export const getBreakpointValue = (key: BreakpointKey): number => BREAKPOINTS[key];

export const getSemanticBreakpointValue = (key: SemanticBreakpointKey): number => SEMANTIC_BREAKPOINTS[key];

export const getMediaQuery = (key: MediaQueryKey): string => MEDIA_QUERIES[key];

// Check if a viewport width matches a breakpoint
export const matchesBreakpoint = (width: number, breakpoint: BreakpointKey, type: "min" | "max" = "min"): boolean => {
  const value = BREAKPOINTS[breakpoint];
  return type === "min" ? width >= value : width < value;
};

// Get current breakpoint based on viewport width
export const getCurrentBreakpoint = (width: number): BreakpointKey => {
  const entries = Object.entries(BREAKPOINTS).reverse() as [BreakpointKey, number][];

  for (const [key, value] of entries) {
    if (width >= value) {
      return key;
    }
  }

  return "xs";
};

// CSS-in-JS helpers
export const media = {
  xs: `@media ${MEDIA_QUERIES.xs}`,
  sm: `@media ${MEDIA_QUERIES.sm}`,
  md: `@media ${MEDIA_QUERIES.md}`,
  lg: `@media ${MEDIA_QUERIES.lg}`,
  xl: `@media ${MEDIA_QUERIES.xl}`,
  "2xl": `@media ${MEDIA_QUERIES["2xl"]}`,

  mobile: `@media ${MEDIA_QUERIES.mobile}`,
  tablet: `@media ${MEDIA_QUERIES.tablet}`,
  desktop: `@media ${MEDIA_QUERIES.desktop}`,

  landscape: `@media ${MEDIA_QUERIES.landscape}`,
  portrait: `@media ${MEDIA_QUERIES.portrait}`,

  retina: `@media ${MEDIA_QUERIES.retina}`,
  print: `@media ${MEDIA_QUERIES.print}`,

  reducedMotion: `@media ${MEDIA_QUERIES.reducedMotion}`,
  darkMode: `@media ${MEDIA_QUERIES.darkMode}`,
  touch: `@media ${MEDIA_QUERIES.touch}`,
} as const;

// Export all constants for use in CSS/SCSS
export const breakpointValues = Object.entries(BREAKPOINTS)
  .map(([key, value]) => `--breakpoint-${key}: ${value}px`)
  .join(";\n");

export const mediaQueryStrings = Object.entries(MEDIA_QUERIES)
  .map(([key, value]) => `--media-${key}: ${value}`)
  .join(";\n");
