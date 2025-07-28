/**
 * Loading Provider
 *
 * Global loading state management with context and
 * centralized loading indicators
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { LoadingOverlay, LoadingCard } from "@/components/ui/loading";
import { useLoadingState, LoadingState } from "@/hooks/useLoadingState";

interface LoadingOperation {
  id: string;
  stage: string;
  progress: number;
  startTime: number;
  priority: "low" | "medium" | "high" | "critical";
}

interface LoadingContextType {
  // Global loading state
  isLoading: boolean;
  operations: LoadingOperation[];

  // Operation management
  startOperation: (id: string, stage: string, priority?: LoadingOperation["priority"]) => void;
  updateOperation: (id: string, stage?: string, progress?: number) => void;
  completeOperation: (id: string) => void;

  // Bulk operations
  startBulkOperation: (
    operations: Array<{ id: string; stage: string; priority?: LoadingOperation["priority"] }>
  ) => void;
  completeBulkOperation: (operationIds: string[]) => void;

  // Utility
  getOperation: (id: string) => LoadingOperation | undefined;
  getHighestPriorityOperation: () => LoadingOperation | undefined;
  clearAllOperations: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

interface LoadingProviderProps {
  children: React.ReactNode;
  showGlobalOverlay?: boolean;
  overlayThreshold?: number; // Number of operations before showing overlay
  maxDisplayedOperations?: number;
}

export function LoadingProvider({
  children,
  showGlobalOverlay = true,
  overlayThreshold = 1,
  maxDisplayedOperations = 3,
}: LoadingProviderProps) {
  const [operations, setOperations] = useState<LoadingOperation[]>([]);
  const operationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startOperation = useCallback((id: string, stage: string, priority: LoadingOperation["priority"] = "medium") => {
    const newOperation: LoadingOperation = {
      id,
      stage,
      progress: 0,
      startTime: Date.now(),
      priority,
    };

    setOperations((prev) => {
      // Remove existing operation with same ID
      const filtered = prev.filter((op) => op.id !== id);
      return [...filtered, newOperation];
    });

    // Set up auto-cleanup after 30 seconds
    const timer = setTimeout(() => {
      completeOperation(id);
    }, 30000);

    operationTimers.current.set(id, timer);
  }, []);

  const updateOperation = useCallback((id: string, stage?: string, progress?: number) => {
    setOperations((prev) =>
      prev.map((op) =>
        op.id === id
          ? {
              ...op,
              stage: stage || op.stage,
              progress: progress !== undefined ? Math.max(0, Math.min(100, progress)) : op.progress,
            }
          : op
      )
    );
  }, []);

  const completeOperation = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));

    // Clear timer
    const timer = operationTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      operationTimers.current.delete(id);
    }
  }, []);

  const startBulkOperation = useCallback(
    (operationsToStart: Array<{ id: string; stage: string; priority?: LoadingOperation["priority"] }>) => {
      const newOperations: LoadingOperation[] = operationsToStart.map((op) => ({
        id: op.id,
        stage: op.stage,
        progress: 0,
        startTime: Date.now(),
        priority: op.priority || "medium",
      }));

      setOperations((prev) => {
        // Remove existing operations with same IDs
        const existingIds = new Set(newOperations.map((op) => op.id));
        const filtered = prev.filter((op) => !existingIds.has(op.id));
        return [...filtered, ...newOperations];
      });

      // Set up auto-cleanup timers
      newOperations.forEach((op) => {
        const timer = setTimeout(() => {
          completeOperation(op.id);
        }, 30000);
        operationTimers.current.set(op.id, timer);
      });
    },
    [completeOperation]
  );

  const completeBulkOperation = useCallback((operationIds: string[]) => {
    setOperations((prev) => prev.filter((op) => !operationIds.includes(op.id)));

    // Clear timers
    operationIds.forEach((id) => {
      const timer = operationTimers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        operationTimers.current.delete(id);
      }
    });
  }, []);

  const getOperation = useCallback(
    (id: string) => {
      return operations.find((op) => op.id === id);
    },
    [operations]
  );

  const getHighestPriorityOperation = useCallback(() => {
    if (operations.length === 0) return undefined;

    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return operations.reduce((highest, current) => {
      if (!highest) return current;
      return priorityOrder[current.priority] > priorityOrder[highest.priority] ? current : highest;
    });
  }, [operations]);

  const clearAllOperations = useCallback(() => {
    setOperations([]);

    // Clear all timers
    operationTimers.current.forEach((timer) => clearTimeout(timer));
    operationTimers.current.clear();
  }, []);

  const isLoading = operations.length > 0;
  const shouldShowOverlay = showGlobalOverlay && operations.length >= overlayThreshold;
  const displayedOperations = operations
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxDisplayedOperations);

  const contextValue: LoadingContextType = {
    isLoading,
    operations,
    startOperation,
    updateOperation,
    completeOperation,
    startBulkOperation,
    completeBulkOperation,
    getOperation,
    getHighestPriorityOperation,
    clearAllOperations,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      <div className="relative">
        {children}

        {/* Global Loading Overlay */}
        {shouldShowOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md space-y-3">
              {displayedOperations.map((operation) => (
                <LoadingCard
                  key={operation.id}
                  title={operation.stage}
                  progress={operation.progress}
                  duration={Date.now() - operation.startTime}
                  className="bg-background shadow-card-deep"
                />
              ))}

              {operations.length > maxDisplayedOperations && (
                <div className="text-foreground bg-background/90 rounded-ds-lg p-spacing-sm text-center text-sm">
                  +{operations.length - maxDisplayedOperations} more operations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Loading Indicator */}
        {isLoading && !shouldShowOverlay && (
          <div className="fixed bottom-4 right-4 z-40">
            <div className="max-w-sm space-y-spacing-sm">
              {displayedOperations.map((operation) => (
                <div
                  key={operation.id}
                  className="bg-background border-ds-border rounded-ds-lg border spacing-3 shadow-card-deep"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary h-2 w-2 animate-pulse rounded-ds-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{operation.stage}</p>
                      {operation.progress > 0 && (
                        <div className="mt-1">
                          <div className="h-1 w-full rounded-ds-full bg-gray-200">
                            <div
                              className="bg-primary h-1 rounded-ds-full transition-all duration-300"
                              style={{ width: `${operation.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}

// Higher-order component for automatic loading management
export function withLoading<P extends object>(Component: React.ComponentType<P>, operationId?: string) {
  return function LoadingWrappedComponent(props: P) {
    const { startOperation, completeOperation } = useLoading();
    const id = operationId || Component.displayName || Component.name || "component";

    React.useEffect(() => {
      startOperation(id, `Loading ${id}...`);
      return () => {
        completeOperation(id);
      };
    }, [id, startOperation, completeOperation]);

    return <Component {...props} />;
  };
}

// Hook for component-specific loading states
export function useComponentLoading(componentName: string) {
  const { startOperation, updateOperation, completeOperation, getOperation } = useLoading();

  const start = useCallback(
    (stage?: string) => {
      startOperation(componentName, stage || `Loading ${componentName}...`);
    },
    [componentName, startOperation]
  );

  const update = useCallback(
    (stage?: string, progress?: number) => {
      updateOperation(componentName, stage, progress);
    },
    [componentName, updateOperation]
  );

  const complete = useCallback(() => {
    completeOperation(componentName);
  }, [componentName, completeOperation]);

  const operation = getOperation(componentName);

  return {
    isLoading: !!operation,
    operation,
    start,
    update,
    complete,
  };
}

// Hook for API call loading states
export function useApiLoading() {
  const { startOperation, updateOperation, completeOperation } = useLoading();

  const wrapApiCall = useCallback(
    async <T,>(apiCall: () => Promise<T>, operationId: string, stage: string = "Loading..."): Promise<T> => {
      try {
        startOperation(operationId, stage);
        const result = await apiCall();
        completeOperation(operationId);
        return result;
      } catch (error) {
        completeOperation(operationId);
        throw error;
      }
    },
    [startOperation, updateOperation, completeOperation]
  );

  return { wrapApiCall };
}
