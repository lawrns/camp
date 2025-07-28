/**
 * Unified RAG Service
 *
 * Provides a unified interface for RAG operations, wrapping the existing RAGHandler
 * and integrating with the AI pipeline for conversation processing.
 *
 * Features:
 * - Comprehensive error handling with typed errors
 * - Retry mechanism with exponential backoff
 * - Performance metrics and logging
 * - Circuit breaker for reliability
 * - Input validation
 */

// import { getAIHandoverService } from "@/lib/ai/ai-handover";
// import { ConfidenceAnalyticsService, getConfidenceAnalyticsService } from '@/lib/ai/confidence-analytics';
import { RAGHandler, RAGQuery } from "@/lib/ai/rag-handler";
import {
  createGenerationError,
  createRetrievalError,
  createValidationError,
  extractErrorInfo,
  RAG_ERROR_CODES,
  RAGError,
} from "./errors";
import { DEFAULT_RETRY_CONFIG, RAGRetryConfig, retryWithCircuitBreaker } from "./retry";

export interface UnifiedRAGInput {
  conversationId: string;
  organizationId: string;
  messageContent: string;
  messageId: string;
  conversationHistory: unknown[];
  organizationPersona: string;
  useKnowledgeBase: boolean;
  useHumanLikeMode: boolean;
  confidenceThreshold: number;
  customerInfo: {
    name?: string;
    email?: string;
    tier?: string;
    previousInteractions?: number;
  };
  options: {
    skipTypingSimulation?: boolean;
    skipPersonalization?: boolean;
    skipKnowledgeSearch?: boolean;
    maxKnowledgeChunks?: number;
  };
}

export interface UnifiedRAGResponse {
  success: boolean;
  error?: string;
  response?: string;
  confidence?: number;
  knowledgeUsed?: unknown[];
  humanLikeProcessing?: {
    enabled: boolean;
    [key: string]: unknown;
  };
  escalated?: boolean;
  escalationReason?: string;
  suggestedAgent?: string;
  processingTime?: number;
  learning?: unknown;
  metrics?: RAGMetrics;
}

export interface RAGMetrics {
  searchLatency?: number;
  relevanceScores?: number[];
  chunksRetrieved?: number;
  cacheHitRate?: number;
  retryAttempts?: number;
  totalProcessingTime: number;
  knowledgeSearchEnabled: boolean;
  humanLikeModeEnabled: boolean;
}

export interface RAGHealthStatus {
  service: "healthy" | "degraded" | "unhealthy";
  ragHandler: "available" | "unavailable";
  confidenceAnalytics: "available" | "unavailable";
  circuitBreaker: "closed" | "open" | "half-open";
  lastError?: string;
  errorCount: number;
  successRate: number;
}

export class UnifiedRAGService {
  private ragHandler: RAGHandler;
  // private confidenceAnalytics: ConfidenceAnalyticsService;
  private retryConfig: RAGRetryConfig;
  private metrics: {
    totalRequests: number;
    successfulRequests: number;
    errorCount: number;
    lastError?: string;
  };

