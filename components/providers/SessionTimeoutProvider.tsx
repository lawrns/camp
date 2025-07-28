/**
 * Session Timeout Provider
 *
 * Global provider for session timeout management with configurable
 * warning displays and automatic session extension
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSessionTimeout, SessionTimeoutConfig } from "@/hooks/useSessionTimeout";
import { SessionTimeoutWarning, SessionTimeoutIndicator } from "@/components/auth/SessionTimeoutWarning";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface SessionTimeoutContextType {
  showWarning: boolean;
  timeRemaining: number;
  isExpired: boolean;
  refreshSession: () => Promise<boolean>;
  updateActivity: () => void;
  formatTimeRemaining: (ms: number) => string;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  config?: Partial<SessionTimeoutConfig>;
  warningVariant?: "modal" | "banner" | "toast" | "sidebar";
  showIndicator?: boolean;
  enableToasts?: boolean;
  criticalPaths?: string[]; // Paths where session should auto-extend
}

export function SessionTimeoutProvider({
  children,
  config = {},
  warningVariant = "toast",
  showIndicator = true,
  enableToasts = true,
  criticalPaths = ["/dashboard/inbox", "/dashboard/tickets"],
}: SessionTimeoutProviderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownCriticalWarning, setHasShownCriticalWarning] = useState(false);

  // Configure session timeout based on user role and environment
  const getSessionConfig = (): Partial<SessionTimeoutConfig> => {
    const baseConfig = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours default
      warningTime: 5 * 60 * 1000, // 5 minutes warning
      refreshThreshold: 2 * 60 * 1000, // 2 minutes auto-refresh
      checkInterval: 30 * 1000, // 30 seconds check
      autoRefresh: true,
      showWarnings: true,
      ...config,
    };

    // Adjust based on user role
    if (user?.role === "admin") {
      baseConfig.sessionDuration = 8 * 60 * 60 * 1000; // 8 hours for admins
      baseConfig.warningTime = 10 * 60 * 1000; // 10 minutes warning
    } else if (user?.role === "agent") {
      baseConfig.sessionDuration = 12 * 60 * 60 * 1000; // 12 hours for agents
      baseConfig.warningTime = 5 * 60 * 1000; // 5 minutes warning
    }

    // Auto-extend on critical paths
    if (criticalPaths.includes(pathname)) {
      baseConfig.autoRefresh = true;
      baseConfig.refreshThreshold = 5 * 60 * 1000; // 5 minutes for critical paths
    }

    return baseConfig;
  };

  const sessionTimeout = useSessionTimeout({
    ...getSessionConfig(),
    onWarning: (timeRemaining) => {
      const minutes = Math.floor(timeRemaining / (1000 * 60));

      if (enableToasts && !hasShownWarning) {
        setHasShownWarning(true);
        toast.warning(`Session expires in ${minutes} minutes`, {
          description: "Click to extend your session",
          action: {
            label: "Extend",
            onClick: () => sessionTimeout.refreshSession(),
          },
          duration: 10000,
        });
      }

      // Show critical warning at 1 minute
      if (minutes <= 1 && !hasShownCriticalWarning) {
        setHasShownCriticalWarning(true);
        if (enableToasts) {
          toast.error("Session expiring in 1 minute!", {
            description: "Please extend your session immediately",
            action: {
              label: "Extend Now",
              onClick: () => sessionTimeout.refreshSession(),
            },
            duration: 60000, // Show for 1 minute
          });
        }
      }
    },
    onExpired: () => {
      if (enableToasts) {
        toast.error("Session expired", {
          description: "You have been logged out for security",
          duration: 5000,
        });
      }
    },
    onRefreshed: () => {
      setHasShownWarning(false);
      setHasShownCriticalWarning(false);
      if (enableToasts) {
        toast.success("Session extended successfully", {
          duration: 3000,
        });
      }
    },
  });

  // Reset warning flags when warning disappears
  useEffect(() => {
    if (!sessionTimeout.showWarning) {
      setHasShownWarning(false);
      setHasShownCriticalWarning(false);
    }
  }, [sessionTimeout.showWarning]);

  // Auto-extend session on critical paths
  useEffect(() => {
    if (criticalPaths.includes(pathname) && sessionTimeout.showWarning) {
      sessionTimeout.refreshSession();
    }
  }, [pathname, sessionTimeout.showWarning, criticalPaths, sessionTimeout]);

  const contextValue: SessionTimeoutContextType = {
    showWarning: sessionTimeout.showWarning,
    timeRemaining: sessionTimeout.timeRemaining,
    isExpired: sessionTimeout.isExpired,
    refreshSession: sessionTimeout.refreshSession,
    updateActivity: sessionTimeout.updateActivity,
    formatTimeRemaining: sessionTimeout.formatTimeRemaining,
  };

  return (
    <SessionTimeoutContext.Provider value={contextValue}>
      {children}

      {/* Session timeout warning */}
      {user && (
        <SessionTimeoutWarning
          variant={warningVariant}
          showProgress={true}
          showActions={true}
          autoHide={false}
          onExtend={() => {
            setHasShownWarning(false);
            setHasShownCriticalWarning(false);
          }}
        />
      )}

      {/* Session timeout indicator */}
      {user && showIndicator && (
        <div className="fixed bottom-4 left-4 z-40">
          <SessionTimeoutIndicator />
        </div>
      )}
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeoutContext() {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error("useSessionTimeoutContext must be used within SessionTimeoutProvider");
  }
  return context;
}

