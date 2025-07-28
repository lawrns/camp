import React, { createContext, ReactNode, useCallback, useContext } from "react";
import {
  ErrorContext,
  ErrorDomain,
  ErrorHandler,
  ErrorSeverity,
  UnifiedErrorBoundary,
  UnifiedErrorBoundaryProps,
} from "./UnifiedErrorBoundary";

// Global error handler registry
interface ErrorHandlerRegistry {
  handlers: Map<ErrorDomain, ErrorHandler[]>;
  defaultHandler?: ErrorHandler;
}

// Error boundary provider context
interface ErrorBoundaryContextValue {
  registerErrorHandler: (domain: ErrorDomain, handler: ErrorHandler) => () => void;
  unregisterErrorHandler: (domain: ErrorDomain, handler: ErrorHandler) => void;
  setDefaultErrorHandler: (handler: ErrorHandler) => void;
  triggerError: (error: Error, domain?: ErrorDomain, severity?: ErrorSeverity) => void;
  getErrorHandlers: (domain: ErrorDomain) => ErrorHandler[];
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

// Provider props
interface ErrorBoundaryProviderProps {
  children: ReactNode;
  defaultDomain?: ErrorDomain;
  defaultSeverity?: ErrorSeverity;
  globalErrorHandler?: ErrorHandler;
  enableGlobalErrorCatching?: boolean;
  errorBoundaryProps?: Omit<UnifiedErrorBoundaryProps, "children">;
}

export function ErrorBoundaryProvider({
  children,
  defaultDomain = "default",
  defaultSeverity = "medium",
  globalErrorHandler,
  enableGlobalErrorCatching = true,
  errorBoundaryProps = {},
}: ErrorBoundaryProviderProps) {
  const [registry] = React.useState<ErrorHandlerRegistry>(
    () =>
      ({
        handlers: new Map<ErrorDomain, ErrorHandler[]>(),
        defaultHandler: globalErrorHandler,
      }) as ErrorHandlerRegistry
  );

  // Register a domain-specific error handler
  const registerErrorHandler = useCallback(
    (domain: ErrorDomain, handler: ErrorHandler) => {
      const handlers = registry.handlers.get(domain) || [];
      handlers.push(handler);
      registry.handlers.set(domain, handlers);

      // Return unregister function
      return () => {
        unregisterErrorHandler(domain, handler);
      };
    },
    [registry]
  );

  // Unregister a domain-specific error handler
  const unregisterErrorHandler = useCallback(
    (domain: ErrorDomain, handler: ErrorHandler) => {
      const handlers = registry.handlers.get(domain);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
          if (handlers.length === 0) {
            registry.handlers.delete(domain);
          } else {
            registry.handlers.set(domain, handlers);
          }
        }
      }
    },
    [registry]
  );

  // Set the default error handler
  const setDefaultErrorHandler = useCallback(
    (handler: ErrorHandler) => {
      registry.defaultHandler = handler;
    },
    [registry]
  );

  // Get all handlers for a domain
  const getErrorHandlers = useCallback(
    (domain: ErrorDomain): ErrorHandler[] => {
      const domainHandlers = registry.handlers.get(domain) || [];
      const handlers = [...domainHandlers];

      if (registry.defaultHandler) {
        handlers.push(registry.defaultHandler);
      }

      return handlers;
    },
    [registry]
  );

  // Trigger an error programmatically
  const triggerError = useCallback(
    (error: Error, domain: ErrorDomain = defaultDomain, severity: ErrorSeverity = defaultSeverity) => {
      // This will be caught by the nearest error boundary
      throw error;
    },
    [defaultDomain, defaultSeverity]
  );

  // Global error handler for all domains
  const unifiedErrorHandler: ErrorHandler = useCallback(
    async (error: any, errorInfo: any, context: any) => {
      const handlers = getErrorHandlers(context.domain);

      // Execute all registered handlers for this domain
      for (const handler of handlers) {
        try {
          await handler(error, errorInfo, context);
        } catch (handlerError) {}
      }
    },
    [getErrorHandlers]
  );

  // Custom error handlers by domain
  const customErrorHandlers = React.useMemo(() => {
    const handlers: Partial<Record<ErrorDomain, ErrorHandler>> = {};

    registry.handlers.forEach((_, domain) => {
      handlers[domain] = unifiedErrorHandler;
    });

    return handlers;
  }, [registry.handlers, unifiedErrorHandler]);

  // Setup global error catching
  React.useEffect(() => {
    if (!enableGlobalErrorCatching) return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || "Unhandled promise rejection");
      error.stack = event.reason?.stack || error.stack;

      // Find the nearest error boundary context to determine domain
      const context: ErrorContext = {
        error,
        errorInfo: { componentStack: "" },
        resetError: () => {},
        domain: defaultDomain,
        severity: defaultSeverity,
        retryCount: 0,
        errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Execute global handlers
      if (registry.defaultHandler) {
        registry.defaultHandler(error, {} as any, context);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const context: ErrorContext = {
        error: event.error || new Error(event.message),
        errorInfo: { componentStack: "" },
        resetError: () => {},
        domain: defaultDomain,
        severity: defaultSeverity,
        retryCount: 0,
        errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Execute global handlers
      if (registry.defaultHandler) {
        registry.defaultHandler(event.error || new Error(event.message), {} as any, context);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleGlobalError);
    };
  }, [enableGlobalErrorCatching, defaultDomain, registry.defaultHandler]);

  const contextValue: ErrorBoundaryContextValue = {
    registerErrorHandler,
    unregisterErrorHandler,
    setDefaultErrorHandler,
    triggerError,
    getErrorHandlers,
  };

  return (
    <ErrorBoundaryContext.Provider value={contextValue}>
      <UnifiedErrorBoundary
        domain={defaultDomain}
        severity={defaultSeverity}
        onError={unifiedErrorHandler}
        customErrorHandlers={customErrorHandlers}
        {...errorBoundaryProps}
      >
        {children}
      </UnifiedErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
}

// Hook for using error boundary context
export function useErrorBoundaryContext() {
  const context = useContext(ErrorBoundaryContext);

  if (!context) {
    throw new Error("useErrorBoundaryContext must be used within ErrorBoundaryProvider");
  }

  return context;
}

// Domain-specific error boundary components for convenience
export function AIErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="ai" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function SupabaseErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="supabase" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function KnowledgeErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="knowledge" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function DashboardErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="dashboard" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function CriticalErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="critical" severity="critical" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function NotificationErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="notification" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}

export function AuthErrorBoundary({ children, ...props }: Omit<UnifiedErrorBoundaryProps, "domain">) {
  return (
    <UnifiedErrorBoundary domain="auth" {...props}>
      {children}
    </UnifiedErrorBoundary>
  );
}
