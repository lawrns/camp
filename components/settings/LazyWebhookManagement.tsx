/**
 * Lazy Webhook Management Component
 *
 * Bundle size optimization: Lazy loads the heavy WebhookManagement component
 * Reduces initial bundle size by ~36KB
 */

"use client";

import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Spinner } from "lucide-react";

// Lazy load the heavy WebhookManagement component
const WebhookManagement = lazy(() => import("./WebhookManagement"));

// Loading fallback component
const WebhookManagementSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-ds-2">
          <Spinner className="h-5 w-5 animate-spin" />
          Loading Webhook Management...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-spacing-md">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-ds-lg border spacing-3">
              <div className="flex-1 space-y-spacing-sm">
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="bg-background h-3 w-2/3 animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Error fallback component
const WebhookManagementError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-red-600">Failed to Load Webhook Management</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-foreground mb-4">There was an error loading the webhook management interface.</p>
      <button
        onClick={retry}
        className="bg-primary rounded px-4 py-2 text-white transition-colors hover:bg-blue-700"
      >
        Try Again
      </button>
    </CardContent>
  </Card>
);

// Error boundary for lazy loading
class WebhookManagementErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: unknown) {
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
export const LazyWebhookManagement: React.FC = () => {
  return (
    <WebhookManagementErrorBoundary fallback={WebhookManagementError}>
      <Suspense fallback={<WebhookManagementSkeleton />}>
        <WebhookManagement />
      </Suspense>
    </WebhookManagementErrorBoundary>
  );
};

export default LazyWebhookManagement;
