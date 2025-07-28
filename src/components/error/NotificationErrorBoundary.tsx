"use client";

import React from "react";
import { Warning as AlertTriangle, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { NotificationErrorBoundary as UnifiedNotificationErrorBoundary } from "./ErrorBoundaryProvider";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((context: { error: Error; resetError: () => void }) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * @deprecated Use NotificationErrorBoundary from ErrorBoundaryProvider instead
 */
export class NotificationErrorBoundary extends React.Component<Props, State> {
  override render() {
    const { children, fallback, onError } = this.props;

    return (
      <UnifiedNotificationErrorBoundary fallback={fallback} onError={onError} maxRetries={2}>
        {children}
      </UnifiedNotificationErrorBoundary>
    );
  }
}
