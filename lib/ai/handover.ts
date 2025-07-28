/**
 * Enhanced AI Handover System
 *
 * Manages intelligent handover from AI to human agents
 * Includes confidence scoring, escalation rules, and context preservation
 */

import { createClient } from "@/lib/supabase/client";
import { AI_PERSONALITIES, type AIPersonality } from "./personalities";

export interface HandoverContext {
  conversationId: string;
  organizationId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  aiPersonality: AIPersonality;
  messageHistory: Array<{
    id: string;
    content: string;
    senderType: "customer" | "ai" | "agent";
    timestamp: string;
    confidence?: number;
  }>;
  currentIssue: {
    category: string;
    description: string;
    urgency: "low" | "medium" | "high" | "critical";
    tags: string[];
  };
  aiAnalysis: {
    confidence: number;
    sentiment: "positive" | "neutral" | "negative" | "frustrated" | "angry";
    complexity: "simple" | "moderate" | "complex";
    suggestedActions: string[];
    escalationReasons: string[];
  };
}

export interface HandoverResult {
  shouldHandover: boolean;
  reason: string;
  urgency: "low" | "medium" | "high" | "critical";
  suggestedAgent?: {
    id?: string;
    skills: string[];
    department: string;
  };
  handoverMessage: string;
  contextSummary: string;
}

/**
 * Enhanced AI Handover Service
 */
export class AIHandoverService {
  private supabase = createClient();

  /**
   * Evaluate if a conversation should be handed over to a human agent
   */
  async evaluateHandover(context: HandoverContext): Promise<HandoverResult> {
    const { aiPersonality, aiAnalysis, currentIssue, messageHistory } = context;

    // Calculate handover score based on multiple factors
    const handoverScore = this.calculateHandoverScore(context);

    // Check escalation rules
    const escalationReasons = this.checkEscalationRules(context);

    // Determine if handover is needed
    const shouldHandover = handoverScore > 0.7 || escalationReasons.length > 0;

    if (!shouldHandover) {
      return {
        shouldHandover: false,
        reason: "AI can continue handling this conversation",
        urgency: "low",
        handoverMessage: "",
        contextSummary: "",
      };
    }

    // Generate handover details
    const urgency = this.determineUrgency(context);
    const suggestedAgent = await this.suggestAgent(context);
    const handoverMessage = this.generateHandoverMessage(context, escalationReasons);
    const contextSummary = this.generateContextSummary(context);

    return {
      shouldHandover: true,
      reason: escalationReasons.join(", ") || "Low AI confidence",
      urgency,
      suggestedAgent,
      handoverMessage,
      contextSummary,
    };
  }

  /**
   * Execute the handover process
   */
  async executeHandover(
    context: HandoverContext,
    handoverResult: HandoverResult,
    assignedAgentId?: string
  ): Promise<void> {
    const { conversationId, organizationId } = context;

    try {
      // 1. Create handover record
      const { data: handover, error: handoverError } = await this.supabase
        .from("campfire_handoffs")
        .insert({
          conversation_id: conversationId,
          organization_id: organizationId,
          from_ai_personality: context.aiPersonality.id,
          to_agent_id: assignedAgentId,
          reason: handoverResult.reason,
          urgency: handoverResult.urgency,
          context_summary: handoverResult.contextSummary,
          ai_confidence: context.aiAnalysis.confidence,
          customer_sentiment: context.aiAnalysis.sentiment,
          issue_complexity: context.aiAnalysis.complexity,
          escalation_reasons: context.aiAnalysis.escalationReasons,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (handoverError) {
        throw new Error(`Failed to create handover: ${handoverError.message}`);
      }

      // 2. Send handover message to conversation
      await this.supabase.from("messages").insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        content: handoverResult.handoverMessage,
        sender_type: "system",
        sender_name: "Campfire AI",
        metadata: {
          type: "handover_notification",
          handover_id: handover.id,
          ai_personality: context.aiPersonality.name,
          urgency: handoverResult.urgency,
        },
      });

      // 3. Update conversation status
      await this.supabase
        .from("conversations")
        .update({
          status: "pending_agent",
          assigned_agent_id: assignedAgentId,
          priority: this.urgencyToPriority(handoverResult.urgency),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      // 4. Notify agents via real-time
      await this.supabase.channel(`org:${organizationId}:agents`).send({
        type: "broadcast",
        event: "handover_created",
        payload: {
          handoverId: handover.id,
          conversationId,
          urgency: handoverResult.urgency,
          reason: handoverResult.reason,
          assignedAgentId,
          timestamp: new Date().toISOString(),
        },
      });

      // 5. Log activity
      await this.supabase.from("activity_events").insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        actor_type: "ai",
        actor_id: context.aiPersonality.id,
        action: "handover_initiated",
        details: {
          reason: handoverResult.reason,
          urgency: handoverResult.urgency,
          ai_confidence: context.aiAnalysis.confidence,
          assigned_agent_id: assignedAgentId,
        },
      });
    } catch (error) {

      throw error;
    }
  }

