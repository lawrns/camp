/**
 * Design system tokens for consistent styling
 * Replaces hard-coded Tailwind classes with semantic design tokens
 */

// ===== SPACING TOKENS (4pt grid system) =====

export const spacing = {
  // Base spacing units (4pt grid)
  xs: "space-1",      // 4px
  sm: "space-2",      // 8px
  md: "space-3",      // 12px
  lg: "space-4",      // 16px
  xl: "space-5",      // 20px
  "2xl": "space-6",   // 24px
  "3xl": "space-8",   // 32px
  "4xl": "space-10",  // 40px
  "5xl": "space-12",  // 48px
  "6xl": "space-16",  // 64px
  
  // Semantic spacing
  component: "space-4",     // 16px - standard component padding
  section: "space-6",       // 24px - section spacing
  page: "space-8",          // 32px - page margins
  container: "space-12",    // 48px - container spacing
} as const;

export const padding = {
  // Component padding
  button: "px-4 py-2",
  input: "px-3 py-2",
  card: "p-4",
  modal: "p-6",
  sidebar: "p-4",
  header: "px-6 py-4",
  
  // Semantic padding
  tight: "p-2",
  normal: "p-4",
  loose: "p-6",
  spacious: "p-8",
} as const;

export const margin = {
  // Component margins
  section: "mb-6",
  paragraph: "mb-4",
  heading: "mb-3",
  list: "mb-4",
  
  // Semantic margins
  tight: "m-2",
  normal: "m-4",
  loose: "m-6",
  spacious: "m-8",
} as const;

// ===== TYPOGRAPHY TOKENS =====

export const typography = {
  // Headings
  "display-lg": "text-4xl font-bold leading-tight",
  "display-md": "text-3xl font-bold leading-tight",
  "display-sm": "text-2xl font-bold leading-tight",
  
  "title-lg": "text-xl font-semibold leading-snug",
  "title-md": "text-lg font-semibold leading-snug",
  "title-sm": "text-base font-semibold leading-snug",
  
  // Body text
  "body-lg": "text-lg font-normal leading-relaxed",
  "body-md": "text-base font-normal leading-normal",
  "body-sm": "text-sm font-normal leading-normal",
  "body-xs": "text-xs font-normal leading-normal",
  
  // Labels and captions
  "label-lg": "text-sm font-medium leading-tight",
  "label-md": "text-xs font-medium leading-tight",
  "label-sm": "text-xs font-medium leading-tight uppercase tracking-wide",
  
  "caption-lg": "text-sm font-normal leading-tight text-gray-600",
  "caption-md": "text-xs font-normal leading-tight text-gray-600",
  "caption-sm": "text-xs font-normal leading-tight text-gray-500",
  
  // Code and monospace
  "code-lg": "text-sm font-mono leading-normal",
  "code-md": "text-xs font-mono leading-normal",
  "code-sm": "text-xs font-mono leading-tight",
} as const;

// ===== COLOR TOKENS =====

export const colors = {
  // Surface colors
  "surface-primary": "bg-white",
  "surface-secondary": "bg-gray-50",
  "surface-tertiary": "bg-gray-100",
  "surface-inverse": "bg-gray-900",

  // Text colors
  "text-primary": "text-gray-900",
  "text-secondary": "text-gray-700",
  "text-tertiary": "text-gray-500",
  "text-inverse": "text-white",
  "text-disabled": "text-gray-400",

  // Border colors
  "border-primary": "border-gray-200",
  "border-secondary": "border-gray-300",
  "border-focus": "border-blue-500",
  "border-error": "border-red-500",
  "border-success": "border-green-500",

  // Status colors (using accessibility-compliant combinations)
  "success-subtle": "bg-green-50 text-green-900 border-green-200",
  "success-emphasis": "bg-green-600 text-white border-green-600",

  "warning-subtle": "bg-amber-50 text-amber-900 border-amber-200",
  "warning-emphasis": "bg-amber-600 text-white border-amber-600",

  "error-subtle": "bg-red-50 text-red-900 border-red-200",
  "error-emphasis": "bg-red-600 text-white border-red-600",

  "info-subtle": "bg-blue-50 text-blue-900 border-blue-200",
  "info-emphasis": "bg-blue-600 text-white border-blue-600",

  "neutral-subtle": "bg-gray-50 text-gray-900 border-gray-200",
  "neutral-emphasis": "bg-gray-600 text-white border-gray-600",
} as const;

// ===== INBOX-SPECIFIC DESIGN TOKENS =====

