import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PhoenixErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {}

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="phoenix-error">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || "An unexpected error occurred"}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="phoenix-button">
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for convenience
export function withPhoenixErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallback?: ReactNode) {
  return (props: P) => (
    <PhoenixErrorBoundary fallback={fallback}>
      <Component {...props} />
    </PhoenixErrorBoundary>
  );
}

// Compatibility exports
export { PhoenixErrorBoundary as UnifiedErrorBoundary };
export { withPhoenixErrorBoundary as withUnifiedErrorBoundary };
