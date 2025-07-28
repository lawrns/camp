/**
 * AI Conversation Summarization Service
 *
 * Auto-generates conversation summaries for:
 * - Handovers between AI and human agents
 * - Ticket creation and escalation
 * - Customer service analytics
 * - Quality assurance reviews
 */

import { openaiService } from "@/lib/ai/openai";
import type { SentimentAlert } from "@/lib/ai/real-time-sentiment";
import type { RoutingResult, SmartRoutingService } from "@/lib/ai/smart-routing";
import { supabase } from "@/lib/supabase";

const supabaseClient = supabase.admin();

export interface ConversationSummary {
  id: string;
  conversationId: string;
  organizationId: string;
  summary: string;
  keyPoints: string[];
  resolution: string | null;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high" | "critical";
  tags: string[];
  duration: number; // in minutes
  messageCount: number;
  participantCount: number;
  handoverReason?: string;
  ticketInfo?: {
    shouldCreateTicket: boolean;
    suggestedTitle: string;
    suggestedCategory: string;
    suggestedPriority: "low" | "medium" | "high" | "urgent";
  };
  metadata: {
    createdAt: string;
    generatedBy: "ai" | "human";
    confidence: number;
    version: string;
  };
}

export interface SummarizationRequest {
  conversationId: string;
  organizationId: string;
  purpose: "handover" | "ticket_creation" | "analytics" | "quality_review";
  context?: {
    handoverReason?: string;
    sentimentAlert?: SentimentAlert;
    routingResult?: RoutingResult;
    agentId?: string;
    customerId?: string;
  };
  options?: {
    includeTicketRecommendation?: boolean;
    includeSentimentAnalysis?: boolean;
    maxSummaryLength?: number;
    language?: string;
  };
}