export const INBOX_DESIGN_TOKENS = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
  },
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
  },
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
} as const;

// ===== DARK MODE TOKENS =====

export const darkModeTokens = {
  surface: "#1F2937",
  "text.default": "#F3F4F6",
  border: "#374151",
  "text-muted": "#9CA3AF",
  "surface-hover": "#374151",
  primary: "#3B82F6",
  "primary-hover": "#2563EB",
} as const;

// ===== COMPONENT TOKENS =====

export const components = {
  // Buttons
  "btn-primary": "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  "btn-secondary": "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  "btn-ghost": "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  "btn-danger": "bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  
  // Cards
  "card-default": "bg-white border border-gray-200 rounded-lg shadow-sm",
  "card-elevated": "bg-white border border-gray-200 rounded-lg shadow-md",
  "card-interactive": "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer",
  
  // Inputs
  "input-default": "bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  "input-error": "bg-red-50 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500",
  "input-disabled": "bg-gray-50 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed",
  
  // Badges
  "badge-default": "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  "badge-dot": "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
  
  // Navigation
  "nav-item": "flex items-center px-3 py-2 text-sm font-medium rounded-md",
  "nav-item-active": "bg-blue-100 text-blue-700",
  "nav-item-inactive": "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  
  // Modals and overlays
  "modal-overlay": "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity",
  "modal-content": "bg-white rounded-lg shadow-xl transform transition-all",
  "dropdown-content": "bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5",
} as const;

// ===== LAYOUT TOKENS =====

export const layout = {
  // Container widths
  "container-sm": "max-w-sm",
  "container-md": "max-w-md",
  "container-lg": "max-w-lg",
  "container-xl": "max-w-xl",
  "container-2xl": "max-w-2xl",
  "container-full": "max-w-full",
  
  // Grid and flex
  "grid-cols-auto": "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
  "flex-center": "flex items-center justify-center",
  "flex-between": "flex items-center justify-between",
  "flex-start": "flex items-center justify-start",
  "flex-end": "flex items-center justify-end",
  
  // Positioning
  "absolute-center": "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
  "absolute-top-right": "absolute top-4 right-4",
  "absolute-bottom-right": "absolute bottom-4 right-4",
} as const;

// ===== ANIMATION TOKENS =====

export const animations = {
  // Transitions
  "transition-fast": "transition-all duration-150 ease-in-out",
  "transition-normal": "transition-all duration-200 ease-in-out",
  "transition-slow": "transition-all duration-300 ease-in-out",
  
  // Specific transitions
  "transition-colors": "transition-colors duration-200 ease-in-out",
  "transition-opacity": "transition-opacity duration-200 ease-in-out",
  "transition-transform": "transition-transform duration-200 ease-in-out",
  
  // Hover effects
  "hover-lift": "hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
  "hover-scale": "hover:transform hover:scale-105 transition-transform duration-200",
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Get design token value by key
 */
export function getToken(category: keyof typeof tokens, key: string): string {
  const tokenCategory = tokens[category];
  return (tokenCategory as unknown)[key] || key;
}

/**
 * Combine multiple design tokens
 */
export function combineTokens(...tokens: string[]): string {
  return tokens.filter(Boolean).join(" ");
}

/**
 * Get responsive token (mobile-first)
 */
export function getResponsiveToken(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const responsive = [base];
  if (sm) responsive.push(`sm:${sm}`);
  if (md) responsive.push(`md:${md}`);
  if (lg) responsive.push(`lg:${lg}`);
  if (xl) responsive.push(`xl:${xl}`);
  return responsive.join(" ");
}

/**
 * Apply dark mode tokens with CSS custom properties
 */
export function applyDarkModeTokens(): Record<string, string> {
  return Object.entries(darkModeTokens).reduce((acc, [key, value]) => {
    acc[`--${key}`] = value;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Get inbox design token value
 */
export function getInboxToken(path: string): string {
  const keys = path.split('.');
  let value: unknown = INBOX_DESIGN_TOKENS;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return original path if not found
    }
  }

  return typeof value === 'string' ? value : path;
}

/**
 * All design tokens grouped by category
 */
export const tokens = {
  spacing,
  padding,
  margin,
  typography,
  colors,
  components,
  layout,
  animations,
  inbox: INBOX_DESIGN_TOKENS,
  darkMode: darkModeTokens,
} as const;

/**
 * Type for all available design tokens
 */
export type DesignToken = keyof typeof tokens;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography;
export type ColorToken = keyof typeof colors;
export type ComponentToken = keyof typeof components;
