/**
 * Simplified AI Service - Helper2 Style
 * Replaces 60+ complex AI classes with simple exported functions
 * Direct OpenAI calls with minimal abstraction
 */

import { supabase } from "@/lib/supabase";
import { env } from "@/lib/utils/env-config";

// Re-export from core module
export { generateEmbedding } from "./core";

// Re-export all types from centralized types file
export * from "./types";

// Re-export service instances
export { confidenceAnalytics, getConfidenceAnalyticsService } from "./confidence-analytics";
export { thresholdTuner, getThresholdTuningService } from "./threshold-tuning";
export { knowledgeProfileManager, getKnowledgeProfileManager } from "./knowledge-profile-manager";
export { ragHandler } from "./rag-handler";
export { unifiedRAGService } from "./rag/UnifiedRAGService";

// Local types for backward compatibility
export interface AIResponse {
  content: string;
  confidence: number;
  shouldHandover: boolean;
  reasoning?: string;
}

export interface ConversationContext {
  conversationId: string;
  organizationId: string;
  messages: Array<{
    content: string;
    senderType: "visitor" | "agent" | "ai";
    created_at: string;
  }>;
  customerProfile?: {
    name?: string;
    email?: string;
    previousInteractions?: number;
  };
}

// Simple OpenAI client
async function callOpenAI(messages: unknown[], model = "gpt-4o-mini"): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Simple confidence calculation
function calculateConfidence(response: string, context: ConversationContext): number {
  // Simple heuristics - replace complex confidence engines
  let confidence = 0.8; // Base confidence

  // Reduce confidence for complex questions
  if (response.includes("I'm not sure") || response.includes("unclear")) {
    confidence -= 0.3;
  }

  // Increase confidence for simple responses
  if (response.length < 100 && !response.includes("?")) {
    confidence += 0.1;
  }

  // Consider conversation length
  if (context.messages.length > 5) {
    confidence -= 0.1; // Longer conversations are more complex
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

// Simple handover decision
function shouldHandover(confidence: number, context: ConversationContext): boolean {
  // Simple rules - replace complex handover engines
  if (confidence < 0.6) return true;
  if (context.messages.length > 8) return true;

  // Check for handover keywords in recent messages
  const recentMessages = context.messages.slice(-3);
  const handoverKeywords = ["speak to human", "talk to agent", "escalate", "manager", "supervisor"];

  for (const message of recentMessages) {
    if (handoverKeywords.some((keyword) => message.content.toLowerCase().includes(keyword))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate AI response for a conversation
 * Replaces: ChatAgent, SupportAgent, UnifiedAIPipeline, etc.
 */
export async function generateAIResponse(context: ConversationContext): Promise<AIResponse> {
  try {
    // Build conversation history for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are a helpful customer support assistant. Be concise, friendly, and professional. 
        If you're unsure about something, say so clearly. Customer name: ${context.customerProfile?.name || "Customer"}`,
      },
      ...context.messages.map((msg: unknown) => ({
        role: msg.senderType === "visitor" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    // Get AI response
    const content = await callOpenAI(messages);

    // Calculate confidence and handover decision
    const confidence = calculateConfidence(content, context);
    const shouldHandoverDecision = shouldHandover(confidence, context);

    return {
      content,
      confidence,
      shouldHandover: shouldHandoverDecision,
      ...(shouldHandoverDecision && {
        reasoning: `Low confidence (${confidence.toFixed(2)}) or complex conversation`,
      }),
    };
  } catch (error) {
    // Fallback response
    return {
      content:
        "I'm having trouble processing your request right now. Let me connect you with a human agent who can help you better.",
      confidence: 0.1,
      shouldHandover: true,
      reasoning: "AI system error - automatic handover",
    };
  }
}

/**
 * Process AI handover
 * Replaces: ai-handover-poller, production-ai-handover, etc.
 */
export async function processAIHandover(conversationId: string, organizationId: string, reason: string): Promise<void> {
  const supabaseClient = supabase.admin();

  try {
    // Update conversation status
    await supabase
      .from("conversations")
      .update({
        status: "open",
        assignedtoai: false,
        ai_handover_reason: reason,
        ai_handover_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    // Log handover event
    await supabase.from("ai_usage_events").insert({
      conversation_id: conversationId,
      organization_id: organizationId,
      event_type: "handover",
      metadata: { reason },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get conversation summary
 * Replaces: generateConversationSummary, context-analyzer, etc.
 */
export async function getConversationSummary(context: ConversationContext): Promise<string> {
  if (context.messages.length === 0) {
    return "No messages in conversation";
  }

  if (context.messages.length <= 3) {
    return "Brief conversation - no summary needed";
  }

  try {
    const messages = [
      {
        role: "system",
        content:
          "Summarize this customer support conversation in 2-3 sentences. Focus on the main issue and resolution status.",
      },
      {
        role: "user",
        content: context.messages.map((msg: unknown) => `${msg.senderType}: ${msg.content}`).join("\n"),
      },
    ];

    return await callOpenAI(messages);
  } catch (error) {
    return "Summary unavailable due to processing error";
  }
}

/**
 * Simple RAG search
 * Replaces: rag-service, rag-handler, VectorOperationsEngine, etc.
 */
export async function searchKnowledge(
  query: string,
  organizationId: string
): Promise<Array<{ content: string; score: number }>> {
  const supabaseClient = supabase.admin();

  try {
    // Simple text search - replace complex vector operations
    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .select("content, title")
      .eq("organization_id", organizationId)
      .textSearch("content", query)
      .limit(5);

    if (error) throw error;

    return (data || []).map((item: unknown) => ({
      content: `${item.title}: ${item.content}`,
      score: 0.8, // Simple static score - replace complex similarity calculations
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Check if AI should handle conversation
 * Replaces: ai-confidence-service, threshold-tuning, etc.
 */
export function shouldAIHandle(context: ConversationContext): boolean {
  // Simple rules - replace complex decision engines

  // Don't handle if already has many messages (complex conversation)
  if (context.messages.length > 6) return false;

  // Don't handle if customer explicitly asks for human
  const recentMessage = context.messages[context.messages.length - 1]?.content.toLowerCase() || "";
  const humanKeywords = ["human", "agent", "person", "representative", "manager"];

  if (humanKeywords.some((keyword) => recentMessage.includes(keyword))) {
    return false;
  }

  // Handle simple questions
  return true;
}

// Export simplified interface
export const AI = {
  generateResponse: generateAIResponse,
  processHandover: processAIHandover,
  getSummary: getConversationSummary,
  searchKnowledge,
  shouldHandle: shouldAIHandle,
};

/**
 * Run AI query with structured output
 * Simple replacement for complex AI query functions
 */
export async function runAIObjectQuery<T>({
  mailbox,
  queryType,
  schema,
  system,
  prompt,
}: {
  mailbox?: unknown;
  queryType: string;
  schema: unknown;
  system: string;
  prompt?: string;
}): Promise<T> {
  try {
    const messages = [
      {
        role: "system",
        content: `${system}\n\nRespond with valid JSON matching the specified schema.`,
      },
      ...(prompt ? [{ role: "user" as const, content: prompt }] : []),
    ];

    const response = await callOpenAI(messages, "gpt-4o-mini");

    // Parse JSON response
    const result = JSON.parse(response);

    // Validate with zod schema if provided
    if (schema && schema.parse) {
      return schema.parse(result);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Run simple AI query
 * Returns plain text response
 */
export async function runAIQuery({
  system,
  prompt,
  model = "gpt-4o-mini",
}: {
  system: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  try {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ];

    return await callOpenAI(messages, model);
  } catch (error) {
    throw error;
  }
}