  /**
   * Calculate handover score based on multiple factors
   */
  private calculateHandoverScore(context: HandoverContext): number {
    const { aiAnalysis, aiPersonality, messageHistory, currentIssue } = context;

    let score = 0;

    // Confidence factor (0-0.4)
    if (aiAnalysis.confidence < aiPersonality.confidenceThreshold) {
      score += (aiPersonality.confidenceThreshold - aiAnalysis.confidence) * 0.4;
    }

    // Sentiment factor (0-0.3)
    if (aiAnalysis.sentiment === "angry") score += 0.3;
    else if (aiAnalysis.sentiment === "frustrated") score += 0.2;
    else if (aiAnalysis.sentiment === "negative") score += 0.1;

    // Complexity factor (0-0.2)
    if (aiAnalysis.complexity === "complex") score += 0.2;
    else if (aiAnalysis.complexity === "moderate") score += 0.1;

    // Urgency factor (0-0.1)
    if (currentIssue.urgency === "critical") score += 0.1;
    else if (currentIssue.urgency === "high") score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Check escalation rules based on personality and context
   */
  private checkEscalationRules(context: HandoverContext): string[] {
    const { aiPersonality, aiAnalysis, currentIssue } = context;
    const reasons: string[] = [];

    // Low confidence escalation
    if (aiPersonality.escalationRules.lowConfidence && aiAnalysis.confidence < aiPersonality.confidenceThreshold) {
      reasons.push("Low AI confidence");
    }

    // Complex query escalation
    if (aiPersonality.escalationRules.complexQueries && aiAnalysis.complexity === "complex") {
      reasons.push("Complex technical issue");
    }

    // Emotional distress escalation
    if (aiPersonality.escalationRules.emotionalDistress && ["angry", "frustrated"].includes(aiAnalysis.sentiment)) {
      reasons.push("Customer emotional distress");
    }

    // Technical issue escalation
    if (aiPersonality.escalationRules.technicalIssues && currentIssue.category === "technical") {
      reasons.push("Technical support required");
    }

    return reasons;
  }

  /**
   * Determine handover urgency
   */
  private determineUrgency(context: HandoverContext): "low" | "medium" | "high" | "critical" {
    const { aiAnalysis, currentIssue } = context;

    if (currentIssue.urgency === "critical" || aiAnalysis.sentiment === "angry") {
      return "critical";
    }

    if (
      currentIssue.urgency === "high" ||
      aiAnalysis.sentiment === "frustrated" ||
      aiAnalysis.complexity === "complex"
    ) {
      return "high";
    }

    if (currentIssue.urgency === "medium" || aiAnalysis.complexity === "moderate") {
      return "medium";
    }

    return "low";
  }

  /**
   * Suggest the best agent for handover
   */
  private async suggestAgent(context: HandoverContext): Promise<HandoverResult["suggestedAgent"]> {
    const { organizationId, currentIssue } = context;

    try {
      // Get available agents with relevant skills
      const { data: agents } = await this.supabase
        .from("organization_members")
        .select(
          `
          user_id,
          role,
          profiles!inner (
            full_name,
            skills,
            department,
            availability_status
          )
        `
        )
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .in("role", ["agent", "admin", "owner"])
        .eq("profiles.availability_status", "available");

      if (!agents || agents.length === 0) {
        return {
          skills: [currentIssue.category],
          department: "support",
        };
      }

      // Find agent with matching skills
      const matchingAgent = agents.find(
        (agent) =>
          agent.profiles.skills?.includes(currentIssue.category) || agent.profiles.department === currentIssue.category
      );

      if (matchingAgent) {
        return {
          id: matchingAgent.user_id,
          skills: matchingAgent.profiles.skills || [],
          department: matchingAgent.profiles.department || "support",
        };
      }

      // Return first available agent
      const firstAgent = agents[0];
      return {
        id: firstAgent.user_id,
        skills: firstAgent.profiles.skills || [],
        department: firstAgent.profiles.department || "support",
      };
    } catch (error) {

      return {
        skills: [currentIssue.category],
        department: "support",
      };
    }
  }

  /**
   * Generate handover message for the conversation
   */
  private generateHandoverMessage(context: HandoverContext, reasons: string[]): string {
    const { aiPersonality, currentIssue } = context;

    const baseMessage = `Hi! I'm ${aiPersonality.name}, and I've been helping you so far. `;

    if (reasons.includes("Customer emotional distress")) {
      return (
        baseMessage +
        "I want to make sure you get the best possible support, so I'm connecting you with one of our human specialists who can provide more personalized assistance. They'll be with you shortly!"
      );
    }

    if (reasons.includes("Complex technical issue")) {
      return (
        baseMessage +
        "Your question requires some specialized technical expertise that one of our human engineers can better address. I'm transferring you to a technical specialist now."
      );
    }

    if (reasons.includes("Low AI confidence")) {
      return (
        baseMessage +
        "To ensure you get the most accurate help, I'm connecting you with one of our human support specialists who can provide more detailed assistance."
      );
    }

    return (
      baseMessage +
      "I'm connecting you with one of our human support specialists who can help you further. They'll have all the context from our conversation."
    );
  }

  /**
   * Generate context summary for the agent
   */
  private generateContextSummary(context: HandoverContext): string {
    const { customerName, currentIssue, aiAnalysis, messageHistory } = context;

    const summary = [
      `Customer: ${customerName || "Unknown"}`,
      `Issue: ${currentIssue.description}`,
      `Category: ${currentIssue.category}`,
      `Urgency: ${currentIssue.urgency}`,
      `Sentiment: ${aiAnalysis.sentiment}`,
      `Complexity: ${aiAnalysis.complexity}`,
      `AI Confidence: ${Math.round(aiAnalysis.confidence * 100)}%`,
      `Messages exchanged: ${messageHistory.length}`,
      `Suggested actions: ${aiAnalysis.suggestedActions.join(", ")}`,
    ];

    return summary.join("\n");
  }

  /**
   * Convert urgency to priority number
   */
  private urgencyToPriority(urgency: string): number {
    switch (urgency) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 1;
    }
  }
}

// Export singleton instance
export const aiHandoverService = new AIHandoverService();
