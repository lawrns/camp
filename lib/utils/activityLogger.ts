import { supabase } from "@/lib/supabase";

export interface ActivityEventData {
  eventType: string;
  eventCategory: string;
  resourceType?: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface LogActivityParams {
  organizationId: string;
  actorId: string;
  actorType?: "user" | "system" | "ai";
  eventData: ActivityEventData;
}

/**
 * Log an activity event to the database
 */
export async function logActivity({
  organizationId,
  actorId,
  actorType = "user",
  eventData,
}: LogActivityParams): Promise<void> {
  try {
    const client = supabase.admin();

    // Get actor profile information if it's a user
    let actorMetadata = {};
    if (actorType === "user") {
      const { data: profile } = await client
        .from("profiles")
        .select("firstName, lastName, avatarUrl, organization_id")
        .eq("user_id", actorId)
        .single();

      if (profile) {
        actorMetadata = {
          userName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
          user_avatar: profile.avatarUrl,
        };
      }
    }

    // Insert activity event
    const { error } = await client.from("activity_events").insert({
      organization_id: organizationId,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      actorId: actorId,
      actorType: actorType,
      resourceType: eventData.resourceType,
      resourceId: eventData.resourceId,
      description: eventData.description,
      metadata: {
        ...actorMetadata,
        ...eventData.metadata,
      },
    });

    if (error) {

    }
  } catch (error) {

  }
}

/**
 * Pre-defined activity event types and helpers
 */
export const ActivityEvents = {
  // Message events
  MESSAGE_SENT: (senderId: string, conversationId: string, content: string) => ({
    eventType: "message.sent",
    eventCategory: "conversation",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `sent a message: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
    metadata: { senderId: senderId },
  }),

  MESSAGE_RECEIVED: (senderId: string, conversationId: string, content: string) => ({
    eventType: "message.received",
    eventCategory: "conversation",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `received a message: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
    metadata: { senderId: senderId },
  }),

  // Conversation events
  CONVERSATION_CREATED: (conversationId: string, subject: string) => ({
    eventType: "conversation.created",
    eventCategory: "conversation",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `created a new conversation: "${subject}"`,
  }),

  CONVERSATION_ASSIGNED: (conversationId: string, agentId: string, agentName: string) => ({
    eventType: "conversation.assigned",
    eventCategory: "conversation",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `assigned conversation to ${agentName}`,
    metadata: { assigned_to: agentId, agent_name: agentName },
  }),

  CONVERSATION_CLOSED: (conversationId: string, reason?: string) => ({
    eventType: "conversation.closed",
    eventCategory: "conversation",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `closed the conversation${reason ? ` (${reason})` : ""}`,
    metadata: { close_reason: reason },
  }),

  // User events
  USER_JOINED: (userId: string, userName: string) => ({
    eventType: "user.joined",
    eventCategory: "user",
    resourceType: "user",
    resourceId: userId,
    description: `${userName} joined the organization`,
    metadata: { userName: userName },
  }),

  USER_LEFT: (userId: string, userName: string) => ({
    eventType: "user.left",
    eventCategory: "user",
    resourceType: "user",
    resourceId: userId,
    description: `${userName} left the organization`,
    metadata: { userName: userName },
  }),

  // AI events
  AI_RESPONSE_GENERATED: (conversationId: string, confidence: number) => ({
    eventType: "ai.response.generated",
    eventCategory: "ai",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `AI generated a response with ${Math.round(confidence * 100)}% confidence`,
    metadata: { confidence },
  }),

  AI_HANDOVER_REQUESTED: (conversationId: string, reason: string) => ({
    eventType: "ai.handover.requested",
    eventCategory: "ai",
    resourceType: "conversation",
    resourceId: conversationId,
    description: `AI requested handover to human agent: ${reason}`,
    metadata: { handover_reason: reason },
  }),

  // Ticket events
  TICKET_CREATED: (ticketId: string, title: string, priority: string) => ({
    eventType: "ticket.created",
    eventCategory: "ticket",
    resourceType: "ticket",
    resourceId: ticketId,
    description: `created a new ${priority} priority ticket: "${title}"`,
    metadata: { priority },
  }),

  TICKET_UPDATED: (ticketId: string, field: string, oldValue: string, newValue: string) => ({
    eventType: "ticket.updated",
    eventCategory: "ticket",
    resourceType: "ticket",
    resourceId: ticketId,
    description: `updated ticket ${field} from "${oldValue}" to "${newValue}"`,
    metadata: { field, old_value: oldValue, new_value: newValue },
  }),

  TICKET_CLOSED: (ticketId: string, resolution: string) => ({
    eventType: "ticket.closed",
    eventCategory: "ticket",
    resourceType: "ticket",
    resourceId: ticketId,
    description: `closed ticket with resolution: "${resolution}"`,
    metadata: { resolution },
  }),

  // System events
  SYSTEM_MAINTENANCE: (description: string) => ({
    eventType: "system.maintenance",
    eventCategory: "system",
    description: `System maintenance: ${description}`,
  }),

  SYSTEM_UPDATE: (version: string, features: string[]) => ({
    eventType: "system.update",
    eventCategory: "system",
    description: `System updated to version ${version}`,
    metadata: { version, features },
  }),

  // Security events
  SECURITY_LOGIN_FAILED: (email: string, ipAddress: string) => ({
    eventType: "security.login.failed",
    eventCategory: "security",
    description: `Failed login attempt for ${email}`,
    metadata: { email, ipAddress: ipAddress },
  }),

  SECURITY_PASSWORD_CHANGED: (userId: string) => ({
    eventType: "security.password.changed",
    eventCategory: "security",
    resourceType: "user",
    resourceId: userId,
    description: "changed their password",
  }),

  // API events
  API_KEY_CREATED: (keyName: string) => ({
    eventType: "api.key.created",
    eventCategory: "api",
    description: `created API key: "${keyName}"`,
    metadata: { key_name: keyName },
  }),

  API_KEY_REVOKED: (keyName: string) => ({
    eventType: "api.key.revoked",
    eventCategory: "api",
    description: `revoked API key: "${keyName}"`,
    metadata: { key_name: keyName },
  }),

  // Webhook events
  WEBHOOK_CREATED: (webhookName: string, url: string) => ({
    eventType: "webhook.created",
    eventCategory: "webhook",
    description: `created webhook "${webhookName}" for ${url}`,
    metadata: { webhook_name: webhookName, webhook_url: url },
  }),

  WEBHOOK_TRIGGERED: (webhookName: string, event: string, success: boolean) => ({
    eventType: "webhook.triggered",
    eventCategory: "webhook",
    description: `webhook "${webhookName}" ${success ? "successfully" : "failed to"} triggered for ${event}`,
    metadata: { webhook_name: webhookName, event, success },
  }),
};

/**
 * Helper function to log activity with common patterns
 */
export async function logUserActivity(
  organizationId: string,
  userId: string,
  eventData: ActivityEventData
): Promise<void> {
  return logActivity({
    organizationId,
    actorId: userId,
    actorType: "user",
    eventData,
  });
}

export async function logSystemActivity(organizationId: string, eventData: ActivityEventData): Promise<void> {
  return logActivity({
    organizationId,
    actorId: "system",
    actorType: "system",
    eventData,
  });
}

export async function logAIActivity(organizationId: string, eventData: ActivityEventData): Promise<void> {
  return logActivity({
    organizationId,
    actorId: "ai",
    actorType: "ai",
    eventData,
  });
}
