import { relations } from "drizzle-orm";
import { bigint, boolean, index, integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { randomSlugField } from "../lib/randomSlugField";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationMessages } from "./conversationMessages";
import { notes } from "./notes";

export const files = pgTable(
  "conversations_file",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text().notNull(),
    url: text().notNull(),
    mimetype: text().notNull(),
    size: integer().notNull(),
    messageId: bigint("message_id", { mode: "number" }),
    noteId: bigint("note_id", { mode: "number" }),
    previewUrl: text(),
    isInline: boolean().notNull(),
    isPublic: boolean().notNull(),
    slug: randomSlugField("slug"),
  },
  (table) => {
    return {
      createdAtIdx: index("conversatio_created_9fddde_idx").on(table.createdAt),
      messageIdIdx: index("conversations_file_message_id_idx").on(table.messageId),
      noteIdIdx: index("conversations_file_note_id_idx").on(table.noteId),
      slugUnique: unique("conversations_file_slug_key").on(table.slug),
    };
  }
);

export const filesRelations = relations(files, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [files.messageId],
    references: [conversationMessages.id],
  }),
  note: one(notes, {
    fields: [files.noteId],
    references: [notes.id],
  }),
}));
