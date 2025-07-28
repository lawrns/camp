/**
 * Lazy Unified Inbox Dashboard Component
 *
 * Bundle size optimization: Lazy loads the heavy UnifiedInboxDashboard component
 * Reduces initial bundle size by ~32KB
 */

"use client";

import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Spinner, ChatCircle, Users, Clock } from "@phosphor-icons/react";

// Lazy load the heavy UnifiedInboxDashboard component
const UnifiedInboxDashboard = lazy(() => import("./UnifiedInboxDashboard"));

// Loading fallback component with inbox-specific skeleton
const InboxDashboardSkeleton = () => (
  <div className="bg-background flex h-screen">
    {/* Sidebar skeleton */}
    <div className="bg-background border-ds-border flex w-80 flex-col border-r">
      <div className="border-ds-border border-b spacing-3">
        <div className="mb-4 flex items-center gap-ds-2">
          <Spinner className="h-5 w-5 animate-spin text-blue-600" />
          <span className="font-semibold">Loading Inbox...</span>
        </div>
        <div className="h-10 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="flex-1 space-y-3 spacing-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-ds-lg border spacing-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-ds-full bg-gray-200" />
              <div className="flex-1 space-y-spacing-sm">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="bg-background h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="flex flex-1 flex-col">
      {/* Header skeleton */}
      <div className="bg-background border-ds-border flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-ds-full bg-gray-200" />
          <div className="space-y-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="bg-background h-3 w-20 animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 space-y-3 p-spacing-md">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-xs animate-pulse rounded-ds-lg spacing-3 ${i % 2 === 0 ? "bg-gray-200" : "bg-blue-200"}`}>
              <div className="bg-background/50 mb-2 h-4 w-full rounded" />
              <div className="bg-background/50 h-4 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Input area skeleton */}
      <div className="bg-background border-ds-border h-20 border-t spacing-3">
        <div className="h-12 animate-pulse rounded-ds-lg bg-gray-200" />
      </div>
    </div>

    {/* Right sidebar skeleton */}
    <div className="bg-background border-ds-border w-80 space-y-3 border-l spacing-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Users className="h-4 w-4" />
            Customer Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-spacing-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-gray-200" />
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

// Error fallback component
const InboxDashboardError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="bg-background flex h-screen items-center justify-center">
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2 text-red-600">
          <ChatCircle className="h-5 w-5" />
          Failed to Load Inbox
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground mb-4">
          There was an error loading the inbox dashboard. This might be due to a network issue or a temporary problem.
        </p>
        <div className="flex gap-ds-2">
          <button
            onClick={retry}
            className="bg-primary rounded px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-foreground rounded bg-gray-200 px-4 py-2 transition-colors hover:bg-gray-300"
          >
            Reload Page
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Error boundary for lazy loading
class InboxDashboardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {

  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} retry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

// Main lazy wrapper component
export const LazyUnifiedInboxDashboard: React.FC = () => {
  return (
    <InboxDashboardErrorBoundary fallback={InboxDashboardError}>
      <Suspense fallback={<InboxDashboardSkeleton />}>
        <UnifiedInboxDashboard />
      </Suspense>
    </InboxDashboardErrorBoundary>
  );
};

export default LazyUnifiedInboxDashboard;
