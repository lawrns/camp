"use client";

import { client as supabase } from "@/lib/supabase/client";

export interface AIHandoverEvent {
  id: string;
  conversation_id: string;
  organization_id: string;
  handover_reason: string;
  ai_confidence: number;
  assigned_agent: string | null;
  context: any;
  status: "pending" | "in_queue" | "assigned" | "completed";
  created_at: string;
  completed_at?: string;
}

export interface HandoverQueueStatus {
  status: "connecting" | "in_queue" | "assigned" | "completed";
  message: string;
  agentName?: string;
  estimatedWaitTime?: number;
  queuePosition?: number;
}

// Simulated agent names for realistic handover experience
const AGENT_NAMES = [
  "Sarah",
  "Mike",
  "Emma",
  "David",
  "Lisa",
  "Alex",
  "Rachel",
  "Tom",
  "Jessica",
  "Chris",
  "Amanda",
  "Ryan",
  "Nicole",
  "Kevin",
  "Stephanie",
  "Mark",
];

export class AIHandoverService {
  private static instance: AIHandoverService;
  private activeHandovers = new Map<string, AIHandoverEvent>();
  private queueSimulationTimers = new Map<string, NodeJS.Timeout>();

  static getInstance(): AIHandoverService {
    if (!AIHandoverService.instance) {
      AIHandoverService.instance = new AIHandoverService();
    }
    return AIHandoverService.instance;
  }

  /**
   * Trigger AI handover when confidence drops below threshold
   */
  async triggerHandover(
    conversationId: string,
    organizationId: string,
    aiConfidence: number,
    context: any = {},
    reason: string = "Low AI confidence"
  ): Promise<AIHandoverEvent> {

    // Create handover record in database
    const { data: handover, error } = await supabase
      .from("ai_handovers")
      .insert({
        conversation_id: conversationId,
        organization_id: organizationId,
        handover_reason: reason,
        ai_confidence: aiConfidence,
        assigned_agent: null, // Will be "assigned" during queue simulation
        context: {
          ...context,
          original_confidence: aiConfidence,
          handover_triggered_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          page_url: window.location.href,
        },
        status: "pending",
      })
      .select()
      .single();

    if (error) {

      throw new Error("Failed to initiate handover");
    }

    // Store in memory for quick access
    this.activeHandovers.set(conversationId, handover);

    // Start queue simulation
    this.startQueueSimulation(handover);

    // Broadcast handover event via Supabase Realtime
    await this.broadcastHandoverEvent(conversationId, organizationId, {
      type: "handover_initiated",
      handover_id: handover.id,
      status: "connecting",
      message: "Connecting to agent...",
      ai_confidence: aiConfidence,
    });

    return handover;
  }

  /**
   * Simulate realistic queue experience (2-5 seconds)
   */
  private startQueueSimulation(handover: AIHandoverEvent): void {
    const conversationId = handover.conversation_id;

    // Clear any existing timer
    if (this.queueSimulationTimers.has(conversationId)) {
      clearTimeout(this.queueSimulationTimers.get(conversationId)!);
    }

    // Simulate realistic wait time (2-5 seconds)
    const waitTime = Math.random() * 3000 + 2000; // 2-5 seconds
    const agentName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];

    // Phase 1: Show connecting state (immediate)
    this.broadcastHandoverEvent(conversationId, handover.organization_id, {
      type: "handover_connecting",
      handover_id: handover.id,
      status: "connecting",
      message: "Connecting to agent...",
      estimatedWaitTime: Math.round(waitTime / 1000),
    });

    // Phase 2: Show in queue state (after 500ms)
    setTimeout(() => {
      this.broadcastHandoverEvent(conversationId, handover.organization_id, {
        type: "handover_in_queue",
        handover_id: handover.id,
        status: "in_queue",
        message: "Finding available agent...",
        estimatedWaitTime: Math.round((waitTime - 500) / 1000),
        queuePosition: Math.floor(Math.random() * 3) + 1, // 1-3 people ahead
      });
    }, 500);

    // Phase 3: Agent assigned (after full wait time)
    const timer = setTimeout(async () => {
      await this.completeHandover(handover, agentName);
      this.queueSimulationTimers.delete(conversationId);
    }, waitTime);

