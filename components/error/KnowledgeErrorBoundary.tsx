"use client";

import React from "react";
import { AlertTriangle as AlertTriangle, BookOpen, RefreshCw as RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { KnowledgeErrorBoundary as UnifiedKnowledgeErrorBoundary } from "./ErrorBoundaryProvider";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((context: { error: Error; resetError: () => void }) => React.ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * @deprecated Use KnowledgeErrorBoundary from ErrorBoundaryProvider instead
 */
export class KnowledgeErrorBoundary extends React.Component<Props, State> {
  override render() {
    const { children, fallback } = this.props;

    return (
      <UnifiedKnowledgeErrorBoundary fallback={fallback} maxRetries={3}>
        {children}
      </UnifiedKnowledgeErrorBoundary>
    );
  }
}
