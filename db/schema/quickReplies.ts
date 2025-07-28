import { relations } from "drizzle-orm";
import { bigint, boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";

/**
 * Quick replies for faster responses
 */
export const quickReplies = pgTable(
  "quick_replies",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: text().notNull(),
    mailboxId: bigint({ mode: "number" }).references(() => mailboxes.id, { onDelete: "cascade" }),
    title: text().notNull(),
    content: text().notNull(),
    category: text(),
    usageCount: integer().notNull().default(0),
    isGlobal: boolean().notNull().default(false),
    isTemplate: boolean().notNull().default(false),
    tags: text().array(),
  },
  (table) => {
    return {
      userIdIdx: index("idx_quick_replies_user_id").on(table.userId),
      mailboxIdIdx: index("idx_quick_replies_mailbox_id").on(table.mailboxId),
      categoryIdx: index("idx_quick_replies_category").on(table.category),
      isGlobalIdx: index("idx_quick_replies_is_global").on(table.isGlobal),
      isTemplateIdx: index("idx_quick_replies_is_template").on(table.isTemplate),
      usageCountIdx: index("idx_quick_replies_usage_count").on(table.usageCount),
    };
  }
);

export const quickRepliesRelations = relations(quickReplies, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [quickReplies.mailboxId],
    references: [mailboxes.id],
  }),
}));