    this.queueSimulationTimers.set(conversationId, timer);
  }

  /**
   * Complete handover and assign "agent"
   */
  private async completeHandover(handover: AIHandoverEvent, agentName: string): Promise<void> {
    const conversationId = handover.conversation_id;

    // Update database record
    const { error } = await supabase
      .from("ai_handovers")
      .update({
        assigned_agent: agentName,
        status: "assigned",
        completed_at: new Date().toISOString(),
      })
      .eq("id", handover.id);

    if (error) {

    }

    // Update memory
    const updatedHandover = {
      ...handover,
      assigned_agent: agentName,
      status: "assigned" as const,
      completed_at: new Date().toISOString(),
    };
    this.activeHandovers.set(conversationId, updatedHandover);

    // Broadcast assignment
    await this.broadcastHandoverEvent(conversationId, handover.organization_id, {
      type: "handover_assigned",
      handover_id: handover.id,
      status: "assigned",
      message: `Agent ${agentName} assigned`,
      agentName: agentName,
    });

    // Update conversation to show it's now handled by "human" agent
    await supabase
      .from("conversations")
      .update({
        ai_handover_id: handover.id,
        assigned_to_ai: false,
        ai_persona: null, // Clear AI persona since it's now "human"
        ai_confidence_score: null,
      })
      .eq("id", conversationId);
  }

  /**
   * Broadcast handover events via Supabase Realtime with proper error handling
   */
  private async broadcastHandoverEvent(conversationId: string, organizationId: string, eventData: any): Promise<void> {
    try {
      const channelName = `org:${organizationId}:conv:${conversationId}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true, self: false },
          presence: { key: `handover_${Date.now()}` },
        },
      });

      // Subscribe to channel first
      const subscriptionStatus = await new Promise((resolve) => {
        channel.subscribe((status) => {
          resolve(status);
        });
      });

      if (subscriptionStatus !== 'SUBSCRIBED') {
        console.warn(`[AI Handover] Failed to subscribe to channel ${channelName}, status: ${subscriptionStatus}`);
        return;
      }

      // Send the broadcast with timeout
      const broadcastPromise = channel.send({
        type: "broadcast",
        event: "ai_handover",
        payload: {
          conversation_id: conversationId,
          organization_id: organizationId,
          timestamp: new Date().toISOString(),
          ...eventData,
        },
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Broadcast timeout')), 5000);
      });

      await Promise.race([broadcastPromise, timeoutPromise]);

      // Clean up channel after successful broadcast
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 1000);

    } catch (error) {
      console.error(`[AI Handover] Broadcast error for conversation ${conversationId}:`, error);
      // Don't throw - handover should continue even if broadcast fails
    }
  }

  /**
   * Check if conversation has active handover
   */
  isHandoverActive(conversationId: string): boolean {
    const handover = this.activeHandovers.get(conversationId);
    return handover?.status === "assigned" || handover?.status === "pending" || handover?.status === "in_queue";
  }

  /**
   * Get handover status for conversation
   */
  getHandoverStatus(conversationId: string): HandoverQueueStatus | null {
    const handover = this.activeHandovers.get(conversationId);
    if (!handover) return null;

    switch (handover.status) {
      case "pending":
        return {
          status: "connecting",
          message: "Connecting to agent...",
        };
      case "in_queue":
        return {
          status: "in_queue",
          message: "Finding available agent...",
          estimatedWaitTime: 3,
        };
      case "assigned":
        return {
          status: "assigned",
          message: `Agent ${handover.assigned_agent} assigned`,
          agentName: handover.assigned_agent || undefined,
        };
      default:
        return null;
    }
  }

  /**
   * Cancel handover (if user closes widget, etc.)
   */
  async cancelHandover(conversationId: string): Promise<void> {
    const handover = this.activeHandovers.get(conversationId);
    if (!handover) return;

    // Clear timer
    if (this.queueSimulationTimers.has(conversationId)) {
      clearTimeout(this.queueSimulationTimers.get(conversationId)!);
      this.queueSimulationTimers.delete(conversationId);
    }

    // Update database
    await supabase.from("ai_handovers").update({ status: "completed" }).eq("id", handover.id);

    // Remove from memory
    this.activeHandovers.delete(conversationId);

  }

  /**
   * Get all active handovers for organization (for admin dashboard)
   */
  async getActiveHandovers(organizationId: string): Promise<AIHandoverEvent[]> {
    const { data, error } = await supabase
      .from("ai_handovers")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", ["pending", "in_queue", "assigned"])
      .order("created_at", { ascending: false });

    if (error) {

      return [];
    }

    return data || [];
  }
}
