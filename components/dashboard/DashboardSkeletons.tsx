/**
 * Loading skeletons for dashboard components
 */

import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-64 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-[var(--fl-color-border)]">
        <div className="flex space-x-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-32 rounded-t bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className={i === 0 || i === 3 ? "lg:col-span-2" : ""}>
            <CardHeader>
              <div className="mb-2 h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="bg-background h-64 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ComprehensiveDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-10 w-10 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
              <div className="mb-2 h-8 w-24 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 h-5 w-48 rounded bg-gray-200" />
            <div className="h-4 w-64 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="bg-background h-80 rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="mb-2 h-5 w-48 rounded bg-gray-200" />
            <div className="h-4 w-64 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="bg-background h-80 rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <div className="mb-2 h-5 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-spacing-md">
                <div className="h-10 w-10 rounded-ds-full bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RAGAnalyticsDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header with export options */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </div>
        <div className="flex gap-ds-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded bg-gray-200" />
          ))}
        </div>
      </div>

      {/* RAG metrics grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="spacing-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-gray-200" />
                <div className="h-6 w-16 rounded bg-gray-200" />
              </div>
              <div className="mb-1 h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-5 w-48 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="bg-background h-64 rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-48 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="bg-background h-64 rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Query logs table */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-spacing-sm">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-spacing-md border-b py-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-48 flex-1 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RealtimeMetricsDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Real-time status bar */}
      <div className="bg-background rounded-ds-lg spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-spacing-md">
            <div className="h-3 w-3 rounded-ds-full bg-gray-300" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-spacing-md">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-10 w-10 rounded-ds-full bg-gray-200" />
                <div className="h-8 w-8 rounded bg-gray-200" />
              </div>
              <div className="mb-2 h-8 w-20 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="flex gap-ds-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-20 rounded bg-gray-200" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-background h-80 rounded" />
        </CardContent>
      </Card>

      {/* Activity feed */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="mt-1 h-8 w-8 rounded-ds-full bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UnifiedInboxDashboardSkeleton() {
  return (
    <div className="h-full animate-pulse">
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Conversations list */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="mb-2 h-5 w-32 rounded bg-gray-200" />
              <div className="flex gap-ds-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-20 rounded bg-gray-200" />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-ds-lg border spacing-3">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-ds-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                        <div className="mb-2 h-3 w-48 rounded bg-gray-200" />
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat view */}
        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-ds-full bg-gray-200" />
                  <div>
                    <div className="mb-1 h-5 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="flex gap-ds-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded bg-gray-200" />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* Messages */}
              <div className="mb-4 flex-1 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-xs ${i % 2 === 0 ? "bg-gray-100" : "bg-[var(--fl-color-info-subtle)]"} rounded-ds-lg spacing-3`}
                    >
                      <div className="mb-1 h-4 w-48 rounded bg-gray-200" />
                      <div className="h-4 w-32 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Input area */}
              <div className="bg-background h-24 rounded-ds-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AIInsightsDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* AI Insights header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </div>
        <div className="flex gap-ds-2">
          <div className="h-9 w-32 rounded bg-gray-200" />
          <div className="h-9 w-24 rounded bg-gray-200" />
        </div>
      </div>

      {/* AI metrics cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-spacing-md">
              <div className="mb-4 flex items-center space-x-3">
                <div className="h-12 w-12 rounded-ds-lg bg-gray-200" />
                <div>
                  <div className="mb-1 h-4 w-24 rounded bg-gray-200" />
                  <div className="h-6 w-16 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-2 w-full rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights and recommendations */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-5 w-32 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-ds-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="mb-1 h-4 w-full rounded bg-gray-200" />
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-5 w-40 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-ds-lg border spacing-3">
                  <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                  <div className="mb-1 h-3 w-full rounded bg-gray-200" />
                  <div className="h-3 w-3/4 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PerformanceMonitoringDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-spacing-sm">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-32 rounded bg-gray-200" />
          <div className="h-8 w-16 rounded bg-gray-200" />
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-8 w-16 rounded bg-gray-200" />
              <div className="h-2 w-full rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics Tabs */}
      <div className="space-y-3">
        <div className="h-10 w-full rounded bg-gray-200" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-spacing-sm">
                    <div className="h-5 w-5 rounded bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-4 rounded bg-gray-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-8 w-16 rounded bg-gray-200" />
                  <div className="h-6 w-20 rounded bg-gray-200" />
                </div>
                <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
                <div className="h-2 w-full rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="h-4 w-64 rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="bg-background h-96 rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
