/**
 * Core AI functionality
 */

import { aiUtils } from "../ai";

export interface AICore {
  processMessage: (message: string, context?: string[]) => Promise<string>;
  calculateConfidence: (response: string, context?: string[]) => number;
  extractKeywords: (text: string) => string[];
  validateConfig: (config: unknown) => boolean;
}

export interface AIProcessingOptions {
  temperature?: number;
  maxTokens?: number;
  includeContext?: boolean;
  useCache?: boolean;
}

export class CoreAIProcessor implements AICore {
  private cache = new Map<string, string>();

  async processMessage(message: string, context: string[] = [], options: AIProcessingOptions = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 500, includeContext = true, useCache = true } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(message, context);
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Simulate AI processing
      const processedMessage = await this.simulateAIProcessing(message, includeContext ? context : [], {
        temperature,
        maxTokens,
      });

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, processedMessage);
      }

      return processedMessage;
    } catch (error) {
      throw new Error("Failed to process message with AI");
    }
  }

  calculateConfidence(response: string, context: string[] = []): number {
    return aiUtils.calculateConfidence(response, context);
  }

  extractKeywords(text: string): string[] {
    return aiUtils.extractKeywords(text);
  }

  validateConfig(config: unknown): boolean {
    try {
      const validatedConfig = aiUtils.validateConfig(config);
      return !!validatedConfig;
    } catch {
      return false;
    }
  }

  private generateCacheKey(message: string, context: string[]): string {
    const contextStr = context.join("|");
    return `${message}:${contextStr}`.substring(0, 100);
  }

  private async simulateAIProcessing(
    message: string,
    context: string[],
    options: { temperature: number; maxTokens: number }
  ): Promise<string> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple response generation based on message content
    const keywords = this.extractKeywords(message);
    const isQuestion = message.includes("?");
    const isGreeting = /hello|hi|hey/i.test(message);
    const isProblem = /problem|issue|error|help/i.test(message);

    if (isGreeting) {
      return "Hello! How can I help you today?";
    }

    if (isProblem) {
      return `I understand you're experiencing an issue. Based on your message, I can see this relates to ${keywords.slice(0, 2).join(" and ")}. Let me help you resolve this.`;
    }

    if (isQuestion) {
      const contextInfo =
        context.length > 0
          ? ` I can see from our previous conversation about ${context.slice(0, 2).join(" and ")}.`
          : "";
      return `That's a great question!${contextInfo} Let me provide you with some information about ${keywords.slice(0, 3).join(", ")}.`;
    }

    // Default response
    return `Thank you for your message. I've noted the key points: ${keywords.slice(0, 3).join(", ")}. How can I assist you further?`;
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global instance
export const coreAI = new CoreAIProcessor();

// Helper functions
export async function processWithAI(
  message: string,
  context?: string[],
  options?: AIProcessingOptions
): Promise<string> {
  return coreAI.processMessage(message, context, options);
}

export function calculateAIConfidence(response: string, context?: string[]): number {
  return coreAI.calculateConfidence(response, context);
}

export function extractAIKeywords(text: string): string[] {
  return coreAI.extractKeywords(text);
}

// Export default
export default coreAI;
