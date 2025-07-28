import { json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const trainingDatasets = pgTable("training_datasets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

// Re-export modelVersions
export { modelVersions } from "./modelVersions";
