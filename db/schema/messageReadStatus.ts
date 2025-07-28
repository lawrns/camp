import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { conversationMessages } from "./conversationMessages";

export const messageReadStatus = pgTable(
  "message_read_status",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    messageId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    readAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      messageIdIdx: index("idx_message_read_status_message_id").on(table.messageId),
      userIdIdx: index("idx_message_read_status_user_id").on(table.userId),
      uniqueConstraint: index("message_read_status_message_user_unique").on(table.messageId, table.userId),
    };
  }
);

export const messageReadStatusRelations = relations(messageReadStatus, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [messageReadStatus.messageId],
    references: [conversationMessages.id],
  }),
}));
