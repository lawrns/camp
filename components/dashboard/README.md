# Dashboard Component Standardization

This directory contains standardized dashboard components that follow the unified design system. All components use the `unified-ui` design tokens and components for consistent styling and behavior.

## 🎯 Goals

- **Consistency**: All dashboard components follow the same design patterns
- **Maintainability**: Single source of truth for styling and behavior
- **Accessibility**: Built-in accessibility features and semantic markup
- **Performance**: Optimized rendering and minimal bundle size
- **Flexibility**: Configurable variants while maintaining consistency

## 📦 Components

### Core Components

#### `MetricCard` / `StatCard`
A standardized metric card component that replaces multiple inconsistent implementations.

```tsx
import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Total Revenue"
  value={125000}
  description="Monthly revenue"
  change={{
    value: 12.5,
    period: "last month",
    trend: "up"
  }}
  icon={TrendingUp}
  variant="success"
/>
```

**Variants:**
- `default` - Standard metric card
- `success` - Green theme for positive metrics
- `warning` - Yellow theme for caution metrics
- `error` - Red theme for negative metrics
- `info` - Blue theme for informational metrics

#### `DashboardGrid`
Responsive grid layout for dashboard components.

```tsx
import { DashboardGrid } from './StandardizedDashboard';

<DashboardGrid columns={4} gap="md">
  <MetricCard title="Metric 1" value={100} />
  <MetricCard title="Metric 2" value={200} />
  <MetricCard title="Metric 3" value={300} />
  <MetricCard title="Metric 4" value={400} />
</DashboardGrid>
```

#### `DashboardSection`
Section wrapper with title, description, and optional actions.

```tsx
import { DashboardSection } from './StandardizedDashboard';

<DashboardSection
  title="Performance Metrics"
  description="Key performance indicators for this period"
  actions={<Button>Export</Button>}
>
  <DashboardGrid columns={3}>
    {/* Metric cards */}
  </DashboardGrid>
</DashboardSection>
```

#### `ActivityFeed`
Standardized activity feed component.

```tsx
import { ActivityFeed } from './StandardizedDashboard';

<ActivityFeed
  items={[
    {
      id: "1",
      title: "New conversation started",
      description: "Customer inquiry about pricing",
      timestamp: "2 minutes ago",
      icon: MessageCircle
    }
  ]}
/>
```

### Preset Components

#### `SuccessMetricCard`
Pre-configured success variant metric card.

```tsx
import { SuccessMetricCard } from './StandardizedDashboard';

<SuccessMetricCard
  title="Conversion Rate"
  value="85%"
  description="Website conversion rate"
/>
```

#### `WarningMetricCard`
Pre-configured warning variant metric card.

#### `ErrorMetricCard`
Pre-configured error variant metric card.

#### `InfoMetricCard`
Pre-configured info variant metric card.

### Utility Components

#### `MetricCardSkeleton`
Loading skeleton for metric cards.

```tsx
import { MetricCardSkeleton } from './StandardizedDashboard';

<MetricCardSkeleton count={4} />
```

## 🔄 Migration Guide

### From `StatCard.tsx`
Replace:
```tsx
import { StatCard } from './StatCard';

<StatCard
  title="Revenue"
  value={1000}
  variant="success"
/>
```

With:
```tsx
import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Revenue"
  value={1000}
  variant="success"
/>
```

### From `MetricCard.tsx`
Replace:
```tsx
import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Response Time"
  value="2.5s"
  variant="success"
/>
```

With:
```tsx
import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Response Time"
  value="2.5s"
  variant="success"
/>
```

### From `EnhancedMetricCard.tsx`
Replace:
```tsx
import { EnhancedMetricCard } from './EnhancedMetricCard';

<EnhancedMetricCard
  title="Users"
  value={1000}
  color="blue"
  icon={Users}
/>
```

With:
```tsx
import { MetricCard } from './StandardizedDashboard';

<MetricCard
  title="Users"
  value={1000}
  icon={Users}
  variant="info"
/>
```

### From `PremiumKPICards.tsx`
Replace the custom KPI card implementation with:

```tsx
import { DashboardGrid, MetricCard } from './StandardizedDashboard';

<DashboardGrid columns={4}>
  {metrics.map((metric) => (
    <MetricCard
      key={metric.id}
      title={metric.title}
      value={metric.value}
      change={{
        value: metric.change || 0,
        period: "last period",
        trend: metric.trend || "neutral"
      }}
      icon={metric.icon}
      variant={getVariantFromColor(metric.color)}
    />
  ))}
</DashboardGrid>
```

## 🎨 Design Tokens

All components use the unified design tokens:

- **Colors**: `var(--fl-color-*)`
- **Spacing**: `var(--fl-spacing-*)`
- **Shadows**: `var(--fl-shadow-*)`
- **Border Radius**: `var(--fl-radius-*)`
- **Typography**: `var(--fl-typography-*)`

## 📱 Responsive Design

Components are built with responsive design in mind:

- **Mobile First**: Components work on all screen sizes
- **Flexible Grids**: `DashboardGrid` adapts to screen size
- **Touch Friendly**: Interactive elements have appropriate touch targets
- **Readable Text**: Typography scales appropriately

## ♿ Accessibility

All components include:

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meets WCAG AA standards
- **Focus Indicators**: Clear focus states

## 🚀 Performance

Optimizations include:

- **Lazy Loading**: Components load only when needed
- **Memoization**: Prevents unnecessary re-renders
- **Bundle Splitting**: Components can be code-split
- **Tree Shaking**: Unused code is eliminated

## 🧪 Testing

Components include:

- **Unit Tests**: Core functionality testing
- **Integration Tests**: Component interaction testing
- **Visual Regression Tests**: UI consistency testing
- **Accessibility Tests**: Screen reader and keyboard testing

## 📋 TODO

- [ ] Migrate all existing dashboard components to use the standardized system
- [ ] Add comprehensive test coverage
- [ ] Create Storybook documentation
- [ ] Add performance monitoring
- [ ] Implement dark mode support
- [ ] Add internationalization support

## 🤝 Contributing

When adding new dashboard components:

1. Use the standardized `MetricCard` as a base
2. Follow the design token system
3. Include proper TypeScript types
4. Add comprehensive documentation
5. Include accessibility features
6. Write tests for new functionality

## 📚 Examples

See the `examples/` directory for complete usage examples and migration patterns. 