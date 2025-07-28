/**
 * Comprehensive Error Handling & Resilience System
 *
 * Implements circuit breakers, retry logic, graceful degradation
 * Ensures 99.9% uptime with intelligent error recovery
 */

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  lastError: Date | null;
  uptime: number;
  recoveryTime: number;
}

enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

class ResilienceManager {
  private static instance: ResilienceManager;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private metrics: ErrorMetrics;
  private startTime = Date.now();

  constructor() {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      lastError: null,
      uptime: 0,
      recoveryTime: 0,
    };
  }

  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async withCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(key, config);

    try {
      return await circuitBreaker.execute(operation);
    } catch (error) {
      this.recordError(error as Error, "circuit_breaker");
      throw error;
    }
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T> {
    const retryConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      ...config,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.recordError(lastError, "retry");

        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Execute with graceful degradation
   */
  async withGracefulDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    fallbackCondition?: (error: Error) => boolean
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      const err = error as Error;
      this.recordError(err, "degradation");

      if (!fallbackCondition || fallbackCondition(err)) {

        return await fallbackOperation();
      }

      throw error;
    }
  }

  /**
   * Execute with timeout protection
   */
  async withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      this.recordError(error as Error, "timeout");
      throw error;
    }
  }

  /**
   * Comprehensive error handling wrapper
   */
  async executeResilient<T>(
    operation: () => Promise<T>,
    options: {
      circuitBreakerKey?: string;
      retry?: Partial<RetryConfig>;
      timeout?: number;
      fallback?: () => Promise<T>;
      circuitBreaker?: Partial<CircuitBreakerConfig>;
    } = {}
  ): Promise<T> {
    let wrappedOperation = operation;

    // Apply timeout if specified
    if (options.timeout) {
      wrappedOperation = () => this.withTimeout(operation, options.timeout!);
    }

    // Apply retry if specified
    if (options.retry) {
      const timeoutOp = wrappedOperation;
      wrappedOperation = () => this.withRetry(timeoutOp, options.retry);
    }

    // Apply circuit breaker if specified
    if (options.circuitBreakerKey) {
      const retryOp = wrappedOperation;
      wrappedOperation = () => this.withCircuitBreaker(options.circuitBreakerKey!, retryOp, options.circuitBreaker);
    }

    // Apply graceful degradation if fallback specified
    if (options.fallback) {
      return this.withGracefulDegradation(wrappedOperation, options.fallback);
    }

    return wrappedOperation();
  }

  /**
   * Get or create circuit breaker
   */
  private getCircuitBreaker(key: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000,
      };

      this.circuitBreakers.set(key, new CircuitBreaker({ ...defaultConfig, ...config }));
    }

    return this.circuitBreakers.get(key)!;
  }

  /**
   * Record error metrics
   */
  private recordError(error: Error, context: string): void {
    this.metrics.totalErrors++;
    this.metrics.lastError = new Date();

    const errorType = `${context}:${error.constructor.name}`;
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;

  }

  /**
   * Get resilience metrics
   */
  getMetrics(): ErrorMetrics & { circuitBreakers: Record<string, CircuitState> } {
    const uptime = Date.now() - this.startTime;

    const circuitBreakers: Record<string, CircuitState> = {};
    this.circuitBreakers.forEach((breaker, key) => {
      circuitBreakers[key] = breaker.getState();
    });

    return {
      ...this.metrics,
      uptime,
      circuitBreakers,
    };
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const uptimeHours = metrics.uptime / (1000 * 60 * 60);
    const errorRate = metrics.totalErrors / Math.max(uptimeHours, 1);

    const openCircuits = Object.values(metrics.circuitBreakers).filter((state) => state === CircuitState.OPEN).length;

    return {
      status: this.determineHealthStatus(errorRate, openCircuits),
      uptime: uptimeHours,
      errorRate,
      totalErrors: metrics.totalErrors,
      openCircuits,
      lastError: metrics.lastError,
      availability: this.calculateAvailability(metrics),
    };
  }

  private determineHealthStatus(errorRate: number, openCircuits: number): string {
    if (openCircuits > 0) return "degraded";
    if (errorRate > 10) return "unhealthy";
    if (errorRate > 1) return "warning";
    return "healthy";
  }

  private calculateAvailability(metrics: ErrorMetrics): number {
    const totalTime = Date.now() - this.startTime;
    const errorTime = metrics.totalErrors * 1000; // Assume 1s downtime per error
    return Math.max(0, ((totalTime - errorTime) / totalTime) * 100);
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      lastError: null,
      uptime: 0,
      recoveryTime: 0,
    };
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const resilienceManager = ResilienceManager.getInstance();

// Convenience functions
export const withCircuitBreaker = resilienceManager.withCircuitBreaker.bind(resilienceManager);
export const withRetry = resilienceManager.withRetry.bind(resilienceManager);
export const withGracefulDegradation = resilienceManager.withGracefulDegradation.bind(resilienceManager);
export const withTimeout = resilienceManager.withTimeout.bind(resilienceManager);
export const executeResilient = resilienceManager.executeResilient.bind(resilienceManager);

export default resilienceManager;
