/**
 * Conversation Summary Tool - Helper2 Style
 *
 * Generates summaries of conversations using existing infrastructure
 * Integrates with conversation-summarization.ts
 */

import { z } from "zod";
import { ConversationSummarizationService } from "@/lib/ai/conversation-summarization";
import { supabase } from "@/lib/supabase";

// Input validation
const conversationSummarySchema = z.object({
  conversationId: z.string(),
  organizationId: z.string(),
  maxMessages: z.number().min(1).max(100).default(50),
  includeMetadata: z.boolean().default(true),
});

// Types
export interface ConversationSummaryParams {
  conversationId: string;
  organizationId: string;
  maxMessages?: number;
  includeMetadata?: boolean;
}

export interface ConversationSummaryResult {
  success: boolean;
  data?: {
    summary: string;
    keyPoints: string[];
    sentiment: "positive" | "neutral" | "negative" | "mixed";
    mainTopics: string[];
    actionItems: string[];
    messageCount: number;
    timespan: {
      start: string;
      end: string;
    };
  };
  error?: string;
  confidence: number;
}

const supabaseClient = supabase.admin();
const summarizationService = new ConversationSummarizationService();

/**
 * Generate conversation summary
 */
export async function summarizeConversation(params: ConversationSummaryParams): Promise<ConversationSummaryResult> {
  try {
    // Validate input
    const validated = conversationSummarySchema.parse(params);

    // Check if summary already exists and is recent
    const existingSummary = await summarizationService.getSummary(validated.conversationId, validated.organizationId);

    if (existingSummary && isRecentSummary(existingSummary.generatedAt)) {
      const summaryData = formatSummaryData(existingSummary);
      return {
        success: true,
        ...(summaryData && { data: summaryData }),
        confidence: 0.95, // High confidence for cached summaries
      };
    }

    // Fetch conversation messages
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select(
        `
        id,
        content,
        sender_type,
        sender_name,
        created_at,
        metadata
      `
      )
      .eq("conversation_id", validated.conversationId)
      .order("created_at", { ascending: false })
      .limit(validated.maxMessages);

    if (fetchError || !messages || messages.length === 0) {
      return {
        success: false,
        error: "No messages found for conversation",
        confidence: 0,
      };
    }

    // Generate new summary
    const summary = await summarizationService.generateSummary({
      conversationId: validated.conversationId,
      organizationId: validated.organizationId,
      messages: messages.reverse(), // Chronological order
      includeActionItems: true,
      includeSentiment: true,
    });

    if (!summary) {
      return {
        success: false,
        error: "Failed to generate summary",
        confidence: 0,
      };
    }

    const summaryData = formatSummaryData(summary);
    return {
      success: true,
      ...(summaryData && { data: summaryData }),
      confidence: calculateSummaryConfidence(summary, messages.length),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e: unknown) => e.message).join(", ")}`,
        confidence: 0,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      confidence: 0,
    };
  }
}

/**
 * Format summary data for response
 */
function formatSummaryData(summary: unknown): ConversationSummaryResult["data"] {
  return {
    summary: summary.summary,
    keyPoints: summary.keyPoints || [],
    sentiment: summary.sentiment || "neutral",
    mainTopics: summary.topics || [],
    actionItems: summary.actionItems || [],
    messageCount: summary.messageCount || 0,
    timespan: {
      start: summary.startTime || new Date().toISOString(),
      end: summary.endTime || new Date().toISOString(),
    },
  };
}

/**
 * Check if summary is recent (within 1 hour)
 */
function isRecentSummary(generatedAt: string): boolean {
  const summaryTime = new Date(generatedAt).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  return now - summaryTime < oneHour;
}

/**
 * Calculate confidence based on summary quality
 */
function calculateSummaryConfidence(summary: any, messageCount: number): number {
  let confidence = 0.7; // Base confidence

  // Adjust based on message count
  if (messageCount >= 10) confidence += 0.1;
  if (messageCount >= 20) confidence += 0.1;

  // Adjust based on summary completeness
  if (summary.keyPoints?.length > 0) confidence += 0.05;
  if (summary.actionItems?.length > 0) confidence += 0.05;

  return Math.min(confidence, 1.0);
}

/**
 * Helper function to format summary for AI context
 */
export function formatSummaryContext(summary: ConversationSummaryResult["data"]): string {
  if (!summary) return "No conversation summary available.";

  const parts = [`Conversation Summary:\n${summary.summary}`];

  if (summary.keyPoints.length > 0) {
    parts.push(`\nKey Points:\n${summary.keyPoints.map((p: unknown) => `- ${p}`).join("\n")}`);
  }

  if (summary.actionItems.length > 0) {
    parts.push(`\nAction Items:\n${summary.actionItems.map((a: unknown) => `- ${a}`).join("\n")}`);
  }

  parts.push(`\nSentiment: ${summary.sentiment}`);
  parts.push(`Messages analyzed: ${summary.messageCount}`);

  return parts.join("\n");
}

/**
 * Get quick conversation insights without full summary
 */
export async function getQuickInsights(
  conversationId: string,
  organizationId: string
): Promise<{
  messageCount: number;
  participants: string[];
  duration: number;
  lastMessageAt: string;
}> {
  const { data: messages } = await supabase
    .from("messages")
    .select("sender_name, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return {
      messageCount: 0,
      participants: [],
      duration: 0,
      lastMessageAt: new Date().toISOString(),
    };
  }

  const participants = [...new Set(messages.map((m: unknown) => m.sender_name).filter(Boolean))];
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  if (!firstMessage || !lastMessage) {
    return {
      messageCount: messages.length,
      participants,
      duration: 0,
      lastMessageAt: null,
    };
  }

  const duration =
    new Date(lastMessage.created_at || new Date()).getTime() -
    new Date(firstMessage.created_at || new Date()).getTime();

  return {
    messageCount: messages.length,
    participants,
    duration,
    lastMessageAt: lastMessage.created_at,
  };
}
