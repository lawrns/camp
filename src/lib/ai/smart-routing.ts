/**
 * Smart Conversation Routing Service
 *
 * Intelligently routes conversations to the most suitable agents based on:
 * - Agent expertise and skills
 * - Current workload and availability
 * - Customer sentiment and urgency
 * - Historical performance metrics
 */

import type { SentimentAlert } from "@/lib/ai/real-time-sentiment";
import { supabase } from "@/lib/supabase";

const supabaseClient = supabase.admin();

export interface AgentProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  skills: string[];
  languages: string[];
  specializations: string[];
  currentWorkload: number;
  maxWorkload: number;
  isAvailable: boolean;
  isOnline: boolean;
  averageResponseTime: number; // in minutes
  customerSatisfactionScore: number; // 0-10
  escalationHandlingScore: number; // 0-10
  sentimentHandlingScore: number; // 0-10
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    days: number[]; // 0-6, Sunday-Saturday
  };
}

export interface RoutingRequest {
  conversationId: string;
  organizationId: string;
  customerInfo?: {
    email?: string;
    name?: string;
    tier?: "free" | "pro" | "enterprise";
    language?: string;
    previousAgents?: string[];
  };
  conversationContext?: {
    subject?: string;
    category?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    tags?: string[];
    messageCount?: number;
  };
  sentimentAlert?: SentimentAlert;
  requiredSkills?: string[];
  preferredAgent?: string;
  excludeAgents?: string[];
}

export interface RoutingResult {
  recommendedAgent: AgentProfile;
  confidence: number;
  reasoning: string[];
  alternativeAgents: Array<{
    agent: AgentProfile;
    score: number;
    reasoning: string;
  }>;
  routingStrategy:
    | "skill_match"
    | "workload_balance"
    | "sentiment_specialist"
    | "escalation_expert"
    | "customer_preference";
  estimatedResponseTime: number; // in minutes
}

export class SmartRoutingService {
  private routingWeights = {
    skillMatch: 0.3,
    workloadBalance: 0.25,
    sentimentHandling: 0.2,
    responseTime: 0.15,
    customerSatisfaction: 0.1,
  };

