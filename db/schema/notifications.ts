import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { organizations } from "./organizations";
import { conversations } from "./conversations";

/**
 * General notification system for all users
 * Supports various notification types with flexible metadata
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),

  // Notification content
  type: text("type", {
    enum: ["message", "mention", "assignment", "system", "ai_handover"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .default("medium")
    .notNull(),

  // Read status
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),

  // Additional data
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  conversation: one(conversations, {
    fields: [notifications.conversationId],
    references: [conversations.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;