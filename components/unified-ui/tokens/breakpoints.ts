/**
 * Premium Responsive System
 *
 * Mobile-first breakpoint system with media query helpers.
 * Supports both viewport and container queries.
 */

// Breakpoint values
export const breakpointValues = {
  xs: 0, // Extra small devices
  sm: 640, // Small devices (landscape phones)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices (large desktops)
  "2xl": 1536, // 2X large devices (larger desktops)
  "3xl": 1920, // 3X large devices (full HD)
  "4xl": 2560, // 4X large devices (2K/QHD)
} as const;

// Breakpoint strings for CSS
export const breakpoints = {
  xs: `${breakpointValues.xs}px`,
  sm: `${breakpointValues.sm}px`,
  md: `${breakpointValues.md}px`,
  lg: `${breakpointValues.lg}px`,
  xl: `${breakpointValues.xl}px`,
  "2xl": `${breakpointValues["2xl"]}px`,
  "3xl": `${breakpointValues["3xl"]}px`,
  "4xl": `${breakpointValues["4xl"]}px`,
} as const;

// Media query helpers
export const mediaQueries = {
  // Min-width queries (mobile-first)
  up: {
    xs: `@media (min-width: ${breakpoints.xs})`,
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
    "2xl": `@media (min-width: ${breakpoints["2xl"]})`,
    "3xl": `@media (min-width: ${breakpoints["3xl"]})`,
    "4xl": `@media (min-width: ${breakpoints["4xl"]})`,
  },

  // Max-width queries
  down: {
    xs: `@media (max-width: ${breakpointValues.sm - 1}px)`,
    sm: `@media (max-width: ${breakpointValues.md - 1}px)`,
    md: `@media (max-width: ${breakpointValues.lg - 1}px)`,
    lg: `@media (max-width: ${breakpointValues.xl - 1}px)`,
    xl: `@media (max-width: ${breakpointValues["2xl"] - 1}px)`,
    "2xl": `@media (max-width: ${breakpointValues["3xl"] - 1}px)`,
    "3xl": `@media (max-width: ${breakpointValues["4xl"] - 1}px)`,
  },

  // Between queries
  between: {
    "xs-sm": `@media (min-width: ${breakpoints.xs}) and (max-width: ${breakpointValues.sm - 1}px)`,
    "sm-md": `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpointValues.md - 1}px)`,
    "md-lg": `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpointValues.lg - 1}px)`,
    "lg-xl": `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpointValues.xl - 1}px)`,
    "xl-2xl": `@media (min-width: ${breakpoints.xl}) and (max-width: ${breakpointValues["2xl"] - 1}px)`,
    "2xl-3xl": `@media (min-width: ${breakpoints["2xl"]}) and (max-width: ${breakpointValues["3xl"] - 1}px)`,
    "3xl-4xl": `@media (min-width: ${breakpoints["3xl"]}) and (max-width: ${breakpointValues["4xl"] - 1}px)`,
  },

  // Only queries (exact breakpoint)
  only: {
    xs: `@media (max-width: ${breakpointValues.sm - 1}px)`,
    sm: `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpointValues.md - 1}px)`,
    md: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpointValues.lg - 1}px)`,
    lg: `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpointValues.xl - 1}px)`,
    xl: `@media (min-width: ${breakpoints.xl}) and (max-width: ${breakpointValues["2xl"] - 1}px)`,
    "2xl": `@media (min-width: ${breakpoints["2xl"]}) and (max-width: ${breakpointValues["3xl"] - 1}px)`,
    "3xl": `@media (min-width: ${breakpoints["3xl"]}) and (max-width: ${breakpointValues["4xl"] - 1}px)`,
    "4xl": `@media (min-width: ${breakpoints["4xl"]})`,
  },
} as const;

// Container query helpers
export const containerQueries = {
  // Min-width container queries
  up: {
    xs: `@container (min-width: ${breakpoints.xs})`,
    sm: `@container (min-width: ${breakpoints.sm})`,
    md: `@container (min-width: ${breakpoints.md})`,
    lg: `@container (min-width: ${breakpoints.lg})`,
    xl: `@container (min-width: ${breakpoints.xl})`,
    "2xl": `@container (min-width: ${breakpoints["2xl"]})`,
  },

  // Max-width container queries
  down: {
    xs: `@container (max-width: ${breakpointValues.sm - 1}px)`,
    sm: `@container (max-width: ${breakpointValues.md - 1}px)`,
    md: `@container (max-width: ${breakpointValues.lg - 1}px)`,
    lg: `@container (max-width: ${breakpointValues.xl - 1}px)`,
    xl: `@container (max-width: ${breakpointValues["2xl"] - 1}px)`,
  },
} as const;

// Device-specific queries
export const deviceQueries = {
  // Touch devices
  touch: "@media (hover: none) and (pointer: coarse)",
  stylus: "@media (hover: none) and (pointer: fine)",
  mouse: "@media (hover: hover) and (pointer: fine)",

  // Orientation
  portrait: "@media (orientation: portrait)",
  landscape: "@media (orientation: landscape)",

  // High DPI screens
  retina: "@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",

  // Reduced motion
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
  motion: "@media (prefers-reduced-motion: no-preference)",

  // Color scheme
  dark: "@media (prefers-color-scheme: dark)",
  light: "@media (prefers-color-scheme: light)",

  // High contrast
  highContrast: "@media (prefers-contrast: high)",
  lowContrast: "@media (prefers-contrast: low)",
} as const;

// Responsive utilities
export const responsiveUtilities = {
  // Hide/show utilities
  hide: {
    xs: `${mediaQueries.only.xs} { display: none; }`,
    sm: `${mediaQueries.only.sm} { display: none; }`,
    md: `${mediaQueries.only.md} { display: none; }`,
    lg: `${mediaQueries.only.lg} { display: none; }`,
    xl: `${mediaQueries.only.xl} { display: none; }`,
    "2xl": `${mediaQueries.only["2xl"]} { display: none; }`,
  },

  show: {
    xs: `${mediaQueries.only.xs} { display: block; }`,
    sm: `${mediaQueries.only.sm} { display: block; }`,
    md: `${mediaQueries.only.md} { display: block; }`,
    lg: `${mediaQueries.only.lg} { display: block; }`,
    xl: `${mediaQueries.only.xl} { display: block; }`,
    "2xl": `${mediaQueries.only["2xl"]} { display: block; }`,
  },
} as const;

// Helper function to check if we're at a breakpoint
export function isBreakpoint(breakpoint: keyof typeof breakpointValues): boolean {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const breakpointValue = breakpointValues[breakpoint];
  const nextBreakpoint = Object.values(breakpointValues).find((bp) => bp > breakpointValue);

  if (nextBreakpoint) {
    return width >= breakpointValue && width < nextBreakpoint;
  }

  return width >= breakpointValue;
}

// Helper function to get current breakpoint
export function getCurrentBreakpoint(): keyof typeof breakpointValues {
  if (typeof window === "undefined") return "xs";

  const width = window.innerWidth;
  const breakpointEntries = Object.entries(breakpointValues) as Array<[keyof typeof breakpointValues, number]>;

  // Find the largest breakpoint that is smaller than current width
  for (let i = breakpointEntries.length - 1; i >= 0; i--) {
    const [name, value] = breakpointEntries[i];
    if (width >= value) {
      return name;
    }
  }

  return "xs";
}

export type Breakpoints = typeof breakpoints;
export type BreakpointValues = typeof breakpointValues;
export type MediaQueries = typeof mediaQueries;
export type DeviceQueries = typeof deviceQueries;
