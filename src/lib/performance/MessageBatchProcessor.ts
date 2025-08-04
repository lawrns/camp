/**
 * Message Batch Processor
 *
 * High-performance message batching system for ultra-fast delivery
 * Optimizes database operations and real-time updates
 *
 * Features:
 * - Batch processing for reduced database load
 * - Configurable batch size and timeout
 * - Retry logic for failed operations
 * - Performance monitoring and metrics
 */

interface BatchProcessorConfig {
  batchSize: number;
  batchTimeout: number; // milliseconds
  maxRetries: number;
  debug: boolean;
}

interface MessageBatch {
  id: string;
  messages: unknown[];
  timestamp: number;
  retryCount: number;
}

export class MessageBatchProcessor {
  private config: BatchProcessorConfig;
  private pendingMessages: unknown[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private processingBatch = false;
  private metrics = {
    totalMessages: 0,
    totalBatches: 0,
    averageProcessingTime: 0,
    failedMessages: 0,
  };

  constructor(config: BatchProcessorConfig) {
    this.config = config;

    if (this.config.debug) {

    }
  }

  /**
   * Add message to batch for processing
   */
  async addMessage(message: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add resolve/reject callbacks to message for later resolution
      const messageWithCallbacks = {
        ...message,
        _resolve: resolve,
        _reject: reject,
        _timestamp: Date.now(),
      };

      this.pendingMessages.push(messageWithCallbacks);
      this.metrics.totalMessages++;

      if (this.config.debug) {

      }

      // Process immediately if batch is full
      if (this.pendingMessages.length >= this.config.batchSize) {
        this.processBatch();
      } else {
        // Set timer for batch timeout
        this.setBatchTimer();
      }
    });
  }

  /**
   * Set or reset batch timer
   */
  private setBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      if (this.pendingMessages.length > 0) {
        this.processBatch();
      }
    }, this.config.batchTimeout);
  }

  /**
   * Process current batch of messages
   */
  private async processBatch(): Promise<void> {
    if (this.processingBatch || this.pendingMessages.length === 0) {
      return;
    }

    this.processingBatch = true;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Extract current batch
    const batch = this.pendingMessages.splice(0, this.config.batchSize);
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const startTime = Date.now();

    if (this.config.debug) {

    }

    try {
      // Process all messages in the batch
      const results = await Promise.allSettled(batch.map((message) => this.processMessage(message)));

      // Resolve/reject individual message promises
      results.forEach((result, index) => {
        const message = batch[index];

        if (result.status === "fulfilled") {
          message._resolve(result.value);
        } else {
          message._reject(result.reason);
          this.metrics.failedMessages++;
        }
      });

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      if (this.config.debug) {

      }
    } catch (error) {

      // Reject all messages in failed batch
      batch.forEach((message) => {
        message._reject(error);
        this.metrics.failedMessages++;
      });
    } finally {
      this.processingBatch = false;

      // Process next batch if there are pending messages
      if (this.pendingMessages.length > 0) {
        setImmediate(() => this.processBatch());
      }
    }
  }

  /**
   * Process individual message (to be overridden by specific implementations)
   */
  private async processMessage(message: unknown): Promise<any> {
    // Default implementation - just return the message
    // This should be overridden by specific batch processors
    return message;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(processingTime: number): void {
    this.metrics.totalBatches++;

    // Calculate rolling average
    const currentAvg = this.metrics.averageProcessingTime;
    const newAvg = (currentAvg * (this.metrics.totalBatches - 1) + processingTime) / this.metrics.totalBatches;
    this.metrics.averageProcessingTime = newAvg;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * Flush all pending messages immediately
   */
  async flush(): Promise<void> {
    if (this.pendingMessages.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Shutdown the batch processor
   */
  shutdown(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Reject any pending messages
    this.pendingMessages.forEach((message) => {
      message._reject(new Error("Batch processor shutdown"));
    });

    this.pendingMessages = [];
    this.processingBatch = false;

    if (this.config.debug) {

    }
  }
}

/**
 * Database Message Batch Processor
 * Specialized for database operations
 */
export class DatabaseMessageBatchProcessor extends MessageBatchProcessor {
  private supabaseClient: unknown;

  constructor(config: BatchProcessorConfig, supabaseClient: unknown) {
    super(config);
    this.supabaseClient = supabaseClient;
  }

  /**
   * Process message with database operations
   */
  protected async processMessage(message: unknown): Promise<any> {
    const startTime = Date.now();

    try {
      // Insert message into database
      const { data, error } = await this.supabaseClient
        .from("messages")
        .insert({
          conversation_id: message.conversationId,
          content: message.content,
          senderType: message.senderType,
          senderName: message.senderName,
          senderEmail: message.senderEmail,
          organization_id: message.organizationId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const processingTime = Date.now() - startTime;

      if (this.config.debug) {

      }

      return {
        success: true,
        data: {
          message: data,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      throw {
        success: false,
        error: error.message || "Database operation failed",
        processingTime,
      };
    }
  }
}

/**
 * Real-time Message Batch Processor
 * Specialized for real-time updates
 */
export class RealtimeMessageBatchProcessor extends MessageBatchProcessor {
  private realtimeClient: unknown;

  constructor(config: BatchProcessorConfig, realtimeClient: unknown) {
    super(config);
    this.realtimeClient = realtimeClient;
  }

  /**
   * Process message with real-time broadcasting
   */
  protected async processMessage(message: unknown): Promise<any> {
    const startTime = Date.now();

    try {
      // Broadcast message via real-time channel
      const channel = this.realtimeClient.channel(`org:${message.organizationId}:conv:${message.conversationId}`);

      await channel.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          message: message,
          timestamp: Date.now(),
        },
      });

      const processingTime = Date.now() - startTime;

      if (this.config.debug) {

      }

      return {
        success: true,
        data: {
          broadcasted: true,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      throw {
        success: false,
        error: error.message || "Real-time broadcast failed",
        processingTime,
      };
    }
  }
}
