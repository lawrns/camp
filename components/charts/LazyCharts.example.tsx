/**
 * LazyCharts Usage Examples
 *
 * This file demonstrates how to use the lazy-loaded chart components
 * as drop-in replacements for standard Recharts imports.
 */

import React from "react";
// Before: Standard Recharts import
// import {
//   LineChart, Line, AreaChart, Area, BarChart, Bar, ChartPie, Pie,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
// } from 'recharts';

// After: Lazy-loaded imports (exact same API)
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  usePreloadChart,
  XAxis,
  YAxis,
} from "./LazyCharts";

// Or import the namespace for cleaner imports
// import { LazyCharts } from './LazyCharts';
// const { LineChart, Line, XAxis, YAxis, ... } = LazyCharts;

// Sample data
const data = [
  { name: "Jan", value: 400, sales: 240 },
  { name: "Feb", value: 300, sales: 139 },
  { name: "Mar", value: 200, sales: 980 },
  { name: "Apr", value: 278, sales: 390 },
  { name: "May", value: 189, sales: 480 },
];

const pieData = [
  { name: "Group A", value: 400, color: "#0088FE" },
  { name: "Group B", value: 300, color: "#00C49F" },
  { name: "Group C", value: 300, color: "#FFBB28" },
  { name: "Group D", value: 200, color: "#FF8042" },
];

// Example 1: Line Chart with preloading
export const LazyLineChartExample = () => {
  // Preload the chart when component mounts (optional optimization)
  usePreloadChart(["LineChart"]);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
          <Line type="monotone" dataKey="sales" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example 2: Area Chart (no changes needed from regular usage)
export const LazyAreaChartExample = () => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example 3: Bar Chart
export const LazyBarChartExample = () => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
          <Bar dataKey="sales" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example 4: Pie Chart with Cell coloring
export const LazyChartPieExample = () => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example 5: Migration guide for existing components
export const MigrationExample = () => {
  // Step 1: Change your import statement
  // FROM: import { LineChart, Line, ... } from 'recharts';
  // TO:   import { LineChart, Line, ... } from '@/components/charts/LazyCharts';

  // Step 2: That's it! The API is exactly the same
  // Your existing chart code works without any other changes

  return (
    <div className="space-y-3 spacing-3">
      <h2 className="text-lg font-bold">Migration Steps:</h2>
      <ol className="list-inside list-decimal space-y-spacing-sm">
        <li>Update your import statements to use LazyCharts</li>
        <li>No other code changes needed!</li>
        <li>Optionally use usePreloadChart() for critical charts</li>
      </ol>

      <div className="mt-8">
        <h3 className="mb-4 text-base font-semibold">Benefits:</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Automatic code splitting for each chart type</li>
          <li>Loading skeletons while charts load</li>
          <li>Exact same API as regular Recharts</li>
          <li>TypeScript types are preserved</li>
          <li>Optional preloading for critical charts</li>
        </ul>
      </div>
    </div>
  );
};

// Example 6: Using in a dashboard with multiple charts
export const DashboardExample = () => {
  // Preload all charts used in this dashboard
  usePreloadChart(["LineChart", "BarChart", "PieChart"]);

  return (
    <div className="grid grid-cols-1 gap-3 spacing-3 md:grid-cols-2">
      <div className="bg-background rounded-ds-lg spacing-3 shadow">
        <h3 className="mb-2 text-base font-semibold">Sales Trend</h3>
        <LazyLineChartExample />
      </div>

      <div className="bg-background rounded-ds-lg spacing-3 shadow">
        <h3 className="mb-2 text-base font-semibold">Revenue by Month</h3>
        <LazyBarChartExample />
      </div>

      <div className="bg-background rounded-ds-lg spacing-3 shadow">
        <h3 className="mb-2 text-base font-semibold">Market Share</h3>
        <LazyChartPieExample />
      </div>

      <div className="bg-background rounded-ds-lg spacing-3 shadow">
        <h3 className="mb-2 text-base font-semibold">Growth Area</h3>
        <LazyAreaChartExample />
      </div>
    </div>
  );
};
