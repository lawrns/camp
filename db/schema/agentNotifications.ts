import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Agent notification preferences and delivery tracking
 * Supports multiple notification channels with delivery confirmation
 */
export const agentNotifications = pgTable("agent_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: text("agent_id").notNull(),
  handoffId: uuid("handoff_id").references(() => require("./campfireHandoffs").campfireHandoffs.id),

  // Notification content
  type: text("type", {
    enum: ["handoff_request", "assignment", "escalation", "queue_alert", "system_alert"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),

  // Delivery methods and status
  channels: jsonb("channels")
    .$type<{
      push: { enabled: boolean; token?: string; delivered?: boolean; deliveredAt?: string };
      websocket: { enabled: boolean; delivered?: boolean; deliveredAt?: string };
      email: { enabled: boolean; address?: string; delivered?: boolean; deliveredAt?: string };
      sms: { enabled: boolean; number?: string; delivered?: boolean; deliveredAt?: string };
    }>()
    .notNull()
    .default({
      push: { enabled: true },
      websocket: { enabled: true },
      email: { enabled: false },
      sms: { enabled: false },
    }),

  // Delivery tracking
  status: text("status", {
    enum: ["pending", "delivered", "failed", "acknowledged", "expired"],
  }).default("pending"),
  deliveryAttempts: integer("delivery_attempts").default(0),
  lastDeliveryAttempt: timestamp("last_delivery_attempt"),
  acknowledgedAt: timestamp("acknowledged_at"),
  expiresAt: timestamp("expires_at"),

  // Metadata
  metadata: jsonb("metadata").$type<{
    conversationId?: string;
    customerId?: string;
    urgencyScore?: number;
    context?: Record<string, any>;
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Agent notification preferences
 * Configurable per agent for different notification types
 */
export const agentNotificationPreferences = pgTable("agent_notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: text("agent_id").notNull().unique(),

  // Channel preferences by notification type
  preferences: jsonb("preferences")
    .$type<{
      handoff_request: {
        push: boolean;
        websocket: boolean;
        email: boolean;
        sms: boolean;
        sound: boolean;
      };
      assignment: {
        push: boolean;
        websocket: boolean;
        email: boolean;
        sms: boolean;
        sound: boolean;
      };
      escalation: {
        push: boolean;
        websocket: boolean;
        email: boolean;
        sms: boolean;
        sound: boolean;
      };
      queue_alert: {
        push: boolean;
        websocket: boolean;
        email: boolean;
        sms: boolean;
        sound: boolean;
      };
    }>()
    .notNull()
    .default({
      handoff_request: {
        push: true,
        websocket: true,
        email: false,
        sms: false,
        sound: true,
      },
      assignment: {
        push: true,
        websocket: true,
        email: true,
        sms: false,
        sound: true,
      },
      escalation: {
        push: true,
        websocket: true,
        email: true,
        sms: true,
        sound: true,
      },
      queue_alert: {
        push: false,
        websocket: true,
        email: false,
        sms: false,
        sound: false,
      },
    }),

  // Contact information
  pushTokens: jsonb("push_tokens").$type<string[]>().default([]),
  emailAddress: text("email_address"),
  phoneNumber: text("phone_number"),

  // Working hours and availability
  workingHours: jsonb("working_hours").$type<{
    timezone: string;
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean };
    };
  }>(),

  // Do not disturb settings
  doNotDisturb: jsonb("do_not_disturb")
    .$type<{
      enabled: boolean;
      start?: string;
      end?: string;
      days?: string[];
    }>()
    .default({ enabled: false }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AgentNotification = typeof agentNotifications.$inferSelect;
export type NewAgentNotification = typeof agentNotifications.$inferInsert;
export type AgentNotificationPreferences = typeof agentNotificationPreferences.$inferSelect;
export type NewAgentNotificationPreferences = typeof agentNotificationPreferences.$inferInsert;
