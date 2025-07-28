/**
 * AI utility functions
 */

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface AIResponse {
  content: string;
  confidence: number;
  tokens: number;
  model: string;
  finishReason: "stop" | "length" | "function_call" | "content_filter";
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// Default AI configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 500,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// AI utility functions
export const aiUtils = {
  /**
   * Format messages for AI consumption
   */
  formatMessages(messages: AIMessage[]): AIMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
      timestamp: msg.timestamp || new Date(),
    }));
  },

  /**
   * Calculate token count (rough estimation)
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  },

  /**
   * Truncate text to fit token limit
   */
  truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    const ratio = maxTokens / estimatedTokens;
    const truncatedLength = Math.floor(text.length * ratio);
    return text.substring(0, truncatedLength) + "...";
  },

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, maxKeywords: number = 5): string[] {
    // Simple keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Sort by frequency and return top keywords
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  },

  /**
   * Determine if content needs AI processing
   */
  needsAIProcessing(content: string): boolean {
    const indicators = [/\?/, /how to/i, /help/i, /issue/i, /problem/i, /error/i, /support/i];

    return indicators.some((pattern) => pattern.test(content));
  },

  /**
   * Calculate confidence score for AI response
   */
  calculateConfidence(response: string, context: string[]): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for uncertain language
    const uncertainWords = ["maybe", "perhaps", "might", "could be", "not sure"];
    const hasUncertainty = uncertainWords.some((word) => response.toLowerCase().includes(word));

    if (hasUncertainty) {
      confidence -= 0.3;
    }

    // Increase confidence if response references context
    const contextWords = context.flatMap((c) => c.toLowerCase().split(/\s+/));
    const responseWords = response.toLowerCase().split(/\s+/);
    const contextMatches = responseWords.filter((word) => contextWords.includes(word)).length;

    if (contextMatches > 0) {
      confidence += Math.min(0.2, contextMatches * 0.05);
    }

    return Math.max(0, Math.min(1, confidence));
  },

  /**
   * Format AI response for display
   */
  formatResponse(response: AIResponse): string {
    return response.content
      .trim()
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines
      .replace(/\s{2,}/g, " "); // Replace multiple spaces
  },

  /**
   * Validate AI configuration
   */
  validateConfig(config: Partial<AIConfig>): AIConfig {
    return {
      model: config.model || DEFAULT_AI_CONFIG.model,
      temperature: Math.max(0, Math.min(2, config.temperature || DEFAULT_AI_CONFIG.temperature)),
      maxTokens: Math.max(1, Math.min(4000, config.maxTokens || DEFAULT_AI_CONFIG.maxTokens)),
      topP: Math.max(0, Math.min(1, config.topP || DEFAULT_AI_CONFIG.topP)),
      frequencyPenalty: Math.max(-2, Math.min(2, config.frequencyPenalty || DEFAULT_AI_CONFIG.frequencyPenalty)),
      presencePenalty: Math.max(-2, Math.min(2, config.presencePenalty || DEFAULT_AI_CONFIG.presencePenalty)),
    };
  },
};
