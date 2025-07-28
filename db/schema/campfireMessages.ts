import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Schema definition for campfire_messages table
 */
export const campfireMessages = pgTable("campfire_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
