import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";

/**
 * User Profiles Schema
 * Stores user profile information linked to Supabase auth.users
 */
export const profiles = pgTable(
  "profiles",
  {
    ...withTimestamps,
    userId: uuid("user_id").primaryKey(),
    organizationId: uuid("organization_id"),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    role: text("role").default("member"),
  },
  (table) => {
    return {
      userIdIdx: index("idx_profiles_user_id").on(table.userId),
      organizationIdIdx: index("idx_profiles_organization_id").on(table.organizationId),
      emailIdx: index("idx_profiles_email").on(table.email),
    };
  }
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
