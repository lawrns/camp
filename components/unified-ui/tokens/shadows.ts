/**
 * Premium Shadow System
 *
 * A subtle, sophisticated depth system with 5 levels.
 * Each shadow is composed of multiple layers for realistic depth.
 */

// Base shadow colors
const shadowColors = {
  umbra: "rgba(0, 0, 0, 0.08)", // Main shadow
  penumbra: "rgba(0, 0, 0, 0.05)", // Soft edge
  ambient: "rgba(0, 0, 0, 0.03)", // Ambient light
  colored: "rgba(79, 70, 229, 0.08)", // Brand-colored shadows
} as const;

// Shadow definitions - 5 levels of depth
export const shadows = {
  // Level 0 - No shadow
  none: "none",

  // Level 1 - Subtle elevation (cards, tiles)
  xs: `0 1px 2px 0 ${shadowColors.ambient}`,

  // Level 2 - Low elevation (buttons, inputs)
  sm: [`0 1px 3px 0 ${shadowColors.ambient}`, `0 1px 2px -1px ${shadowColors.penumbra}`].join(", "),

  // Level 3 - Medium elevation (dropdowns, tooltips)
  md: [`0 4px 6px -1px ${shadowColors.ambient}`, `0 2px 4px -2px ${shadowColors.penumbra}`].join(", "),

  // Level 4 - High elevation (modals, popovers)
  lg: [`0 10px 15px -3px ${shadowColors.penumbra}`, `0 4px 6px -4px ${shadowColors.umbra}`].join(", "),

  // Level 5 - Maximum elevation (sticky elements, notifications)
  xl: [`0 20px 25px -5px ${shadowColors.penumbra}`, `0 8px 10px -6px ${shadowColors.umbra}`].join(", "),

  // Special shadows
  inner: `inset 0 2px 4px 0 ${shadowColors.ambient}`,

  // Interactive states
  focus: {
    default: `0 0 0 3px rgba(79, 70, 229, 0.1)`,
    error: `0 0 0 3px rgba(225, 29, 72, 0.1)`,
    success: `0 0 0 3px rgba(5, 150, 105, 0.1)`,
  },

  // Colored shadows for brand elements
  colored: {
    indigo: {
      sm: `0 1px 3px 0 rgba(79, 70, 229, 0.1), 0 1px 2px -1px rgba(79, 70, 229, 0.06)`,
      md: `0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -2px rgba(79, 70, 229, 0.06)`,
      lg: `0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -4px rgba(79, 70, 229, 0.06)`,
    },
    emerald: {
      sm: `0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px -1px rgba(5, 150, 105, 0.06)`,
      md: `0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -2px rgba(5, 150, 105, 0.06)`,
      lg: `0 10px 15px -3px rgba(5, 150, 105, 0.1), 0 4px 6px -4px rgba(5, 150, 105, 0.06)`,
    },
  },

  // Utility shadows
  outline: `0 0 0 1px ${shadowColors.penumbra}`,
  divider: `0 1px 0 0 ${shadowColors.ambient}`,

  // Hover states (slightly elevated)
  hover: {
    sm: [`0 2px 4px 0 ${shadowColors.ambient}`, `0 2px 3px -1px ${shadowColors.penumbra}`].join(", "),
    md: [`0 6px 8px -1px ${shadowColors.ambient}`, `0 3px 5px -2px ${shadowColors.penumbra}`].join(", "),
    lg: [`0 12px 17px -3px ${shadowColors.penumbra}`, `0 5px 7px -4px ${shadowColors.umbra}`].join(", "),
  },

  // Active/pressed states (slightly depressed)
  active: {
    sm: `0 1px 2px 0 ${shadowColors.ambient}`,
    md: `0 2px 3px -1px ${shadowColors.ambient}`,
    lg: `0 4px 6px -2px ${shadowColors.penumbra}`,
  },
} as const;

// Shadow transition utilities
export const shadowTransitions = {
  fast: "box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  normal: "box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "box-shadow 350ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// Blur values for glassmorphism effects
export const blurs = {
  none: "0",
  sm: "4px",
  md: "8px",
  lg: "16px",
  xl: "24px",
  "2xl": "40px",
} as const;

export type Shadows = typeof shadows;
export type ShadowTransitions = typeof shadowTransitions;
export type Blurs = typeof blurs;
