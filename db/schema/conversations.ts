import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  real,
} from "drizzle-orm/pg-core";
import { mailboxes } from "@/db/schema/mailboxes";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationEvents } from "./conversationEvents";
import { conversationMessages } from "./conversationMessages";

export const conversations = pgTable(
  "conversations",
  {
    ...withTimestamps,
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    mailboxId: integer("mailbox_id"),
    
    // Conversation properties
    subject: text("subject"),
    status: text("status").default("open"),
    priority: text("priority").default("medium"),
    
    // Assignment
    assignedToUserId: uuid("assigned_to_user_id"),
    assignmentMetadata: jsonb("assignment_metadata").default("{}"),
    assignedAt: timestamp("assigned_at", { precision: 6, withTimezone: true }),
    
    // Customer information
    customer: jsonb("customer").default("{}"),
    customerId: uuid("customer_id"),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    customerVerified: boolean("customer_verified").default(false),
    customerOnline: boolean("customer_online").default(false),
    customerIp: text("customer_ip"),
    customerBrowser: text("customer_browser"),
    customerOs: text("customer_os"),
    customerDeviceType: text("customer_device_type").default("desktop"),
    
    // AI and RAG
    ragEnabled: boolean("rag_enabled").default(false),
    aiHandoverActive: boolean("ai_handover_active").default(false),
    aiPersona: text("ai_persona").default("friendly"),
    aiConfidenceScore: real("ai_confidence_score").default(0.0),
    
    // Metadata
    metadata: jsonb("metadata").default("{}"),
    tags: text("tags").array().default([]),
    
    // Timestamps
    lastMessageAt: timestamp("last_message_at", { precision: 6, withTimezone: true }),
    closedAt: timestamp("closed_at", { precision: 6, withTimezone: true }),
  },
  (conversations) => ({
    // Indexes for performance
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
    assignedToUserIdIdx: index("idx_conversations_assigned_to_user_id").on(conversations.assignedToUserId),
    aiHandoverIdx: index("idx_conversations_ai_handover").on(conversations.aiHandoverActive),
    lastMessageAtIdx: index("idx_conversations_last_message_at").on(conversations.lastMessageAt),
    customerEmailIdx: index("idx_conversations_customer_email").on(conversations.customerEmail),
  })
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  mailbox: one(mailboxes, {
    fields: [conversations.mailboxId],
    references: [mailboxes.id],
  }),
  messages: many(conversationMessages),
  events: many(conversationEvents),
}));
