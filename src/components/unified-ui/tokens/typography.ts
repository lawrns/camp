/**
 * Typography tokens for Campfire Design System
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "Monaco", "Courier New", "monospace"],
  },

  // Font sizes
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
    base: ["1rem", { lineHeight: "1.5rem" }], // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
    "5xl": ["3rem", { lineHeight: "1" }], // 48px
    "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
  },

  // Font weights
  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  // Line heights
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  // Text styles (composed)
  textStyles: {
    // Headings
    h1: {
      fontSize: "3rem",
      fontWeight: "700",
      lineHeight: "1.2",
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "2.25rem",
      fontWeight: "600",
      lineHeight: "1.3",
      letterSpacing: "-0.025em",
    },
    h3: {
      fontSize: "1.875rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: "600",
      lineHeight: "1.5",
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: "600",
      lineHeight: "1.5",
    },

    // Body text
    body: {
      fontSize: "1rem",
      fontWeight: "400",
      lineHeight: "1.5",
    },
    bodySmall: {
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.5",
    },
    bodyLarge: {
      fontSize: "1.125rem",
      fontWeight: "400",
      lineHeight: "1.625",
    },

    // UI text
    label: {
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.25",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: "400",
      lineHeight: "1.25",
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.25",
      letterSpacing: "0.025em",
    },
    buttonLarge: {
      fontSize: "1rem",
      fontWeight: "500",
      lineHeight: "1.5",
      letterSpacing: "0.025em",
    },

    // Code
    code: {
      fontFamily: "mono",
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.5",
    },
    codeBlock: {
      fontFamily: "mono",
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.625",
    },
  },
} as const;
