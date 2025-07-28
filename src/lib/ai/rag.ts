/**
 * Enhanced RAG Service - Phase 4: AI Mastery
 *
 * Forge human-indistinguishable RAG with 70%+ autonomous resolution
 * Features:
 * - Empathetic organization-aware prompts
 * - Human-like response timing (500-2000ms delays)
 * - Fine-tuned confidence thresholds (<0.7 triggers handover)
 * - Personalized responses with organization context
 */

import { generateCompletion, generateEmbedding } from "./core";
import { createClient } from "@/lib/supabase/server";

export interface RAGContext {
  conversationId: string;
  organizationId: string;
  organizationName?: string;
  customerName?: string;
  customerEmail?: string;
  messageContent: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  knowledgeChunks?: Array<{
    content: string;
    source: string;
    relevance: number;
  }>;
}

export interface RAGResponse {
  content: string;
  confidence: number;
  sources: Array<{
    content: string;
    source: string;
    relevance: number;
  }>;
  reasoning: string;
  shouldHandover: boolean;
  responseTime: number;
  agentName?: string;
  empathyScore?: number;
}

export class EnhancedRAGService {
  private confidenceThreshold = 0.7;
  private humanDelayRange = { min: 500, max: 2000 };
  private supabase = createClient();

  /**
   * Generate human-indistinguishable RAG response
   */
  async generateResponse(context: RAGContext): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // 1. Retrieve relevant knowledge chunks
      const knowledgeChunks = await this.retrieveKnowledge(context);

      // 2. Build empathetic, organization-aware prompt
      const prompt = await this.buildEmpathicPrompt(context, knowledgeChunks);

      // 3. Simulate human typing delay
      await this.simulateHumanDelay();

      // 4. Generate AI response
      const aiResponse = await generateCompletion({
        system: prompt.system,
        prompt: prompt.user,
        temperature: 0.3, // Slightly more creative for human-like responses
        maxTokens: 500,
        functionId: "enhanced-rag-response",
      });

      // 5. Calculate confidence with enhanced scoring
      const confidence = await this.calculateEnhancedConfidence(context, aiResponse.text, knowledgeChunks);

      // 6. Generate reasoning for transparency
      const reasoning = this.generateReasoning(confidence, knowledgeChunks, context);

      // 7. Determine if handover is needed
      const shouldHandover = confidence < this.confidenceThreshold;

      const response: RAGResponse = {
        content: aiResponse.text,
        confidence,
        sources: knowledgeChunks,
        reasoning,
        shouldHandover,
        responseTime: Date.now() - startTime,
        agentName: this.generateAgentName(context.organizationName),
        empathyScore: this.calculateEmpathyScore(aiResponse.text),
      };

      // 8. Log interaction for learning
      await this.logInteraction(context, response);

