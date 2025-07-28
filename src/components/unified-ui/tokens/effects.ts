/**
 * Visual effects tokens for Campfire Design System
 */

export const effects = {
  // Border radius
  borderRadius: {
    none: "0px",
    sm: "0.125rem", // 2px
    DEFAULT: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },

  // Box shadows
  boxShadow: {
    none: "none",
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",

    // Colored shadows
    primary: "0 4px 14px 0 rgba(185, 28, 28, 0.3)",
    secondary: "0 4px 14px 0 rgba(59, 130, 246, 0.3)",
    success: "0 4px 14px 0 rgba(16, 185, 129, 0.3)",
    warning: "0 4px 14px 0 rgba(245, 158, 11, 0.3)",
    error: "0 4px 14px 0 rgba(239, 68, 68, 0.3)",

    // Glass morphism shadows
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  },

  // Transitions
  transition: {
    none: "none",
    all: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    DEFAULT: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    colors:
      "color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    shadow: "box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    transform: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Animation durations
  duration: {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },

  // Animation timing functions
  timing: {
    DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Blur effects
  blur: {
    none: "0",
    sm: "4px",
    DEFAULT: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "40px",
    "3xl": "64px",
  },

  // Backdrop filters
  backdrop: {
    blur: {
      none: "blur(0)",
      sm: "blur(4px)",
      DEFAULT: "blur(8px)",
      md: "blur(12px)",
      lg: "blur(16px)",
      xl: "blur(24px)",
    },
    brightness: {
      50: "brightness(0.5)",
      75: "brightness(0.75)",
      100: "brightness(1)",
      125: "brightness(1.25)",
      150: "brightness(1.5)",
    },
  },

  // Opacity
  opacity: {
    0: "0",
    5: "0.05",
    10: "0.1",
    20: "0.2",
    25: "0.25",
    30: "0.3",
    40: "0.4",
    50: "0.5",
    60: "0.6",
    70: "0.7",
    75: "0.75",
    80: "0.8",
    90: "0.9",
    95: "0.95",
    100: "1",
  },
} as const;
