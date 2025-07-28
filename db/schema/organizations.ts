import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { organizationMembers } from "./organizationMembers";
import { profiles } from "./profiles";

/**
 * Organizations Schema
 * Core organization entities for multi-tenant architecture
 */
export const organizations = pgTable(
  "organizations",
  {
    ...withTimestamps,
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    privateMetadata: jsonb("private_metadata").$type<Record<string, any>>().default({}),
    email: text("email"),
    clerkUserId: text("clerk_user_id"),
  },
  (table) => {
    return {
      slugIdx: index("idx_organizations_slug").on(table.slug),
      nameIdx: index("idx_organizations_name").on(table.name),
    };
  }
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  profiles: many(profiles),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
