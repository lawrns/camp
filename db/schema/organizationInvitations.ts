import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./organizations";

// Organization invitation status enum
export const organizationInvitationStatusEnum = pgEnum("organization_invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

// Organization invitation role enum
export const organizationInvitationRoleEnum = pgEnum("organization_invitation_role", [
  "owner",
  "admin",
  "agent",
  "viewer",
]);

// Organization invitations table
export const organizationInvitations = pgTable("organization_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: organizationInvitationRoleEnum("role").notNull(),
  token: text("token").notNull().unique(),
  invitedBy: uuid("invited_by").notNull(), // References auth.users(id)
  status: organizationInvitationStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedBy: uuid("accepted_by"), // References auth.users(id)
});

// Zod schemas
export const insertOrganizationInvitationSchema = createInsertSchema(organizationInvitations, {
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "agent", "viewer"]),
});

export const selectOrganizationInvitationSchema = createSelectSchema(organizationInvitations);

export const updateOrganizationInvitationSchema = insertOrganizationInvitationSchema.partial();

// TypeScript types
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;
export type UpdateOrganizationInvitation = Partial<NewOrganizationInvitation>;

// Type aliases for schemas - avoiding generic constraints
export type SelectOrganizationInvitationSchema = typeof selectOrganizationInvitationSchema;
export type InsertOrganizationInvitationSchema = typeof insertOrganizationInvitationSchema;
export type UpdateOrganizationInvitationSchema = typeof updateOrganizationInvitationSchema;

// Validation schemas for API endpoints
export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "agent", "viewer"]).default("agent"),
  sendInvite: z.boolean().default(true),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  organizationId: z.string().uuid(),
  userInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const validateInvitationSchema = z.object({
  token: z.string().min(1),
  org: z.string().uuid(),
});
