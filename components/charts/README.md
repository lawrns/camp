# Lazy Charts System

A performance-optimized lazy loading system for Recharts components with automatic code splitting and loading skeletons.

## Features

- 🚀 **Automatic Code Splitting**: Each chart type is loaded only when needed
- 💀 **Loading Skeletons**: Beautiful skeleton placeholders while charts load
- 🔄 **Drop-in Replacement**: Exact same API as standard Recharts
- 📦 **TypeScript Support**: All types are preserved from original Recharts
- ⚡ **Preloading**: Optional preloading for critical charts
- 🎨 **Customizable**: Skeleton components can be styled

## Installation

The LazyCharts system is already included in your project. No additional installation needed.

## Usage

### Basic Usage

Simply change your import statement:

```tsx
// Before
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// After
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/charts/LazyCharts";
```

That's it! Your existing chart code works without any other changes.

### Available Components

All commonly used Recharts components are available:

- **Charts**: `AreaChart`, `LineChart`, `BarChart`, `PieChart`
- **Container**: `ResponsiveContainer`
- **Axes**: `XAxis`, `YAxis`
- **Grid**: `CartesianGrid`
- **Interactivity**: `Tooltip`, `Legend`
- **Elements**: `Area`, `Line`, `Bar`, `Pie`, `Cell`
- **Reference**: `ReferenceLine`

### Preloading Charts

For critical charts that should load immediately, use the `usePreloadChart` hook:

```tsx
import { LineChart, usePreloadChart } from "@/components/charts/LazyCharts";

function Dashboard() {
  // Preload charts when component mounts
  usePreloadChart(["LineChart", "BarChart"]);

  return (
    <div>
      <LineChart data={data}>{/* Chart configuration */}</LineChart>
    </div>
  );
}
```

### Loading Skeletons

While charts are loading, appropriate skeleton placeholders are shown:

- **Line/Area/Bar Charts**: Show axis labels and chart area skeleton
- **Pie Charts**: Show circular skeleton
- **Other Components**: Load without skeleton (they're typically small)

### Advanced Usage

#### Import Namespace

For cleaner imports when using many components:

```tsx
import { LazyCharts } from "@/components/charts/LazyCharts";

const { LineChart, Line, XAxis, YAxis } = LazyCharts;
```

#### Custom Preloading

Preload charts programmatically:

```tsx
import { preloadChart } from "@/components/charts/LazyCharts";

// Preload a specific chart type
preloadChart("LineChart");

// Preload multiple charts
["LineChart", "BarChart", "PieChart"].forEach((chart) => {
  preloadChart(chart);
});
```

## Migration Guide

1. **Find all Recharts imports** in your codebase
2. **Replace the import path** with `@/components/charts/LazyCharts`
3. **No other changes needed** - the API is identical

### Example Migration

```tsx
// components/analytics/Dashboard.tsx

// OLD
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// NEW
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/charts/LazyCharts";

// Rest of your component stays exactly the same!
```

## Performance Benefits

- **Reduced Initial Bundle**: Charts are not included in the initial JavaScript bundle
- **Faster Page Load**: Only the charts actually rendered are downloaded
- **Better UX**: Loading skeletons provide visual feedback
- **Optimal Caching**: Each chart type is cached separately by the browser

## TypeScript

All TypeScript types are preserved from the original Recharts library. Your IDE autocomplete and type checking work exactly as before.

## Troubleshooting

### Chart not rendering?

- Ensure you're wrapping charts in `ResponsiveContainer` or providing explicit dimensions
- Check browser console for any loading errors

### Skeleton showing too long?

- This usually indicates a network issue
- Consider preloading critical charts with `usePreloadChart`

### TypeScript errors?

- Make sure you're importing from the correct path
- The API should be identical to standard Recharts

## Examples

See `LazyCharts.example.tsx` for complete working examples of:

- Line Charts
- Area Charts
- Bar Charts
- Pie Charts
- Dashboard with multiple charts
- Preloading strategies
