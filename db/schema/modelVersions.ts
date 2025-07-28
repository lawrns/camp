import { boolean, integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { trainingDatasets } from "./trainingDatasets";

export const modelVersions = pgTable("model_versions", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  version: varchar("version", { length: 100 }).notNull(),
  description: text("description"),
  baseModel: varchar("base_model", { length: 100 }).notNull(),
  fineTunedModelId: varchar("fine_tuned_model_id", { length: 255 }),
  datasetId: integer("dataset_id").references(() => trainingDatasets.id),
  status: varchar("status", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(false),
  tags: json("tags").$type<string[]>().default([]),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
