/**
 * Circuit breaker implementation for resilient service calls
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export enum CircuitBreakerState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, rejecting calls
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 600000, // 10 minutes
      expectedErrors: [],
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new Error(`Circuit breaker is OPEN. Next attempt at ${this.nextAttemptTime?.toISOString()}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.reset();
    }
  }

  private onFailure(error: unknown): void {
    // Check if this is an expected error that shouldn't trigger circuit breaker
    if (this.isExpectedError(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.trip();
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.trip();
    }
  }

  private isExpectedError(error: unknown): boolean {
    if (!this.config.expectedErrors?.length) {
      return false;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return this.config.expectedErrors.some((expectedError) => errorMessage.includes(expectedError));
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  private trip(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  // Public methods for monitoring
  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN;
  }

  // Manual control methods
  forceOpen(): void {
    this.trip();
  }

  forceClose(): void {
    this.reset();
  }

  forceHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.nextAttemptTime = undefined;
  }
}

// Factory function for common configurations
export function createCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  return new CircuitBreaker(config);
}

// Predefined circuit breakers for common use cases
export const circuitBreakers = {
  // For API calls
  api: createCircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    expectedErrors: ["Network Error", "Timeout"],
  }),

  // For database operations
  database: createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    expectedErrors: ["Connection refused", "Timeout"],
  }),

  // For external services
  external: createCircuitBreaker({
    failureThreshold: 10,
    resetTimeout: 120000, // 2 minutes
    expectedErrors: ["Service Unavailable", "503", "502"],
  }),

  // For AI services
  ai: createCircuitBreaker({
    failureThreshold: 8,
    resetTimeout: 90000, // 1.5 minutes
    expectedErrors: ["Rate limit", "Token limit", "Model unavailable"],
  }),
};

// Decorator function for wrapping functions with circuit breaker
export function withCircuitBreaker<T extends (...args: unknown[]) => Promise<any>>(
  fn: T,
  circuitBreaker: CircuitBreaker
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return circuitBreaker.execute(() => fn(...args));
  }) as T;
}

// Monitor multiple circuit breakers
export class CircuitBreakerMonitor {
  private breakers = new Map<string, CircuitBreaker>();

  register(name: string, breaker: CircuitBreaker): void {
    this.breakers.set(name, breaker);
  }

  unregister(name: string): void {
    this.breakers.delete(name);
  }

  getStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  getHealthStatus(): { healthy: string[]; unhealthy: string[] } {
    const healthy: string[] = [];
    const unhealthy: string[] = [];

    for (const [name, breaker] of this.breakers.entries()) {
      if (breaker.isClosed()) {
        healthy.push(name);
      } else {
        unhealthy.push(name);
      }
    }

    return { healthy, unhealthy };
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClose();
    }
  }
}

// Global monitor instance
export const globalCircuitBreakerMonitor = new CircuitBreakerMonitor();

// Register default circuit breakers
globalCircuitBreakerMonitor.register("api", circuitBreakers.api);
globalCircuitBreakerMonitor.register("database", circuitBreakers.database);
globalCircuitBreakerMonitor.register("external", circuitBreakers.external);
globalCircuitBreakerMonitor.register("ai", circuitBreakers.ai);
