# Campfire Widget Design System

A pixel-perfect, meticulously crafted design system for the Campfire widget following Intercom standards with an 8px grid system and comprehensive responsive design.

## 🎯 Overview

This design system provides a complete set of components, tokens, and utilities for building consistent, accessible, and performant chat widgets. Every component follows strict design principles with pixel-perfect alignment and smooth interactions.

## ✨ Key Features

- **Pixel-Perfect Design**: 8px grid system with consistent spacing
- **Responsive First**: Mobile-optimized with proper breakpoints
- **Accessibility Compliant**: WCAG 2.1 AA standards
- **Performance Optimized**: Smooth animations and efficient rendering
- **Type Safe**: Full TypeScript support with comprehensive types
- **Intercom Quality**: Professional-grade UI matching industry standards

## 🚀 Quick Start

```tsx
import { UltimateWidget } from './design-system';

function App() {
  return (
    <UltimateWidget
      organizationId="your-org-id"
      config={{
        organizationName: "Your Company",
        primaryColor: "#3b82f6",
        position: "bottom-right",
        welcomeMessage: "Hi! How can we help?",
        showWelcomeMessage: true,
        enableHelp: true,
      }}
      onMessage={(message) => handleMessage(message)}
      onClose={() => console.log('Widget closed')}
    />
  );
}
```

## 📦 Components

### Core Components

#### UltimateWidget
The main widget component that consolidates all functionality.

```tsx
interface UltimateWidgetProps {
  organizationId: string;
  config?: UltimateWidgetConfig;
  onMessage?: (message: string) => void;
  onClose?: () => void;
  className?: string;
}
```

#### PixelPerfectChatInterface
The chat interface with perfect message alignment and scrolling.

```tsx
<PixelPerfectChatInterface
  messages={messages}
  isConnected={true}
  typingUsers={[]}
  organizationName="Company"
  onSendMessage={handleSend}
/>
```

#### MessageBubble
Individual message component with perfect styling.

```tsx
<MessageBubble
  id="msg-1"
  content="Hello world!"
  senderType="visitor"
  timestamp="2024-01-01T12:00:00Z"
  isOwn={true}
  showTimestamp={true}
/>
```

### UI Components

#### WidgetButton
Standardized button with consistent styling.

```tsx
<WidgetButton variant="primary" size="md" onClick={handleClick}>
  Send Message
</WidgetButton>
```

**Variants**: `primary`, `secondary`, `ghost`, `danger`
**Sizes**: `xs`, `sm`, `md`, `lg`

#### WidgetHeader
Header component with organization branding.

```tsx
<WidgetHeader
  organizationName="Company"
  isConnected={true}
  onClose={handleClose}
  onMinimize={handleMinimize}
/>
```

#### WidgetTabs
Tab navigation with badges and animations.

```tsx
<WidgetTabs
  tabs={[
    { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { id: 'help', label: 'Help', icon: <HelpIcon /> }
  ]}
  activeTab="chat"
  onTabChange={setActiveTab}
/>
```

## 🎨 Design Tokens

### Spacing (8px Grid)
```tsx
export const SPACING = {
  xs: '4px',    // 0.5 * base
  sm: '8px',    // 1 * base  
  md: '12px',   // 1.5 * base
  lg: '16px',   // 2 * base
  xl: '24px',   // 3 * base
  '2xl': '32px', // 4 * base
  '3xl': '48px', // 6 * base
};
```

### Typography
```tsx
export const TYPOGRAPHY = {
  messageText: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
  },
  timestamp: {
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: '400',
    opacity: '0.7',
  },
  header: {
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: '600',
  },
};
```

### Colors
```tsx
export const COLORS = {
  primary: {
    500: '#3b82f6',  // Main brand blue
    600: '#2563eb',  // Hover state
  },
  visitor: {
    background: '#3b82f6',
    text: '#ffffff',
  },
  agent: {
    background: '#f3f4f6',
    text: '#111827',
  },
};
```

### Border Radius
```tsx
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  widget: '16px',
  messageBubble: {
    visitor: '16px 16px 4px 16px',
    agent: '16px 16px 16px 4px',
  },
};
```

## 📱 Responsive Design

### Breakpoints
```tsx
export const BREAKPOINTS = {
  xs: '475px',   // Large phones
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Laptops
  '2xl': '1536px', // Large screens
};
```

### Responsive Hooks

#### useResponsive()
```tsx
const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
```

#### useWidgetDimensions()
```tsx
const { getWidgetDimensions } = useWidgetDimensions();
const dimensions = getWidgetDimensions('open');
```

#### useResponsiveTypography()
```tsx
const { getTypographyScale } = useResponsiveTypography();
const scale = getTypographyScale();
```

## 🎭 Animations

### Timing
```tsx
export const ANIMATIONS = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
};
```

### Usage
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: parseFloat(ANIMATIONS.normal) / 1000,
    ease: [0.0, 0.0, 0.2, 1],
  }}
>
  Content
</motion.div>
```

## ♿ Accessibility

### ARIA Labels
All interactive elements include proper ARIA labels:

```tsx
<WidgetButton aria-label="Send message">
  <SendIcon />
</WidgetButton>
```

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space activation for buttons
- Escape to close modals/dropdowns

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Live regions for dynamic content

### Touch Targets
- Minimum 44px touch targets on mobile
- Proper spacing between interactive elements
- Touch-friendly hover states

## 🔧 Utilities

### Class Name Utility
```tsx
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
);
```

### Responsive Utilities
```tsx
import { useResponsiveTouchTargets } from './design-system';

const { getMinTouchTarget } = useResponsiveTouchTargets();
const minHeight = getMinTouchTarget(); // '44px' on touch devices
```

## 📋 Best Practices

### Component Structure
1. Import design tokens at the top
2. Define interfaces with proper types
3. Use responsive hooks for dynamic styling
4. Include proper ARIA attributes
5. Add loading and error states

### Styling Guidelines
1. Always use design tokens instead of hardcoded values
2. Follow the 8px grid system for spacing
3. Use semantic color names (primary, secondary, etc.)
4. Include hover, focus, and active states
5. Test on multiple screen sizes

### Performance Tips
1. Use `motion.div` for animations
2. Memoize expensive calculations
3. Use `useCallback` for event handlers
4. Implement proper loading states
5. Optimize images and assets

## 🚀 Migration Guide

See [DEPRECATED.md](./DEPRECATED.md) for detailed migration instructions from legacy components.

## 📚 Examples

Check [EXAMPLES.md](./EXAMPLES.md) for complete implementation examples:
- Basic widget setup
- Custom theming
- Advanced configurations
- Integration patterns
- Responsive design
- Testing strategies

## 🤝 Contributing

1. Follow the established design patterns
2. Add proper TypeScript types
3. Include accessibility features
4. Test on multiple devices
5. Update documentation

## 📄 License

This design system is part of the Campfire project and follows the same licensing terms.
