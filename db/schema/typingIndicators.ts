import { relations } from "drizzle-orm";
import { bigint, boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";

export type SenderType = "agent" | "visitor" | "system" | "bot";

export const typingIndicators = pgTable(
  "typing_indicators",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    conversationId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    senderType: text().notNull().$type<SenderType>(),
    isTyping: boolean().notNull().default(false),
    content: text(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      conversationIdIdx: index("idx_typing_indicators_conversation_id").on(table.conversationId),
      isTypingIdx: index("idx_typing_indicators_is_typing").on(table.isTyping),
      updatedAtIdx: index("idx_typing_indicators_updated_at").on(table.updatedAt),
      uniqueConstraint: index("typing_indicators_conversation_user_unique").on(table.conversationId, table.userId),
    };
  }
);

export const typingIndicatorRelations = relations(typingIndicators, ({ one }) => ({
  conversation: one(conversations, {
    fields: [typingIndicators.conversationId],
    references: [conversations.id],
  }),
}));
