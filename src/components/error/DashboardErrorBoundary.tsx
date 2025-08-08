"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button-unified";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Icon } from "@/lib/ui/Icon";
import { DashboardErrorBoundary as UnifiedDashboardErrorBoundary } from "./ErrorBoundaryProvider";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<any>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * @deprecated Use DashboardErrorBoundary from ErrorBoundaryProvider instead
 */
export class DashboardErrorBoundary extends React.Component<Props, State> {
  override render() {
    const { children, fallback, onError } = this.props;

    return (
      <UnifiedDashboardErrorBoundary
        fallback={fallback ? () => React.createElement(fallback as unknown) : undefined}
        onError={onError}
        maxRetries={2}
      >
        {children}
      </UnifiedDashboardErrorBoundary>
    );
  }
}