  /**
   * Find the best agent for a conversation
   */
  async routeConversation(request: RoutingRequest): Promise<RoutingResult | null> {
    try {
      // Get available agents for the organization
      const agents = await this.getAvailableAgents(request.organizationId, request.excludeAgents);

      if (agents.length === 0) {
        return null;
      }

      // Score each agent based on multiple factors
      const scoredAgents = await Promise.all(agents.map((agent: unknown) => this.scoreAgent(agent, request)));

      // Sort by score (highest first)
      scoredAgents.sort((a, b) => b.score - a.score);

      const bestAgent = scoredAgents[0];
      if (!bestAgent) {
        return null;
      }

      const alternativeAgents = scoredAgents.slice(1, 4); // Top 3 alternatives

      // Determine routing strategy
      const strategy = this.determineRoutingStrategy(request, bestAgent);

      // Estimate response time
      const estimatedResponseTime = this.estimateResponseTime(bestAgent.agent, request);

      const result: RoutingResult = {
        recommendedAgent: bestAgent.agent,
        confidence: Math.min(bestAgent.score / 100, 0.95), // Cap at 95%
        reasoning: bestAgent.reasoning,
        alternativeAgents: alternativeAgents.map((alt: unknown) => ({
          agent: alt.agent,
          score: alt.score,
          reasoning: alt.reasoning.join(", "),
        })),
        routingStrategy: strategy,
        estimatedResponseTime,
      };

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get available agents for an organization
   */
  private async getAvailableAgents(organizationId: string, excludeAgents?: string[]): Promise<AgentProfile[]> {
    try {
      const { data: orgMembers } = await supabase
        .from("organization_members")
        .select(
          `
          user_id,
          role,
          profiles!inner(
            user_id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .in("role", ["agent", "senior_agent", "team_lead", "admin"]);

      if (!orgMembers) return [];

      // Get agent performance metrics and availability
      const agents: AgentProfile[] = await Promise.all(
        orgMembers
          .filter((member: unknown) => !excludeAgents?.includes(member.user_id))
          .map(async (member: unknown) => {
            const metrics = await this.getAgentMetrics(member.user_id, organizationId);
            const availability = await this.getAgentAvailability(member.user_id);

            return {
              id: member.user_id,
              email: member.profiles.email,
              fullName: member.profiles.full_name || member.profiles.email,
              role: member.role,
              skills: metrics.skills || [],
              languages: metrics.languages || ["en"],
              specializations: metrics.specializations || [],
              currentWorkload: metrics.currentWorkload || 0,
              maxWorkload: metrics.maxWorkload || 10,
              isAvailable: availability.isAvailable,
              isOnline: availability.isOnline,
              averageResponseTime: metrics.averageResponseTime || 15,
              customerSatisfactionScore: metrics.customerSatisfactionScore || 7.5,
              escalationHandlingScore: metrics.escalationHandlingScore || 7.0,
              sentimentHandlingScore: metrics.sentimentHandlingScore || 7.0,
              timezone: metrics.timezone || "UTC",
              workingHours: metrics.workingHours || {
                start: "09:00",
                end: "17:00",
                days: [1, 2, 3, 4, 5], // Monday-Friday
              },
            };
          })
      );

      // Filter to only available agents
      return agents.filter((agent: unknown) => agent.isAvailable && agent.currentWorkload < agent.maxWorkload);
    } catch (error) {
      return [];
    }
  }

  /**
   * Score an agent for a specific conversation
   */
  private async scoreAgent(
    agent: AgentProfile,
    request: RoutingRequest
  ): Promise<{
    agent: AgentProfile;
    score: number;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let totalScore = 0;

    // 1. Skill matching (30%)
    const skillScore = this.calculateSkillScore(agent, request);
    totalScore += skillScore * this.routingWeights.skillMatch;
    if (skillScore > 80) reasoning.push(`Strong skill match (${skillScore}%)`);

    // 2. Workload balance (25%)
    const workloadScore = this.calculateWorkloadScore(agent);
    totalScore += workloadScore * this.routingWeights.workloadBalance;
    if (workloadScore > 80) reasoning.push(`Low workload (${agent.currentWorkload}/${agent.maxWorkload})`);

    // 3. Sentiment handling (20%)
    const sentimentScore = this.calculateSentimentScore(agent, request.sentimentAlert);
    totalScore += sentimentScore * this.routingWeights.sentimentHandling;
    if (sentimentScore > 80) reasoning.push(`Excellent sentiment handling (${agent.sentimentHandlingScore}/10)`);

    // 4. Response time (15%)
    const responseScore = this.calculateResponseTimeScore(agent);
    totalScore += responseScore * this.routingWeights.responseTime;
    if (responseScore > 80) reasoning.push(`Fast response time (${agent.averageResponseTime} min avg)`);

    // 5. Customer satisfaction (10%)
    const satisfactionScore = agent.customerSatisfactionScore * 10; // Convert to 0-100 scale
    totalScore += satisfactionScore * this.routingWeights.customerSatisfaction;
    if (satisfactionScore > 80) reasoning.push(`High customer satisfaction (${agent.customerSatisfactionScore}/10)`);

    // Bonus points for specific scenarios
    if (request.sentimentAlert?.severity === "critical" && agent.escalationHandlingScore >= 8.5) {
      totalScore += 10;
      reasoning.push("Escalation specialist for critical issue");
    }

    if (request.customerInfo?.tier === "enterprise" && agent.role === "senior_agent") {
      totalScore += 5;
      reasoning.push("Senior agent for enterprise customer");
    }

    if (request.customerInfo?.previousAgents?.includes(agent.id)) {
      totalScore += 15;
      reasoning.push("Previously handled this customer");
    }

    return {
      agent,
      score: Math.min(totalScore, 100), // Cap at 100
      reasoning,
    };
  }

  /**
   * Calculate skill matching score
   */
  private calculateSkillScore(agent: AgentProfile, request: RoutingRequest): number {
    const requiredSkills = request.requiredSkills || [];
    const conversationTags = request.conversationContext?.tags || [];
    const category = request.conversationContext?.category;

    let score = 50; // Base score

    // Check required skills
    if (requiredSkills.length > 0) {
      const matchedSkills = requiredSkills.filter((skill: unknown) =>
        agent.skills.some((agentSkill) => agentSkill.toLowerCase().includes(skill.toLowerCase()))
      );
      score += (matchedSkills.length / requiredSkills.length) * 30;
    }

    // Check specializations
    if (category && agent.specializations.includes(category)) {
      score += 20;
    }

    // Check conversation tags against skills
    if (conversationTags.length > 0) {
      const tagMatches = conversationTags.filter((tag: unknown) =>
        agent.skills.some((skill) => skill.toLowerCase().includes(tag.toLowerCase()))
      );
      score += (tagMatches.length / conversationTags.length) * 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate workload balance score
   */
  private calculateWorkloadScore(agent: AgentProfile): number {
    const utilizationRate = agent.currentWorkload / agent.maxWorkload;

    // Prefer agents with lower utilization
    if (utilizationRate <= 0.3) return 100; // Very low workload
    if (utilizationRate <= 0.5) return 90; // Low workload
    if (utilizationRate <= 0.7) return 70; // Medium workload
    if (utilizationRate <= 0.9) return 50; // High workload
    return 20; // Very high workload
  }

  /**
   * Calculate sentiment handling score
   */
  private calculateSentimentScore(agent: AgentProfile, sentimentAlert?: SentimentAlert): number {
    let score = agent.sentimentHandlingScore * 10; // Convert to 0-100 scale

    if (sentimentAlert) {
      // Boost score for agents good with difficult customers
      if (sentimentAlert.severity === "critical" && agent.escalationHandlingScore >= 8.0) {
        score += 20;
      } else if (sentimentAlert.severity === "high" && agent.sentimentHandlingScore >= 7.5) {
        score += 15;
      } else if (sentimentAlert.alertType === "negative_sentiment" && agent.sentimentHandlingScore >= 8.0) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate response time score
   */
  private calculateResponseTimeScore(agent: AgentProfile): number {
    // Prefer agents with faster response times
    if (agent.averageResponseTime <= 5) return 100; // Very fast
    if (agent.averageResponseTime <= 10) return 90; // Fast
    if (agent.averageResponseTime <= 15) return 80; // Good
    if (agent.averageResponseTime <= 30) return 60; // Average
    if (agent.averageResponseTime <= 60) return 40; // Slow
    return 20; // Very slow
  }

  /**
   * Determine the primary routing strategy used
   */
  private determineRoutingStrategy(request: RoutingRequest, bestAgent: unknown): RoutingResult["routingStrategy"] {
    if (request.sentimentAlert?.severity === "critical") {
      return "escalation_expert";
    }

    if (request.sentimentAlert?.alertType === "negative_sentiment") {
      return "sentiment_specialist";
    }

    if (request.customerInfo?.previousAgents?.includes(bestAgent.agent.id)) {
      return "customer_preference";
    }

    if (request.requiredSkills && request.requiredSkills.length > 0) {
      return "skill_match";
    }

    return "workload_balance";
  }

  /**
   * Estimate response time for the assigned agent
   */
  private estimateResponseTime(agent: AgentProfile, request: RoutingRequest): number {
    let baseTime = agent.averageResponseTime;

    // Adjust based on current workload
    const workloadMultiplier = 1 + (agent.currentWorkload / agent.maxWorkload) * 0.5;
    baseTime *= workloadMultiplier;

    // Adjust based on priority
    if (request.conversationContext?.priority === "urgent") {
      baseTime *= 0.5; // Urgent gets faster response
    } else if (request.conversationContext?.priority === "high") {
      baseTime *= 0.7;
    } else if (request.conversationContext?.priority === "low") {
      baseTime *= 1.5;
    }

    // Adjust based on sentiment alert
    if (request.sentimentAlert?.severity === "critical") {
      baseTime *= 0.3; // Critical sentiment gets immediate attention
    } else if (request.sentimentAlert?.severity === "high") {
      baseTime *= 0.6;
    }

    return Math.max(Math.round(baseTime), 1); // Minimum 1 minute
  }

  /**
   * Get agent performance metrics
   */
  private async getAgentMetrics(agentId: string, organizationId: string): Promise<any> {
    // This would typically query a metrics table
    // For now, return mock data
    return {
      skills: ["customer_service", "technical_support", "billing"],
      languages: ["en"],
      specializations: ["technical_issues"],
      currentWorkload: Math.floor(Math.random() * 8),
      maxWorkload: 10,
      averageResponseTime: 5 + Math.floor(Math.random() * 20),
      customerSatisfactionScore: 7 + Math.random() * 2.5,
      escalationHandlingScore: 6.5 + Math.random() * 3,
      sentimentHandlingScore: 7 + Math.random() * 2.5,
      timezone: "UTC",
      workingHours: {
        start: "09:00",
        end: "17:00",
        days: [1, 2, 3, 4, 5],
      },
    };
  }

  /**
   * Get agent availability status
   */
  private async getAgentAvailability(agentId: string): Promise<{ isAvailable: boolean; isOnline: boolean }> {
    // This would typically check real-time presence data
    // For now, return mock data
    return {
      isAvailable: Math.random() > 0.3, // 70% chance of being available
      isOnline: Math.random() > 0.2, // 80% chance of being online
    };
  }

  /**
   * Assign conversation to the recommended agent
   */
  async assignConversation(conversationId: string, agentId: string, routingResult: RoutingResult): Promise<boolean> {
    try {
      // Update conversation assignment
      const { error } = await supabase
        .from("conversations")
        .update({
          assigned_to_id: agentId,
          assigned_at: new Date().toISOString(),
          routing_metadata: {
            strategy: routingResult.routingStrategy,
            confidence: routingResult.confidence,
            reasoning: routingResult.reasoning,
            estimated_response_time: routingResult.estimatedResponseTime,
          },
        })
        .eq("id", conversationId);

      if (error) {
        return false;
      }

      // Log routing decision
      await this.logRoutingDecision(conversationId, agentId, routingResult);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log routing decision for analytics
   */
  private async logRoutingDecision(
    conversationId: string,
    agentId: string,
    routingResult: RoutingResult
  ): Promise<void> {
    try {
      await supabase.from("routing_decisions").insert({
        conversation_id: conversationId,
        assigned_agent_id: agentId,
        routing_strategy: routingResult.routingStrategy,
        confidence: routingResult.confidence,
        reasoning: routingResult.reasoning,
        estimated_response_time: routingResult.estimatedResponseTime,
        alternative_agents: routingResult.alternativeAgents.map((alt: unknown) => ({
          agent_id: alt.agent.id,
          score: alt.score,
          reasoning: alt.reasoning,
        })),
        created_at: new Date().toISOString(),
      });
    } catch (error) {}
  }
}

// Export singleton instance
export const smartRoutingService = new SmartRoutingService();
