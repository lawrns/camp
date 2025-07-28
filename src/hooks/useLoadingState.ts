/**
 * Loading State Management Hook
 *
 * Comprehensive loading state management with progress tracking,
 * error handling, and optimistic updates
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error: Error | null;
  startTime: number | null;
  duration: number;
}

export interface LoadingOptions {
  initialStage?: string;
  timeout?: number;
  onStart?: () => void;
  onProgress?: (progress: number, stage: string) => void;
  onComplete?: (duration: number) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

export function useLoadingState(options: LoadingOptions = {}) {
  const {
    initialStage = "Loading...",
    timeout = 30000, // 30 seconds default timeout
    onStart,
    onProgress,
    onComplete,
    onError,
    onTimeout,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: initialStage,
    error: null,
    startTime: null,
    duration: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Start loading
  const startLoading = useCallback(
    (stage: string = initialStage) => {
      const startTime = Date.now();

      setState({
        isLoading: true,
        progress: 0,
        stage,
        error: null,
        startTime,
        duration: 0,
      });

      // Set up timeout
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          const timeoutError = new Error(`Operation timed out after ${timeout}ms`);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: timeoutError,
            duration: Date.now() - startTime,
          }));
          onTimeout?.();
          onError?.(timeoutError);
        }, timeout);
      }

      // Set up duration tracking
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.startTime ? Date.now() - prev.startTime : 0,
        }));
      }, 100);

      onStart?.();
    },
    [initialStage, timeout, onStart, onTimeout, onError]
  );

  // Update progress
  const setProgress = useCallback(
    (progress: number, stage?: string) => {
      setState((prev) => ({
        ...prev,
        progress: Math.max(0, Math.min(100, progress)),
        stage: stage || prev.stage,
      }));

      onProgress?.(progress, stage || state.stage);
    },
    [onProgress, state.stage]
  );

  // Complete loading
  const completeLoading = useCallback(() => {
    const duration = state.startTime ? Date.now() - state.startTime : 0;

    setState((prev) => ({
      ...prev,
      isLoading: false,
      progress: 100,
      duration,
    }));

    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    onComplete?.(duration);
  }, [state.startTime, onComplete]);

  // Set error
  const setError = useCallback(
    (error: Error) => {
      const duration = state.startTime ? Date.now() - state.startTime : 0;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
        duration,
      }));

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      onError?.(error);
    },
    [state.startTime, onError]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      stage: initialStage,
      error: null,
      startTime: null,
      duration: 0,
    });

    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [initialStage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    setProgress,
    completeLoading,
    setError,
    reset,
  };
}

// Hook for async operations with automatic loading state
export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: LoadingOptions = {}
) {
  const loadingState = useLoadingState(options);
  const [data, setData] = useState<R | null>(null);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      try {
        loadingState.startLoading();
        const result = await operation(...args);
        setData(result);
        loadingState.completeLoading();
        return result;
      } catch (error) {
        loadingState.setError(error instanceof Error ? error : new Error("Unknown error"));
        return null;
      }
    },
    [operation, loadingState]
  );

  const retry = useCallback(() => {
    loadingState.reset();
    setData(null);
  }, [loadingState]);

  return {
    ...loadingState,
    data,
    execute,
    retry,
  };
}

// Hook for multi-stage operations
export function useMultiStageLoading(stages: string[], options: LoadingOptions = {}) {
  const loadingState = useLoadingState(options);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const nextStage = useCallback(() => {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < stages.length) {
      setCurrentStageIndex(nextIndex);
      const progress = ((nextIndex + 1) / stages.length) * 100;
      loadingState.setProgress(progress, stages[nextIndex]);
    } else {
      loadingState.completeLoading();
    }
  }, [currentStageIndex, stages, loadingState]);

  const goToStage = useCallback(
    (stageIndex: number) => {
      if (stageIndex >= 0 && stageIndex < stages.length) {
        setCurrentStageIndex(stageIndex);
        const progress = ((stageIndex + 1) / stages.length) * 100;
        loadingState.setProgress(progress, stages[stageIndex]);
      }
    },
    [stages, loadingState]
  );

  const start = useCallback(() => {
    setCurrentStageIndex(0);
    loadingState.startLoading(stages[0]);
  }, [stages, loadingState]);

  const reset = useCallback(() => {
    setCurrentStageIndex(0);
    loadingState.reset();
  }, [loadingState]);

  return {
    ...loadingState,
    currentStageIndex,
    currentStage: stages[currentStageIndex],
    totalStages: stages.length,
    nextStage,
    goToStage,
    start,
    reset,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T, optimisticUpdate: Partial<T>) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const loadingState = useLoadingState();

  const update = useCallback(
    async (optimisticUpdate: Partial<T>) => {
      // Apply optimistic update immediately
      const optimisticData = { ...data, ...optimisticUpdate };
      setData(optimisticData);
      setIsOptimistic(true);
      loadingState.startLoading("Saving...");

      try {
        // Perform actual update
        const result = await updateFn(data, optimisticUpdate);
        setData(result);
        setIsOptimistic(false);
        loadingState.completeLoading();
        return result;
      } catch (error) {
        // Revert optimistic update on error
        setData(data);
        setIsOptimistic(false);
        loadingState.setError(error instanceof Error ? error : new Error("Update failed"));
        throw error;
      }
    },
    [data, updateFn, loadingState]
  );

  const revert = useCallback(() => {
    setData(initialData);
    setIsOptimistic(false);
    loadingState.reset();
  }, [initialData, loadingState]);

  return {
    data,
    isOptimistic,
    update,
    revert,
    ...loadingState,
  };
}

// Hook for batch operations
export function useBatchLoading<T>(
  items: T[],
  processor: (item: T, index: number) => Promise<void>,
  options: LoadingOptions & { batchSize?: number; delayBetweenBatches?: number } = {}
) {
  const { batchSize = 5, delayBetweenBatches = 100, ...loadingOptions } = options;
  const loadingState = useLoadingState(loadingOptions);
  const [processedItems, setProcessedItems] = useState<T[]>([]);
  const [failedItems, setFailedItems] = useState<{ item: T; error: Error }[]>([]);

  const processBatch = useCallback(async () => {
    if (items.length === 0) return;

    loadingState.startLoading(`Processing ${items.length} items...`);
    setProcessedItems([]);
    setFailedItems([]);

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map((item, batchIndex) =>
          processor(item, i + batchIndex)
            .then(() => item)
            .catch((error) => ({ item, error }))
        );

        const batchResults = await Promise.all(batchPromises);

        // Separate successful and failed items
        const successful = batchResults.filter((result): result is T => !(result as any).error);
        const failed = batchResults.filter((result): result is { item: T; error: Error } => !!(result as any).error);

        setProcessedItems((prev) => [...prev, ...successful]);
        setFailedItems((prev) => [...prev, ...failed]);

        // Update progress
        const progress = ((i + batch.length) / items.length) * 100;
        loadingState.setProgress(progress, `Processed ${i + batch.length} of ${items.length} items`);

        // Delay between batches
        if (i + batchSize < items.length && delayBetweenBatches > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
        }
      }

      loadingState.completeLoading();
    } catch (error) {
      loadingState.setError(error instanceof Error ? error : new Error("Batch processing failed"));
    }
  }, [items, processor, batchSize, delayBetweenBatches, loadingState]);

  const retry = useCallback(() => {
    setProcessedItems([]);
    setFailedItems([]);
    loadingState.reset();
  }, [loadingState]);

  const retryFailed = useCallback(async () => {
    if (failedItems.length === 0) return;

    const failedItemsOnly = failedItems.map((f) => f.item);
    setFailedItems([]);

    // Process only failed items
    for (let i = 0; i < failedItemsOnly.length; i += batchSize) {
      const batch = failedItemsOnly.slice(i, i + batchSize);
      const batchPromises = batch.map((item, batchIndex) =>
        processor(item, i + batchIndex)
          .then(() => item)
          .catch((error) => ({ item, error }))
      );

      const batchResults = await Promise.all(batchPromises);

      const successful = batchResults.filter((result): result is T => !(result as any).error);
      const failed = batchResults.filter((result): result is { item: T; error: Error } => !!(result as any).error);

      setProcessedItems((prev) => [...prev, ...successful]);
      setFailedItems((prev) => [...prev, ...failed]);
    }
  }, [failedItems, processor, batchSize]);

  return {
    ...loadingState,
    processedItems,
    failedItems,
    successCount: processedItems.length,
    failureCount: failedItems.length,
    totalCount: items.length,
    processBatch,
    retry,
    retryFailed,
  };
}
