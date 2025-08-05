"use client";

import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import {
  Activity,
  BarChart3,
  Globe,
  Monitor,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MetricCard } from "./MetricCard";
import { TimeRange } from "./types";
import { usePerformanceData } from "./usePerformanceData";
import { getOverallStatus, getStatusColor } from "./utils";

export function PerformanceMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const { metrics, chartData } = usePerformanceData(isMonitoring);

  const overallStatus = getOverallStatus(metrics);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
      case "good":
        return <Icon icon={TrendingUp} className="h-4 w-4" />;
      case "warning":
        return <Icon icon={Activity} className="h-4 w-4" />;
      case "critical":
        return <Icon icon={TrendingDown} className="h-4 w-4" />;
      default:
        return <Icon icon={Activity} className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-ds-lg ${getStatusColor(overallStatus)}`}>
              <Icon icon={Monitor} className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-ds-2">
                Performance Monitor
                <div
                  className={`h-2 w-2 rounded-ds-full ${isMonitoring ? "bg-semantic-success animate-pulse" : "bg-neutral-400"}`}
                />
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">System performance and health metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-ds-2">
            <Badge variant="outline" className={getStatusColor(overallStatus)}>
              {getStatusIcon(overallStatus)}
              <span className="ml-1 capitalize">{overallStatus}</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsMonitoring(!isMonitoring)}>
              {isMonitoring ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="space-y-3">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="5m">5 Minutes</TabsTrigger>
            <TabsTrigger value="1h">1 Hour</TabsTrigger>
            <TabsTrigger value="6h">6 Hours</TabsTrigger>
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
          </TabsList>

          <TabsContent value={timeRange} className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {Object.entries(metrics).map(([key, metric]) => (
                  <MetricCard key={key} metric={metric} chartData={chartData[key] || []} />
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button variant="outline" size="sm" className="justify-start" leftIcon={<Icon icon={BarChart3} className="h-4 w-4" />}>
                Performance Metrics
              </Button>
              <Button variant="outline" size="sm" className="justify-start" leftIcon={<Icon icon={Globe} className="h-4 w-4" />}>
                Network Status
              </Button>
              <Button variant="outline" size="sm" className="justify-start" leftIcon={<Icon icon={WifiHigh} className="h-4 w-4" />}>
                Connection Health
              </Button>
              <Button variant="outline" size="sm" className="justify-start" leftIcon={<Icon icon={Zap} className="h-4 w-4" />}>
                System Resources
              </Button>
            </div>

            {/* Status Summary */}
            <div className="rounded-ds-lg bg-muted/30 spacing-3">
              <h3 className="mb-2 font-medium">Performance Summary</h3>
              <p className="text-sm text-muted-foreground">
                System is running with <span className="font-medium capitalize">{overallStatus}</span> performance.
                {overallStatus === "critical" && " Immediate attention required."}
                {overallStatus === "warning" && " Monitor closely for potential issues."}
                {overallStatus === "good" && " Performance is within acceptable ranges."}
                {overallStatus === "excellent" && " All systems operating optimally."}
              </p>

              {(overallStatus === "warning" || overallStatus === "critical") && (
                <div className="mt-3 flex gap-ds-2">
                  <Button size="sm" variant="primary">
                    View Recommendations
                  </Button>
                  <Button size="sm" variant="outline">
                    Export Report
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
