/**
 * Escalation Tool - Helper2 Style
 *
 * Handles escalation to human agents
 * Integrates with existing handover system
 */

import { z } from "zod";
import { initiateHandover } from "@/lib/ai/ai-handover";
import { broadcastToConversation } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

// Input validation
const escalationSchema = z.object({
  conversationId: z.string(),
  organizationId: z.string(),
  reason: z.string().min(10).max(500),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("high"),
  context: z.record(z.unknown()).optional(),
  requestedBy: z.enum(["ai", "customer", "system"]).default("ai"),
});

// Types
export interface EscalationParams {
  conversationId: string;
  organizationId: string;
  reason: string;
  priority?: "low" | "medium" | "high" | "urgent";
  context?: Record<string, any>;
  requestedBy?: "ai" | "customer" | "system";
}

export interface EscalationResult {
  success: boolean;
  data?: {
    escalationId: string;
    assignedAgent?: {
      id: string;
      name: string;
      availability: string;
    };
    estimatedWaitTime?: number;
    queuePosition?: number;
    message: string;
  };
  error?: string;
  confidence: number;
}

const supabaseClient = supabase.admin();

/**
 * Escalate conversation to human agent
 */
export async function escalateToHuman(params: EscalationParams): Promise<EscalationResult> {
  try {
    // Validate input
    const validated = escalationSchema.parse(params);

    // Check current conversation state
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        status,
        assigned_to_ai,
        assigned_to,
        priority,
        metadata
      `
      )
      .eq("id", validated.conversationId)
      .eq("organization_id", validated.organizationId)
      .single();

    if (convError || !conversation) {
      return {
        success: false,
        error: "Conversation not found",
        confidence: 0,
      };
    }

    // Check if already assigned to human
    if (conversation.assigned_to && !conversation.assigned_to_ai) {
      const { data: agent } = await supabase
        .from("profiles")
        .select("id, full_name, availability_status")
        .eq("id", conversation.assigned_to)
        .single();

      return {
        success: true,
        data: {
          escalationId: `esc-${conversation.id}`,
          ...(agent && {
            assignedAgent: {
              id: agent.id,
              name: agent.fullName,
              availability: agent.availability_status || "available",
            },
          }),
          message: "Conversation has been escalated to human support team",
        },
        confidence: 1.0,
      };
    }

    // Find available agent
    const availableAgent = await findAvailableAgent(validated.organizationId, validated.priority);

    // Update conversation
    const updateData: unknown = {
      assigned_to_ai: false,
      status: "open",
      priority: validated.priority,
      updated_at: new Date().toISOString(),
    };

    if (availableAgent) {
      updateData.assigned_to = availableAgent.id;
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update(updateData)
      .eq("id", validated.conversationId)
      .eq("organization_id", validated.organizationId);

    if (updateError) {
      return {
        success: false,
        error: "Failed to update conversation",
        confidence: 0,
      };
    }

    // Create escalation record
    const escalationId = `esc-${Date.now()}-${validated.conversationId}`;
    const { error: escError } = await supabase.from("escalations").insert([
      {
        id: escalationId,
        conversation_id: validated.conversationId,
        organization_id: validated.organizationId,
        reason: validated.reason,
        priority: validated.priority,
        requested_by: validated.requestedBy,
        assigned_to: availableAgent?.id,
        context: validated.context,
        status: availableAgent ? "assigned" : "pending",
      },
    ]);

    if (escError) {
      // Continue anyway - escalation still happened
    }

    // Use existing handover system
    await initiateHandover({
      conversationId: validated.conversationId,
      reason: validated.reason,
      context: {
        ...validated.context,
        escalationId,
        priority: validated.priority,
        requestedBy: validated.requestedBy,
      },
      priority: validated.priority,
    });

    // Calculate queue position if no agent assigned
    let queuePosition: number | undefined;
    let estimatedWaitTime: number | undefined;

    if (!availableAgent) {
      const queueInfo = await getQueueInfo(validated.organizationId, validated.priority);
      queuePosition = queueInfo.position;
      estimatedWaitTime = queueInfo.estimatedWait;
    }

    // Broadcast escalation event
    await broadcastToConversation(validated.organizationId, validated.conversationId, "escalation_initiated", {
      escalationId,
      assignedAgent: availableAgent,
      queuePosition,
      estimatedWaitTime,
      timestamp: new Date().toISOString(),
    });

    const responseData: unknown = {
      escalationId,
    };

    if (availableAgent) {
      responseData.assignedAgent = {
        id: availableAgent.id,
        name: availableAgent.fullName,
        availability: availableAgent.availability_status || "available",
      };
    }

    if (estimatedWaitTime !== undefined) {
      responseData.estimatedWaitTime = estimatedWaitTime;
    }

    if (queuePosition !== undefined) {
      responseData.queuePosition = queuePosition;
    }

    return {
      success: true,
      data: {
        ...responseData,
        message: availableAgent
          ? `Assigned to ${availableAgent.fullName}`
          : `Added to queue (position ${queuePosition})`,
      },
      confidence: 1.0, // High confidence for successful escalation
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
 * Find available agent based on priority and workload
 */
async function findAvailableAgent(organizationId: string, priority: string): Promise<any> {
  // Get online agents
  const { data: agents } = await supabase
    .from("organization_members")
    .select(
      `
      user_id,
      role,
      profiles!inner(
        id,
        full_name,
        availability_status
      )
    `
    )
    .eq("organization_id", organizationId)
    .eq("profiles.availability_status", "available")
    .in("role", ["agent", "admin"]);

  if (!agents || agents.length === 0) {
    return null;
  }

  // For urgent priority, find senior agents
  if (priority === "urgent") {
    const seniorAgents = agents.filter((a: unknown) => a.role === "admin");
    if (seniorAgents.length > 0) {
      return seniorAgents[0]?.profiles || null;
    }
  }

  // Get agent workloads
  const agentIds = agents.map((a: unknown) => a.user_id);
  const { data: workloads } = await supabase
    .from("conversations")
    .select("assigned_to")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .in("assigned_to", agentIds);

  // Count conversations per agent
  const workloadMap = new Map<string, number>();
  agentIds.forEach((id: unknown) => workloadMap.set(id, 0));
  workloads?.forEach((w: unknown) => {
    if (w.assigned_to) {
      workloadMap.set(w.assigned_to, (workloadMap.get(w.assigned_to) || 0) + 1);
    }
  });

  // Find agent with lowest workload
  let selectedAgent = agents[0]?.profiles || null;
  let lowestWorkload = workloadMap.get(agents[0]?.user_id ?? "") || 0;

  agents.forEach((agent: unknown) => {
    const workload = workloadMap.get(agent.user_id ?? "") || 0;
    if (workload < lowestWorkload) {
      lowestWorkload = workload;
      selectedAgent = agent.profiles;
    }
  });

  return selectedAgent;
}

/**
 * Get queue information
 */
async function getQueueInfo(
  organizationId: string,
  priority: string
): Promise<{ position: number; estimatedWait: number }> {
  // Count pending escalations
  const { count } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .eq("assigned_to_ai", false)
    .is("assigned_to", null);

  const position = (count || 0) + 1;

  // Estimate wait time based on priority and position
  const baseWaitMinutes = priority === "urgent" ? 2 : priority === "high" ? 5 : 10;
  const estimatedWait = position * baseWaitMinutes;

  return { position, estimatedWait };
}

/**
 * Helper function to format escalation confirmation
 */
export function formatEscalationConfirmation(escalation: EscalationResult["data"]): string {
  if (!escalation) return "Escalation failed.";

  const parts = [`I've escalated your conversation to a human agent.`];

  if (escalation.assignedAgent) {
    parts.push(`\n${escalation.assignedAgent.name} will assist you shortly.`);
  } else if (escalation.queuePosition) {
    parts.push(`\nYou're currently #${escalation.queuePosition} in the queue.`);
    if (escalation.estimatedWaitTime) {
      parts.push(`Estimated wait time: ${escalation.estimatedWaitTime} minutes.`);
    }
  }

  parts.push(`\nThank you for your patience.`);

  return parts.join(" ");
}
