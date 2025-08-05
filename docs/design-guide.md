# Campfire V2 Design Guide - Rule of Law

> **MANDATORY**: This guide is the absolute authority for all UI design decisions. No exceptions.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Component Standards](#component-standards)
3. [AI-Specific Patterns](#ai-specific-patterns)
4. [Motion Guidelines](#motion-guidelines)
5. [Accessibility Requirements](#accessibility-requirements)
6. [Testing Requirements](#testing-requirements)
7. [Enforcement](#enforcement)

## Design Tokens

### Color System

**MANDATORY**: Use ONLY these color tokens. No hardcoded colors allowed.

```typescript
import { colors } from '@/styles/theme';

// ✅ CORRECT - Using design tokens
className="bg-primary-500 text-white"

// ❌ FORBIDDEN - Hardcoded colors
className="bg-blue-500 text-white"
```

#### Primary Colors
- `primary-500`: Main brand color (#3b82f6)
- `primary-600`: Hover states (#2563eb)
- `primary-50`: Light backgrounds (#eff6ff)

#### Status Colors
- `success-500`: Success states (#22c55e)
- `warning-500`: Warning states (#f59e0b)
- `error-500`: Error states (#ef4444)
- `info-500`: Information states (#0ea5e9)

#### Neutral Colors
- `neutral-50` to `neutral-950`: Gray scale
- `text-primary`: Main text (#1e293b)
- `text-secondary`: Secondary text (#64748b)
- `text-muted`: Muted text (#94a3b8)

### Spacing System

**MANDATORY**: Use ONLY 8px grid system. No arbitrary spacing.

```typescript
import { spacing } from '@/styles/theme';

// ✅ CORRECT - Using 8px grid
className="p-4 m-2 gap-6" // 16px, 8px, 24px

// ❌ FORBIDDEN - Arbitrary spacing
className="p-5 m-3 gap-7" // Not in 8px grid
```

#### Spacing Scale
- `spacing-1`: 4px (0.25rem)
- `spacing-2`: 8px (0.5rem) - **Base unit**
- `spacing-3`: 12px (0.75rem)
- `spacing-4`: 16px (1rem)
- `spacing-6`: 24px (1.5rem)
- `spacing-8`: 32px (2rem)

### Typography

**MANDATORY**: Use ONLY defined font sizes and weights.

```typescript
import { typography } from '@/styles/theme';

// ✅ CORRECT - Using typography tokens
className="text-sm font-medium leading-tight"

// ❌ FORBIDDEN - Arbitrary typography
className="text-13px font-501"
```

#### Font Sizes
- `text-xs`: 12px (0.75rem)
- `text-sm`: 14px (0.875rem)
- `text-base`: 16px (1rem)
- `text-lg`: 18px (1.125rem)
- `text-xl`: 20px (1.25rem)
- `text-2xl`: 24px (1.5rem)

#### Font Weights
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

### Border Radius

**MANDATORY**: Use ONLY defined radius tokens.

```typescript
import { radius } from '@/styles/theme';

// ✅ CORRECT - Using radius tokens
className="rounded-md rounded-lg rounded-xl"

// ❌ FORBIDDEN - Arbitrary radius
className="rounded-7px rounded-13px"
```

#### Radius Scale
- `rounded-none`: 0px
- `rounded-sm`: 4px (0.25rem)
- `rounded-md`: 6px (0.375rem)
- `rounded-lg`: 8px (0.5rem)
- `rounded-xl`: 12px (0.75rem)
- `rounded-2xl`: 16px (1rem)

## Component Standards

### Button Component

**MANDATORY**: All buttons must follow this exact pattern.

```tsx
import { motion } from 'framer-motion';
import { colors, spacing, radius, motion as motionTokens } from '@/styles/theme';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button = ({ variant, size, disabled, loading, children, onClick }: ButtonProps) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-neutral-500',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-base rounded-md',
    lg: 'h-12 px-6 text-lg rounded-lg',
  };

  return (
    <motion.button
      className={[
        ...baseClasses,
        variantClasses[variant],
        sizeClasses[size],
      ].join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {loading && (
        <motion.div
          className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  );
};
```

### Card Component

**MANDATORY**: All cards must follow this exact pattern.

```tsx
import { motion } from 'framer-motion';
import { colors, spacing, radius, shadows } from '@/styles/theme';

interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = ({ children, padding = 'md', shadow = 'md', hover = false }: CardProps) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const Component = hover ? motion.div : 'div';

  return (
    <Component
      className={[
        'bg-white rounded-lg border border-neutral-200',
        paddingClasses[padding],
        shadowClasses[shadow],
        hover && 'hover:shadow-lg transition-shadow duration-200',
      ].join(' ')}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </Component>
  );
};
```

### Input Component

**MANDATORY**: All inputs must follow this exact pattern.

```tsx
import { motion } from 'framer-motion';
import { colors, spacing, radius } from '@/styles/theme';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const Input = ({ value, onChange, placeholder, type = 'text', error, disabled, required }: InputProps) => {
  return (
    <div className="space-y-1">
      <motion.input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={[
          'w-full h-10 px-3 py-2',
          'border border-neutral-300 rounded-md',
          'text-base text-neutral-900 placeholder-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-neutral-100 disabled:cursor-not-allowed',
          error && 'border-error-500 focus:ring-error-500',
        ].join(' ')}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
      />
      {error && (
        <motion.p
          className="text-sm text-error-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
```

## AI-Specific Patterns

### AI State Indicators

**MANDATORY**: All AI interactions must use these state patterns.

```tsx
import { motion } from 'framer-motion';
import { ai, motion as motionTokens } from '@/styles/theme';

interface AIStateProps {
  state: 'thinking' | 'typing' | 'confident' | 'uncertain' | 'error';
  message?: string;
}

const AIStateIndicator = ({ state, message }: AIStateProps) => {
  const stateConfig = {
    thinking: {
      color: ai.thinking.text,
      background: ai.thinking.background,
      border: ai.thinking.border,
      icon: '🤔',
    },
    typing: {
      color: ai.typing.indicator.color,
      background: 'transparent',
      border: 'transparent',
      icon: '⌨️',
    },
    confident: {
      color: ai.confident.text,
      background: ai.confident.background,
      border: ai.confident.border,
      icon: '✅',
    },
    uncertain: {
      color: ai.uncertain.text,
      background: ai.uncertain.background,
      border: ai.uncertain.border,
      icon: '🤷',
    },
    error: {
      color: ai.error.text,
      background: ai.error.background,
      border: ai.error.border,
      icon: '❌',
    },
  };

  const config = stateConfig[state];

  return (
    <motion.div
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-md border',
        'text-sm font-medium',
      ].join(' ')}
      style={{
        color: config.color,
        backgroundColor: config.background,
        borderColor: config.border,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: motionTokens.ai.handover.duration }}
    >
      <span>{config.icon}</span>
      {message && <span>{message}</span>}
      {state === 'typing' && (
        <motion.div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-current rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
```

### AI Handover Animation

**MANDATORY**: All AI handovers must use this animation pattern.

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/styles/theme';

interface AIHandoverProps {
  isVisible: boolean;
  children: React.ReactNode;
}

const AIHandover = ({ isVisible, children }: AIHandoverProps) => {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: motionTokens.ai.handover.duration,
            ease: motionTokens.ai.handover.easing,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

## Motion Guidelines

### Animation Principles

**MANDATORY**: All animations must follow these principles.

1. **Performance**: All animations must be GPU-accelerated (transform, opacity)
2. **Duration**: Use only defined motion tokens (fast: 150ms, medium: 300ms, slow: 500ms)
3. **Easing**: Use only defined easing functions
4. **Reduced Motion**: Respect user preferences

```tsx
import { motion } from 'framer-motion';
import { motion as motionTokens } from '@/styles/theme';

// ✅ CORRECT - Using motion tokens
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: motionTokens.duration.medium,
    ease: motionTokens.easing.easeOut,
  }}
/>

// ❌ FORBIDDEN - Arbitrary animations
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
/>
```

### Hover Animations

**MANDATORY**: All hover animations must be subtle and performant.

```tsx
// ✅ CORRECT - Subtle hover animation
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
/>

// ❌ FORBIDDEN - Excessive hover animation
<motion.button
  whileHover={{ scale: 1.5, rotate: 360, y: -20 }}
  transition={{ duration: 0.5 }}
/>
```

## Accessibility Requirements

### WCAG 2.2 AA Compliance

**MANDATORY**: All components must meet WCAG 2.2 AA standards.

1. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Focus Indicators**: Visible focus rings on all interactive elements
3. **Keyboard Navigation**: All interactive elements must be keyboard accessible
4. **Screen Reader Support**: Proper ARIA labels and roles

```tsx
// ✅ CORRECT - Accessible button
<button
  className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  aria-label="Send message"
  aria-describedby="button-description"
>
  Send
</button>

// ❌ FORBIDDEN - Inaccessible button
<button className="focus:outline-none">
  Send
</button>
```

### Reduced Motion Support

**MANDATORY**: All animations must respect reduced motion preferences.

```tsx
import { useReducedMotion } from 'framer-motion';

const Component = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.3 }}
    >
      Content
    </motion.div>
  );
};
```

## Testing Requirements

### Unit Testing

**MANDATORY**: All components must have comprehensive unit tests.

```tsx
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with correct design tokens', () => {
    render(<Button variant="primary" size="md">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500', 'text-white', 'h-10', 'px-4');
  });

  it('applies correct hover states', () => {
    render(<Button variant="primary" size="md">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-primary-600');
  });

  it('handles loading state correctly', () => {
    render(<Button variant="primary" size="md" loading>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
});
```

### Visual Testing

**MANDATORY**: All components must have visual regression tests.

```tsx
// visual-tests/Button.visual.test.ts
import { test, expect } from '@playwright/test';

test.describe('Button Visual Tests', () => {
  test('primary button matches design', async ({ page }) => {
    await page.goto('/test/button');
    await expect(page.locator('[data-testid="primary-button"]')).toHaveScreenshot('primary-button.png');
  });

  test('button hover state matches design', async ({ page }) => {
    await page.goto('/test/button');
    await page.hover('[data-testid="primary-button"]');
    await expect(page.locator('[data-testid="primary-button"]')).toHaveScreenshot('primary-button-hover.png');
  });
});
```

### Layout Testing

**MANDATORY**: All components must have layout stability tests.

```tsx
// layout-tests/Button.layout.test.ts
import { test, expect } from '@playwright/test';

test.describe('Button Layout Tests', () => {
  test('button maintains consistent dimensions', async ({ page }) => {
    await page.goto('/test/button');
    
    const button = page.locator('[data-testid="primary-button"]');
    const initialBox = await button.boundingBox();
    
    // Trigger state changes
    await button.hover();
    await button.click();
    
    const finalBox = await button.boundingBox();
    
    // Ensure no layout shift
    expect(finalBox?.width).toBe(initialBox?.width);
    expect(finalBox?.height).toBe(initialBox?.height);
  });
});
```

## Enforcement

### ESLint Rules

**MANDATORY**: These ESLint rules must be enabled and enforced.

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@campfire/design-tokens'],
  rules: {
    '@campfire/design-tokens/no-hardcoded-colors': 'error',
    '@campfire/design-tokens/no-arbitrary-spacing': 'error',
    '@campfire/design-tokens/no-arbitrary-typography': 'error',
    '@campfire/design-tokens/no-arbitrary-radius': 'error',
    '@campfire/design-tokens/require-motion-tokens': 'error',
  },
};
```

### CI/CD Checks

**MANDATORY**: These checks must pass before any merge.

```yaml
# .github/workflows/design-compliance.yml
name: Design Compliance Check

on: [pull_request]

jobs:
  design-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Design Token Compliance
        run: npm run check:design-tokens
      - name: Run Visual Regression Tests
        run: npm run test:visual
      - name: Run Layout Stability Tests
        run: npm run test:layout
      - name: Check Accessibility
        run: npm run test:accessibility
```

### Pre-commit Hooks

**MANDATORY**: These hooks must run before every commit.

```json
// .husky/pre-commit
#!/bin/sh
npm run lint:design-tokens
npm run test:unit
npm run test:visual:quick
```

## Violation Consequences

**SEVERE**: Violating any rule in this guide will result in:

1. **Immediate PR rejection**
2. **Required fixes before merge**
3. **Documentation of violation**
4. **Team notification**

## Success Metrics

**MANDATORY**: These metrics must be maintained:

1. **100% design token compliance**
2. **0 layout shifts in production**
3. **100% accessibility compliance**
4. **<50ms component render times**
5. **100% visual regression test pass rate**

---

**This guide is the law. Follow it without exception.** 