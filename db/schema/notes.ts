import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text } from "drizzle-orm/pg-core";
import { files } from "@/db/schema/files";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";

export const notes = pgTable(
  "conversations_note",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    body: text().notNull(),
    userId: text(), // Migrated from clerkUserId to Supabase user ID
    role: text(),
    conversationId: bigint({ mode: "number" }).notNull(),
    slackMessageTs: text(),
    slackChannel: text(),
  },
  (table) => {
    return {
      createdAtIdx: index("conversatio_created_5ad461_idx").on(table.createdAt),
      conversationIdIdx: index("conversations_note_conversation_id_a486ed4c").on(table.conversationId),
      userIdIdx: index("conversations_note_user_id").on(table.userId),
    };
  }
);

export const notesRelations = relations(notes, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [notes.conversationId],
    references: [conversations.id],
  }),
  files: many(files),
}));