export class ConversationSummarizationService {
  /**
   * Generate comprehensive conversation summary
   */
  async generateSummary(request: SummarizationRequest): Promise<ConversationSummary | null> {
    try {
      // Get conversation data
      const conversationData = await this.getConversationData(request.conversationId, request.organizationId);

      if (!conversationData || conversationData.messages.length === 0) {
        return null;
      }

      // Generate AI summary based on purpose
      const aiSummary = await this.generateAISummary(conversationData, request);

      // Analyze sentiment and urgency
      const sentimentAnalysis = await this.analyzeSentimentAndUrgency(conversationData.messages);

      // Extract key points and tags
      const keyPoints = await this.extractKeyPoints(conversationData.messages, request.purpose);
      const tags = await this.generateTags(conversationData.messages, aiSummary);

      // Generate ticket recommendation if requested
      let ticketInfo = undefined;
      if (request.options?.includeTicketRecommendation || request.purpose === "ticket_creation") {
        ticketInfo = await this.generateTicketRecommendation(conversationData, aiSummary, sentimentAnalysis);
      }

      // Calculate conversation metrics
      const duration = this.calculateConversationDuration(conversationData.messages);
      const participantCount = this.calculateParticipantCount(conversationData.messages);

      const summary: ConversationSummary = {
        id: `summary-${Date.now()}`,
        conversationId: request.conversationId,
        organizationId: request.organizationId,
        summary: aiSummary,
        keyPoints,
        resolution: this.extractResolution(conversationData.messages),
        sentiment: sentimentAnalysis.sentiment,
        urgency: sentimentAnalysis.urgency,
        tags,
        duration,
        messageCount: conversationData.messages.length,
        participantCount,
        handoverReason: request.context?.handoverReason,
        ticketInfo,
        metadata: {
          createdAt: new Date().toISOString(),
          generatedBy: "ai",
          confidence: 0.85,
          version: "1.0",
        },
      };

      // Save summary to database
      await this.saveSummary(summary);

      return summary;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate summary specifically for handovers
   */
  async generateHandoverSummary(
    conversationId: string,
    organizationId: string,
    handoverReason: string,
    fromHandler: "ai" | "human",
    toHandler: "ai" | "human",
    agentId?: string
  ): Promise<ConversationSummary | null> {
    return this.generateSummary({
      conversationId,
      organizationId,
      purpose: "handover",
      context: {
        handoverReason,
        ...(agentId && { agentId }),
      },
      options: {
        includeTicketRecommendation: true,
        includeSentimentAnalysis: true,
      },
    });
  }

  /**
   * Generate summary for ticket creation
   */
  async generateTicketSummary(
    conversationId: string,
    organizationId: string,
    customerId?: string
  ): Promise<ConversationSummary | null> {
    return this.generateSummary({
      conversationId,
      organizationId,
      purpose: "ticket_creation",
      context: {
        ...(customerId && { customerId }),
      },
      options: {
        includeTicketRecommendation: true,
        includeSentimentAnalysis: true,
        maxSummaryLength: 500,
      },
    });
  }

  /**
   * Get conversation data from database
   */
  private async getConversationData(conversationId: string, organizationId: string): Promise<any> {
    try {
      // Get conversation details
      const { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("organization_id", organizationId)
        .single();

      if (!conversation) return null;

      // Get messages
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      // Get customer info
      const { data: customer } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", conversation.customer_id || "")
        .single();

      return {
        conversation,
        messages: messages || [],
        customer,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate AI summary using OpenAI
   */
  private async generateAISummary(conversationData: any, request: SummarizationRequest): Promise<string> {
    try {
      const { messages } = conversationData;
      const purpose = request.purpose;

      // Build context-aware system prompt
      const systemPrompt = this.buildSystemPrompt(purpose, request.options);

      // Prepare conversation history
      const conversationHistory = messages
        .map(
          (msg: unknown) =>
            `${msg.sender_type === "visitor" ? "Customer" : msg.sender_type === "ai" ? "AI Assistant" : "Agent"}: ${msg.content}`
        )
        .join("\n");

      const completion = await openaiService.createChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please summarize this conversation:\n\n${conversationHistory}` },
        ],
        "gpt-4"
      );

      return completion.choices[0]?.message?.content || "Summary generation failed";
    } catch (error) {
      return "Unable to generate summary due to processing error";
    }
  }

  /**
   * Build system prompt based on purpose
   */
  private buildSystemPrompt(purpose: string, options?: unknown): string {
    const basePrompt = `You are an expert customer service analyst. Generate a clear, concise summary that captures the essence of the conversation.`;

    switch (purpose) {
      case "handover":
        return `${basePrompt} This summary is for agent handover - focus on the current issue status, customer sentiment, and what actions the next agent should take. Be specific about unresolved items.`;

      case "ticket_creation":
        return `${basePrompt} This summary is for ticket creation - focus on the technical issue, steps already tried, customer impact, and resolution requirements. Structure it for technical tracking.`;

      case "analytics":
        return `${basePrompt} This summary is for analytics - focus on the conversation outcome, customer satisfaction, resolution method, and key performance indicators.`;

      case "quality_review":
        return `${basePrompt} This summary is for quality review - focus on agent performance, customer satisfaction, adherence to protocols, and improvement opportunities.`;

      default:
        return `${basePrompt} Provide a balanced overview of the conversation including key issues, resolutions, and outcomes.`;
    }
  }

  /**
   * Analyze sentiment and urgency
   */
  private async analyzeSentimentAndUrgency(messages: unknown[]): Promise<{ sentiment: string; urgency: string }> {
    try {
      const recentMessages = messages.slice(-5); // Analyze last 5 messages
      const customerMessages = recentMessages.filter((msg: unknown) => msg.sender_type === "visitor");

      if (customerMessages.length === 0) {
        return { sentiment: "neutral", urgency: "medium" };
      }

      const textToAnalyze = customerMessages.map((msg: unknown) => msg.content).join(" ");

      const completion = await openaiService.createChatCompletion(
        [
          {
            role: "system",
            content:
              'Analyze the sentiment (positive/neutral/negative) and urgency (low/medium/high/critical) of this customer communication. Respond with JSON format: {"sentiment": "...", "urgency": "..."}',
          },
          { role: "user", content: textToAnalyze },
        ],
        "gpt-3.5-turbo"
      );

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return {
        sentiment: result.sentiment || "neutral",
        urgency: result.urgency || "medium",
      };
    } catch (error) {
      return { sentiment: "neutral", urgency: "medium" };
    }
  }

  /**
   * Extract key points from conversation
   */
  private async extractKeyPoints(messages: unknown[], purpose: string): Promise<string[]> {
    try {
      const conversationText = messages.map((msg: unknown) => msg.content).join(" ");

      const completion = await openaiService.createChatCompletion(
        [
          {
            role: "system",
            content: `Extract 3-5 key points from this conversation for ${purpose}. Return as JSON array of strings.`,
          },
          { role: "user", content: conversationText },
        ],
        "gpt-3.5-turbo"
      );

      const result = JSON.parse(completion.choices[0]?.message?.content || "[]");
      return Array.isArray(result) ? result : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate relevant tags
   */
  private async generateTags(messages: unknown[], summary: string): Promise<string[]> {
    try {
      const completion = await openaiService.createChatCompletion(
        [
          {
            role: "system",
            content: "Generate 3-6 relevant tags for this conversation. Return as JSON array of lowercase strings.",
          },
          { role: "user", content: `Summary: ${summary}` },
        ],
        "gpt-3.5-turbo"
      );

      const result = JSON.parse(completion.choices[0]?.message?.content || "[]");
      return Array.isArray(result) ? result : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate ticket recommendation
   */
  private async generateTicketRecommendation(
    conversationData: any,
    summary: string,
    sentimentAnalysis: any
  ): Promise<any> {
    try {
      const { messages } = conversationData;
      const hasUnresolvedIssues = this.detectUnresolvedIssues(messages);
      const isComplexIssue =
        messages.length > 10 || sentimentAnalysis.urgency === "high" || sentimentAnalysis.urgency === "critical";

      const shouldCreateTicket = hasUnresolvedIssues || isComplexIssue || sentimentAnalysis.sentiment === "negative";

      if (!shouldCreateTicket) {
        return {
          shouldCreateTicket: false,
          suggestedTitle: "",
          suggestedCategory: "",
          suggestedPriority: "low",
        };
      }

      const completion = await openaiService.createChatCompletion(
        [
          {
            role: "system",
            content:
              'Generate a ticket title, category, and priority based on this conversation summary. Return JSON format: {"title": "...", "category": "...", "priority": "low|medium|high|urgent"}',
          },
          { role: "user", content: `Summary: ${summary}\nUrgency: ${sentimentAnalysis.urgency}` },
        ],
        "gpt-3.5-turbo"
      );

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

      return {
        shouldCreateTicket: true,
        suggestedTitle: result.title || "Customer Support Issue",
        suggestedCategory: result.category || "general",
        suggestedPriority: result.priority || sentimentAnalysis.urgency,
      };
    } catch (error) {
      return {
        shouldCreateTicket: false,
        suggestedTitle: "",
        suggestedCategory: "",
        suggestedPriority: "low",
      };
    }
  }

  /**
   * Detect unresolved issues in conversation
   */
  private detectUnresolvedIssues(messages: unknown[]): boolean {
    const lastMessages = messages.slice(-3);
    const resolutionKeywords = ["resolved", "fixed", "solved", "working now", "thank you", "thanks"];
    const unresolvKeywords = ["still not working", "still broken", "not fixed", "problem persists", "issue remains"];

    const recentText = lastMessages.map((msg: unknown) => msg.content.toLowerCase()).join(" ");

    // Check for explicit unresolved indicators
    if (unresolvKeywords.some((keyword) => recentText.includes(keyword))) {
      return true;
    }

    // Check if conversation ends without clear resolution
    if (!resolutionKeywords.some((keyword) => recentText.includes(keyword))) {
      return true;
    }

    return false;
  }

  /**
   * Extract resolution information
   */
  private extractResolution(messages: unknown[]): string | null {
    const lastMessages = messages.slice(-3);
    const resolutionKeywords = ["resolved", "fixed", "solved", "working now"];

    for (const message of lastMessages.reverse()) {
      if (resolutionKeywords.some((keyword) => message.content.toLowerCase().includes(keyword))) {
        return message.content;
      }
    }

    return null;
  }

  /**
   * Calculate conversation duration
   */
  private calculateConversationDuration(messages: unknown[]): number {
    if (messages.length < 2) return 0;

    const firstMessage = new Date(messages[0].created_at);
    const lastMessage = new Date(messages[messages.length - 1].created_at);

    return Math.round((lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60)); // minutes
  }

  /**
   * Calculate participant count
   */
  private calculateParticipantCount(messages: unknown[]): number {
    const uniqueSenders = new Set(messages.map((msg: unknown) => msg.sender_type));
    return uniqueSenders.size;
  }

  /**
   * Save summary to database
   */
  private async saveSummary(summary: ConversationSummary): Promise<void> {
    try {
      await (supabase as any).from("conversation_summaries").insert([
        {
          id: summary.id,
          conversation_id: summary.conversationId,
          organization_id: summary.organizationId,
          summary: summary.summary,
          key_points: summary.keyPoints,
          resolution: summary.resolution,
          sentiment: summary.sentiment,
          urgency: summary.urgency,
          tags: summary.tags,
          duration: summary.duration,
          message_count: summary.messageCount,
          participant_count: summary.participantCount,
          handover_reason: summary.handoverReason,
          ticket_info: summary.ticketInfo,
          metadata: summary.metadata,
        },
      ]);
    } catch (error) {}
  }

  /**
   * Get existing summary for conversation
   */
  async getSummary(conversationId: string, organizationId: string): Promise<ConversationSummary | null> {
    try {
      const { data } = await (supabase as any)
        .from("conversation_summaries")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      return {
        id: data.id,
        conversationId: data.conversationId || data.conversation_id,
        organizationId: data.organizationId || data.organization_id,
        summary: data.summary,
        keyPoints: data.key_points || [],
        resolution: data.resolution,
        sentiment: data.sentiment,
        urgency: data.urgency,
        tags: data.tags || [],
        duration: data.duration,
        messageCount: data.message_count,
        participantCount: data.participant_count,
        handoverReason: data.handover_reason,
        ticketInfo: data.ticket_info,
        metadata: data.metadata,
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const conversationSummarizationService = new ConversationSummarizationService();
