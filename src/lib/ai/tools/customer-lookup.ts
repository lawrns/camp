/**
 * Customer Lookup Tool - Helper2 Style
 *
 * Retrieves customer information from the database
 * Direct Supabase calls with organization scoping
 */

import { z } from "zod";
import { supabase } from "@/lib/supabase";

// Input validation
const customerLookupSchema = z
  .object({
    email: z.string().email().optional(),
    customerId: z.string().optional(),
    organizationId: z.string(),
  })
  .refine((data: unknown) => data.email || data.customerId, {
    message: "Either email or customerId must be provided",
  });

// Types
export interface CustomerLookupParams {
  email?: string;
  customerId?: string;
  organizationId: string;
}

export interface CustomerLookupResult {
  success: boolean;
  data?: {
    id: string;
    email: string;
    name?: string;
    metadata?: Record<string, any>;
    tier?: string;
    created_at: string;
    total_conversations: number;
    last_conversation_at?: string;
    satisfaction_score?: number;
  };
  error?: string;
  confidence: number;
}

const supabaseClient = supabase.admin();

/**
 * Look up customer information
 */
export async function lookupCustomer(params: CustomerLookupParams): Promise<CustomerLookupResult> {
  try {
    // Validate input
    const validated = customerLookupSchema.parse(params);

    // Build query
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        metadata,
        created_at,
        conversations!conversations_customer_id_fkey(
          id,
          created_at
        )
      `
      )
      .eq("organization_id", validated.organizationId);

    // Add filter
    if (validated.email) {
      query = query.eq("email", validated.email);
    } else if (validated.customerId) {
      query = query.eq("id", validated.customerId);
    }

    const { data: customer, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "Customer not found",
          confidence: 1.0, // High confidence that customer doesn't exist
        };
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        confidence: 0,
      };
    }

    // Calculate additional metrics
    const conversations = customer.conversations || [];
    const totalConversations = conversations.length;
    const lastConversation = conversations.sort(
      (a: unknown, b: unknown) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    // Get satisfaction score if available
    const { data: feedbackData } = await supabase
      .from("message_feedback")
      .select("rating")
      .eq("customer_id", customer.id)
      .eq("organization_id", validated.organizationId);

    const satisfactionScore =
      feedbackData && feedbackData.length > 0
        ? feedbackData.reduce((sum: unknown, f: unknown) => sum + (f.rating || 0), 0) / feedbackData.length
        : undefined;

    // Extract tier from metadata if available
    const tier = customer.metadata?.tier || customer.metadata?.subscription_level || "free";

    const result: unknown = {
      id: customer.id,
      email: customer.email,
      name: customer.fullName,
      metadata: customer.metadata,
      tier,
      created_at: customer.created_at,
      total_conversations: totalConversations,
    };

    if (lastConversation?.created_at !== undefined) {
      result.last_conversation_at = lastConversation.created_at;
    }

    if (satisfactionScore !== undefined) {
      result.satisfaction_score = satisfactionScore;
    }

    return {
      success: true,
      data: result,
      confidence: 1.0, // High confidence for direct database lookup
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
 * Helper function to get customer context for AI
 */
export function formatCustomerContext(customer: CustomerLookupResult["data"]): string {
  if (!customer) return "No customer information available.";

  const parts = [
    `Customer: ${customer.fullName || customer.email}`,
    `Account created: ${new Date(customer.created_at).toLocaleDateString()}`,
    `Tier: ${customer.tier}`,
    `Total conversations: ${customer.total_conversations}`,
  ];

  if (customer.last_conversation_at) {
    parts.push(`Last contact: ${new Date(customer.last_conversation_at).toLocaleDateString()}`);
  }

  if (customer.satisfaction_score !== undefined) {
    parts.push(`Satisfaction score: ${(customer.satisfaction_score * 100).toFixed(0)}%`);
  }

  return parts.join("\n");
}
