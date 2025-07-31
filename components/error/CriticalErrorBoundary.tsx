"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Warning as AlertCircle,
  Warning as AlertTriangle,
  Bug,
  House as Home,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { CriticalErrorBoundary as UnifiedCriticalErrorBoundary } from "./ErrorBoundaryProvider";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  level: "critical" | "component" | "section";
  context?: string | undefined;
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * @deprecated Use CriticalErrorBoundary from ErrorBoundaryProvider instead
 */
export class CriticalErrorBoundary extends Component<Props, State> {
  override render() {
    const { children, fallback, onError } = this.props;

    return (
      <UnifiedCriticalErrorBoundary
        fallback={
          fallback || (
            <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-destructive-subtle)] spacing-3">
              <div className="bg-background max-w-md rounded-ds-lg p-spacing-lg shadow-xl">
                <div className="mb-4 flex justify-center">
                  <Icon icon={AlertCircle} className="h-16 w-16 text-red-600" />
                </div>
                <h1 className="mb-2 heading-center text-3xl font-bold text-red-900">Critical System Error</h1>
                <p className="text-foreground mb-6 text-center">
                  The application has encountered a critical error and cannot continue.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full rounded-ds-md bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <Icon icon={RefreshCw} className="mr-2 inline h-4 w-4" />
                    Reload Application
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="border-ds-border-strong bg-background text-foreground w-full rounded-ds-md border px-4 py-3 font-medium transition-colors hover:bg-[var(--color-background-subtle)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <Icon icon={Home} className="mr-2 inline h-4 w-4" />
                    Go to Home
                  </button>
                </div>
              </div>
            </div>
          )
        }
        onError={onError}
        maxRetries={1}
        severity="critical"
      >
        {children}
      </UnifiedCriticalErrorBoundary>
    );
  }
}

// Convenience wrapper components
export const CriticalBoundary: React.FC<{ children: ReactNode; context?: string | undefined }> = ({
  children,
  context,
}) => (
  <CriticalErrorBoundary level="critical" context={context}>
    {children}
  </CriticalErrorBoundary>
);

export const ComponentBoundary: React.FC<{ children: ReactNode; context?: string | undefined }> = ({
  children,
  context,
}) => (
  <CriticalErrorBoundary level="component" context={context}>
    {children}
  </CriticalErrorBoundary>
);

export const SectionBoundary: React.FC<{ children: ReactNode; context?: string | undefined }> = ({
  children,
  context,
}) => (
  <CriticalErrorBoundary level="section" context={context}>
    {children}
  </CriticalErrorBoundary>
);
