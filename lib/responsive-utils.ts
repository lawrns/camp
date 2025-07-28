/**
 * Responsive utilities for CSS-in-JS and dynamic styling
 */

import { BreakpointKey, BREAKPOINTS, media } from "./breakpoints";

// Type for responsive values
export type ResponsiveValue<T> = T | Partial<Record<BreakpointKey, T>>;

// Convert responsive value to CSS string
export function responsiveStyle<T>(
  property: string,
  value: ResponsiveValue<T>,
  formatter?: (val: T) => string
): string {
  if (typeof value !== "object" || value === null) {
    // Single value - apply to all breakpoints
    const formattedValue = formatter ? formatter(value as T) : String(value);
    return `${property}: ${formattedValue};`;
  }

  // Responsive object
  let css = "";
  const entries = Object.entries(value) as [BreakpointKey, T][];

  // Sort entries by breakpoint size (mobile-first)
  entries.sort(([a], [b]) => BREAKPOINTS[a] - BREAKPOINTS[b]);

  entries.forEach(([breakpoint, val], index) => {
    const formattedValue = formatter ? formatter(val) : String(val);

    if (index === 0 && breakpoint === "xs") {
      // Base style (no media query)
      css += `${property}: ${formattedValue};\n`;
    } else {
      // Media query wrapped style
      css += `${media[breakpoint]} {\n  ${property}: ${formattedValue};\n}\n`;
    }
  });

  return css;
}

// Common responsive properties
export const responsive = {
  // Spacing
  padding: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("padding", value, (v) => (typeof v === "number" ? `${v}px` : v)),

  margin: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("margin", value, (v) => (typeof v === "number" ? `${v}px` : v)),

  // Typography
  fontSize: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("font-size", value, (v) => (typeof v === "number" ? `${v}px` : v)),

  lineHeight: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("line-height", value, (v) => (typeof v === "number" ? String(v) : v)),

  // Layout
  width: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("width", value, (v) => (typeof v === "number" ? `${v}px` : v)),

  maxWidth: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("max-width", value, (v) => (typeof v === "number" ? `${v}px` : v)),

  display: (value: ResponsiveValue<string>) => responsiveStyle("display", value),

  flexDirection: (value: ResponsiveValue<string>) => responsiveStyle("flex-direction", value),

  gridTemplateColumns: (value: ResponsiveValue<string>) => responsiveStyle("grid-template-columns", value),

  gap: (value: ResponsiveValue<string | number>) =>
    responsiveStyle("gap", value, (v) => (typeof v === "number" ? `${v}px` : v)),
};

// Clamp calculator for fluid typography
export function clamp(
  minSize: number,
  maxSize: number,
  minViewport: number = BREAKPOINTS.xs,
  maxViewport: number = BREAKPOINTS.xl
): string {
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const yAxisIntersection = -minViewport * slope + minSize;

  return `clamp(${minSize}px, ${yAxisIntersection.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${maxSize}px)`;
}

// Fluid spacing calculator
export function fluidSpacing(minSpace: number, maxSpace: number, minViewport?: number, maxViewport?: number): string {
  return clamp(minSpace, maxSpace, minViewport, maxViewport);
}

// Container query helper
export function containerQuery(containerName: string, minWidth: number, styles: string): string {
  return `
    @container ${containerName} (min-width: ${minWidth}px) {
      ${styles}
    }
  `;
}

// Aspect ratio helper
export function aspectRatio(width: number, height: number): string {
  return `
    position: relative;
    &::before {
      content: '';
      display: block;
      padding-bottom: ${(height / width) * 100}%;
    }
    > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `;
}

// Safe area inset helper for mobile devices
export function safeArea(property: "top" | "right" | "bottom" | "left", fallback = "0px"): string {
  return `env(safe-area-inset-${property}, ${fallback})`;
}

// Responsive grid helper
export function responsiveGrid(minItemWidth: number | string, gap?: ResponsiveValue<number | string>): string {
  const minWidth = typeof minItemWidth === "number" ? `${minItemWidth}px` : minItemWidth;
  let styles = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(${minWidth}, 1fr));
  `;

  if (gap) {
    styles += responsive.gap(gap);
  }

  return styles;
}

// Hide/show utilities
export const visibility = {
  hideOn: (breakpoint: BreakpointKey) => `
    ${media[breakpoint]} {
      display: none;
    }
  `,

  showOn: (breakpoint: BreakpointKey) => `
    display: none;
    ${media[breakpoint]} {
      display: block;
    }
  `,

  hideBelow: (breakpoint: BreakpointKey) => `
    @media (max-width: ${BREAKPOINTS[breakpoint] - 1}px) {
      display: none;
    }
  `,

  showAbove: (breakpoint: BreakpointKey) => `
    display: none;
    ${media[breakpoint]} {
      display: block;
    }
  `,
};
