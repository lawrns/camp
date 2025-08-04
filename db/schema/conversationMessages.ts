import { relations } from "drizzle-orm";
import { bigint, boolean, index, jsonb, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";
import { nativeEncryptedField } from "../lib/encryptedField";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";
import { platformCustomers } from "./platformCustomers";

// Export types used throughout the application
export type MessageRole = "user" | "assistant" | "system" | "tool";
export type ToolMetadata = {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
};
export type MessageMetadata = {
  confidence?: number;
  reasoning?: string;
  tool?: ToolMetadata;
  [key: string]: unknown;
};

// Export constants
export const DRAFT_STATUSES = ["draft", "sending", "sent", "failed"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const conversationMessages = pgTable(
  "messages",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    // CRITICAL: Direct organization_id for multi-tenant security and performance
    organizationId: uuid("organization_id").notNull(),
    conversationId: bigint({ mode: "number" }).notNull(),
    content: nativeEncryptedField("encrypted_content"),
    senderName: text(),
    senderEmail: text(),
    senderType: text().$type<"customer" | "agent" | "system">().notNull(),
    role: text().$type<"user" | "assistant" | "system" | "tool">(),
    source: text().$type<"email" | "chat" | "api" | "helpscout" | "slack">(),
    sourceData: jsonb().$type<{
      messageId?: string;
      emailId?: string;
      threadId?: string;
      references?: string[];
      inReplyTo?: string;
      [key: string]: unknown;
    }>(),
    inReplyToId: bigint({ mode: "number" }),
    responseToId: bigint({ mode: "number" }),
    isDeleted: boolean().notNull().default(false),
    deletedAt: timestamp(),
    validatedMailboxId: uuid("validated_mailbox_id"),
    gmailThreadId: text("gmail_thread_id"),
    cleanedUpText: text("cleaned_up_text"),
    isPrompt: boolean("is_prompt").default(false),
    metadata: jsonb().$type<MessageMetadata>().default({}),
    attachments: jsonb().$type<
      {
        id: string;
        name: string;
        url: string;
        size: number;
        type: string;
      }[]
    >(),
    summary: jsonb().$type<string[]>(),
    embedding: vector({ dimensions: 1536 }),
    embeddingText: text(),
    deliveryStatus: text().$type<"pending" | "sent" | "delivered" | "failed">().default("delivered"),
    deliveryMetadata: jsonb().$type<{
      attempts?: number;
      lastAttempt?: string;
      error?: string;
      [key: string]: unknown;
    }>(),
    // Additional properties needed by the codebase
    status: text().$type<"pending" | "sent" | "delivered" | "failed">(),
    body: text(), // Alternative to content for some use cases
    clerkUserId: text("clerk_user_id"),
    gmailMessageId: text("gmail_message_id"),
  },
  (table) => {
    return {
      // CRITICAL: Organization index for multi-tenant security
      organizationIdIdx: index("messages_organization_id_idx").on(table.organizationId),
      // Composite indexes for performance
      orgConversationCreatedIdx: index("messages_org_conversation_created_idx").on(
        table.organizationId,
        table.conversationId,
        table.createdAt
      ),
      orgSenderTypeIdx: index("messages_org_sender_type_idx").on(table.organizationId, table.senderType),
      // Existing indexes
      conversationIdIdx: index("messages_conversation_id_6ff892e4").on(table.conversationId),
      createdAtIdx: index("messages_created_at_55fe4d42").on(table.createdAt),
      senderEmailIdx: index("messages_sender_email_a7e79845").on(table.senderEmail),
      senderTypeIdx: index("messages_sender_type_c4a69ecf").on(table.senderType),
      embeddingVectorIdx: index("messages_embedding_vector_index").using(
        "hnsw",
        table.embedding.asc().nullsLast().op("vector_cosine_ops")
      ),
      sourceIdx: index("messages_source_idx").on(table.source),
      deliveryStatusIdx: index("messages_delivery_status_idx").on(table.deliveryStatus),
      // Performance index for conversation message queries
      conversationCreatedAtIdx: index("idx_messages_conversation_created_at").on(
        table.conversationId,
        table.createdAt.desc()
      ),
    };
  }
);

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  platformCustomer: one(platformCustomers, {
    fields: [conversationMessages.senderEmail],
    references: [platformCustomers.email],
  }),
  inReplyTo: one(conversationMessages, {
    fields: [conversationMessages.inReplyToId],
    references: [conversationMessages.id],
  }),
}));
