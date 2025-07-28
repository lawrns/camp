import { relations } from "drizzle-orm";
import { bigint, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationMessages } from "./conversationMessages";

export type QueueStatus = "queued" | "processing" | "delivered" | "failed";

export const messageQueue = pgTable(
  "message_queue",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    messageId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    status: text().notNull().$type<QueueStatus>(),
    retryCount: integer().notNull().default(0),
    maxRetries: integer().notNull().default(5),
    nextRetryAt: timestamp({ withTimezone: true }),
    errorMessage: text(),
  },
  (table) => {
    return {
      messageIdIdx: index("idx_message_queue_message_id").on(table.messageId),
      statusIdx: index("idx_message_queue_status").on(table.status),
      nextRetryAtIdx: index("idx_message_queue_next_retry_at").on(table.nextRetryAt),
    };
  }
);

export const messageQueueRelations = relations(messageQueue, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [messageQueue.messageId],
    references: [conversationMessages.id],
  }),
}));
