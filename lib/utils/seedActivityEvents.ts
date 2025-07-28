import { supabase } from "@/lib/supabase";
import { ActivityEvents, logAIActivity, logSystemActivity, logUserActivity } from "./activityLogger";

export interface SeedActivityParams {
  organizationId: string;
  userId: string;
  count?: number;
}

/**
 * Seed sample activity events for testing and demonstration
 */
export async function seedActivityEvents({ organizationId, userId, count = 20 }: SeedActivityParams): Promise<void> {

  const activities = [
    // Recent conversation activities
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.CONVERSATION_CREATED("conv-1", "Payment issue with subscription")
      ),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.MESSAGE_SENT(userId, "conv-1", "Hello! I'm having trouble with my payment method.")
      ),
    () => logAIActivity(organizationId, ActivityEvents.AI_RESPONSE_GENERATED("conv-1", 0.85)),
    () =>
      logUserActivity(organizationId, userId, ActivityEvents.CONVERSATION_ASSIGNED("conv-1", userId, "Sarah Johnson")),

    // Ticket management
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.TICKET_CREATED("ticket-1", "API Integration Help", "high")
      ),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.TICKET_UPDATED("ticket-1", "status", "open", "in-progress")
      ),

    // System activities
    () =>
      logSystemActivity(
        organizationId,
        ActivityEvents.SYSTEM_UPDATE("2.1.0", ["New dashboard", "Improved search", "Bug fixes"])
      ),
    () =>
      logSystemActivity(organizationId, ActivityEvents.SYSTEM_MAINTENANCE("Scheduled database optimization completed")),

    // Security events
    () => logUserActivity(organizationId, userId, ActivityEvents.SECURITY_PASSWORD_CHANGED(userId)),
    () => logUserActivity(organizationId, userId, ActivityEvents.API_KEY_CREATED("Production API Key")),

    // More conversation activities
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.CONVERSATION_CREATED("conv-2", "Feature request: Dark mode")
      ),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.MESSAGE_RECEIVED(userId, "conv-2", "Could you please add a dark mode option to the dashboard?")
      ),
    () => logUserActivity(organizationId, userId, ActivityEvents.CONVERSATION_ASSIGNED("conv-2", userId, "Mike Chen")),
    () =>
      logUserActivity(organizationId, userId, ActivityEvents.CONVERSATION_CLOSED("conv-2", "Feature added to roadmap")),

    // AI interactions
    () =>
      logAIActivity(
        organizationId,
        ActivityEvents.AI_HANDOVER_REQUESTED("conv-3", "Complex technical question requires human expertise")
      ),
    () => logAIActivity(organizationId, ActivityEvents.AI_RESPONSE_GENERATED("conv-4", 0.92)),

    // Webhook activities
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.WEBHOOK_CREATED("Slack Notifications", "https://hooks.slack.com/services/...")
      ),
    () =>
      logSystemActivity(
        organizationId,
        ActivityEvents.WEBHOOK_TRIGGERED("Slack Notifications", "message.created", true)
      ),

    // More tickets
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.TICKET_CREATED("ticket-2", "Mobile app crashes on login", "urgent")
      ),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.TICKET_CLOSED("ticket-1", "Provided documentation and code examples")
      ),

    // User management
    () => logUserActivity(organizationId, userId, ActivityEvents.USER_JOINED("user-2", "Alex Rodriguez")),

    // Additional conversations
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.CONVERSATION_CREATED("conv-5", "Billing question about enterprise plan")
      ),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.MESSAGE_SENT(
          userId,
          "conv-5",
          "Hi, I'd like to upgrade to the enterprise plan. What are the benefits?"
        )
      ),

    // Security activities
    () =>
      logSystemActivity(
        organizationId,
        ActivityEvents.SECURITY_LOGIN_FAILED("suspicious@example.com", "192.168.1.100")
      ),
    () => logUserActivity(organizationId, userId, ActivityEvents.API_KEY_REVOKED("Old Development Key")),
  ];

  // Shuffle activities and take only the requested count
  const shuffledActivities = activities.sort(() => Math.random() - 0.5).slice(0, count);

  // Execute activities with small delays to create realistic timestamps
  for (let i = 0; i < shuffledActivities.length; i++) {
    try {
      await shuffledActivities[i]();
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {

    }
  }

}

/**
 * Seed activity events for a specific conversation
 */
export async function seedConversationActivity(
  organizationId: string,
  userId: string,
  conversationId: string,
  conversationSubject: string
): Promise<void> {
  const activities = [
    () =>
      logUserActivity(organizationId, userId, ActivityEvents.CONVERSATION_CREATED(conversationId, conversationSubject)),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.MESSAGE_SENT(userId, conversationId, "Initial message for this conversation")
      ),
    () => logAIActivity(organizationId, ActivityEvents.AI_RESPONSE_GENERATED(conversationId, 0.88)),
    () =>
      logUserActivity(
        organizationId,
        userId,
        ActivityEvents.CONVERSATION_ASSIGNED(conversationId, userId, "Current User")
      ),
  ];

  for (const activity of activities) {
    try {
      await activity();
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {

    }
  }
}

/**
 * Clean up old activity events (for testing)
 */
export async function cleanupActivityEvents(organizationId: string): Promise<void> {
  // Use the already imported supabase

  try {
    const { error } = await supabase.admin().from("activity_events").delete().eq("organization_id", organizationId);

    if (error) {

    } else {

    }
  } catch (error) {

  }
}
