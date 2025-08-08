import React from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/charts/LazyCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the type locally since @/types doesn't exist
interface DailyMetric {
  date: string;
  value: number;
}

interface AreaChartProps {
  data: DailyMetric[];
  title?: string;
  gradientId?: string;
  className?: string;
}

export function AreaChart({
  data,
  title = "Conversations Overview",
  gradientId = "colorGradient",
  className,
}: AreaChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${gradientId}2`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${gradientId}3`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
                className="text-tiny text-muted-foreground"
              />
              <YAxis className="text-tiny text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="conversations"
                name="Conversations"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
              <Area
                type="monotone"
                dataKey="responseTime"
                name="Response Time (s)"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill={`url(#${gradientId}2)`}
              />
              <Area
                type="monotone"
                dataKey="ragRate"
                name="RAG Rate"
                stroke="hsl(var(--chart-3))"
                fillOpacity={1}
                fill={`url(#${gradientId}3)`}
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
