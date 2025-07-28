import { relations } from "drizzle-orm";
import { bigint, boolean, index, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";

/**
 * Organization Members Schema
 * Bridge table connecting Supabase auth.users with organizations and mailboxes for multi-tenant architecture
 */
export const organizationMembers = pgTable(
  "organization_members",
  {
    ...withTimestamps,
    id: uuid("id").primaryKey().defaultRandom(),

    // Reference to Supabase auth.users
    userId: uuid("user_id").notNull(),

    // Organization identifier (maps to existing organizationId)
    organizationId: text("organization_id").notNull(),

    // Reference to mailbox (tenant)
    mailboxId: bigint("mailbox_id", { mode: "number" })
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),

    // Role-based access control
    role: text("role").notNull().$type<"owner" | "admin" | "agent" | "viewer">(),

    // Status tracking
    status: text("status").notNull().default("active").$type<"active" | "inactive" | "pending">(),

    // Invitation tracking
    invitedBy: uuid("invited_by"),
    invitedAt: timestamp("invited_at", { withTimezone: true, mode: "date" }),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).defaultNow(),

    // Metadata
    permissions: jsonb("permissions").default({}),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }),
  },
  (table) => {
    return {
      userIdIdx: index("idx_org_members_user_id").on(table.userId),
      organizationIdIdx: index("idx_org_members_organization_id").on(table.organizationId),
      mailboxIdIdx: index("idx_org_members_mailbox_id").on(table.mailboxId),
      roleIdx: index("idx_org_members_role").on(table.role),
      statusIdx: index("idx_org_members_status").on(table.status),
      userOrgIdx: index("idx_org_members_user_org").on(table.userId, table.organizationId),
      userMailboxIdx: index("idx_org_members_user_mailbox").on(table.userId, table.mailboxId),
      orgRoleIdx: index("idx_org_members_org_role").on(table.organizationId, table.role),
      mailboxRoleIdx: index("idx_org_members_mailbox_role").on(table.mailboxId, table.role),
      uniqueMembershipIdx: unique("idx_org_members_unique_membership").on(
        table.userId,
        table.organizationId,
        table.mailboxId
      ),
    };
  }
);

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [organizationMembers.mailboxId],
    references: [mailboxes.id],
  }),
}));

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
