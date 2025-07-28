# Premium Design Token System

A sophisticated, light-only design token system for modern web applications.

## Overview

This token system provides a comprehensive set of design values organized into logical categories:

- **Colors**: Sophisticated palette with semantic naming
- **Typography**: Extended type scale from 11px to 48px
- **Spacing**: 4px base unit system with negative values
- **Shadows**: 5-level subtle depth system
- **Animations**: Spring-based motion values
- **Breakpoints**: Mobile-first responsive system
- **Effects**: Border radius, opacity, blur, and more

## Usage

### Import tokens in TypeScript/JavaScript:

```typescript
// 16px

// Use the token helper
import { colors, spacing, token, tokens, typography } from "@campfire/ui/tokens";

// Use individual values
const primaryColor = colors.primary.default;
const bodyFont = typography.textStyles.body;
const mediumSpace = spacing[4];

const color = token("colors.primary.default");
```

### Generate CSS custom properties:

```typescript
import { generateAllCSSVariables } from "@campfire/ui/tokens";

// Generate all CSS variables
const cssVars = generateAllCSSVariables();
// Inject into your document or CSS-in-JS solution
```

### Use in components:

```tsx
import { colors, shadows, spacing } from "@campfire/ui/tokens";

const Card = styled.div`
  background: ${colors.surface.default};
  padding: ${spacing[6]};
  border-radius: ${effects.borderRadius.lg};
  box-shadow: ${shadows.sm};

  &:hover {
    box-shadow: ${shadows.hover.sm};
  }
`;
```

### Responsive design:

```tsx
import { mediaQueries } from "@campfire/ui/tokens";

const Container = styled.div`
  padding: ${spacing[4]};

  ${mediaQueries.up.md} {
    padding: ${spacing[8]};
  }

  ${mediaQueries.up.lg} {
    padding: ${spacing[12]};
  }
`;
```

### Animations:

```tsx
import { animations, transitions } from "@campfire/ui/tokens";

const AnimatedButton = styled.button`
  transition: ${transitions.colors};

  &:hover {
    animation: ${animations.pulse};
  }
`;
```

## Token Categories

### Colors

- Neutral palette with cool gray undertones
- Brand colors: Indigo (primary), Emerald (success), Amber (warning), Rose (error)
- Semantic mappings for consistent usage
- Interactive states with subtle transparency

### Typography

- Font families: Sans (Inter), Serif (Crimson Pro), Mono (JetBrains Mono)
- Extended type scale with optimized line heights
- Pre-composed text styles for common use cases
- Letter spacing and paragraph spacing utilities

### Spacing

- Base unit: 4px
- Scale from 0 to 96 (0px to 384px)
- Negative spacing values
- Component-specific presets (button, input, card, etc.)
- Layout spacing for containers and panels

### Shadows

- 5 levels: xs, sm, md, lg, xl
- Special shadows for interactive states
- Colored shadows for brand elements
- Shadow transitions for smooth interactions

### Animations

- Duration scale: 50ms to 1000ms
- Spring-based easing curves
- Pre-defined keyframe animations
- Stagger utilities for list animations

### Breakpoints

- Mobile-first: xs (0), sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- Media query helpers for up, down, between, and only
- Container query support
- Device-specific queries (touch, retina, reduced motion)

### Effects

- Border radius scale with full (pill) option
- Opacity scale (0-100)
- Blur values for glassmorphism
- Z-index scale with semantic values
- Aspect ratios including golden ratio

## Best Practices

1. **Use semantic tokens**: Prefer `colors.primary.default` over `indigo[600]`
2. **Maintain consistency**: Use the spacing scale for all spacing values
3. **Responsive first**: Design mobile-first using the breakpoint system
4. **Motion with purpose**: Use animations sparingly and respect reduced motion
5. **Accessible contrasts**: Ensure text has sufficient contrast against backgrounds

## TypeScript Support

All tokens are fully typed for excellent IDE support and type safety:

```typescript
import type { Colors, Spacing, Tokens, Typography } from "@campfire/ui/tokens";
```