// Higher-order component for pages that need session extension
export function withSessionExtension<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    autoExtend?: boolean;
    showWarning?: boolean;
    criticalOperation?: boolean;
  } = {}
) {
  const { autoExtend = false, showWarning = true, criticalOperation = false } = options;

  return function SessionExtendedComponent(props: P) {
    const { refreshSession, updateActivity, showWarning: sessionWarning } = useSessionTimeoutContext();

    useEffect(() => {
      // Auto-extend session for critical operations
      if (criticalOperation && sessionWarning) {
        refreshSession();
      }
    }, [sessionWarning, refreshSession, criticalOperation]);

    useEffect(() => {
      // Update activity when component mounts
      updateActivity();

      // Set up auto-extend if enabled
      if (autoExtend) {
        const interval = setInterval(() => {
          updateActivity();
        }, 60000); // Update every minute

        return () => clearInterval(interval);
      }
    }, [updateActivity, autoExtend]);

    return (
      <div>
        {showWarning && criticalOperation && (
          <div className="mb-4 rounded-ds-lg border border-[var(--fl-color-border-interactive)] bg-blue-50 spacing-3">
            <div className="flex items-center space-x-spacing-sm text-blue-800">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-ds-full"></div>
              <span className="text-sm font-medium">Session auto-extending for critical operation</span>
            </div>
          </div>
        )}
        <Component {...props} />
      </div>
    );
  };
}

// Hook for manual session management
export function useSessionManager() {
  const context = useSessionTimeoutContext();
  const [isExtending, setIsExtending] = useState(false);

  const extendSession = async () => {
    setIsExtending(true);
    try {
      const success = await context.refreshSession();
      return success;
    } finally {
      setIsExtending(false);
    }
  };

  const extendOnAction = async <T,>(action: () => Promise<T> | T): Promise<T> => {
    context.updateActivity();
    try {
      const result = await action();
      context.updateActivity(); // Update again after successful action
      return result;
    } catch (error) {
      // Don't update activity on failed actions
      throw error;
    }
  };

  return {
    ...context,
    isExtending,
    extendSession,
    extendOnAction,
  };
}

// Component for displaying session status in navigation
export function SessionStatus({ className }: { className?: string }) {
  const { showWarning, timeRemaining, formatTimeRemaining } = useSessionTimeoutContext();

  if (!showWarning) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const isUrgent = minutes <= 2;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`h-2 w-2 rounded-ds-full ${isUrgent ? "animate-pulse bg-red-500" : "bg-yellow-500"}`} />
      <span className={`font-mono text-sm ${isUrgent ? "text-red-600" : "text-yellow-600"}`}>
        {formatTimeRemaining(timeRemaining)}
      </span>
    </div>
  );
}

// Component for critical operation protection
export function CriticalOperationGuard({
  children,
  message = "This operation requires an active session",
}: {
  children: React.ReactNode;
  message?: string;
}) {
  const { showWarning, refreshSession } = useSessionTimeoutContext();
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (showWarning && !isProtected) {
      setIsProtected(true);
      refreshSession().then(() => {
        setIsProtected(false);
      });
    }
  }, [showWarning, refreshSession, isProtected]);

  if (isProtected) {
    return (
      <div className="rounded-ds-lg border border-[var(--fl-color-warning-muted)] bg-yellow-50 spacing-3">
        <div className="flex items-center space-x-spacing-sm text-yellow-800">
          <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-yellow-600 border-t-transparent"></div>
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
