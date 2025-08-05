import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning as AlertCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/ui/Icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MessagePanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry or other error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="flex h-full flex-col items-center justify-center p-spacing-lg">
          <Icon icon={AlertCircle} className="text-brand-mahogany-500 mb-4 h-12 w-12" />
          <h3 className="mb-2 text-base font-semibold">Something went wrong</h3>
          <p className="text-foreground mb-4 max-w-md text-center">
            We encountered an error while loading the message panel. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button onClick={this.handleReset}>Try Again</Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 max-w-2xl rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 overflow-auto text-tiny">{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
