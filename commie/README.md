# Commie - Past Homepage and Comrad Pages

This folder contains the restored homepage and /comrad/ pages from past commits in the Campfire project. These files were extracted from git history and organized for easy replication into the current codebase.

## Structure

```
commie/
├── app/
│   ├── page.tsx              # Homepage main page
│   ├── home.css              # Homepage specific styles
│   └── comrad/
│       └── page.tsx          # Comrad page (AI agent showcase)
└── components/
    └── homepage/
        └── Homepage.tsx      # Homepage component with animations
```

## Files Description

### Homepage Files
- **`app/page.tsx`**: Main homepage page with dynamic loading and widget integration
- **`app/home.css`**: Homepage-specific styles with gradients and animations
- **`components/homepage/Homepage.tsx`**: Complex homepage component with:
  - Interactive handover animation between human and AI
  - Parallax background effects
  - Animated navigation
  - Hero section with operator images
  - Mouse-following cursor effects

### Comrad Page Files
- **`app/comrad/page.tsx`**: Complete Comrad AI agent showcase page featuring:
  - Human behavior simulation demos
  - Pricing transparency section
  - Social proof testimonials
  - Gradient backgrounds and animations
  - Typing animations
  - Interactive chat demos

## Key Features

### Homepage Features
- **Interactive Handover Animation**: Shows transition from human to AI operator
- **Parallax Background**: Animated gradient backgrounds that respond to scroll
- **Mouse Following Cursor**: Interactive cursor that follows mouse movement
- **Animated Navigation**: Sticky navigation with scroll effects
- **Dynamic Image Transitions**: Operator images that change based on animation state

### Comrad Page Features
- **Human Behavior Simulation**: Demonstrates natural typing patterns, emotional intelligence, and context memory
- **Pricing Transparency**: Outcome-based pricing vs traditional AI pricing comparison
- **Social Proof**: Customer testimonials with metrics
- **Gradient Backgrounds**: Complex animated gradient backgrounds
- **Typing Animations**: Realistic typing effects with corrections and hesitations

## Integration Notes

To integrate these pages into your current codebase:

1. **Copy the files** to your app directory structure
2. **Update imports** to match your current project structure
3. **Add required dependencies** (framer-motion, lucide-react)
4. **Update image paths** for operator.png and rag.png
5. **Adjust styling** to match your current design system
6. **Test animations** and interactions

## Dependencies Required

- `framer-motion` for animations
- `lucide-react` for icons
- `next/link` for navigation
- Custom `FadeIn` component from `@/lib/performance/lightweight-animations`

## Source

These files were extracted from commit `23e41b6ae` in the Campfire project git history, which contained the working homepage and comrad pages before they were removed in later cleanup operations. 