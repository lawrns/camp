"use client";

import { useState, useCallback, useRef } from "react";
import { RAGAIService, RAGContext, AIResponse } from "@/lib/services/rag-ai-service";
import { useAIHandoverQueue } from "./useAIHandoverQueue";

export interface UseRAGAIProps {
  conversationId: string;
  organizationId: string;
  onAIResponse?: (response: AIResponse) => void;
  onHandoverTriggered?: (confidence: number) => void;
  confidenceThreshold?: number;
}

export interface UseRAGAIReturn {
  // State
  isProcessing: boolean;
  lastResponse: AIResponse | null;
  error: string | null;

  // Actions
  generateResponse: (query: string, context?: Partial<RAGContext>) => Promise<AIResponse>;
  generateHumanLikeResponse: (query: string, context?: Partial<RAGContext>) => Promise<AIResponse>;

  // Utilities
  getConfidenceLevel: (confidence: number) => "high" | "medium" | "low" | "very-low";
  shouldShowConfidence: boolean;
}

export function useRAGAI({
  conversationId,
  organizationId,
  onAIResponse,
  onHandoverTriggered,
  confidenceThreshold = 0.7,
}: UseRAGAIProps): UseRAGAIReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ragService = useRef(RAGAIService.getInstance());
  const { triggerHandover } = useAIHandoverQueue({
    conversationId,
    organizationId,
    onHandoverComplete: (agentName) => {

    },
  });

  // Generate AI response using RAG
  const generateResponse = useCallback(
    async (query: string, context: Partial<RAGContext> = {}): Promise<AIResponse> => {
      if (isProcessing) {
        throw new Error("AI is already processing a request");
      }

      setIsProcessing(true);
      setError(null);

      try {

        const fullContext: RAGContext = {
          query,
          conversationId,
          organizationId,
          ...context,
        };

        const response = await ragService.current.generateResponse(fullContext);

        setLastResponse(response);

        // Trigger handover if confidence is too low
        if (response.shouldHandover && response.confidence < confidenceThreshold) {

          await triggerHandover(
            response.confidence,
            {
              query,
              response: response.content,
              sources: response.sources.length,
              reasoning: response.reasoning,
            },
            `AI confidence below threshold (${response.confidence.toFixed(2)} < ${confidenceThreshold})`
          );

          onHandoverTriggered?.(response.confidence);
        }

        onAIResponse?.(response);

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate AI response";

        setError(errorMessage);

        // Create fallback response
        const fallbackResponse: AIResponse = {
          content: "I'm experiencing technical difficulties. Let me connect you with a human agent.",
          confidence: 0.1,
          sources: [],
          reasoning: "System error",
          shouldHandover: true,
          responseTime: 0,
        };

        setLastResponse(fallbackResponse);
        return fallbackResponse;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      conversationId,
      organizationId,
      isProcessing,
      confidenceThreshold,
      triggerHandover,
      onAIResponse,
      onHandoverTriggered,
    ]
  );

  // Generate human-like response with typing simulation
  const generateHumanLikeResponse = useCallback(
    async (query: string, context: Partial<RAGContext> = {}): Promise<AIResponse> => {
      if (isProcessing) {
        throw new Error("AI is already processing a request");
      }

      setIsProcessing(true);
      setError(null);

      try {

        const fullContext: RAGContext = {
          query,
          conversationId,
          organizationId,
          ...context,
        };

        const response = await ragService.current.simulateHumanResponse(
          fullContext,
          () => {

          },
          (agentName) => {

          }
        );

        setLastResponse(response);

        // Trigger handover if confidence is too low
        if (response.shouldHandover && response.confidence < confidenceThreshold) {

          await triggerHandover(
            response.confidence,
            {
              query,
              response: response.content,
              sources: response.sources.length,
              reasoning: response.reasoning,
              agent_name: response.agentName,
            },
            `AI confidence below threshold (${response.confidence.toFixed(2)} < ${confidenceThreshold})`
          );

          onHandoverTriggered?.(response.confidence);
        }

        onAIResponse?.(response);

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate human-like AI response";

        setError(errorMessage);

        // Create fallback response
        const fallbackResponse: AIResponse = {
          content: "I'm experiencing technical difficulties. Let me connect you with a human agent.",
          confidence: 0.1,
          sources: [],
          reasoning: "System error",
          shouldHandover: true,
          responseTime: 0,
        };

        setLastResponse(fallbackResponse);
        return fallbackResponse;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      conversationId,
      organizationId,
      isProcessing,
      confidenceThreshold,
      triggerHandover,
      onAIResponse,
      onHandoverTriggered,
    ]
  );

  // Get confidence level description
  const getConfidenceLevel = useCallback((confidence: number): "high" | "medium" | "low" | "very-low" => {
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.6) return "medium";
    if (confidence >= 0.4) return "low";
    return "very-low";
  }, []);

  // Whether to show confidence indicators (for debugging/admin)
  const shouldShowConfidence = process.env.NODE_ENV === "development" || window.location.search.includes("debug=true");

  return {
    // State
    isProcessing,
    lastResponse,
    error,

    // Actions
    generateResponse,
    generateHumanLikeResponse,

    // Utilities
    getConfidenceLevel,
    shouldShowConfidence,
  };
}

// Helper hook for confidence monitoring
export function useAIConfidenceTracking(responses: AIResponse[], windowSize: number = 10) {
  const recentResponses = responses.slice(-windowSize);

  const averageConfidence =
    recentResponses.length > 0 ? recentResponses.reduce((sum, r) => sum + r.confidence, 0) / recentResponses.length : 0;

  const handoverRate =
    recentResponses.length > 0 ? recentResponses.filter((r) => r.shouldHandover).length / recentResponses.length : 0;

  const averageResponseTime =
    recentResponses.length > 0
      ? recentResponses.reduce((sum, r) => sum + r.responseTime, 0) / recentResponses.length
      : 0;

  return {
    averageConfidence,
    handoverRate,
    averageResponseTime,
    totalResponses: recentResponses.length,
    highConfidenceResponses: recentResponses.filter((r) => r.confidence >= 0.8).length,
    lowConfidenceResponses: recentResponses.filter((r) => r.confidence < 0.4).length,
  };
}

// Hook for RAG analytics
export function useRAGAnalytics(organizationId: string) {
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    averageConfidence: 0,
    handoverRate: 0,
    topSources: [] as { title: string; usage: number }[],
    responseTimeP95: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      // This would typically fetch from an analytics API
      // For now, we'll use placeholder data
      setAnalytics({
        totalQueries: 1250,
        averageConfidence: 0.73,
        handoverRate: 0.27,
        topSources: [
          { title: "Getting Started Guide", usage: 45 },
          { title: "Billing FAQ", usage: 32 },
          { title: "Technical Support", usage: 28 },
        ],
        responseTimeP95: 1200,
      });
    } catch (error) {

    }
  }, [organizationId]);

  return {
    analytics,
    fetchAnalytics,
    refreshAnalytics: fetchAnalytics,
  };
}
