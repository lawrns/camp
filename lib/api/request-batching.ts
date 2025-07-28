/**
 * Request batching utility for performance optimization
 */

interface BatchedRequest<T> {
  id: string;
  data: T;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  maxRetries: number;
  retryDelay: number;
}

export class RequestBatcher<T, R> {
  private queue: BatchedRequest<T>[] = [];
  private config: BatchConfig;
  private batchProcessor: (requests: T[]) => Promise<R[]>;
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(batchProcessor: (requests: T[]) => Promise<R[]>, config: Partial<BatchConfig> = {}) {
    this.batchProcessor = batchProcessor;
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 100, // milliseconds
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  async add(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest<T> = {
        id: this.generateId(),
        data,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(request);

      // Start timer if not already running
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }

      // Process immediately if batch is full
      if (this.queue.length >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.clearTimer();

    const batch = this.queue.splice(0, this.config.maxBatchSize);

    try {
      const results = await this.processBatchWithRetry(batch);

      // Resolve individual requests
      batch.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach((request) => {
        request.reject(error);
      });
    } finally {
      this.isProcessing = false;

      // Process remaining queue if any
      if (this.queue.length > 0) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.config.maxWaitTime);
      }
    }
  }

  private async processBatchWithRetry(batch: BatchedRequest<T>[]): Promise<R[]> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const requestData = batch.map((request) => request.data);
        return await this.batchProcessor(requestData);
      } catch (error) {
        lastError = error;

        if (attempt < this.config.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Get current queue size
  getQueueSize(): number {
    return this.queue.length;
  }

  // Get processing status
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Clear the queue (useful for testing)
  clearQueue(): void {
    this.queue.forEach((request) => {
      request.reject(new Error("Queue cleared"));
    });
    this.queue = [];
    this.clearTimer();
  }

  // Get statistics
  getStats() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      hasTimer: this.timer !== null,
      config: this.config,
    };
  }
}

// Specialized batchers for common use cases

// Database query batcher
export class DatabaseQueryBatcher<T, R> extends RequestBatcher<T, R> {
  constructor(queryProcessor: (queries: T[]) => Promise<R[]>, config: Partial<BatchConfig> = {}) {
    super(queryProcessor, {
      maxBatchSize: 50,
      maxWaitTime: 50,
      ...config,
    });
  }
}

// API request batcher
export class APIRequestBatcher<T, R> extends RequestBatcher<T, R> {
  constructor(apiProcessor: (requests: T[]) => Promise<R[]>, config: Partial<BatchConfig> = {}) {
    super(apiProcessor, {
      maxBatchSize: 20,
      maxWaitTime: 100,
      ...config,
    });
  }
}

// Embedding generation batcher
export class EmbeddingBatcher extends RequestBatcher<string, number[]> {
  constructor(embeddingProcessor: (texts: string[]) => Promise<number[][]>, config: Partial<BatchConfig> = {}) {
    super(embeddingProcessor, {
      maxBatchSize: 100,
      maxWaitTime: 200,
      ...config,
    });
  }
}

// Utility functions

export function createDatabaseBatcher<T, R>(
  queryProcessor: (queries: T[]) => Promise<R[]>,
  config?: Partial<BatchConfig>
): DatabaseQueryBatcher<T, R> {
  return new DatabaseQueryBatcher(queryProcessor, config);
}

export function createAPIBatcher<T, R>(
  apiProcessor: (requests: T[]) => Promise<R[]>,
  config?: Partial<BatchConfig>
): APIRequestBatcher<T, R> {
  return new APIRequestBatcher(apiProcessor, config);
}

export function createEmbeddingBatcher(
  embeddingProcessor: (texts: string[]) => Promise<number[][]>,
  config?: Partial<BatchConfig>
): EmbeddingBatcher {
  return new EmbeddingBatcher(embeddingProcessor, config);
}

// Global batcher instances for common use cases
export const globalQueryBatcher = createDatabaseBatcher(async (queries: any[]) => {
  // This would be implemented with actual database logic

  return queries.map(() => ({}));
});

export const globalAPIBatcher = createAPIBatcher(async (requests: any[]) => {
  // This would be implemented with actual API logic

  return requests.map(() => ({}));
});

export const globalEmbeddingBatcher = createEmbeddingBatcher(async (texts: string[]) => {
  // This would be implemented with actual embedding generation

  return texts.map(() => new Array(1536).fill(0));
});
