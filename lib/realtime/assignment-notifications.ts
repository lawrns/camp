/**
 * Assignment Notification System
 *
 * Comprehensive real-time notifications for conversation assignments
 * Ensures all team members are notified when assignments change
 */

import { broadcastToOrganization, broadcastToConversation, broadcastToDashboard } from "./lean-server";
import { supabase } from "@/lib/supabase/consolidated-exports";
import { trackNotificationLatency } from "@/lib/telemetry/performance-utils";

export interface AssignmentNotificationData {
  conversationId: string;
  assigneeId: string | null;
  assigneeName?: string;
  assignedBy: string;
  assignedByName?: string;
  previousAssigneeId?: string | null;
  timestamp: string;
  conversationTitle?: string;
  customerName?: string;
  customerEmail?: string;
  priority?: string;
  status?: string;
}

export interface AssignmentContext {
  organizationId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Send comprehensive assignment notifications
 */
export async function sendAssignmentNotifications(
  data: AssignmentNotificationData,
  context: AssignmentContext
): Promise<void> {
  const startTime = performance.now();

  try {
    // 1. Broadcast to organization-wide channel for dashboard updates
    await broadcastToOrganization(context.organizationId, "conversation_assigned", {
      ...data,
      eventType: "assignment_changed",
      organizationId: context.organizationId,
    });

    // 2. Broadcast to conversation-specific channel
    await broadcastToConversation(context.organizationId, data.conversationId, "conversation_update", {
      id: data.conversationId,
      assigned_to_user_id: data.assigneeId,
      assignee_id: data.assigneeId,
      assigned_agent_id: data.assigneeId,
      updated_at: data.timestamp,
      eventType: "assignment_changed",
    });

    // 3. Broadcast to dashboard for real-time metrics updates
    await broadcastToDashboard(context.organizationId, "assignment_metrics_update", {
      assigneeId: data.assigneeId,
      previousAssigneeId: data.previousAssigneeId,
      conversationId: data.conversationId,
      timestamp: data.timestamp,
    });

    // 4. Send targeted notifications to specific users
    await Promise.all([
      // Notify the newly assigned user
      data.assigneeId
        ? sendUserNotification(context.organizationId, data.assigneeId, "assignment_received", {
            title: "Conversation Assigned",
            message: `You've been assigned to a conversation${data.customerName ? ` with ${data.customerName}` : ""}`,
            conversationId: data.conversationId,
            assignedBy: data.assignedBy,
            priority: data.priority,
          })
        : Promise.resolve(),

      // Notify the previous assignee if there was one
      data.previousAssigneeId && data.previousAssigneeId !== data.assigneeId
        ? sendUserNotification(context.organizationId, data.previousAssigneeId, "assignment_removed", {
            title: "Conversation Reassigned",
            message: `A conversation has been reassigned to ${data.assigneeName || "another agent"}`,
            conversationId: data.conversationId,
            reassignedTo: data.assigneeId,
            reassignedBy: data.assignedBy,
          })
        : Promise.resolve(),

      // Notify the user who made the assignment (if different from assignee)
      data.assignedBy !== data.assigneeId
        ? sendUserNotification(context.organizationId, data.assignedBy, "assignment_confirmed", {
            title: "Assignment Confirmed",
            message: `Conversation assigned to ${data.assigneeName || "agent"}`,
            conversationId: data.conversationId,
            assigneeId: data.assigneeId,
          })
        : Promise.resolve(),
    ]);

    // 5. Create persistent notification records
    await createPersistentNotifications(data, context);

    // Track notification performance
    const duration = performance.now() - startTime;
    await trackNotificationLatency("assignment_notification", context.organizationId, context.userId, duration);

  } catch (error) {

    // Track failed notification
    const duration = performance.now() - startTime;
    await trackNotificationLatency("assignment_notification_failed", context.organizationId, context.userId, duration);

    throw error;
  }
}

/**
 * Send notification to a specific user
 */
async function sendUserNotification(
  organizationId: string,
  userId: string,
  notificationType: string,
  notificationData: Record<string, any>
): Promise<void> {
  try {
    // Broadcast to user-specific channel
    const userChannel = `org:${organizationId}:user:${userId}`;
    await broadcastToOrganization(organizationId, "user_notification", {
      userId,
      type: notificationType,
      data: notificationData,
      timestamp: new Date().toISOString(),
    });

    // Also send to user's notification channel
    const notificationChannel = `org:${organizationId}:user:${userId}:notifications`;
    const supabaseClient = supabase.admin();

    await supabaseClient.channel(notificationChannel).send({
      type: "broadcast",
      event: "new_notification",
      payload: {
        type: notificationType,
        ...notificationData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {

  }
}

/**
 * Create persistent notification records in the database
 */
async function createPersistentNotifications(
  data: AssignmentNotificationData,
  context: AssignmentContext
): Promise<void> {
  try {
    const supabaseClient = supabase.admin();
    const notifications = [];

    // Notification for newly assigned user
    if (data.assigneeId) {
      notifications.push({
        organization_id: context.organizationId,
        user_id: data.assigneeId,
        type: "assignment",
        title: "Conversation Assigned",
        message: `You've been assigned to a conversation${data.customerName ? ` with ${data.customerName}` : ""}`,
        conversation_id: data.conversationId,
        data: {
          assignedBy: data.assignedBy,
          assignedByName: data.assignedByName,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          priority: data.priority,
        },
        read: false,
        created_at: data.timestamp,
      });
    }

    // Notification for previous assignee
    if (data.previousAssigneeId && data.previousAssigneeId !== data.assigneeId) {
      notifications.push({
        organization_id: context.organizationId,
        user_id: data.previousAssigneeId,
        type: "reassignment",
        title: "Conversation Reassigned",
        message: `A conversation has been reassigned to ${data.assigneeName || "another agent"}`,
        conversation_id: data.conversationId,
        data: {
          reassignedTo: data.assigneeId,
          reassignedToName: data.assigneeName,
          reassignedBy: data.assignedBy,
          reassignedByName: data.assignedByName,
        },
        read: false,
        created_at: data.timestamp,
      });
    }

    if (notifications.length > 0) {
      const { error } = await supabaseClient.from("notifications").insert(notifications);

      if (error) {

      }
    }
  } catch (error) {

  }
}

/**
 * Send unassignment notifications
 */
export async function sendUnassignmentNotifications(
  conversationId: string,
  previousAssigneeId: string,
  context: AssignmentContext
): Promise<void> {
  const data: AssignmentNotificationData = {
    conversationId,
    assigneeId: null,
    previousAssigneeId,
    assignedBy: context.userId,
    assignedByName: context.userName,
    timestamp: new Date().toISOString(),
  };

  await sendAssignmentNotifications(data, context);
}

/**
 * Send bulk assignment notifications for multiple conversations
 */
export async function sendBulkAssignmentNotifications(
  assignments: Array<{
    conversationId: string;
    assigneeId: string;
    previousAssigneeId?: string;
  }>,
  context: AssignmentContext
): Promise<void> {
  const startTime = performance.now();

  try {
    // Send notifications in parallel for better performance
    await Promise.all(
      assignments.map((assignment) => {
        const data: AssignmentNotificationData = {
          conversationId: assignment.conversationId,
          assigneeId: assignment.assigneeId,
          previousAssigneeId: assignment.previousAssigneeId,
          assignedBy: context.userId,
          assignedByName: context.userName,
          timestamp: new Date().toISOString(),
        };

        return sendAssignmentNotifications(data, context);
      })
    );

    // Send bulk update notification
    await broadcastToOrganization(context.organizationId, "bulk_assignment_complete", {
      assignmentCount: assignments.length,
      assignedBy: context.userId,
      assignedByName: context.userName,
      timestamp: new Date().toISOString(),
    });

    const duration = performance.now() - startTime;

  } catch (error) {

    throw error;
  }
}
