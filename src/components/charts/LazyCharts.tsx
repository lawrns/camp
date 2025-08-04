/**
 * Lazy Chart Components System
 *
 * Provides lazy-loaded Recharts components with loading skeletons
 * for optimal performance. Drop-in replacements for standard Recharts imports.
 */

import React, { ComponentProps, lazy, Suspense } from "react";
import type {
  AreaChart as AreaChartType,
  Area as AreaType,
  BarChart as BarChartType,
  Bar as BarType,
  CartesianGrid as CartesianGridType,
  Cell as CellType,
  Legend as LegendType,
  LineChart as LineChartType,
  Line as LineType,
  PieChart as PieChartType,
  Pie as PieType,
  PolarAngleAxis as PolarAngleAxisType,
  PolarGrid as PolarGridType,
  PolarRadiusAxis as PolarRadiusAxisType,
  RadarChart as RadarChartType,
  Radar as RadarType,
  ReferenceLine as ReferenceLineType,
  ResponsiveContainer as ResponsiveContainerType,
  Tooltip as TooltipType,
  XAxis as XAxisType,
  YAxis as YAxisType,
} from "recharts";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { cn } from "@/lib/utils";

// Lazy load all chart components
const LazyAreaChart = lazy(() => import("recharts").then((module) => ({ default: module.AreaChart })));
const LazyLineChart = lazy(() => import("recharts").then((module) => ({ default: module.LineChart })));
const LazyBarChart = lazy(() => import("recharts").then((module) => ({ default: module.BarChart })));
const LazyPieChart = lazy(() => import("recharts").then((module) => ({ default: module.PieChart })));
const LazyResponsiveContainer = lazy(() =>
  import("recharts").then((module) => ({ default: module.ResponsiveContainer }))
);
const LazyXAxis = lazy(() => import("recharts").then((module) => ({ default: module.XAxis })));
const LazyYAxis = lazy(() => import("recharts").then((module) => ({ default: module.YAxis })));
const LazyCartesianGrid = lazy(() => import("recharts").then((module) => ({ default: module.CartesianGrid })));
const LazyTooltip = lazy(() => import("recharts").then((module) => ({ default: module.Tooltip })));
const LazyLegend = lazy(() =>
  import("recharts").then((module) => ({
    default: module.Legend as React.ComponentType<Omit<ComponentProps<typeof LegendType>, "ref">>,
  }))
);
const LazyArea = lazy(() =>
  import("recharts").then((module) => ({
    default: module.Area as React.ComponentType<ComponentProps<typeof AreaType>>,
  }))
);
const LazyLine = lazy(() => import("recharts").then((module) => ({ default: module.Line })));
const LazyBar = lazy(() =>
  import("recharts").then((module) => ({
    default: module.Bar as React.ComponentType<ComponentProps<typeof BarType>>,
  }))
);
const LazyPie = lazy(() =>
  import("recharts").then((module) => ({
    default: module.Pie as React.ComponentType<ComponentProps<typeof PieType>>,
  }))
);
const LazyCell = lazy(() => import("recharts").then((module) => ({ default: module.Cell })));
const LazyPolarAngleAxis = lazy(() => import("recharts").then((module) => ({ default: module.PolarAngleAxis })));
const LazyPolarGrid = lazy(() => import("recharts").then((module) => ({ default: module.PolarGrid })));
const LazyPolarRadiusAxis = lazy(() => import("recharts").then((module) => ({ default: module.PolarRadiusAxis })));
const LazyRadar = lazy(() =>
  import("recharts").then((module) => ({
    default: module.Radar as React.ComponentType<ComponentProps<typeof RadarType>>,
  }))
);
const LazyRadarChart = lazy(() => import("recharts").then((module) => ({ default: module.RadarChart })));
const LazyReferenceLine = lazy(() => import("recharts").then((module) => ({ default: module.ReferenceLine })));

// Chart loading skeleton components
interface ChartSkeletonProps {
  className?: string | undefined;
  height?: number | string | undefined;
  width?: number | string | undefined;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ className, height = 300, width = "100%" }) => (
  <div className={cn("flex flex-col gap-2", className)} style={{ width, height }}>
    <div className="relative flex-1">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 spacing-3">
        <div className="flex h-full flex-col justify-between">
          {/* Y-axis labels */}
          <div className="flex flex-col gap-ds-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between spacing-3">
        {/* X-axis labels */}
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </div>
);

const PieSkeleton: React.FC<ChartSkeletonProps> = ({ className, height = 300, width = "100%" }) => (
  <div className={cn("flex items-center justify-center", className)} style={{ width, height }}>
    <Skeleton className="rounded-ds-full" style={{ width: 200, height: 200 }} />
  </div>
);

// Wrapper components with exact same API as Recharts
export const AreaChart: React.FC<ComponentProps<typeof AreaChartType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 300} width={props.width || 400} />}>
      <LazyAreaChart {...restProps} />
    </Suspense>
  );
};

export const LineChart: React.FC<ComponentProps<typeof LineChartType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 300} width={props.width || 400} />}>
      <LazyLineChart {...restProps} />
    </Suspense>
  );
};

export const BarChart: React.FC<ComponentProps<typeof BarChartType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 300} width={props.width || 400} />}>
      <LazyBarChart {...restProps} />
    </Suspense>
  );
};

export const PieChart: React.FC<ComponentProps<typeof PieChartType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<PieSkeleton height={props.height} width={props.width} />}>
      <LazyPieChart {...restProps} />
    </Suspense>
  );
};

// Container and axis components (these are usually small enough to not need skeletons)
export const ResponsiveContainer: React.FC<ComponentProps<typeof ResponsiveContainerType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<div style={{ width: props.width || "100%", height: props.height || "100%" }} />}>
      <LazyResponsiveContainer {...restProps} />
    </Suspense>
  );
};

