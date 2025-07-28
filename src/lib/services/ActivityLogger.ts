/**
 * Activity Logger Service
 * Logs activities to the activity_events table
 */

interface ActivityLogParams {
  action: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  priority?: "low" | "medium" | "high" | "urgent";
}

export class ActivityLogger {
  /**
   * Log an activity event (client-side)
   */
  static async log(params: ActivityLogParams): Promise<void> {
    try {
      const response = await fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: params.action,
          description: params.description,
          type: params.resourceType || "general",
          metadata: {
            ...params.metadata,
            priority: params.priority,
            resourceId: params.resourceId,
          },
        }),
      });

      if (!response.ok) {

      }
    } catch (error) {

    }
  }

  /**
   * Log message-related activities
   */
  static async logMessage(action: "sent" | "received", description: string, conversationId?: string): Promise<void> {
    const params: ActivityLogParams = {
      action: "message",
      description: `${action} ${description}`,
      resourceType: "conversation",
    };

    if (conversationId !== undefined) {
      params.resourceId = conversationId;
    }

    return this.log(params);
  }

  /**
   * Log ticket-related activities
   */
  static async logTicket(
    action: "created" | "updated" | "resolved" | "escalated",
    description: string,
    ticketId?: string,
    priority?: "low" | "medium" | "high" | "urgent"
  ): Promise<void> {
    const params: ActivityLogParams = {
      action: "ticket",
      description: `${action} ${description}`,
      resourceType: "ticket",
    };

    if (ticketId !== undefined) {
      params.resourceId = ticketId;
    }

    if (priority !== undefined) {
      params.priority = priority;
    }

    return this.log(params);
  }

  /**
   * Log user-related activities
   */
  static async logUser(action: "joined" | "left" | "online" | "offline", description: string): Promise<void> {
    return this.log({
      action: "user",
      description: `${action} ${description}`,
      resourceType: "user",
    });
  }

  /**
   * Log system-related activities
   */
  static async logSystem(action: string, description: string): Promise<void> {
    return this.log({
      action: "system",
      description: `${action} ${description}`,
      resourceType: "system",
    });
  }

  /**
   * Log AI-related activities
   */
  static async logAI(action: string, description: string, metadata?: Record<string, any>): Promise<void> {
    const params: ActivityLogParams = {
      action: "ai",
      description: `${action} ${description}`,
      resourceType: "ai",
    };

    if (metadata !== undefined) {
      params.metadata = metadata;
    }

    return this.log(params);
  }

  /**
   * Log achievement-related activities
   */
  static async logAchievement(description: string, rating?: number): Promise<void> {
    return this.log({
      action: "achievement",
      description: `earned ${description}`,
      resourceType: "achievement",
      metadata: { rating },
    });
  }
}

/**
 * Server-side activity logging
 */
export class ServerActivityLogger {
  /**
   * Log an activity event (server-side)
   */
  static async log(supabase: any, userId: string, organizationId: string, params: ActivityLogParams): Promise<void> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      // Get organization member role
      const { data: member } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .single();

      // Create activity event
      const { error } = await supabase.from("activity_events").insert({
        organization_id: organizationId,
        action: params.action,
        resource_type: params.resourceType || "general",
        resource_id: params.resourceId || null,
        actor_id: userId,
        data: {
          description: params.description,
          user_name: profile?.full_name || "Unknown User",
          user_avatar: profile?.avatar_url,
          user_role: member?.role || "member",
          priority: params.priority,
          ...(params.metadata || {}),
        },
      });

      if (error) {

      }
    } catch (error) {

    }
  }
}

export default ActivityLogger;
