/**
 * Agent Handoff Flow - Direct Message Processing (Skip AI)
 *
 * Handles the flow after an agent accepts a handoff request via the `handoff:accepted` event.
 * This implements the missing architectural flow:
 * C4 (Agent Replies) → Message Processing Flow (skip AI) → Real-time Delivery
 */

import { supabase } from "@/lib/supabase";

// TODO: Implement WebSocketV2Service or use existing realtime service
// import { webSocketV2Service, type MessageEvent, type WebSocketV2Event } from "../realtime-server/WebSocketV2Service";

// Temporary types until WebSocketV2Service is implemented
interface MessageEvent {
  type: "message";
  conversation_id: string;
  organization_id: string;
  user_id: string;
  data: any;
  timestamp: string;
  event_id: string;
}

interface WebSocketV2Event {
  type: "system" | "message";
  conversation_id: string;
  organization_id: string;
  user_id: string;
  data: any;
  timestamp: string;
  event_id: string;
}

// Temporary service stub
const webSocketV2Service = {
  sendEvent: async (event: MessageEvent | WebSocketV2Event) => {

  },
};

export interface AgentMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  agentId: string;
  content: string;
  metadata?: {
    handoffId?: string;
    skipAI?: boolean;
    priority?: "low" | "medium" | "high" | "urgent";
  };
}

export interface HandoffAcceptedEvent {
  handoffId: string;
  conversationId: string;
  organizationId: string;
  agentId: string;
  timestamp: string;
}

export class AgentHandoffFlow {
  private static instance: AgentHandoffFlow | null = null;

  static getInstance(): AgentHandoffFlow {
    if (!AgentHandoffFlow.instance) {
      AgentHandoffFlow.instance = new AgentHandoffFlow();
    }
    return AgentHandoffFlow.instance;
  }