export const XAxis: React.FC<ComponentProps<typeof XAxisType>> = (props) => {
  return (
    <Suspense fallback={null}>
      <LazyXAxis {...props} />
    </Suspense>
  );
};

export const YAxis: React.FC<ComponentProps<typeof YAxisType>> = (props) => {
  return (
    <Suspense fallback={null}>
      <LazyYAxis {...props} />
    </Suspense>
  );
};

export const CartesianGrid: React.FC<ComponentProps<typeof CartesianGridType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyCartesianGrid {...restProps} />
    </Suspense>
  );
};

export const Tooltip: React.FC<ComponentProps<typeof TooltipType>> = (props) => {
  // Note: Tooltip component doesn't support refs, so we don't extract it
  return (
    <Suspense fallback={null}>
      <LazyTooltip {...props} />
    </Suspense>
  );
};

export const Legend: React.FC<ComponentProps<typeof LegendType>> = (props) => {
  return (
    <Suspense fallback={null}>
      <LazyLegend {...props} />
    </Suspense>
  );
};

// Chart elements
export const Area: React.FC<ComponentProps<typeof AreaType>> = (props) => (
  <Suspense fallback={null}>
    <LazyArea {...(props as unknown)} />
  </Suspense>
);

export const Line: React.FC<ComponentProps<typeof LineType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyLine {...restProps} />
    </Suspense>
  );
};

export const Bar: React.FC<ComponentProps<typeof BarType>> = (props) => (
  <Suspense fallback={null}>
    <LazyBar {...(props as unknown)} />
  </Suspense>
);

export const Pie: React.FC<ComponentProps<typeof PieType>> = (props) => (
  <Suspense fallback={null}>
    <LazyPie {...(props as unknown)} />
  </Suspense>
);

export const Cell: React.FC<ComponentProps<typeof CellType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyCell {...restProps} />
    </Suspense>
  );
};

export const PolarAngleAxis: React.FC<ComponentProps<typeof PolarAngleAxisType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyPolarAngleAxis ref={ref as React.Ref<PolarAngleAxisType> | undefined} {...restProps} />
    </Suspense>
  );
};

export const PolarGrid: React.FC<ComponentProps<typeof PolarGridType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyPolarGrid {...restProps} />
    </Suspense>
  );
};

export const PolarRadiusAxis: React.FC<ComponentProps<typeof PolarRadiusAxisType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyPolarRadiusAxis ref={ref as React.Ref<PolarRadiusAxisType> | undefined} {...restProps} />
    </Suspense>
  );
};

export const Radar: React.FC<ComponentProps<typeof RadarType>> = (props) => (
  <Suspense fallback={null}>
    <LazyRadar {...(props as unknown)} />
  </Suspense>
);

export const RadarChart: React.FC<ComponentProps<typeof RadarChartType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={<ChartSkeleton height={props.height || 300} width={props.width || 400} />}>
      <LazyRadarChart {...restProps} />
    </Suspense>
  );
};

export const ReferenceLine: React.FC<ComponentProps<typeof ReferenceLineType>> = (props) => {
  const { ref, ...restProps } = props;
  return (
    <Suspense fallback={null}>
      <LazyReferenceLine ref={ref as React.Ref<ReferenceLineType> | undefined} {...restProps} />
    </Suspense>
  );
};

// Export a namespace for easy migration
export const LazyCharts = {
  AreaChart,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line,
  Bar,
  Pie,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
};

// Preload function for critical charts
export const preloadChart = (chartType: keyof typeof LazyCharts) => {
  switch (chartType) {
    case "AreaChart":
      return import("recharts").then((module) => module.AreaChart);
    case "LineChart":
      return import("recharts").then((module) => module.LineChart);
    case "BarChart":
      return import("recharts").then((module) => module.BarChart);
    case "PieChart":
      return import("recharts").then((module) => module.PieChart);
    case "ResponsiveContainer":
      return import("recharts").then((module) => module.ResponsiveContainer);
    case "XAxis":
      return import("recharts").then((module) => module.XAxis);
    case "YAxis":
      return import("recharts").then((module) => module.YAxis);
    case "CartesianGrid":
      return import("recharts").then((module) => module.CartesianGrid);
    case "Tooltip":
      return import("recharts").then((module) => module.Tooltip);
    case "Legend":
      return import("recharts").then((module) => module.Legend);
    case "Area":
      return import("recharts").then((module) => module.Area);
    case "Line":
      return import("recharts").then((module) => module.Line);
    case "Bar":
      return import("recharts").then((module) => module.Bar);
    case "Pie":
      return import("recharts").then((module) => module.Pie);
    case "Cell":
      return import("recharts").then((module) => module.Cell);
    case "PolarAngleAxis":
      return import("recharts").then((module) => module.PolarAngleAxis);
    case "PolarGrid":
      return import("recharts").then((module) => module.PolarGrid);
    case "PolarRadiusAxis":
      return import("recharts").then((module) => module.PolarRadiusAxis);
    case "Radar":
      return import("recharts").then((module) => module.Radar);
    case "RadarChart":
      return import("recharts").then((module) => module.RadarChart);
    case "ReferenceLine":
      return import("recharts").then((module) => module.ReferenceLine);
    default:
      return import("recharts");
  }
};

// Hook for preloading charts
export const usePreloadChart = (chartTypes: (keyof typeof LazyCharts)[]) => {
  React.useEffect(() => {
    chartTypes.forEach((chartType) => {
      void preloadChart(chartType);
    });
  }, [chartTypes]);
};

// Default export for convenience
export default LazyCharts;
