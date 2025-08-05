"use client";

import React from "react";
import { AlertTriangle as AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/ui/Icon";
import { UnifiedErrorBoundary } from "./UnifiedErrorBoundary";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((context: { error: Error; resetError: () => void }) => React.ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * @deprecated Use UnifiedErrorBoundary instead
 */
export class SimplifiedErrorBoundary extends React.Component<Props, State> {
  override render() {
    const { children, fallback } = this.props;

    return (
      <UnifiedErrorBoundary fallback={fallback} domain="default" maxRetries={3}>
        {children}
      </UnifiedErrorBoundary>
    );
  }
}

// Export a simple hook for error handling
export function useErrorHandler() {
  return (error: Error) => {
    if (process.env.NODE_ENV === "development") {
    }
    // In production, could send to error tracking service
  };
}