  /**
   * Process agent reply after handoff acceptance
   * This bypasses AI processing (M4, M5) and goes directly to delivery
   */
  async processAgentReply(message: AgentMessage): Promise<void> {
    try {
      // Step 1: Persist agent response directly (skip AI processing)
      const persistedMessage = await this.persistAgentResponse(message);

      // Step 2: Deliver message via real-time channels
      await this.deliverDirectly(persistedMessage);

      // Step 3: Notify via WebSocket v2 Gateway
      await this.notifyWebSocketV2(persistedMessage);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle handoff acceptance event
   */
  async handleHandoffAccepted(event: HandoffAcceptedEvent): Promise<void> {
    try {
      // Update handoff status in database
      await this.updateHandoffStatus(event.handoffId, "accepted", event.agentId);

      // Set up agent message processing for this conversation
      await this.setupAgentMessageHandling(event.conversationId, event.agentId);

      // Notify relevant parties
      await this.notifyHandoffAcceptance(event);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Persist agent response directly to database (skip AI processing)
   */
  private async persistAgentResponse(message: AgentMessage): Promise<AgentMessage & { id: string; timestamp: string }> {
    const { data, error } = await supabase
      .browser()
      .from("conversation_messages")
      .insert({
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversation_id: message.conversationId,
        organization_id: message.organizationId,
        sender_id: message.agentId,
        sender_type: "agent",
        content: message.content,
        metadata: {
          ...message.metadata,
          skipAI: true,
          processed_by: "AgentHandoffFlow",
          handoff_reply: true,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to persist agent message: ${error.message}`);
    }

    return {
      ...message,
      id: data.id,
      timestamp: data.created_at || new Date().toISOString(),
    };
  }

  /**
   * Deliver message directly via real-time channels
   */
  private async deliverDirectly(message: AgentMessage & { timestamp: string }): Promise<void> {
    const messageEvent: MessageEvent = {
      type: "message",
      conversation_id: message.conversationId,
      organization_id: message.organizationId,
      user_id: message.agentId,
      data: {
        content: message.content,
        sender_type: "agent",
        metadata: message.metadata,
      },
      timestamp: message.timestamp,
      event_id: `msg_event_${Date.now()}`,
    };

    // Send via WebSocket v2 Gateway
    await webSocketV2Service.sendEvent(messageEvent);
  }

  /**
   * Notify WebSocket v2 Gateway of agent message
   */
  private async notifyWebSocketV2(message: AgentMessage & { timestamp: string }): Promise<void> {
    const event: WebSocketV2Event = {
      type: "system",
      conversation_id: message.conversationId,
      organization_id: message.organizationId,
      user_id: "system",
      data: {
        event_type: "agent_reply_processed",
        agent_id: message.agentId,
        message_id: message.id,
        bypassed_ai: true,
      },
      timestamp: message.timestamp,
      event_id: `system_${Date.now()}`,
    };

    await webSocketV2Service.sendEvent(event);
  }

  /**
   * Update handoff status in database
   */
  private async updateHandoffStatus(
    handoffId: string,
    status: "accepted" | "completed" | "failed",
    agentId?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (agentId) {
      updateData.assigned_agent_id = agentId;
      updateData.accepted_at = new Date().toISOString();
    }

    const { error } = await supabase.browser().from("ai_handovers").update(updateData).eq("id", handoffId);

    if (error) {
      throw new Error(`Failed to update handoff status: ${error.message}`);
    }
  }

  /**
   * Setup agent message handling for conversation
   */
  private async setupAgentMessageHandling(conversationId: string, agentId: string): Promise<void> {
    // Subscribe to agent messages for this conversation
    // This would be integrated with the existing WebSocket v2 service
  }

  /**
   * Notify relevant parties of handoff acceptance
   */
  private async notifyHandoffAcceptance(event: HandoffAcceptedEvent): Promise<void> {
    const notificationEvent: WebSocketV2Event = {
      type: "system",
      conversation_id: event.conversationId,
      organization_id: event.organizationId,
      user_id: "system",
      data: {
        event_type: "handoff_accepted",
        handoff_id: event.handoffId,
        agent_id: event.agentId,
        timestamp: event.timestamp,
      },
      timestamp: event.timestamp,
      event_id: `handoff_accepted_${Date.now()}`,
    };

    await webSocketV2Service.sendEvent(notificationEvent);
  }

  /**
   * Get flow statistics for monitoring
   */
  async getFlowStatistics(): Promise<{
    totalAgentReplies: number;
    totalHandoffsAccepted: number;
    averageProcessingTime: number;
    bypassedAICount: number;
  }> {
    try {
      // Query statistics from database
      const { data: agentReplies, error: repliesError } = await supabase
        .browser()
        .from("conversation_messages")
        .select("id, created_at, metadata")
        .eq("sender_type", "agent")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order("created_at", { ascending: false });

      if (repliesError) throw repliesError;

      const bypassedAICount = agentReplies?.filter((msg: any) => msg.metadata?.skipAI === true).length || 0;

      const { data: handoffs, error: handoffsError } = await supabase
        .browser()
        .from("ai_handovers")
        .select("id, accepted_at, created_at")
        .eq("status", "accepted")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (handoffsError) throw handoffsError;

      // Calculate average processing time
      const processingTimes =
        handoffs
          ?.map((h: any) => (h.accepted_at ? new Date(h.accepted_at).getTime() - new Date(h.created_at).getTime() : 0))
          .filter((time: any) => time > 0) || [];

      const averageProcessingTime =
        processingTimes.length > 0
          ? processingTimes.reduce((sum: any, time: any) => sum + time, 0) / processingTimes.length
          : 0;

      return {
        totalAgentReplies: agentReplies?.length || 0,
        totalHandoffsAccepted: handoffs?.length || 0,
        averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
        bypassedAICount,
      };
    } catch (error) {
      return {
        totalAgentReplies: 0,
        totalHandoffsAccepted: 0,
        averageProcessingTime: 0,
        bypassedAICount: 0,
      };
    }
  }
}

// Export singleton instance
export const agentHandoffFlow = AgentHandoffFlow.getInstance();
