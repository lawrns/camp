import { relations } from "drizzle-orm";
import { bigint, customType, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { knowledgeDocuments } from "./knowledgeDocuments";
import { mailboxes } from "./mailboxes";

// Custom type for vector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
});

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    documentId: bigint({ mode: "number" })
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    mailboxId: bigint({ mode: "number" })
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    content: text().notNull(),
    contentHash: text(),
    tokenCount: integer(),
    chunkIndex: integer(),
    embedding: vector("embedding"),
    metadata: jsonb(),
  },
  (table) => {
    return {
      documentIdIdx: index("idx_knowledge_chunks_document_id").on(table.documentId),
      mailboxIdIdx: index("idx_knowledge_chunks_mailbox_id").on(table.mailboxId),
    };
  }
);

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeChunks.documentId],
    references: [knowledgeDocuments.id],
  }),
  mailbox: one(mailboxes, {
    fields: [knowledgeChunks.mailboxId],
    references: [mailboxes.id],
  }),
}));