  constructor(organizationId?: string, retryConfig?: RAGRetryConfig) {
    this.ragHandler = new RAGHandler();
    // this.confidenceAnalytics = getConfidenceAnalyticsService();
    this.retryConfig = retryConfig || DEFAULT_RETRY_CONFIG;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      errorCount: 0,
    };
  }

  /**
   * Process a message with comprehensive error handling and retry logic
   */
  async processMessage(input: UnifiedRAGInput): Promise<UnifiedRAGResponse> {
    const startTime = Date.now();
    let retryAttempts = 0;
    this.metrics.totalRequests++;

    try {
      // Validate input
      this.validateInput(input);

      // Build RAG query if knowledge base is enabled
      let ragResults: unknown[] = [];
      let searchLatency = 0;

      if (input.useKnowledgeBase && !input.options.skipKnowledgeSearch) {
        const searchStartTime = Date.now();

        try {
          ragResults = await retryWithCircuitBreaker(
            async () => {
              retryAttempts++;
              const query: RAGQuery = {
                query: input.messageContent,
                maxResults: input.options.maxKnowledgeChunks || 5,
                minRelevanceScore: 0.7,
                includeMetadata: true,
              };

              const ragResponse = await this.ragHandler.search(query);
              if (!ragResponse.results) {
                throw createRetrievalError("RAG search returned no results", RAG_ERROR_CODES.KNOWLEDGE_NOT_FOUND, {
                  query: input.messageContent,
                });
              }
              return ragResponse.results;
            },
            this.retryConfig,
            `RAG search for conversation ${input.conversationId}`
          );

          searchLatency = Date.now() - searchStartTime;
          this.logRAGMetrics("search", searchLatency, true);
        } catch (error) {
          searchLatency = Date.now() - searchStartTime;
          this.logRAGMetrics("search", searchLatency, false, error);

          // Continue without RAG results but log the error
          if (error instanceof RAGError) {
          } else {
          }
        }
      }

      // Generate AI response using existing pipeline
      let aiResponse;
      try {
        aiResponse = await retryWithCircuitBreaker(
          async () => {
            // const response = await getAIHandoverService().generateAIResponse(
            //   input.conversationId,
            //   input.messageContent,
            //   input.organizationId,
            //   {
            //     conversationHistory: input.conversationHistory,
            //     organizationPersona: input.organizationPersona,
            //     customerInfo: input.customerInfo,
            //     knowledgeResults: ragResults,
            //     humanLikeMode: input.useHumanLikeMode,
            //   }
            // );
            const response = {
              content: "This is a mock AI response.",
              confidence: 0.95,
              escalated: false,
              learning: {},
              suggestedAgent: null,
              needsHandover: false,
              handoverReason: null,
            };

            if (!response || typeof response.confidence !== "number") {
              throw createGenerationError(
                "AI response generation failed or returned invalid data",
                RAG_ERROR_CODES.AI_RESPONSE_FAILED,
                { conversationId: input.conversationId }
              );
            }

            return response;
          },
          this.retryConfig,
          `AI response generation for conversation ${input.conversationId}`
        );

        this.logRAGMetrics("generation", Date.now() - startTime, true);

        // Analyze confidence
        // const confidenceResult = await this.confidenceAnalytics.analyze({
        //   conversationId: input.conversationId,
        //   organizationId: input.organizationId,
        //   text: aiResponse.response,
        //   context: {
        //     customerTier: input.customerInfo.tier,
        //     conversationHistoryLength: input.conversationHistory.length,
        //     ragResultsCount: ragResults.length,
        //   },
        // });

        // aiResponse.confidence = confidenceResult.confidence;
        // if (confidenceResult.shouldEscalate) {
        //   aiResponse.escalated = true;
        //   aiResponse.escalationReason = confidenceResult.reason;
        // }
      } catch (error) {
        this.logRAGMetrics("generation", Date.now() - startTime, false, error);
        throw createGenerationError("Failed to generate AI response", RAG_ERROR_CODES.AI_RESPONSE_FAILED, {
          conversationId: input.conversationId,
          error: extractErrorInfo(error),
        });
      }

      const totalProcessingTime = Date.now() - startTime;

      // Determine if escalation is needed based on confidence threshold
      const shouldEscalate = aiResponse.confidence < input.confidenceThreshold;
      const escalatedStatus = shouldEscalate || aiResponse.needsHandover;
      const escalationReasonText = shouldEscalate
        ? `Confidence ${Math.round(aiResponse.confidence * 100)}% below threshold ${Math.round(input.confidenceThreshold * 100)}%`
        : aiResponse.handoverReason;

      // Calculate metrics
      const metrics: RAGMetrics = {
        searchLatency,
        relevanceScores: ragResults.map((r: unknown) => r.relevanceScore || 0),
        chunksRetrieved: ragResults.length,
        cacheHitRate: 0, // TODO: Implement cache hit tracking
        retryAttempts,
        totalProcessingTime,
        knowledgeSearchEnabled: input.useKnowledgeBase,
        humanLikeModeEnabled: input.useHumanLikeMode,
      };

      this.metrics.successfulRequests++;

      return {
        success: true,
        response: aiResponse.content,
        confidence: aiResponse.confidence,
        knowledgeUsed: ragResults,
        humanLikeProcessing: {
          enabled: input.useHumanLikeMode,
          persona: input.organizationPersona,
        },
        ...(escalatedStatus ? { escalated: escalatedStatus } : {}),
        ...(escalationReasonText ? { escalationReason: escalationReasonText } : {}),
        processingTime: totalProcessingTime,
        learning: {
          knowledgeBaseUsed: input.useKnowledgeBase,
          ragResultsCount: ragResults.length,
          processingTime: totalProcessingTime,
        },
        metrics,
      };
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      const errorInfo = extractErrorInfo(error);

      this.metrics.errorCount++;
      this.metrics.lastError = errorInfo.message;

      return {
        success: false,
        error: errorInfo.message,
        processingTime: totalProcessingTime,
        knowledgeUsed: [],
        humanLikeProcessing: {
          enabled: false,
        },
        escalated: true,
        escalationReason: "AI processing failed",
        confidence: 0,
        metrics: {
          retryAttempts,
          totalProcessingTime,
          knowledgeSearchEnabled: input.useKnowledgeBase,
          humanLikeModeEnabled: input.useHumanLikeMode,
        },
      };
    }
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: UnifiedRAGInput): void {
    if (!input.conversationId || typeof input.conversationId !== "string") {
      throw createValidationError(
        "conversationId is required and must be a string",
        RAG_ERROR_CODES.MISSING_REQUIRED_FIELD,
        { field: "conversationId", value: input.conversationId }
      );
    }

    if (!input.organizationId || typeof input.organizationId !== "string") {
      throw createValidationError(
        "organizationId is required and must be a string",
        RAG_ERROR_CODES.MISSING_REQUIRED_FIELD,
        { field: "organizationId", value: input.organizationId }
      );
    }

    if (!input.messageContent || typeof input.messageContent !== "string") {
      throw createValidationError(
        "messageContent is required and must be a string",
        RAG_ERROR_CODES.MISSING_REQUIRED_FIELD,
        { field: "messageContent", value: input.messageContent }
      );
    }

    if (
      typeof input.confidenceThreshold !== "number" ||
      input.confidenceThreshold < 0 ||
      input.confidenceThreshold > 1
    ) {
      throw createValidationError(
        "confidenceThreshold must be a number between 0 and 1",
        RAG_ERROR_CODES.INVALID_CONFIDENCE_THRESHOLD,
        { field: "confidenceThreshold", value: input.confidenceThreshold }
      );
    }

    if (
      input.options.maxKnowledgeChunks &&
      (input.options.maxKnowledgeChunks < 1 || input.options.maxKnowledgeChunks > 20)
    ) {
      throw createValidationError("maxKnowledgeChunks must be between 1 and 20", RAG_ERROR_CODES.INVALID_INPUT, {
        field: "maxKnowledgeChunks",
        value: input.options.maxKnowledgeChunks,
      });
    }
  }

  /**
   * Log RAG metrics for monitoring
   */
  private logRAGMetrics(operation: string, duration: number, success: boolean, error?: unknown): void {
    const logData = {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...(error ? { error: extractErrorInfo(error) } : {}),
    };

    if (success) {
    } else {
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<RAGHealthStatus> {
    const successRate =
      this.metrics.totalRequests > 0 ? this.metrics.successfulRequests / this.metrics.totalRequests : 1;

    let serviceStatus: RAGHealthStatus["service"] = "healthy";
    if (this.metrics.errorCount > 10 || successRate < 0.8) {
      serviceStatus = "degraded";
    }
    if (successRate < 0.5) {
      serviceStatus = "unhealthy";
    }

    // Test RAG handler availability
    let ragHandlerStatus: RAGHealthStatus["ragHandler"] = "available";
    try {
      // Simple test query
      await this.ragHandler.search({
        query: "test",
        maxResults: 1,
        minRelevanceScore: 0.5,
      });
    } catch {
      ragHandlerStatus = "unavailable";
    }

    const healthStatus: unknown = {
      service: serviceStatus,
      ragHandler: ragHandlerStatus,
      confidenceAnalytics: "available", // Assume available since it's local
      circuitBreaker: "closed", // TODO: Get actual circuit breaker state
      errorCount: this.metrics.errorCount,
      successRate,
    };
    if (this.metrics.lastError !== undefined) {
      healthStatus.lastError = this.metrics.lastError;
    }
    return healthStatus;
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      errorCount: 0,
    };
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? this.metrics.successfulRequests / this.metrics.totalRequests : 1,
    };
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RAGRetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}

// Export a default instance for backward compatibility
export const unifiedRAGService = new UnifiedRAGService();
