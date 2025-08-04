/**
 * Ticket Functions - Helper2 Approach
 * Simple exported functions instead of complex service classes
 */

// Use centralized Agent type
import type { Agent } from "@/types/entities";

export interface TicketData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  assigneeId?: string;
  dueDate?: string;
  tags: string[];
  conversationId: string;
  organizationId: string;
}

// DEPRECATED: Use unified /api/tickets endpoint instead
// This function bypasses authentication and organization validation
export async function createTicket(data: TicketData) {
  const supabaseClient = supabase.admin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      conversation_id: data.conversationId,
      mailbox_id: data.organizationId, // tickets need mailbox_id
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignee_id: data.assigneeId,
      due_date: data.dueDate,
      tags: data.tags,
      status: "open",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return ticket;
}

export async function getAvailableAgents(organizationId: string, category?: string): Promise<Agent[]> {
  // Use API call instead of direct service role client to avoid browser errors
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(`/api/organizations/${organizationId}/agents`, {
      method: "GET",
      headers,
      credentials: "include", // CRITICAL FIX: Include cookies for authentication
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.operators || [];
  } catch (error) {
    return [];
  }
}

export async function assignTicket(ticketId: string, agentId: string, organizationId: string) {
  const supabaseClient = supabase.admin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      assignee_id: agentId,
      status: "assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign ticket: ${error.message}`);
  }

  return ticket;
}

export async function updateTicketStatus(ticketId: string, status: string, organizationId: string) {
  const supabaseClient = supabase.admin();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ticket status: ${error.message}`);
  }

  return ticket;
}

export async function getTicketSLA(priority: string) {
  // Simple SLA calculation based on priority
  const slaMap = {
    critical: { responseTime: 1, resolutionTime: 4 },
    high: { responseTime: 2, resolutionTime: 8 },
    medium: { responseTime: 4, resolutionTime: 24 },
    low: { responseTime: 8, resolutionTime: 72 },
  };

  return slaMap[priority as keyof typeof slaMap] || slaMap.medium;
}

export async function autoAssignTicket(ticketId: string, organizationId: string) {
  // Get available agents
  const agents = await getAvailableAgents(organizationId);

  if (agents.length === 0) {
    throw new Error("No available agents for assignment");
  }

  // Simple assignment: pick agent with lowest workload (with fallback)
  const selectedAgent = agents.reduce((prev: any, current: any) => {
    const prevWorkload = prev.workload || 0;
    const currentWorkload = current.workload || 0;
    return prevWorkload < currentWorkload ? prev : current;
  });

  return assignTicket(ticketId, selectedAgent.id, organizationId);
}
