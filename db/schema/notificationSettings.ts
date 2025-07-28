import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

/**
 * User notification settings per organization
 */
export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Channel preferences
  email: boolean("email").default(true).notNull(),
  push: boolean("push").default(true).notNull(),
  desktop: boolean("desktop").default(true).notNull(),
  sound: boolean("sound").default(true).notNull(),

  // Digest settings
  digest: text("digest", { enum: ["none", "daily", "weekly"] })
    .default("none")
    .notNull(),

  // Quiet hours
  quietHours: jsonb("quiet_hours")
    .$type<{
      enabled: boolean;
      start?: string; // HH:MM format
      end?: string; // HH:MM format
    }>()
    .default({ enabled: false }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(profiles, {
    fields: [notificationSettings.userId],
    references: [profiles.id],
  }),
  organization: one(organizations, {
    fields: [notificationSettings.organizationId],
    references: [organizations.id],
  }),
}));

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NewNotificationSettings = typeof notificationSettings.$inferInsert;