import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { campfireHandoffs } from "./campfireHandoffs";

/**
 * Audit logs for handoff actions
 */
export const campfireHandoffLogs = pgTable("campfire_handoff_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  handoffId: uuid("handoff_id")
    .notNull()
    .references(() => campfireHandoffs.id),
  action: text("action").notNull(),
  userId: text("user_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"),
});
