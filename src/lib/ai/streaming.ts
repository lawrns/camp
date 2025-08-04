/**
 * AI Streaming Response System
 *
 * Provides real-time streaming AI responses with typing indicators
 * Supports personality-based timing and human-like interaction patterns
 */

// Add React import for the hook
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { AI_PERSONALITIES, calculateTypingTiming, type AIPersonality } from "./personalities";

export interface StreamingOptions {
  conversationId: string;
  organizationId: string;
  personality: AIPersonality;
  enableTypingIndicator: boolean;
  enableThinkingDelay: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface TypingIndicatorOptions {
  conversationId: string;
  organizationId: string;
  agentName: string;
  isTyping: boolean;
}

/**
 * Stream AI response with human-like timing and typing indicators
 */
export class AIStreamingService {
  private supabase = createClient();
  private activeStreams = new Map<string, AbortController>();

  /**
   * Start streaming an AI response
   */
  async streamResponse(prompt: string, options: StreamingOptions): Promise<void> {
    const { conversationId, personality, enableTypingIndicator, enableThinkingDelay } = options;

    // Create abort controller for this stream
    const abortController = new AbortController();
    this.activeStreams.set(conversationId, abortController);

    try {
      // 1. Show thinking delay if enabled
      if (enableThinkingDelay) {
        if (enableTypingIndicator) {
          await this.setTypingIndicator({
            conversationId,
            organizationId: options.organizationId,
            agentName: personality.name,
            isTyping: true,
          });
        }

        await this.delay(personality.typingSpeed.thinkingDelay);

        if (abortController.signal.aborted) return;
      }

      // 2. Generate AI response (simulated for now)
      const response = await this.generateAIResponse(prompt, personality);

      if (abortController.signal.aborted) return;

      // 3. Stream the response with typing simulation
      await this.simulateTyping(response, options, abortController.signal);
    } catch (error) {

      options.onError?.(error instanceof Error ? error : new Error("Streaming failed"));
    } finally {
      // Clean up
      this.activeStreams.delete(conversationId);

      if (enableTypingIndicator) {
        await this.setTypingIndicator({
          conversationId,
          organizationId: options.organizationId,
          agentName: personality.name,
          isTyping: false,
        });
      }
    }
  }

  /**
   * Simulate human-like typing with personality-based timing
   */
  private async simulateTyping(response: string, options: StreamingOptions, signal: AbortSignal): Promise<void> {
    const { personality, onChunk, onComplete } = options;
    const timing = calculateTypingTiming(response, personality);

    // Split response into words for realistic typing
    const words = response.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) return;

      const word = words[i];
      currentText += (i > 0 ? " " : "") + word;

      // Send chunk update
      onChunk?.(currentText);

      // Calculate delay based on word length and typing speed
      const wordDelay = ((word.length / personality.typingSpeed.wordsPerMinute) * 60 * 1000) / 5; // Rough approximation

      // Add pause for sentence endings
      const isPausePoint = word.includes(".") || word.includes("!") || word.includes("?");
      const pauseDelay = isPausePoint ? personality.typingSpeed.pauseBetweenSentences : 0;

      await this.delay(wordDelay + pauseDelay);
    }

    if (!signal.aborted) {
      onComplete?.(response);
    }
  }

  /**
   * Set typing indicator status
   */
  async setTypingIndicator(options: TypingIndicatorOptions): Promise<void> {
    const { conversationId, organizationId, agentName, isTyping } = options;

    try {
      if (isTyping) {
        // Insert typing indicator
        await this.supabase.from("typing_indicators").upsert({
          conversation_id: conversationId,
          organization_id: organizationId,
          userName: agentName,
          userType: "ai",
          isTyping: true,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Remove typing indicator
        await this.supabase
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("userName", agentName)
          .eq("userType", "ai");
      }

      // Broadcast typing status via real-time
      await this.supabase.channel(`org:${organizationId}:conversation:${conversationId}`).send({
        type: "broadcast",
        event: "typing_indicator",
        payload: {
          conversationId,
          agentName,
          isTyping,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {

    }
  }

  /**
   * Generate AI response (placeholder for actual AI integration)
   */
  private async generateAIResponse(prompt: string, personality: AIPersonality): Promise<string> {
    // This would integrate with your actual AI service (OpenAI, Anthropic, etc.)
    // For now, return a personality-appropriate response

    const responses = {
      alex: [
        "I'd be happy to help you with that! Let me look into this for you.",
        "Thanks for reaching out! I can definitely assist you with this question.",
        "I understand your concern, and I'm here to help resolve this for you.",
      ],
      sophia: [
        "Let me analyze this technical issue systematically. First, I'll need to gather some diagnostic information.",
        "Based on the error you're experiencing, I can provide a step-by-step troubleshooting approach.",
        "This appears to be a configuration issue. I'll walk you through the resolution process.",
      ],
      maya: [
        "I can imagine how frustrating this must be for you. Let me help make this right.",
        "I understand this situation is concerning, and I want to ensure we resolve it completely.",
        "Thank you for your patience. I'm committed to finding the best solution for you.",
      ],
      jordan: [
        "Quick solution: Here's what you need to do to resolve this.",
        "I can help with that right away. The fix is straightforward.",
        "Got it! Here's the immediate solution to your question.",
      ],
    };

    const personalityResponses = responses[personality.id as keyof typeof responses] || responses.alex;
    const randomResponse = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];

    // Simulate AI processing delay
    await this.delay(500 + Math.random() * 1000);

    return randomResponse;
  }

  /**
   * Stop streaming for a conversation
   */
  stopStreaming(conversationId: string): void {
    const controller = this.activeStreams.get(conversationId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(conversationId);
    }
  }

  /**
   * Stop all active streams
   */
  stopAllStreaming(): void {
    for (const [conversationId, controller] of this.activeStreams) {
      controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * Check if a conversation has an active stream
   */
  isStreaming(conversationId: string): boolean {
    return this.activeStreams.has(conversationId);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiStreamingService = new AIStreamingService();

/**
 * React hook for AI streaming
 */
export function useAIStreaming() {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const [error, setError] = React.useState<Error | null>(null);

  const startStreaming = React.useCallback(
    async (prompt: string, options: Omit<StreamingOptions, "onChunk" | "onComplete" | "onError">) => {
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      await aiStreamingService.streamResponse(prompt, {
        ...options,
        onChunk: (chunk) => setStreamingText(chunk),
        onComplete: (response) => {
          setStreamingText(response);
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
        },
      });
    },
    []
  );

  const stopStreaming = React.useCallback((conversationId: string) => {
    aiStreamingService.stopStreaming(conversationId);
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamingText,
    error,
    startStreaming,
    stopStreaming,
  };
}
