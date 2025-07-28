/**
 * Multi-Tenant Security Layer
 * Ensures proper organization isolation for widget-to-inbox communication
 */

import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export interface OrganizationContext {
  organizationId: string;
  isValid: boolean;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "trial";
  limits: {
    maxConversations: number;
    maxMessages: number;
    maxAgents: number;
  };
}

export interface SecurityValidationResult {
  success: boolean;
  organizationContext?: OrganizationContext;
  error?: string;
}

/**
 * Validate organization access for widget requests
 */
export async function validateOrganizationAccess(
  organizationId: string,
  request: NextRequest
): Promise<SecurityValidationResult> {
  try {
    // Check if organization exists and is active
    const { data: organization, error } = await supabase
      .admin()
      .from("organizations")
      .select("id, name, plan, status, settings")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      return {
        success: false,
        error: "Organization not found or inactive",
      };
    }

    if (organization.status !== "active") {
      return {
        success: false,
        error: "Organization is not active",
      };
    }

    // Get organization limits based on plan
    const limits = getOrganizationLimits(organization.plan);

    return {
      success: true,
      organizationContext: {
        organizationId: organization.id,
        isValid: true,
        plan: organization.plan,
        status: organization.status,
        limits,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to validate organization access",
    };
  }
}

/**
 * Get organization limits based on plan
 */
function getOrganizationLimits(plan: string) {
  switch (plan) {
    case "enterprise":
      return {
        maxConversations: 100000,
        maxMessages: 1000000,
        maxAgents: 100,
      };
    case "pro":
      return {
        maxConversations: 10000,
        maxMessages: 100000,
        maxAgents: 25,
      };
    case "free":
    default:
      return {
        maxConversations: 100,
        maxMessages: 1000,
        maxAgents: 3,
      };
  }
}

/**
 * Validate conversation belongs to organization
 */
export async function validateConversationAccess(conversationId: string, organizationId: string): Promise<boolean> {
  try {
    const { data: conversation, error } = await supabase
      .admin()
      .from("conversations")
      .select("id, organization_id")
      .eq("id", conversationId)
      .eq("organization_id", organizationId)
      .single();

    return !error && conversation !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Validate message belongs to organization
 */
export async function validateMessageAccess(messageId: string, organizationId: string): Promise<boolean> {
  try {
    const { data: message, error } = await supabase
      .admin()
      .from("messages")
      .select("id, conversation_id")
      .eq("id", messageId)
      .single();

    if (error || !message) {
      return false;
    }

    // Check if conversation belongs to organization
    return await validateConversationAccess(message.conversation_id, organizationId);
  } catch (error) {
    return false;
  }
}

/**
 * Rate limiting for widget requests
 */
export class WidgetRateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly WINDOW_SIZE = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 100; // per minute per organization

  static isAllowed(organizationId: string): boolean {
    // Skip rate limiting in test environment if disabled
    if (process.env.DISABLE_RATE_LIMITING === "true") {
      return true;
    }

    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;

    // Get existing requests for this organization
    const orgRequests = this.requests.get(organizationId) || [];

    // Filter out old requests
    const recentRequests = orgRequests.filter((time) => time > windowStart);

    // Check if under limit
    if (recentRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(organizationId, recentRequests);

    return true;
  }

  static getRemainingRequests(organizationId: string): number {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;
    const orgRequests = this.requests.get(organizationId) || [];
    const recentRequests = orgRequests.filter((time) => time > windowStart);

    return Math.max(0, this.MAX_REQUESTS - recentRequests.length);
  }
}

/**
 * Sanitize and validate widget input data
 */
export function sanitizeWidgetInput(data: any): any {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const sanitized: any = {};

  // Allowed fields for widget requests
  const allowedFields = ["content", "visitorId", "conversationId", "organizationId", "metadata", "initialMessage"];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === "string") {
        // Sanitize strings
        sanitized[field] = data[field].trim().substring(0, 10000);
      } else if (typeof data[field] === "object" && field === "metadata") {
        // Sanitize metadata object
        sanitized[field] = sanitizeMetadata(data[field]);
      } else {
        sanitized[field] = data[field];
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize metadata object
 */
function sanitizeMetadata(metadata: any): any {
  if (typeof metadata !== "object" || metadata === null) {
    return {};
  }

  const sanitized: any = {};
  const allowedMetadataFields = [
    "customer_email",
    "customer_name",
    "source",
    "ip",
    "user_agent",
    "referrer",
    "page_url",
  ];

  for (const field of allowedMetadataFields) {
    if (metadata[field] !== undefined && typeof metadata[field] === "string") {
      sanitized[field] = metadata[field].trim().substring(0, 1000);
    }
  }

  return sanitized;
}

/**
 * Generate secure channel name for organization
 */
export function generateSecureChannelName(organizationId: string, resourceType: string, resourceId?: string): string {
  // Validate organization ID format
  if (!/^[a-f0-9-]{36}$/.test(organizationId)) {
    throw new Error("Invalid organization ID format");
  }

  // Validate resource type
  const allowedResourceTypes = ["conversation", "typing", "presence", "notification"];
  if (!allowedResourceTypes.includes(resourceType)) {
    throw new Error("Invalid resource type");
  }

  if (resourceId) {
    return `org:${organizationId}:${resourceType}:${resourceId}`;
  }

  return `org:${organizationId}:${resourceType}`;
}

/**
 * Middleware for widget API security
 */
export async function withWidgetSecurity(
  request: NextRequest,
  handler: (request: NextRequest, context: OrganizationContext) => Promise<Response>
): Promise<Response> {
  try {
    // Extract organization ID from headers or body
    const organizationId = request.headers.get("X-Organization-ID") || (await request.json()).organization_id;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "Organization ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (!WidgetRateLimiter.isAllowed(organizationId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate organization access
    const validation = await validateOrganizationAccess(organizationId, request);
    if (!validation.success || !validation.organizationContext) {
      return new Response(JSON.stringify({ error: validation.error || "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call the handler with validated context
    return await handler(request, validation.organizationContext);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
