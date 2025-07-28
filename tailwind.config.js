/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core colors - map to design system variables
        border: 'var(--ds-color-border)',
        input: 'var(--ds-color-border)',
        ring: 'var(--ds-color-primary-500)',
        background: 'var(--ds-color-background)',
        foreground: 'var(--ds-color-text)',
        
        // Primary color palette
        primary: {
          DEFAULT: 'var(--ds-color-primary-500)',
          foreground: 'var(--ds-color-text-inverse)',
          50: 'var(--ds-color-primary-50)',
          100: 'var(--ds-color-primary-100)',
          200: 'var(--ds-color-primary-200)',
          300: 'var(--ds-color-primary-300)',
          400: 'var(--ds-color-primary-400)',
          500: 'var(--ds-color-primary-500)',
          600: 'var(--ds-color-primary-600)',
          700: 'var(--ds-color-primary-700)',
          800: 'var(--ds-color-primary-800)',
          900: 'var(--ds-color-primary-900)',
          950: 'var(--ds-color-primary-950)',
        },
        
        // Secondary (neutral) colors
        secondary: {
          DEFAULT: 'var(--ds-color-neutral-500)',
          foreground: 'var(--ds-color-text)',
          50: 'var(--ds-color-neutral-50)',
          100: 'var(--ds-color-neutral-100)',
          200: 'var(--ds-color-neutral-200)',
          300: 'var(--ds-color-neutral-300)',
          400: 'var(--ds-color-neutral-400)',
          500: 'var(--ds-color-neutral-500)',
          600: 'var(--ds-color-neutral-600)',
          700: 'var(--ds-color-neutral-700)',
          800: 'var(--ds-color-neutral-800)',
          900: 'var(--ds-color-neutral-900)',
          950: 'var(--ds-color-neutral-950)',
        },
        
        // Status colors
        success: {
          DEFAULT: 'var(--ds-color-success-500)',
          foreground: 'var(--ds-color-text-inverse)',
          50: 'var(--ds-color-success-50)',
          100: 'var(--ds-color-success-100)',
          200: 'var(--ds-color-success-200)',
          300: 'var(--ds-color-success-300)',
          400: 'var(--ds-color-success-400)',
          500: 'var(--ds-color-success-500)',
          600: 'var(--ds-color-success-600)',
          700: 'var(--ds-color-success-700)',
          800: 'var(--ds-color-success-800)',
          900: 'var(--ds-color-success-900)',
        },
        
        warning: {
          DEFAULT: 'var(--ds-color-warning-500)',
          foreground: 'var(--ds-color-text-inverse)',
          50: 'var(--ds-color-warning-50)',
          100: 'var(--ds-color-warning-100)',
          200: 'var(--ds-color-warning-200)',
          300: 'var(--ds-color-warning-300)',
          400: 'var(--ds-color-warning-400)',
          500: 'var(--ds-color-warning-500)',
          600: 'var(--ds-color-warning-600)',
          700: 'var(--ds-color-warning-700)',
          800: 'var(--ds-color-warning-800)',
          900: 'var(--ds-color-warning-900)',
        },
        
        error: {
          DEFAULT: 'var(--ds-color-error-500)',
          foreground: 'var(--ds-color-text-inverse)',
          50: 'var(--ds-color-error-50)',
          100: 'var(--ds-color-error-100)',
          200: 'var(--ds-color-error-200)',
          300: 'var(--ds-color-error-300)',
          400: 'var(--ds-color-error-400)',
          500: 'var(--ds-color-error-500)',
          600: 'var(--ds-color-error-600)',
          700: 'var(--ds-color-error-700)',
          800: 'var(--ds-color-error-800)',
          900: 'var(--ds-color-error-900)',
        },
        
        info: {
          DEFAULT: 'var(--ds-color-info-500)',
          foreground: 'var(--ds-color-text-inverse)',
          50: 'var(--ds-color-info-50)',
          100: 'var(--ds-color-info-100)',
          200: 'var(--ds-color-info-200)',
          300: 'var(--ds-color-info-300)',
          400: 'var(--ds-color-info-400)',
          500: 'var(--ds-color-info-500)',
          600: 'var(--ds-color-info-600)',
          700: 'var(--ds-color-info-700)',
          800: 'var(--ds-color-info-800)',
          900: 'var(--ds-color-info-900)',
        },
        
        // Muted colors
        muted: {
          DEFAULT: 'var(--ds-color-neutral-100)',
          foreground: 'var(--ds-color-text-muted)',
        },
        
        // Accent colors
        accent: {
          DEFAULT: 'var(--ds-color-neutral-100)',
          foreground: 'var(--ds-color-text)',
        },
        
        // Card colors
        card: {
          DEFAULT: 'var(--ds-color-background)',
          foreground: 'var(--ds-color-text)',
        },
        
        // Popover colors
        popover: {
          DEFAULT: 'var(--ds-color-background)',
          foreground: 'var(--ds-color-text)',
        },
      },
      
      borderRadius: {
        // Design system radius tokens
        'ds-none': 'var(--ds-radius-none)',
        'ds-xs': 'var(--ds-radius-xs)',
        'ds-sm': 'var(--ds-radius-sm)',
        'ds-md': 'var(--ds-radius-md)',
        'ds-lg': 'var(--ds-radius-lg)',
        'ds-xl': 'var(--ds-radius-xl)',
        'ds-2xl': 'var(--ds-radius-2xl)',
        'ds-3xl': 'var(--ds-radius-3xl)',
        'ds-full': 'var(--ds-radius-full)',
      },
      
      fontFamily: {
        sans: ['var(--ds-font-family-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--ds-font-family-mono)', 'monospace'],
      },
      
      fontSize: {
        xs: ['var(--ds-font-size-xs)', { lineHeight: 'var(--ds-line-height-xs)' }],
        sm: ['var(--ds-font-size-sm)', { lineHeight: 'var(--ds-line-height-sm)' }],
        base: ['var(--ds-font-size-base)', { lineHeight: 'var(--ds-line-height-base)' }],
        lg: ['var(--ds-font-size-lg)', { lineHeight: 'var(--ds-line-height-lg)' }],
        xl: ['var(--ds-font-size-xl)', { lineHeight: 'var(--ds-line-height-xl)' }],
        '2xl': ['var(--ds-font-size-2xl)', { lineHeight: 'var(--ds-line-height-2xl)' }],
        '3xl': ['var(--ds-font-size-3xl)', { lineHeight: 'var(--ds-line-height-3xl)' }],
        '4xl': ['var(--ds-font-size-4xl)', { lineHeight: 'var(--ds-line-height-4xl)' }],
        '5xl': ['var(--ds-font-size-5xl)', { lineHeight: 'var(--ds-line-height-5xl)' }],
        '6xl': ['var(--ds-font-size-6xl)', { lineHeight: 'var(--ds-line-height-6xl)' }],
      },
      
      spacing: {
        // Design system spacing tokens
        'ds-0': 'var(--ds-spacing-0)',
        'ds-1': 'var(--ds-spacing-1)',
        'ds-2': 'var(--ds-spacing-2)',
        'ds-3': 'var(--ds-spacing-3)',
        'ds-4': 'var(--ds-spacing-4)',
        'ds-5': 'var(--ds-spacing-5)',
        'ds-6': 'var(--ds-spacing-6)',
        'ds-8': 'var(--ds-spacing-8)',
        'ds-10': 'var(--ds-spacing-10)',
        'ds-12': 'var(--ds-spacing-12)',
        'ds-16': 'var(--ds-spacing-16)',
        'ds-20': 'var(--ds-spacing-20)',
        'ds-24': 'var(--ds-spacing-24)',
        'ds-32': 'var(--ds-spacing-32)',
      },
      
      boxShadow: {
        sm: 'var(--ds-shadow-sm)',
        DEFAULT: 'var(--ds-shadow-md)',
        md: 'var(--ds-shadow-md)',
        lg: 'var(--ds-shadow-lg)',
        xl: 'var(--ds-shadow-xl)',
        '2xl': 'var(--ds-shadow-2xl)',
        inner: 'var(--ds-shadow-inner)',
        none: 'none',
      },
      
      transitionDuration: {
        fast: 'var(--ds-transition-fast)',
        medium: 'var(--ds-transition-medium)',
        slow: 'var(--ds-transition-slow)',
      },
      
      transitionTimingFunction: {
        bounce: 'var(--ds-ease-bounce)',
        spring: 'var(--ds-ease-spring)',
        elastic: 'var(--ds-ease-elastic)',
        smooth: 'var(--ds-ease-smooth)',
        sharp: 'var(--ds-ease-sharp)',
      },
    },
  },
  plugins: [
    // Design System Token Plugin
    function({ addUtilities, theme }) {
      const spacing = theme('spacing');
      const borderRadius = theme('borderRadius');

      // Generate design system utilities
      const dsUtilities = {};

      // Add padding utilities with ds- prefix
      Object.entries(spacing).forEach(([key, value]) => {
        if (key.startsWith('ds-')) {
          const suffix = key.replace('ds-', '');
          dsUtilities[`.p-ds-${suffix}`] = { padding: value };
          dsUtilities[`.px-ds-${suffix}`] = { 'padding-left': value, 'padding-right': value };
          dsUtilities[`.py-ds-${suffix}`] = { 'padding-top': value, 'padding-bottom': value };
          dsUtilities[`.pt-ds-${suffix}`] = { 'padding-top': value };
          dsUtilities[`.pr-ds-${suffix}`] = { 'padding-right': value };
          dsUtilities[`.pb-ds-${suffix}`] = { 'padding-bottom': value };
          dsUtilities[`.pl-ds-${suffix}`] = { 'padding-left': value };

          // Add margin utilities
          dsUtilities[`.m-ds-${suffix}`] = { margin: value };
          dsUtilities[`.mx-ds-${suffix}`] = { 'margin-left': value, 'margin-right': value };
          dsUtilities[`.my-ds-${suffix}`] = { 'margin-top': value, 'margin-bottom': value };
          dsUtilities[`.mt-ds-${suffix}`] = { 'margin-top': value };
          dsUtilities[`.mr-ds-${suffix}`] = { 'margin-right': value };
          dsUtilities[`.mb-ds-${suffix}`] = { 'margin-bottom': value };
          dsUtilities[`.ml-ds-${suffix}`] = { 'margin-left': value };

          // Add gap utilities
          dsUtilities[`.gap-ds-${suffix}`] = { gap: value };
          dsUtilities[`.gap-x-ds-${suffix}`] = { 'column-gap': value };
          dsUtilities[`.gap-y-ds-${suffix}`] = { 'row-gap': value };
        }
      });

      // Add border radius utilities with ds- prefix
      Object.entries(borderRadius).forEach(([key, value]) => {
        if (key.startsWith('ds-')) {
          const suffix = key.replace('ds-', '');
          dsUtilities[`.rounded-ds-${suffix}`] = { 'border-radius': value };
          dsUtilities[`.rounded-t-ds-${suffix}`] = {
            'border-top-left-radius': value,
            'border-top-right-radius': value
          };
          dsUtilities[`.rounded-r-ds-${suffix}`] = {
            'border-top-right-radius': value,
            'border-bottom-right-radius': value
          };
          dsUtilities[`.rounded-b-ds-${suffix}`] = {
            'border-bottom-left-radius': value,
            'border-bottom-right-radius': value
          };
          dsUtilities[`.rounded-l-ds-${suffix}`] = {
            'border-top-left-radius': value,
            'border-bottom-left-radius': value
          };
        }
      });

      addUtilities(dsUtilities);
    }
  ],
  safelist: [
    // Core utilities
    'bg-background',
    'text-foreground',
    'bg-primary',
    'text-primary-foreground',
    'bg-secondary',
    'text-secondary-foreground',
    'bg-muted',
    'text-muted-foreground',
    'bg-accent',
    'text-accent-foreground',
    'bg-card',
    'text-card-foreground',
    'bg-popover',
    'text-popover-foreground',
    
    // Status colors
    'bg-success',
    'text-success-foreground',
    'bg-warning',
    'text-warning-foreground',
    'bg-error',
    'text-error-foreground',
    'bg-info',
    'text-info-foreground',
    
    // Primary variants
    'bg-primary-50',
    'bg-primary-100',
    'bg-primary-200',
    'bg-primary-300',
    'bg-primary-400',
    'bg-primary-500',
    'bg-primary-600',
    'bg-primary-700',
    'bg-primary-800',
    'bg-primary-900',
    'bg-primary-950',
    
    // Secondary variants
    'bg-secondary-50',
    'bg-secondary-100',
    'bg-secondary-200',
    'bg-secondary-300',
    'bg-secondary-400',
    'bg-secondary-500',
    'bg-secondary-600',
    'bg-secondary-700',
    'bg-secondary-800',
    'bg-secondary-900',
    'bg-secondary-950',
    
    // Border radius
    'rounded-sm',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-full',
    
    // Focus states
    'focus:ring-primary',
    'focus:ring-primary-300',
    'focus:ring-2',
    'focus:ring-offset-2',
  ],
}
