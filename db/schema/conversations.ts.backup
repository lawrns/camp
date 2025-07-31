import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { mailboxes } from "@/db/schema/mailboxes";
import { nativeEncryptedField } from "../lib/encryptedField";
import { randomSlugField } from "../lib/randomSlugField";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationEvents } from "./conversationEvents";
import { conversationMessages } from "./conversationMessages";
import { platformCustomers } from "./platformCustomers";
import { ragProfiles } from "./ragProfiles";

export const conversations = pgTable(
  "conversations", // Fixed: changed from "conversations_conversation" to "conversations"
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    // CRITICAL: Direct organization_id for multi-tenant security and performance
    organizationId: uuid("organization_id").notNull(),
    uid: randomSlugField("uid"),
    mailboxId: bigint({ mode: "number" }).notNull(),
    subject: text(),
    status: text().default("open"),
    assignedToId: bigint({ mode: "number" }),
    assignedToUserId: text(),
    assignedToType: text(),
    vipStatus: boolean().default(false),
    unread: boolean().default(true),
    priority: integer().default(1),
    tags: text().array(),
    isSpam: boolean().default(false),
    lastReplyAt: timestamp({ precision: 6, withTimezone: true }),
    customerWaitingSince: timestamp({ precision: 6, withTimezone: true }),
    lastRagResponseId: uuid("last_rag_response_id"),
    platformCustomerInfo: jsonb(),
    phoneNumber: text(),
    whatsAppNumber: text(),
    customerDisplayName: text(),
    customerDisplayNameManual: text(),
    conversationState: text().default("active"),
    language: text(),
    source: text(),
    sourceInfo: jsonb(),
    messageCount: integer().default(0),
    customFields: jsonb(),
    embedding: vector({ dimensions: 1536 }),
    lastActiveAt: timestamp({ precision: 6, withTimezone: true }),
    estimatedResponseTime: integer(),
    satisfactionRating: integer(),
    customerEmail: nativeEncryptedField("customer_email"),
    // GitHub integration fields
    githubIssueNumber: integer(),
    githubIssueUrl: text(),
    githubRepoOwner: text(),
    githubRepoName: text(),
    // Additional properties needed by the codebase
    closedAt: timestamp({ precision: 6, withTimezone: true }),
    lastUserEmailCreatedAt: timestamp({ precision: 6, withTimezone: true }),
    isPrompt: boolean().default(false),
  },
  (conversations) => ({
    // CRITICAL: Organization-first indexes for performance
    organizationIdIdx: index("idx_conversations_organization_id").on(conversations.organizationId),
    orgStatusCreatedIdx: index("idx_conversations_org_status_created").on(
      conversations.organizationId,
      conversations.status,
      conversations.createdAt
    ),
    orgMailboxStatusIdx: index("idx_conversations_org_mailbox_status").on(
      conversations.organizationId,
      conversations.mailboxId,
      conversations.status
    ),

    // Existing indexes preserved
    mailboxIdIdx: index().on(conversations.mailboxId),
    statusIdx: index().on(conversations.status),
    assignedToIdIdx: index().on(conversations.assignedToId),
    assignedToUserIdIdx: index().on(conversations.assignedToUserId),
    createdAtIdx: index().on(conversations.createdAt),
    isSpamIdx: index().on(conversations.isSpam),
    lastActiveAtIdx: index().on(conversations.lastActiveAt),
    customerEmailIdx: index().on(conversations.customerEmail),
    uidUnique: unique().on(conversations.uid),
  })
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  mailbox: one(mailboxes, {
    fields: [conversations.mailboxId],
    references: [mailboxes.id],
  }),
  messages: many(conversationMessages),
  events: many(conversationEvents),
  platformCustomer: one(platformCustomers, {
    fields: [conversations.customerEmail],
    references: [platformCustomers.email],
  }),
  ragProfile: one(ragProfiles, {
    fields: [conversations.lastRagResponseId],
    references: [ragProfiles.id],
  }),
}));
