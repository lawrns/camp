import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { organizations } from "./organizations";
import { profiles } from "./profiles";

export const conversationFiles = pgTable("conversation_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),

  // File information
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // Path in storage bucket
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  fileType: text("file_type").notNull(),
  publicUrl: text("public_url").notNull(),

  // Metadata
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ConversationFile = typeof conversationFiles.$inferSelect;
export type NewConversationFile = typeof conversationFiles.$inferInsert;
