import { integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * RAG persona profiles
 */
export const ragProfiles = pgTable("rag_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  /**
   * Maximum vector distance threshold for retrieving relevant chunks
   */
  threshold: real("threshold").notNull().default(0.7),
  /**
   * Number of top similar chunks to retrieve
   */
  k: integer("k").notNull().default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
