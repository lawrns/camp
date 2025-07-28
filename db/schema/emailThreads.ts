import { relations } from "drizzle-orm";
import { bigint, boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";
import { mailboxes } from "./mailboxes";

export const emailThreads = pgTable(
  "email_threads",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),

    // Email identifiers
    messageId: text("message_id").notNull().unique(),
    threadId: text("thread_id").notNull(),

    // Email headers
    subject: text("subject").notNull(),
    from: text("from").notNull(),
    to: text("to").notNull(),
    cc: text("cc"),
    bcc: text("bcc"),
    replyTo: text("reply_to"),

    // Email content
    textContent: text("text_content"),
    htmlContent: text("html_content"),

    // Email metadata
    headers: jsonb("headers").$type<Record<string, string>>(),
    attachments: jsonb("attachments").$type<
      Array<{
        filename: string;
        contentType: string;
        size: number;
        contentId?: string;
      }>
    >(),

    // Processing status
    isProcessed: boolean("is_processed").default(false).notNull(),
    processingError: text("processing_error"),

    // Relationships
    mailboxId: bigint("mailbox_id", { mode: "number" })
      .references(() => mailboxes.id, {
        onDelete: "cascade",
      })
      .notNull(),
    conversationId: bigint("conversation_id", { mode: "number" }).references(() => conversations.id, {
      onDelete: "set null",
    }),

    // Email-specific timestamps
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  },
  (table) => {
    return {
      messageIdIdx: index("email_threads_message_id_idx").on(table.messageId),
      threadIdIdx: index("email_threads_thread_id_idx").on(table.threadId),
      mailboxIdIdx: index("email_threads_mailbox_id_idx").on(table.mailboxId),
      conversationIdIdx: index("email_threads_conversation_id_idx").on(table.conversationId),
      receivedAtIdx: index("email_threads_received_at_idx").on(table.receivedAt),
      isProcessedIdx: index("email_threads_is_processed_idx").on(table.isProcessed),
    };
  }
);

export const emailThreadsRelations = relations(emailThreads, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [emailThreads.mailboxId],
    references: [mailboxes.id],
  }),
  conversation: one(conversations, {
    fields: [emailThreads.conversationId],
    references: [conversations.id],
  }),
}));
