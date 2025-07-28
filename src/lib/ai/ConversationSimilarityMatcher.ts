/**
 * Conversation Similarity Matcher
 * Finds similar conversations and patterns for AI assistance
 */

export interface SimilarityMatch {
  conversationId: string;
  similarity: number;
  matchType: "content" | "intent" | "resolution" | "keywords";
  matchedContent: string;
  confidence: number;
  metadata?: {
    customerType?: string;
    category?: string;
    resolution?: string;
    tags?: string[];
  };
}

export interface ConversationMatch extends SimilarityMatch {
  conversationTitle?: string;
  timestamp: string;
  status: "resolved" | "pending" | "active";
}

export interface ConversationCluster {
  id: string;
  label: string;
  conversations: ConversationMatch[];
  centroid: number[];
  size: number;
  avgSimilarity: number;
}

export interface SimilarityConfig {
  threshold: number;
  maxResults: number;
  includeResolved: boolean;
  weightContent: number;
  weightIntent: number;
  weightResolution: number;
}

export interface ConversationContext {
  id: string;
  content: string;
  intent?: string;
  category?: string;
  tags?: string[];
  customerType?: string;
  resolution?: string;
  sentiment?: "positive" | "negative" | "neutral";
  priority?: "low" | "medium" | "high" | "urgent";
}

export class ConversationSimilarityMatcher {
  private defaultConfig: SimilarityConfig = {
    threshold: 0.7,
    maxResults: 5,
    includeResolved: true,
    weightContent: 0.4,
    weightIntent: 0.3,
    weightResolution: 0.3,
  };

  constructor(private config: Partial<SimilarityConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Find similar conversations to the given context
   */
  async findSimilarConversations(
    currentContext: ConversationContext,
    conversationPool: ConversationContext[]
  ): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];

    for (const conversation of conversationPool) {
      if (conversation.id === currentContext.id) {
        continue; // Skip self
      }

      const similarity = this.calculateSimilarity(currentContext, conversation);

      if (similarity >= this.config.threshold!) {
        matches.push({
          conversationId: conversation.id,
          similarity,
          matchType: this.getPrimaryMatchType(currentContext, conversation),
          matchedContent: this.getMatchedContent(currentContext, conversation),
          confidence: this.calculateConfidence(similarity),
          metadata: {
            ...(conversation.customerType && { customerType: conversation.customerType }),
            ...(conversation.category && { category: conversation.category }),
            ...(conversation.resolution && { resolution: conversation.resolution }),
            ...(conversation.tags && { tags: conversation.tags }),
          },
        });
      }
    }

    // Sort by similarity score (descending)
    matches.sort((a, b) => b.similarity - a.similarity);

