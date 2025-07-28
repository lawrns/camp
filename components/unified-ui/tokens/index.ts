export { colors, generateCSSVariables } from "./colors";
export { typography } from "./typography";
export { spacing } from "./spacing";
export { effects } from "./effects";

// Re-export all tokens as a single object
export const tokens = {
  colors: require("./colors").colors,
  typography: require("./typography").typography,
  spacing: require("./spacing").spacing,
  effects: require("./effects").effects,
} as const;

// Type exports
export type Colors = typeof import("./colors").colors;
export type Typography = typeof import("./typography").typography;
export type Spacing = typeof import("./spacing").spacing;
export type Effects = typeof import("./effects").effects;
export type Tokens = typeof tokens;
