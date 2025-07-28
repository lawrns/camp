import { bigint, boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";

/**
 * Tracks user online presence status and activity
 */
export const userPresence = pgTable(
  "user_presence",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: text().notNull().unique(),
    isOnline: boolean().notNull().default(false),
    lastActive: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastHeartbeat: timestamp({ withTimezone: true }).notNull().defaultNow(),
    statusMessage: text(),
  },
  (table) => {
    return {
      userIdIdx: index("idx_user_presence_user_id").on(table.userId),
      lastHeartbeatIdx: index("idx_user_presence_last_heartbeat").on(table.lastHeartbeat),
      lastActiveIdx: index("idx_user_presence_last_active").on(table.lastActive),
    };
  }
);

/**
 * Status options for user presence
 */
export type UserStatus = "online" | "away" | "busy" | "offline" | "hidden";
