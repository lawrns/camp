/**
 * Real-time AI processor for live conversation handling
 */

import { openaiClient } from "@/lib/infrastructure/openai/client";
import { globalCache } from "@/lib/telemetry/tiered-cache";

interface AIProcessingConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  responseTimeoutMs: number;
  confidenceThreshold: number;
  enableStreaming: boolean;
}

interface ConversationContext {
  conversationId: string;
  organizationId: string;
  customerData: unknown;
  messageHistory: unknown[];
  knowledgeBase: unknown[];
  currentTopic?: string;
}

interface AIResponse {
  content: string;
  confidence: number;
  shouldHandoff: boolean;
  reasoning: string;
  suggestedActions: string[];
  processingTime: number;
}

export class RealtimeAIProcessor {
  private config: AIProcessingConfig;
  private processingQueue = new Map<string, Promise<AIResponse>>();
  private activeStreams = new Map<string, any>();

  constructor(config: Partial<AIProcessingConfig> = {}) {
    this.config = {
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 500,
      responseTimeoutMs: 10000,
      confidenceThreshold: 0.8,
      enableStreaming: true,
      ...config,
    };
  }

  async processMessage(message: string, context: ConversationContext): Promise<AIResponse> {
    const startTime = performance.now();

    // Check if already processing this message
    const cacheKey = `ai_processing:${context.conversationId}:${Date.now()}`;
    if (this.processingQueue.has(cacheKey)) {
      return this.processingQueue.get(cacheKey)!;
    }

    // Check cache first
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached as AIResponse;
    }

    const processingPromise = this.executeProcessing(message, context, startTime);
    this.processingQueue.set(cacheKey, processingPromise);

    try {
      const result = await processingPromise;

      // Cache the result
      globalCache.set(cacheKey, result, 300000); // 5 minutes

      return result;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }

  private async executeProcessing(
    message: string,
    context: ConversationContext,
    startTime: number
  ): Promise<AIResponse> {
    try {
      // Build conversation prompt
      const prompt = this.buildConversationPrompt(message, context);

      // Get AI response
      const response = await openaiClient.createChatCompletion(prompt, {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      const aiContent = response.choices[0]?.message?.content || "";
      const processingTime = performance.now() - startTime;

      // Analyze response confidence
      const confidence = this.calculateConfidence(aiContent, context);

      // Determine if handoff is needed
      const shouldHandoff = this.shouldHandoffToHuman(confidence, aiContent, context);

      // Extract suggested actions
      const suggestedActions = this.extractSuggestedActions(aiContent);

      return {
        content: aiContent,
        confidence,
        shouldHandoff,
        reasoning: this.generateReasoning(confidence, shouldHandoff),
        suggestedActions,
        processingTime,
      };
    } catch (error) {
      return {
        content: "I'm having trouble processing your message right now. Let me connect you with a human agent.",
        confidence: 0,
        shouldHandoff: true,
        reasoning: "AI processing failed",
        suggestedActions: ["escalate_to_human"],
        processingTime: performance.now() - startTime,
      };
    }
  }

  async processStreamingMessage(
    message: string,
    context: ConversationContext,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    if (!this.config.enableStreaming) {
      return this.processMessage(message, context);
    }

    const startTime = performance.now();
    const streamId = `${context.conversationId}:${Date.now()}`;

    try {
      const prompt = this.buildConversationPrompt(message, context);

      const stream = await openaiClient.createStreamingChatCompletion(prompt, {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      this.activeStreams.set(streamId, stream);

      let fullContent = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      const processingTime = performance.now() - startTime;
      const confidence = this.calculateConfidence(fullContent, context);
      const shouldHandoff = this.shouldHandoffToHuman(confidence, fullContent, context);

      return {
        content: fullContent,
        confidence,
        shouldHandoff,
        reasoning: this.generateReasoning(confidence, shouldHandoff),
        suggestedActions: this.extractSuggestedActions(fullContent),
        processingTime,
      };
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  private buildConversationPrompt(message: string, context: ConversationContext): unknown[] {
    const systemPrompt = `You are Campfire AI, a helpful customer support assistant. 
    
    Context:
    - Customer: ${context.customerData?.name || "Unknown"}
    - Topic: ${context.currentTopic || "General Support"}
    - Organization: ${context.organizationId}
    
    Guidelines:
    - Be helpful, concise, and professional
    - Use the knowledge base to provide accurate information
    - If you're unsure, suggest escalating to a human agent
    - Maintain conversation context and history
    
    Knowledge Base:
    ${context.knowledgeBase.map((kb) => `- ${kb.title}: ${kb.content}`).join("\n")}
    `;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...context.messageHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    return messages;
  }

  private calculateConfidence(content: string, context: ConversationContext): number {
    // Simple confidence calculation based on various factors
    let confidence = 0.8; // Base confidence

    // Reduce confidence for uncertain language
    const uncertainWords = ["maybe", "perhaps", "might", "could be", "not sure"];
    const hasUncertainty = uncertainWords.some((word) => content.toLowerCase().includes(word));

    if (hasUncertainty) {
      confidence -= 0.2;
    }

    // Increase confidence if knowledge base was used
    if (context.knowledgeBase.length > 0) {
      confidence += 0.1;
    }

    // Decrease confidence for complex queries
    if (content.split(" ").length > 100) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private shouldHandoffToHuman(confidence: number, content: string, context: ConversationContext): boolean {
    // Handoff if confidence is below threshold
    if (confidence < this.config.confidenceThreshold) {
      return true;
    }

    // Handoff for specific keywords
    const handoffKeywords = ["speak to human", "human agent", "escalate", "complaint", "refund", "cancel subscription"];

    const needsHandoff = handoffKeywords.some((keyword) => content.toLowerCase().includes(keyword));

    return needsHandoff;
  }

  private extractSuggestedActions(content: string): string[] {
    const actions = [];

    // Extract common action patterns
    if (content.includes("check your account")) {
      actions.push("check_account");
    }

    if (content.includes("contact support")) {
      actions.push("escalate_to_human");
    }

    if (content.includes("documentation") || content.includes("guide")) {
      actions.push("provide_documentation");
    }

    return actions;
  }

  private generateReasoning(confidence: number, shouldHandoff: boolean): string {
    if (shouldHandoff) {
      return `Handoff recommended due to ${confidence < this.config.confidenceThreshold ? "low confidence" : "explicit request"}`;
    }

    return `AI response with ${Math.round(confidence * 100)}% confidence`;
  }

  // Stop streaming for a conversation
  stopStreaming(conversationId: string): void {
    for (const [streamId, stream] of this.activeStreams.entries()) {
      if (streamId.startsWith(conversationId)) {
        try {
          // Stop the stream if possible
          stream?.return?.();
        } catch (error) {}
        this.activeStreams.delete(streamId);
      }
    }
  }

  // Get processing statistics
  getStats() {
    return {
      activeProcessing: this.processingQueue.size,
      activeStreams: this.activeStreams.size,
      config: this.config,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<AIProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default processor instance
export const realtimeAIProcessor = new RealtimeAIProcessor();

// Helper functions
export async function processAIMessage(message: string, context: ConversationContext): Promise<AIResponse> {
  return realtimeAIProcessor.processMessage(message, context);
}

export async function processStreamingAIMessage(
  message: string,
  context: ConversationContext,
  onChunk: (chunk: string) => void
): Promise<AIResponse> {
  return realtimeAIProcessor.processStreamingMessage(message, context, onChunk);
}
