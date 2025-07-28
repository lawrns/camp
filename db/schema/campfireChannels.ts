import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Schema definition for campfire_channels table
 */
export const campfireChannels = pgTable("campfire_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
