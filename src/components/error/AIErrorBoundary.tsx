"use client";

import React from "react";
import { AlertTriangle, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { ErrorBoundary } from "./ErrorBoundary";
import { AIErrorBoundary as UnifiedAIErrorBoundary } from "./ErrorBoundaryProvider";

interface AIErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function AIErrorFallback({ error, onRetry }: AIErrorFallbackProps) {
  return (
    <div className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-ds-lg border border-orange-200 bg-orange-50 spacing-3 text-center">
      <div className="mb-3 flex items-center gap-ds-2">
        <Icon icon={Bot} className="h-6 w-6 text-orange-600" />
        <Icon icon={AlertTriangle} className="text-semantic-warning h-5 w-5" />
      </div>

      <h4 className="mb-2 text-base font-medium text-orange-900">AI Service Temporarily Unavailable</h4>

      <p className="mb-4 max-w-sm text-sm text-orange-700">
        We're experiencing issues with our AI service. Please try again in a moment.
      </p>

      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="border-orange-300 text-orange-700 hover:bg-orange-100"
      >
        <Icon icon={RefreshCw} className="mr-2 h-4 w-4" />
        Retry AI Request
      </Button>
    </div>
  );
}

interface AIErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * @deprecated Use AIErrorBoundary from ErrorBoundaryProvider instead
 */
export function AIErrorBoundary({ children, onError }: AIErrorBoundaryProps) {
  return (
    <UnifiedAIErrorBoundary
      onError={onError}
      fallback={<AIErrorFallback error={null} onRetry={() => window.location.reload()} />}
    >
      {children}
    </UnifiedAIErrorBoundary>
  );
}
