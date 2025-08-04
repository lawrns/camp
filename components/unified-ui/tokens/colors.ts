/**
 * Unified Color Tokens for Campfire Design System
 * Based on the consolidated color system from the codebase analysis
 */

export const colors = {
  // Brand Colors
  brand: {
    mahogany: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },
    blue: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: "#10b981",
      DEFAULT: "#059669",
      dark: "#047857",
    },
    warning: {
      light: "#fbbf24",
      DEFAULT: "#f59e0b",
      dark: "#d97706",
    },
    error: {
      light: "#f87171",
      DEFAULT: "#ef4444",
      dark: "#dc2626",
    },
    info: {
      light: "#60a5fa",
      DEFAULT: "#3b82f6",
      dark: "#2563eb",
    },
  },

  // Neutral Colors
  neutral: {
    0: "#ffffff",
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
    1000: "#000000",
  },

  // Component-specific colors
  components: {
    background: {
      primary: "var(--neutral-0)",
      secondary: "var(--neutral-50)",
      tertiary: "var(--neutral-100)",
      inverse: "var(--neutral-900)",
    },
    text: {
      primary: "var(--neutral-900)",
      secondary: "var(--neutral-600)",
      tertiary: "var(--neutral-500)",
      inverse: "var(--neutral-0)",
      link: "var(--brand-blue-600)",
    },
    border: {
      light: "var(--neutral-200)",
      DEFAULT: "var(--neutral-300)",
      dark: "var(--neutral-400)",
    },
  },

  // Special Effects
  effects: {
    glass: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    glow: {
      primary: "var(--brand-mahogany-500)",
      secondary: "var(--brand-blue-500)",
    },
  },
} as const;

// CSS Variable Generator
export function generateCSSVariables() {
  const cssVars: string[] = [":root {"];

  // Flatten the colors object into CSS variables
  function flatten(obj: unknown, prefix = "") {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}-${key}` : key;

      if (typeof value === "string") {
        cssVars.push(`  --${varName}: ${value};`);
      } else if (typeof value === "object") {
        flatten(value, varName);
      }
    });
  }

  flatten(colors);
  cssVars.push("}");

  return cssVars.join("\n");
}
