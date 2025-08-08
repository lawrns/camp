import { aiHandoverService, type HandoverContext, type HandoverResult } from "@/lib/ai/handover";
import { supabase } from "@/lib/supabase/consolidated-exports";
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from "@/lib/realtime/unified-channel-standards";

export type HandoverAction = "request" | "accept" | "stop";

export interface HandoverRequestInput {
  context: HandoverContext;
  targetOperatorId?: string;
}

export class HandoverOrchestrator {
  async request(input: HandoverRequestInput): Promise<{ requested: boolean; result?: HandoverResult }> {
    const { context, targetOperatorId } = input;

    const result = await aiHandoverService.evaluateHandover(context);
    if (!result.shouldHandover) {
      return { requested: false, result };
    }

    await aiHandoverService.executeHandover(context, result, targetOperatorId);
    return { requested: true, result };
  }

  async accept(params: {
    handoverId: string;
    organizationId: string;
    agentId: string;
    conversationId: string;
  }): Promise<{ accepted: boolean }> {
    const { handoverId, organizationId, agentId, conversationId } = params;
    const admin = supabase.admin();

    // Optimistic lock: transition from pending -> accepted
    const { data: updated, error } = await admin
      .from("campfire_handoffs")
      .update({
        status: "accepted",
        assignedAgentId: agentId,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", handoverId)
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return { accepted: false };
    }

    // Assign conversation to agent
    await admin
      .from("conversations")
      .update({
        assigned_to_user_id: agentId,
        status: "open",
        aiHandoverActive: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    // Broadcast assignment
    try {
      const { broadcastToChannel } = await import("@/lib/realtime/standardized-realtime");
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversations(organizationId),
        UNIFIED_EVENTS.CONVERSATION_ASSIGNED,
        { conversationId, assigneeId: agentId, assignedBy: "handover" }
      );
    } catch {}

    return { accepted: true };
  }

  async stop(params: {
    conversationId: string;
    organizationId: string;
    handoverId?: string;
  }): Promise<{ stopped: boolean }> {
    const { conversationId, organizationId, handoverId } = params;
    const admin = supabase.admin();

    // Update conversation to exit AI mode
    await admin
      .from("conversations")
      .update({
        aiHandoverActive: false,
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);

    // Mark handover as completed if provided
    if (handoverId) {
      await admin
        .from("campfire_handoffs")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", handoverId)
        .eq("organization_id", organizationId);
    }

    // Broadcast completion
    try {
      const { broadcastToChannel } = await import("@/lib/realtime/standardized-realtime");
      await broadcastToChannel(
        UNIFIED_CHANNELS.conversationHandover(organizationId, conversationId),
        UNIFIED_EVENTS.AI_HANDOVER_COMPLETED,
        { conversationId, organizationId, timestamp: new Date().toISOString() }
      );
    } catch {}

    return { stopped: true };
  }
}

export const handoverOrchestrator = new HandoverOrchestrator();
