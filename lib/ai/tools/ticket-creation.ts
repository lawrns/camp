/**
 * Ticket Creation Tool - Helper2 Style
 *
 * Creates support tickets from conversations
 * Direct Supabase calls with proper validation
 */

import { z } from "zod";
import { supabase } from "@/lib/supabase";

// Input validation
const ticketCreationSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  conversationId: z.string(),
  organizationId: z.string(),
  customerEmail: z.string().email().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Types
export interface TicketCreationParams {
  subject: string;
  description: string;
  conversationId: string;
  organizationId: string;
  customerEmail?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  metadata?: Record<string, any>;
}

export interface TicketCreationResult {
  success: boolean;
  data?: {
    ticketId: string;
    ticketNumber: string;
    status: string;
    createdAt: string;
    assignedTo?: string;
  };
  error?: string;
  confidence: number;
}

const supabaseClient = supabase.admin();

/**
 * Create a support ticket
 */
export async function createTicket(params: TicketCreationParams): Promise<TicketCreationResult> {
  try {
    // Validate input
    const validated = ticketCreationSchema.parse(params);

    // Generate ticket number
    const ticketNumber = await generateTicketNumber(validated.organizationId);

    // Create ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert([
        {
          organization_id: validated.organizationId,
          conversation_id: validated.conversationId,
          ticket_number: ticketNumber,
          subject: validated.subject,
          description: validated.description,
          priority: validated.priority,
          category: validated.category,
          customer_email: validated.customerEmail,
          status: "open",
          source: "ai_automatic",
          metadata: {
            ...validated.metadata,
            created_by_ai: true,
            ai_session_id: `ai-${Date.now()}`,
          },
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle specific errors
      if (error.code === "23505") {
        return {
          success: false,
          error: "Ticket already exists for this conversation",
          confidence: 1.0,
        };
      }

      return {
        success: false,
        error: `Failed to create ticket: ${error.message}`,
        confidence: 0,
      };
    }

    // Link to conversation
    await supabase
      .from("conversations")
      .update({
        ticket_id: ticket.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.conversationId)
      .eq("organization_id", validated.organizationId);

    // Create initial ticket activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      organization_id: validated.organizationId,
      activity_type: "created",
      description: "Ticket created automatically by AI",
      metadata: {
        source: "ai_automatic",
      },
    });

    return {
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.id,
        status: ticket.status,
        createdAt: ticket.created_at,
        assignedTo: ticket.assigned_agent_id,
      },
      confidence: 1.0, // High confidence for successful creation
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
 * Generate unique ticket number
 */
async function generateTicketNumber(organizationId: string): Promise<string> {
  // Use default ticket prefix since ticket_prefix field doesn't exist in organizations schema
  const prefix = "TKT";

  // Generate sequence number using timestamp (RPC function not available)
  const sequenceNumber = Date.now() % 1000000; // Use last 6 digits of timestamp
  const paddedNumber = String(sequenceNumber).padStart(6, "0");

  return `${prefix}-${paddedNumber}`;
}

/**
 * Helper function to format ticket confirmation for AI
 */
export function formatTicketConfirmation(ticket: TicketCreationResult["data"]): string {
  if (!ticket) return "Failed to create ticket.";

  return `
Ticket created successfully:
- Ticket Number: ${ticket.ticketNumber}
- Status: ${ticket.status}
- Created: ${new Date(ticket.createdAt).toLocaleString()}
${ticket.assignedTo ? `- Assigned to: ${ticket.assignedTo}` : "- Awaiting assignment"}

A support agent will review your ticket and respond as soon as possible.
`.trim();
}

/**
 * Check if ticket already exists for conversation
 */
export async function checkExistingTicket(
  conversationId: string,
  organizationId: string
): Promise<{ exists: boolean; ticketNumber?: string }> {
  const { data } = await supabase
    .from("tickets")
    .select("ticketNumber")
    .eq("conversation_id", conversationId)
    .eq("organization_id", organizationId)
    .single();

  return {
    exists: !!data,
    ticketNumber: data?.ticketNumber,
  };
}

/**
 * Create RPC function in Supabase (run this migration):
 *
 * CREATE SEQUENCE IF NOT EXISTS ticket_sequences;
 *
 * CREATE OR REPLACE FUNCTION increment_ticket_sequence(org_id uuid)
 * RETURNS bigint
 * LANGUAGE plpgsql
 * AS $$
 * DECLARE
 *   seq_name text;
 *   next_val bigint;
 * BEGIN
 *   -- Use organization-specific sequence if needed
 *   -- For now, use global sequence
 *   SELECT nextval('ticket_sequences') INTO next_val;
 *   RETURN next_val;
 * END;
 * $$;
 */
