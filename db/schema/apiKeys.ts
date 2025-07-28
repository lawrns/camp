import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { organizations } from "./organizations";

/**
 * API Keys Schema
 * For managing organization API keys
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    ...withTimestamps,
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(), // Store hashed version of the key
    keyPrefix: text("key_prefix").notNull(), // Store first few characters for display
    isActive: boolean("is_active").default(true),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    permissions: text("permissions").array().default([]), // Array of permission strings
    description: text("description"),
  },
  (table) => ({
    organizationIdIdx: index("api_keys_organization_id_idx").on(table.organizationId),
    keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash),
    isActiveIdx: index("api_keys_is_active_idx").on(table.isActive),
  })
);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
