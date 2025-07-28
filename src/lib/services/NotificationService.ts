import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type NotificationType = "message" | "mention" | "assignment" | "system" | "ai_handover";
type NotificationPriority = "low" | "medium" | "high";

export interface CreateNotificationOptions {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  conversationId?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface BroadcastNotificationOptions extends CreateNotificationOptions {
  targetUserIds?: string[]; // If not provided, broadcasts to all org members
}

export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = supabase.admin();
  }

  /**
   * Create a notification for a single user
   */
  async createNotification(options: CreateNotificationOptions) {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: options.userId,
        organization_id: options.organizationId,
        type: options.type,
        title: options.title,
        message: options.message,
        conversation_id: options.conversationId,
        priority: options.priority || "medium",
        metadata: options.metadata || {},
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Broadcast via realtime
    await this.broadcastToUser(options.userId, options.organizationId, data);

    return data;
  }

  /**
   * Create notifications for multiple users
   */
  async broadcastNotification(options: BroadcastNotificationOptions) {
    const { targetUserIds, ...notificationData } = options;

    // Get target users
    let userIds = targetUserIds;
    if (!userIds || userIds.length === 0) {
      // Get all organization members
      const { data: members } = await this.supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", options.organizationId);

      userIds = members?.map((m: any) => m.user_id) || [];
    }

    // Create notifications for all users
    const notifications = userIds!.map((userId) => ({
      user_id: userId,
      organization_id: options.organizationId,
      type: options.type,
      title: options.title,
      message: options.message,
      conversation_id: options.conversationId,
      priority: options.priority || "medium",
      metadata: options.metadata || {},
      read: false,
    }));

    const { data, error } = await this.supabase.from("notifications").insert(notifications).select();

    if (error) {
      throw new Error(`Failed to broadcast notifications: ${error.message}`);
    }

    // Broadcast to all users via realtime
    for (const notification of data || []) {
      await this.broadcastToUser(notification.user_id, notification.organization_id, notification);
    }

    return data;
  }

  /**
   * Notify when a conversation is assigned
   */
  async notifyAssignment(conversationId: string, assignedUserId: string, assignedByUserId: string) {
    // Get conversation details
    const { data: conversation } = await this.supabase
      .from("conversations")
      .select("id, customer_name, organization_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) return;

    // Get assigner's name
    const { data: assigner } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", assignedByUserId)
      .single();

    const assignerName = assigner?.full_name || "Someone";

    await this.createNotification({
      userId: assignedUserId,
      organizationId: conversation.organization_id,
      type: "assignment",
      title: "New conversation assigned",
      message: `${assignerName} assigned you a conversation with ${conversation.customer_name || "a customer"}`,
      conversationId,
      priority: "high",
      metadata: {
        assignedBy: assignedByUserId,
        customerName: conversation.customer_name,
      },
    });
  }

  /**
   * Notify when user is mentioned
   */
  async notifyMention(
    messageId: string,
    conversationId: string,
    mentionedUserId: string,
    mentionedByUserId: string,
    messagePreview: string
  ) {
    // Get conversation and user details
    const [conversationResult, mentionerResult] = await Promise.all([
      this.supabase
        .from("conversations")
        .select("id, customer_name, organization_id")
        .eq("id", conversationId)
        .single(),
      this.supabase.from("profiles").select("full_name").eq("user_id", mentionedByUserId).single(),
    ]);

    const conversation = conversationResult.data;
    const mentioner = mentionerResult.data;

    if (!conversation) return;

    const mentionerName = mentioner?.full_name || "Someone";

    await this.createNotification({
      userId: mentionedUserId,
      organizationId: conversation.organization_id,
      type: "mention",
      title: `${mentionerName} mentioned you`,
      message: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? "..." : ""),
      conversationId,
      priority: "high",
      metadata: {
        messageId,
        mentionedBy: mentionedByUserId,
        customerName: conversation.customer_name,
      },
    });
  }

  /**
   * Notify AI handover
   */
  async notifyAIHandover(conversationId: string, organizationId: string, reason: string, confidence: number) {
    // Get available agents
    const { data: availableAgents } = await this.supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("role", "agent");

    const userIds = availableAgents?.map((a: any) => a.user_id) || [];

    // Get conversation details
    const { data: conversation } = await this.supabase
      .from("conversations")
      .select("customer_name")
      .eq("id", conversationId)
      .single();

    await this.broadcastNotification({
      organizationId,
      targetUserIds: userIds,
      type: "ai_handover",
      title: "AI needs human assistance",
      message: `AI confidence dropped to ${Math.round(confidence * 100)}% for ${conversation?.customer_name || "a customer"}. Reason: ${reason}`,
      conversationId,
      priority: "high",
      metadata: {
        reason,
        confidence,
        customerName: conversation?.customer_name,
      },
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]) {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("id", notificationIds);

    if (error) {
      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    const { count } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("read", false);

    return count || 0;
  }

  /**
   * Broadcast notification to user via realtime
   */
  private async broadcastToUser(userId: string, organizationId: string, notification: any) {
    const channel = `org:${organizationId}:user:${userId}:notifications`;
    await this.supabase.channel(channel).send({
      type: "broadcast",
      event: "new_notification",
      payload: notification,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
