import { boolean, integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { mailboxes } from "./mailboxes";

export const aiTrainingData = pgTable("ai_training_data", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  mailboxId: integer("mailbox_id")
    .notNull()
    .references(() => mailboxes.id),
  dataType: varchar("data_type", { length: 50 }).notNull(), // 'conversation', 'message', 'document'
  category: varchar("category", { length: 100 }).notNull(),
  content: json("content")
    .$type<{
      input: string;
      expectedOutput: string;
      context?: string;
      metadata?: Record<string, unknown>;
    }>()
    .notNull(),
  labels: json("labels").$type<string[]>().default([]),
  qualityScore: integer("quality_score"), // 1-5 rating
  isValidated: boolean("is_validated").default(false),
  validatedBy: varchar("validated_by", { length: 255 }),
  validatedAt: timestamp("validated_at"),
  version: varchar("version", { length: 50 }).default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export const aiTrainingDataBatches = pgTable("ai_training_data_batches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  mailboxId: integer("mailbox_id")
    .notNull()
    .references(() => mailboxes.id),
  totalRecords: integer("total_records").default(0),
  validatedRecords: integer("validated_records").default(0),
  status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'ready', 'in_use', 'archived'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

export const aiTrainingDataBatchItems = pgTable("ai_training_data_batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => aiTrainingDataBatches.id),
  trainingDataId: integer("training_data_id")
    .notNull()
    .references(() => aiTrainingData.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
