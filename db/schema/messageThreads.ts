import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationMessages } from "./conversationMessages";
import { conversations } from "./conversations";

/**
 * Tracks message threading information, allowing messages to be organized into threads
 */
export const messageThreads = pgTable(
  "message_threads",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    threadId: text().notNull(), // Can be generated with nanoid or UUID
    parentMessageId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    conversationId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    title: text(),
    lastActivityAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      threadIdIdx: index("idx_message_threads_thread_id").on(table.threadId),
      parentMessageIdIdx: index("idx_message_threads_parent_message_id").on(table.parentMessageId),
      conversationIdIdx: index("idx_message_threads_conversation_id").on(table.conversationId),
      lastActivityAtIdx: index("idx_message_threads_last_activity_at").on(table.lastActivityAt),
    };
  }
);

export const messageThreadsRelations = relations(messageThreads, ({ one }) => ({
  parentMessage: one(conversationMessages, {
    fields: [messageThreads.parentMessageId],
    references: [conversationMessages.id],
  }),
  conversation: one(conversations, {
    fields: [messageThreads.conversationId],
    references: [conversations.id],
  }),
}));
