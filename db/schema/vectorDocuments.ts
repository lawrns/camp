import { json, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const vectorDocuments = pgTable("vector_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull(),
  embedding: json("embedding").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