    // Return top results
    return matches.slice(0, this.config.maxResults);
  }

  /**
   * Calculate similarity between two conversations
   */
  private calculateSimilarity(context1: ConversationContext, context2: ConversationContext): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Content similarity
    const contentSim = this.calculateContentSimilarity(context1.content, context2.content);
    totalScore += contentSim * this.config.weightContent!;
    totalWeight += this.config.weightContent!;

    // Intent similarity
    if (context1.intent && context2.intent) {
      const intentSim = this.calculateIntentSimilarity(context1.intent, context2.intent);
      totalScore += intentSim * this.config.weightIntent!;
      totalWeight += this.config.weightIntent!;
    }

    // Resolution similarity
    if (context1.resolution && context2.resolution) {
      const resolutionSim = this.calculateResolutionSimilarity(context1.resolution, context2.resolution);
      totalScore += resolutionSim * this.config.weightResolution!;
      totalWeight += this.config.weightResolution!;
    }

    // Tag overlap
    if (context1.tags && context2.tags) {
      const tagSim = this.calculateTagSimilarity(context1.tags, context2.tags);
      totalScore += tagSim * 0.2; // Additional weight for tags
      totalWeight += 0.2;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate content similarity using basic text analysis
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = this.tokenize(content1.toLowerCase());
    const words2 = this.tokenize(content2.toLowerCase());

    const intersection = words1.filter((word) => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Calculate intent similarity
   */
  private calculateIntentSimilarity(intent1: string, intent2: string): number {
    // Exact match
    if (intent1 === intent2) return 1.0;

    // Partial match for similar intents
    const similarIntents: Record<string, string[]> = {
      support: ["help", "assistance", "question"],
      billing: ["payment", "invoice", "charge"],
      technical: ["bug", "error", "issue"],
      feature: ["request", "enhancement", "suggestion"],
    };

    for (const [category, intents] of Object.entries(similarIntents)) {
      if (intents.includes(intent1) && intents.includes(intent2)) {
        return 0.8;
      }
    }

    return 0.0;
  }

  /**
   * Calculate resolution similarity
   */
  private calculateResolutionSimilarity(resolution1: string, resolution2: string): number {
    // Simple keyword-based similarity
    const keywords1 = this.extractKeywords(resolution1);
    const keywords2 = this.extractKeywords(resolution2);

    const intersection = keywords1.filter((word) => keywords2.includes(word));
    const union = [...new Set([...keywords1, ...keywords2])];

    return intersection.length / Math.max(union.length, 1);
  }

  /**
   * Calculate tag similarity
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    const intersection = tags1.filter((tag) => tags2.includes(tag));
    const union = [...new Set([...tags1, ...tags2])];

    return intersection.length / Math.max(union.length, 1);
  }

  /**
   * Get primary match type
   */
  private getPrimaryMatchType(
    context1: ConversationContext,
    context2: ConversationContext
  ): SimilarityMatch["matchType"] {
    const contentSim = this.calculateContentSimilarity(context1.content, context2.content);

    let intentSim = 0;
    if (context1.intent && context2.intent) {
      intentSim = this.calculateIntentSimilarity(context1.intent, context2.intent);
    }

    let resolutionSim = 0;
    if (context1.resolution && context2.resolution) {
      resolutionSim = this.calculateResolutionSimilarity(context1.resolution, context2.resolution);
    }

    let keywordSim = 0;
    if (context1.tags && context2.tags) {
      keywordSim = this.calculateTagSimilarity(context1.tags, context2.tags);
    }

    // Return the type with highest similarity
    const scores = [
      { type: "content" as const, score: contentSim },
      { type: "intent" as const, score: intentSim },
      { type: "resolution" as const, score: resolutionSim },
      { type: "keywords" as const, score: keywordSim },
    ];

    return scores.sort((a, b) => b.score - a.score)[0]?.type || "content";
  }

  /**
   * Get matched content snippet
   */
  private getMatchedContent(context1: ConversationContext, context2: ConversationContext): string {
    // Return a snippet of the matched conversation
    const words = context2.content.split(" ");
    if (words.length <= 20) {
      return context2.content;
    }
    return words.slice(0, 20).join(" ") + "...";
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(similarity: number): number {
    // Convert similarity to confidence percentage
    return Math.min(similarity * 100, 100);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !this.isStopWord(word));
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = this.tokenize(text.toLowerCase());

    // Simple keyword extraction - in production, use more sophisticated methods
    const keywords = words.filter((word) => word.length > 3 && !this.isStopWord(word) && !this.isCommonWord(word));

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Check if word is too common
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      "user",
      "customer",
      "issue",
      "problem",
      "help",
      "please",
      "thank",
      "thanks",
      "time",
      "need",
      "want",
      "like",
      "know",
      "think",
      "good",
      "great",
      "work",
    ]);
    return commonWords.has(word.toLowerCase());
  }

  /**
   * Cluster conversations by similarity
   */
  async clusterConversations(
    organizationId: string,
    options: { timeWindow: { days: number } }
  ): Promise<ConversationCluster[]> {
    // Mock implementation - in real app, this would use vector clustering
    return [
      {
        id: "cluster-1",
        label: "Billing Issues",
        conversations: [],
        centroid: [0.1, 0.2, 0.3],
        size: 5,
        avgSimilarity: 0.85,
      },
      {
        id: "cluster-2",
        label: "Technical Support",
        conversations: [],
        centroid: [0.4, 0.5, 0.6],
        size: 8,
        avgSimilarity: 0.78,
      },
    ];
  }

  /**
   * Get conversation insights
   */
  async getConversationInsights(
    organizationId: string,
    options: { days: number }
  ): Promise<{
    patterns: Array<{ pattern: string; frequency: number; sentiment: string }>;
    recommendations: Array<{ text: string; confidence: number }>;
  }> {
    // Mock implementation - in real app, this would analyze conversation patterns
    return {
      patterns: [
        { pattern: "Password reset requests", frequency: 15, sentiment: "neutral" },
        { pattern: "Billing inquiries", frequency: 8, sentiment: "negative" },
      ],
      recommendations: [
        { text: "Consider adding a self-service password reset option", confidence: 0.9 },
        { text: "Improve billing documentation", confidence: 0.7 },
      ],
    };
  }
}

// Export singleton instance with default config
export const conversationSimilarityMatcher = new ConversationSimilarityMatcher();

// Export factory function for custom configurations
export function createSimilarityMatcher(config: Partial<SimilarityConfig>): ConversationSimilarityMatcher {
  return new ConversationSimilarityMatcher(config);
}
