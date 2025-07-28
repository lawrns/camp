import { relations } from "drizzle-orm";
import { bigint, boolean, index, json, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversations } from "./conversations";
import { mailboxes } from "./mailboxes";

export type SourceType = "pdf" | "url" | "markdown" | "docx" | "text" | "html";

// Knowledge Documents Table
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    mailboxId: text()
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    sourceType: text().notNull().$type<SourceType>(),
    sourceUrl: text(),
    content: text(),
    metadata: json(),
    tags: text().array(),
    category: text(),
    enabled: boolean().default(true),
    createdBy: text(),
  },
  (table) => {
    return {
      mailboxIdIdx: index("idx_knowledge_documents_mailbox_id").on(table.mailboxId),
      sourceTypeIdx: index("idx_knowledge_documents_source_type").on(table.sourceType),
      tagsIdx: index("idx_knowledge_documents_tags").on(table.tags),
    };
  }
);

// Knowledge Document Versions Table
export const knowledgeDocumentVersions = pgTable(
  "knowledge_document_versions",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    documentId: bigint({ mode: "number" })
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    content: text().notNull(),
    metadata: json(),
    versionNumber: bigint({ mode: "number" }).notNull(),
    createdBy: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      documentIdIdx: index("idx_knowledge_document_versions_document_id").on(table.documentId),
      versionNumberIdx: index("idx_knowledge_document_versions_version_number").on(table.versionNumber),
    };
  }
);

// Knowledge Suggestions Table
export const knowledgeSuggestions = pgTable(
  "knowledge_suggestions",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    mailboxId: text()
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    content: text().notNull(),
    title: text(),
    reason: text().notNull(),
    sourceConversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    replacementForId: bigint({ mode: "number" }).references(() => knowledgeDocuments.id, { onDelete: "set null" }),
    status: text().default("pending"),
    metadata: json(),
  },
  (table) => {
    return {
      mailboxIdIdx: index("idx_knowledge_suggestions_mailbox_id").on(table.mailboxId),
      statusIdx: index("idx_knowledge_suggestions_status").on(table.status),
      sourceConversationIdIdx: index("idx_knowledge_suggestions_source_conversation_id").on(table.sourceConversationId),
    };
  }
);

// Knowledge Categories Table
export const knowledgeCategories = pgTable(
  "knowledge_categories",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    mailboxId: text()
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    parentId: bigint({ mode: "number" }),
  },
  (table) => {
    return {
      mailboxIdIdx: index("idx_knowledge_categories_mailbox_id").on(table.mailboxId),
      parentIdIdx: index("idx_knowledge_categories_parent_id").on(table.parentId),
    };
  }
);

// Relations for knowledgeCategories (removed duplicate - see end of file)

// Document-Category Junction Table
export const knowledgeDocumentCategories = pgTable(
  "knowledge_document_categories",
  {
    documentId: bigint({ mode: "number" })
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    categoryId: bigint({ mode: "number" })
      .notNull()
      .references(() => knowledgeCategories.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      documentIdIdx: index("idx_knowledge_document_categories_document_id").on(table.documentId),
      categoryIdIdx: index("idx_knowledge_document_categories_category_id").on(table.categoryId),
      pk: primaryKey({ columns: [table.documentId, table.categoryId] }),
    };
  }
);

// Relations
export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one, many }) => ({
  mailbox: one(mailboxes, {
    fields: [knowledgeDocuments.mailboxId],
    references: [mailboxes.id],
  }),
  versions: many(knowledgeDocumentVersions),
  categories: many(knowledgeDocumentCategories),
}));

export const knowledgeDocumentVersionsRelations = relations(knowledgeDocumentVersions, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeDocumentVersions.documentId],
    references: [knowledgeDocuments.id],
  }),
}));

export const knowledgeSuggestionsRelations = relations(knowledgeSuggestions, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [knowledgeSuggestions.mailboxId],
    references: [mailboxes.id],
  }),
  sourceConversation: one(conversations, {
    fields: [knowledgeSuggestions.sourceConversationId],
    references: [conversations.id],
  }),
  replacementFor: one(knowledgeDocuments, {
    fields: [knowledgeSuggestions.replacementForId],
    references: [knowledgeDocuments.id],
  }),
}));

export const knowledgeCategoriesRelations = relations(knowledgeCategories, ({ one, many }) => ({
  mailbox: one(mailboxes, {
    fields: [knowledgeCategories.mailboxId],
    references: [mailboxes.id],
  }),
  parent: one(knowledgeCategories, {
    fields: [knowledgeCategories.parentId],
    references: [knowledgeCategories.id],
  }),
  children: many(knowledgeCategories),
  documents: many(knowledgeDocumentCategories),
}));

export const knowledgeDocumentCategoriesRelations = relations(knowledgeDocumentCategories, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeDocumentCategories.documentId],
    references: [knowledgeDocuments.id],
  }),
  category: one(knowledgeCategories, {
    fields: [knowledgeDocumentCategories.categoryId],
    references: [knowledgeCategories.id],
  }),
}));