      return response;
    } catch (error) {

      return {
        content:
          "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can help you immediately.",
        confidence: 0.1,
        sources: [],
        reasoning: "System error occurred during processing",
        shouldHandover: true,
        responseTime: Date.now() - startTime,
        agentName: "System",
      };
    }
  }

  /**
   * Retrieve relevant knowledge chunks using vector similarity
   */
  private async retrieveKnowledge(context: RAGContext): Promise<
    Array<{
      content: string;
      source: string;
      relevance: number;
    }>
  > {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(context.messageContent);

      // Search knowledge base using vector similarity
      const { data: knowledgeChunks, error } = await this.supabase
        .from("knowledge_chunks")
        .select("content, source, embedding")
        .eq("organization_id", context.organizationId)
        .limit(5);

      if (error) {

        return [];
      }

      // Calculate relevance scores and sort
      const scoredChunks = (knowledgeChunks || [])
        .map((chunk) => ({
          content: chunk.content,
          source: chunk.source || "Knowledge Base",
          relevance: this.calculateCosineSimilarity(queryEmbedding, chunk.embedding || []),
        }))
        .filter((chunk) => chunk.relevance > 0.7) // Only high-relevance chunks
        .sort((a, b) => b.relevance - a.relevance);

      return scoredChunks;
    } catch (error) {

      return [];
    }
  }

  /**
   * Build empathetic, organization-aware prompt
   */
  private async buildEmpathicPrompt(
    context: RAGContext,
    knowledgeChunks: Array<{ content: string; source: string; relevance: number }>
  ): Promise<{ system: string; user: string }> {
    const orgName = context.organizationName || "our company";
    const customerName = context.customerName || "there";

    // Get organization-specific tone and personality
    const orgPersonality = await this.getOrganizationPersonality(context.organizationId);

    const knowledgeContext =
      knowledgeChunks.length > 0
        ? `\n\nRelevant information from our knowledge base:\n${knowledgeChunks
            .map((chunk) => `- ${chunk.content} (Source: ${chunk.source})`)
            .join("\n")}`
        : "";

    const conversationContext =
      context.conversationHistory.length > 0
        ? `\n\nConversation history:\n${context.conversationHistory
            .slice(-3)
            .map((msg) => `${msg.role === "user" ? "Customer" : "Agent"}: ${msg.content}`)
            .join("\n")}`
        : "";

    const system = `You are an empathetic and knowledgeable customer support agent for ${orgName}. 

Your personality: ${orgPersonality.tone} and ${orgPersonality.style}. 
Your goal: Provide helpful, accurate, and genuinely caring responses that make customers feel heard and valued.

Guidelines:
- Be warm, professional, and understanding
- Use the customer's name (${customerName}) naturally in conversation
- Reference specific information from our knowledge base when relevant
- If you're not confident about an answer, be honest and offer to connect them with a specialist
- Show empathy for their situation and acknowledge their feelings
- Provide clear, actionable solutions when possible
- Use natural, conversational language that feels human

Remember: You represent ${orgName} and should embody our values of ${orgPersonality.values}.`;

    const user = `Customer message: "${context.messageContent}"${conversationContext}${knowledgeContext}

Please respond as a caring ${orgName} support agent. Be helpful, empathetic, and professional.`;

    return { system, user };
  }

  /**
   * Simulate human-like response delay
   */
  private async simulateHumanDelay(): Promise<void> {
    const delay = Math.random() * (this.humanDelayRange.max - this.humanDelayRange.min) + this.humanDelayRange.min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Calculate enhanced confidence score
   */
  private async calculateEnhancedConfidence(
    context: RAGContext,
    response: string,
    knowledgeChunks: Array<{ content: string; source: string; relevance: number }>
  ): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Factor 1: Knowledge base relevance (40% weight)
    if (knowledgeChunks.length > 0) {
      const avgRelevance = knowledgeChunks.reduce((sum, chunk) => sum + chunk.relevance, 0) / knowledgeChunks.length;
      confidence += avgRelevance * 0.4;
    }

    // Factor 2: Response completeness (30% weight)
    const responseLength = response.length;
    const completenessScore = Math.min(responseLength / 200, 1); // Optimal around 200 chars
    confidence += completenessScore * 0.3;

    // Factor 3: Conversation context alignment (20% weight)
    if (context.conversationHistory.length > 0) {
      // Simple heuristic: if response mentions previous context
      const lastUserMessage =
        context.conversationHistory.filter((msg) => msg.role === "user").slice(-1)[0]?.content || "";

      const contextAlignment = this.calculateContextAlignment(response, lastUserMessage);
      confidence += contextAlignment * 0.2;
    }

    // Factor 4: Empathy and tone (10% weight)
    const empathyScore = this.calculateEmpathyScore(response);
    confidence += empathyScore * 0.1;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate empathy score based on response content
   */
  private calculateEmpathyScore(response: string): number {
    const empathyIndicators = [
      "understand",
      "sorry",
      "apologize",
      "help",
      "appreciate",
      "thank",
      "welcome",
      "happy",
      "glad",
      "please",
      "certainly",
    ];

    const words = response.toLowerCase().split(/\s+/);
    const empathyCount = words.filter((word) => empathyIndicators.some((indicator) => word.includes(indicator))).length;

    return Math.min((empathyCount / words.length) * 10, 1); // Normalize to 0-1
  }

  /**
   * Calculate context alignment score
   */
  private calculateContextAlignment(response: string, previousMessage: string): number {
    const responseWords = new Set(response.toLowerCase().split(/\s+/));
    const previousWords = new Set(previousMessage.toLowerCase().split(/\s+/));

    const intersection = new Set([...responseWords].filter((word) => previousWords.has(word)));
    const union = new Set([...responseWords, ...previousWords]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Generate reasoning for transparency
   */
  private generateReasoning(
    confidence: number,
    knowledgeChunks: Array<{ content: string; source: string; relevance: number }>,
    context: RAGContext
  ): string {
    const reasons = [];

    if (knowledgeChunks.length > 0) {
      reasons.push(`Found ${knowledgeChunks.length} relevant knowledge sources`);
    } else {
      reasons.push("No specific knowledge base matches found");
    }

    if (confidence >= 0.8) {
      reasons.push("High confidence based on clear knowledge match");
    } else if (confidence >= 0.7) {
      reasons.push("Moderate confidence with good context understanding");
    } else {
      reasons.push("Low confidence - may need human expertise");
    }

    if (context.conversationHistory.length > 0) {
      reasons.push("Considered conversation history for context");
    }

    return reasons.join(". ");
  }

  /**
   * Generate agent name based on organization
   */
  private generateAgentName(organizationName?: string): string {
    const agentNames = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn"];

    // Use organization name to consistently pick the same agent
    const index = organizationName
      ? organizationName.length % agentNames.length
      : Math.floor(Math.random() * agentNames.length);

    return agentNames[index];
  }

  /**
   * Get organization personality settings
   */
  private async getOrganizationPersonality(organizationId: string): Promise<{
    tone: string;
    style: string;
    values: string;
  }> {
    try {
      const { data: org } = await this.supabase
        .from("organizations")
        .select("metadata")
        .eq("id", organizationId)
        .single();

      const personality = org?.metadata?.personality || {};

      return {
        tone: personality.tone || "friendly and professional",
        style: personality.style || "helpful and solution-focused",
        values: personality.values || "customer satisfaction and excellence",
      };
    } catch (error) {
      return {
        tone: "friendly and professional",
        style: "helpful and solution-focused",
        values: "customer satisfaction and excellence",
      };
    }
  }

  /**
   * Log interaction for learning and analytics
   */
  private async logInteraction(context: RAGContext, response: RAGResponse): Promise<void> {
    try {
      await this.supabase.from("ai_interactions").insert({
        conversation_id: context.conversationId,
        organization_id: context.organizationId,
        query: context.messageContent,
        response: response.content,
        confidence: response.confidence,
        sources_used: response.sources.length,
        should_handover: response.shouldHandover,
        response_time: response.responseTime,
        empathy_score: response.empathyScore,
        created_at: new Date().toISOString(),
      });
    } catch (error) {

    }
  }
}

// Singleton instance
let ragServiceInstance: EnhancedRAGService | null = null;

export function getEnhancedRAGService(): EnhancedRAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new EnhancedRAGService();
  }
  return ragServiceInstance;
}
