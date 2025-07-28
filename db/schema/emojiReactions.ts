import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationMessages } from "./conversationMessages";

/**
 * Tracks emoji reactions to messages
 */
export const emojiReactions = pgTable(
  "emoji_reactions",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    messageId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    userId: text().notNull(),
    emoji: text().notNull(), // Unicode emoji character or shortcode
  },
  (table) => {
    return {
      messageIdIdx: index("idx_emoji_reactions_message_id").on(table.messageId),
      userIdIdx: index("idx_emoji_reactions_user_id").on(table.userId),
      emojiIdx: index("idx_emoji_reactions_emoji").on(table.emoji),
      // Ensure each user can only react once with the same emoji to a message
      uniqueConstraint: index("emoji_reactions_message_user_emoji_unique").on(
        table.messageId,
        table.userId,
        table.emoji
      ),
    };
  }
);

export const emojiReactionsRelations = relations(emojiReactions, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [emojiReactions.messageId],
    references: [conversationMessages.id],
  }),
}));
