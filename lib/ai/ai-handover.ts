/**
 * AI Handover Service
 * Manages the handover process from AI to human agents
 */

import { createApiClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { analyzeSentiment } from "./sentiment";

export enum HandoverReason {
  LOW_CONFIDENCE = "low_confidence",
  USER_REQUEST = "user_request",
  SENTIMENT_NEGATIVE = "sentiment_negative",
  COMPLEX_QUERY = "complex_query",
  POLICY_VIOLATION = "policy_violation",
  TECHNICAL_ERROR = "technical_error",
  HIGH_VALUE_CUSTOMER = "high_value_customer",
  REPEATED_QUESTION = "repeated_question",
}

export enum HandoverPriority {
  URGENT = "urgent",
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low",
}

export interface HandoverContext {
  conversationId: string;
  reason: HandoverReason;
  priority: HandoverPriority;
  confidence: number;
  summary: string;
  suggestedActions: string[];
  customerSentiment: "positive" | "neutral" | "negative";
  metadata: Record<string, any>;
}

export interface HandoverStats {
  totalHandovers: number;
  byReason: Record<HandoverReason, number>;
  byPriority: Record<HandoverPriority, number>;
  averageConfidence: number;
  averageTimeToHandover: number; // in seconds
}

class AIHandoverService {
  private supabase: ReturnType<typeof createApiClient>;

  constructor() {
    this.supabase = createApiClient();
  }

  /**
   * Evaluate if handover to human is needed
   */
  async evaluateHandoverNeed(
    conversationId: string,
    lastMessage: string,
    confidence: number,
    organizationId: string
  ): Promise<{ shouldHandover: boolean; reason?: HandoverReason; priority?: HandoverPriority }> {
    // Get organization settings
    const { data: settings } = await this.supabase
      .from("organization_settings")
      .select("confidence_threshold, auto_handover_enabled")
      .eq("organization_id", organizationId)
      .single();

    const confidenceThreshold = settings?.confidence_threshold || 0.6;
    const autoHandoverEnabled = settings?.auto_handover_enabled ?? true;

    if (!autoHandoverEnabled) {
      return { shouldHandover: false };
    }

    // Check confidence threshold
    if (confidence < confidenceThreshold) {
      return {
        shouldHandover: true,
        reason: HandoverReason.LOW_CONFIDENCE,
        priority: confidence < 0.3 ? HandoverPriority.HIGH : HandoverPriority.NORMAL,
      };
    }

    // Check for explicit handover request
    const handoverPhrases = [
      "speak to human",
      "talk to agent",
      "human agent",
      "real person",
      "transfer me",
      "escalate",
    ];

    const lowerMessage = lastMessage.toLowerCase();
    if (handoverPhrases.some((phrase) => lowerMessage.includes(phrase))) {
      return {
        shouldHandover: true,
        reason: HandoverReason.USER_REQUEST,
        priority: HandoverPriority.HIGH,
      };
    }

    // Check sentiment
    const sentiment = analyzeSentiment(lastMessage);
    if (sentiment.sentiment.compound < -0.5 || sentiment.urgency === "high") {
      return {
        shouldHandover: true,
        reason: HandoverReason.SENTIMENT_NEGATIVE,
        priority: sentiment.urgency === "high" ? HandoverPriority.URGENT : HandoverPriority.HIGH,
      };
    }

    // Check for repeated questions (simplified)
    const { data: recentMessages } = await this.supabase
      .from("messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentMessages && recentMessages.length > 3) {
      const lastThreeMessages = recentMessages.slice(0, 3).map((m) => m.content.toLowerCase());
      const hasSimilarMessages = lastThreeMessages.every((msg) => this.calculateSimilarity(msg, lowerMessage) > 0.8);

      if (hasSimilarMessages) {
        return {
          shouldHandover: true,
          reason: HandoverReason.REPEATED_QUESTION,
          priority: HandoverPriority.HIGH,
        };
      }
    }

    return { shouldHandover: false };
  }

  /**
   * Create handover context for human agent
   */
  async createHandoverContext(
    conversationId: string,
    reason: HandoverReason,
    confidence: number
  ): Promise<HandoverContext> {
    // Get conversation details
    const { data: conversation } = await this.supabase
      .from("conversations")
      .select(
        `
        *,
        messages(
          content,
          role,
          created_at
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Generate summary
    const summary = await this.generateConversationSummary(conversation.messages || []);

    // Analyze sentiment
    const sentimentAnalysis = analyzeSentiment(
      conversation.messages
        ?.filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" ") || ""
    );

    // Determine priority
    const priority = this.determinePriority(reason, confidence, sentimentAnalysis.sentiment.compound);

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(reason, sentimentAnalysis);

    return {
      conversationId,
      reason,
      priority,
      confidence,
      summary,
      suggestedActions,
      customerSentiment: this.mapSentimentToCategory(sentimentAnalysis.sentiment.compound),
      metadata: {
        messageCount: conversation.messages?.length || 0,
        conversationDuration: this.calculateDuration(conversation),
        lastUserMessage: conversation.messages?.filter((m) => m.role === "user").pop()?.content || "",
      },
    };
  }

  /**
   * Execute handover to human agent
   */
  async executeHandover(context: HandoverContext): Promise<void> {
    const { conversationId, reason, priority } = context;

    // Update conversation status
    await this.supabase
      .from("conversations")
      .update({
        status: "pending",
        escalated_to_human: true,
        escalation_reason: reason,
        escalation_priority: priority,
        escalated_at: new Date().toISOString(),
        ai_summary: context.summary,
        suggested_actions: context.suggestedActions,
      })
      .eq("id", conversationId);

    // Create handover event
    await this.supabase.from("conversation_events").insert({
      conversation_id: conversationId,
      event_type: "handover_initiated",
      data: {
        reason,
        priority,
        confidence: context.confidence,
        sentiment: context.customerSentiment,
      },
      created_at: new Date().toISOString(),
    });

    // Notify available agents (this would trigger real-time notifications)
    await this.notifyAgents(context);
  }

  /**
   * Get handover statistics
   */
  async getHandoverStats(organizationId: string, timeRange: "24h" | "7d" | "30d" = "7d"): Promise<HandoverStats> {
    const startDate = this.getStartDate(timeRange);

    const { data: handovers } = await this.supabase
      .from("conversations")
      .select("escalation_reason, escalation_priority, escalated_at, created_at")
      .eq("organization_id", organizationId)
      .eq("escalated_to_human", true)
      .gte("escalated_at", startDate.toISOString());

    if (!handovers || handovers.length === 0) {
      return {
        totalHandovers: 0,
        byReason: {} as Record<HandoverReason, number>,
        byPriority: {} as Record<HandoverPriority, number>,
        averageConfidence: 0,
        averageTimeToHandover: 0,
      };
    }

    // Calculate statistics
    const byReason = handovers.reduce(
      (acc, h) => {
        const reason = h.escalation_reason as HandoverReason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<HandoverReason, number>
    );

    const byPriority = handovers.reduce(
      (acc, h) => {
        const priority = h.escalation_priority as HandoverPriority;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<HandoverPriority, number>
    );

    // Calculate average time to handover
    const timesToHandover = handovers
      .filter((h) => h.escalated_at && h.created_at)
      .map((h) => {
        const created = new Date(h.created_at).getTime();
        const escalated = new Date(h.escalated_at!).getTime();
        return (escalated - created) / 1000; // Convert to seconds
      });

    const averageTimeToHandover =
      timesToHandover.length > 0 ? timesToHandover.reduce((sum, time) => sum + time, 0) / timesToHandover.length : 0;

    // Get average confidence from AI sessions
    const { data: sessions } = await this.supabase
      .from("ai_sessions")
      .select("confidence_score")
      .eq("organization_id", organizationId)
      .eq("escalated_to_human", true)
      .gte("created_at", startDate.toISOString());

    const averageConfidence =
      sessions && sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / sessions.length
        : 0;

    return {
      totalHandovers: handovers.length,
      byReason,
      byPriority,
      averageConfidence,
      averageTimeToHandover,
    };
  }

  /**
   * Private helper methods
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private async generateConversationSummary(messages: unknown[]): Promise<string> {
    // Simple summary generation
    const userMessages = messages.filter((m) => (m as unknown).role === "user");
    const lastFewMessages = userMessages.slice(-3);

    if (lastFewMessages.length === 0) {
      return "No messages in conversation yet.";
    }

    const topics = lastFewMessages
      .map((m) => (m as unknown).content)
      .join(" ")
      .split(/\s+/)
      .filter((word) => word.length > 5)
      .slice(0, 5);

    return `Customer discussing: ${topics.join(", ")}. ${userMessages.length} messages exchanged.`;
  }

  private determinePriority(reason: HandoverReason, confidence: number, sentiment: number): HandoverPriority {
    if (reason === HandoverReason.POLICY_VIOLATION || reason === HandoverReason.HIGH_VALUE_CUSTOMER) {
      return HandoverPriority.URGENT;
    }

    if (sentiment < -0.7 || confidence < 0.2) {
      return HandoverPriority.HIGH;
    }

    if (reason === HandoverReason.USER_REQUEST || reason === HandoverReason.REPEATED_QUESTION) {
      return HandoverPriority.HIGH;
    }

    return HandoverPriority.NORMAL;
  }

  private generateSuggestedActions(reason: HandoverReason, sentiment: unknown): string[] {
    const actions: string[] = [];

    if (reason === HandoverReason.SENTIMENT_NEGATIVE) {
      actions.push("Acknowledge customer frustration");
      actions.push("Offer immediate assistance");
      if ((sentiment as unknown).urgency === "high") {
        actions.push("Expedite resolution");
      }
    }

    if (reason === HandoverReason.REPEATED_QUESTION) {
      actions.push("Review previous responses");
      actions.push("Clarify customer's specific concern");
      actions.push("Provide detailed explanation");
    }

    if (reason === HandoverReason.LOW_CONFIDENCE) {
      actions.push("Verify customer's request");
      actions.push("Gather additional information");
    }

    if (actions.length === 0) {
      actions.push("Review conversation history");
      actions.push("Provide personalized assistance");
    }

    return actions;
  }

  private mapSentimentToCategory(compound: number): "positive" | "neutral" | "negative" {
    if (compound > 0.3) return "positive";
    if (compound < -0.3) return "negative";
    return "neutral";
  }

  private calculateDuration(conversation: unknown): number {
    const typedConversation = conversation as unknown;
    if (!typedConversation.messages || typedConversation.messages.length < 2) {
      return 0;
    }

    const firstMessage = typedConversation.messages[0];
    const lastMessage = typedConversation.messages[typedConversation.messages.length - 1];

    return Math.floor(
      (new Date(lastMessage.created_at).getTime() - new Date(firstMessage.created_at).getTime()) / 1000 / 60
    ); // Return in minutes
  }

  private async notifyAgents(context: HandoverContext): Promise<void> {
    // This would integrate with the real-time notification system
    // For now, just log

  }

  private getStartDate(timeRange: "24h" | "7d" | "30d"): Date {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

// Singleton instance
let handoverService: AIHandoverService | null = null;

/**
 * Get the AI handover service instance
 */
export function getAIHandoverService(): AIHandoverService {
  if (!handoverService) {
    handoverService = new AIHandoverService();
  }
  return handoverService;
}
