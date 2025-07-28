import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";

export const unused_escalations = pgTable(
  "conversations_escalation",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    slackMessageTs: text(),
    resolvedAt: timestamp({ withTimezone: true, mode: "date" }),
    conversationId: bigint({ mode: "number" }).notNull(),
    slackChannel: text(),
    summary: text(),
    userId: text(), // Migrated from clerkUserId to Supabase user ID
  },
  (table) => {
    return {
      createdAtIdx: index("conversatio_created_176a78_idx").on(table.createdAt),
      conversationIdIdx: index("conversations_escalation_conversation_id_6a4dba67").on(table.conversationId),
    };
  }
);

export const escalationsRelations = relations(unused_escalations, ({ one }) => ({
  conversation: one(conversations, {
    fields: [unused_escalations.conversationId],
    references: [conversations.id],
  }),
}));
