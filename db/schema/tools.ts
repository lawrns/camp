import { relations } from "drizzle-orm";
import { bigint, boolean, index, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { nativeEncryptedField } from "../lib/encryptedField";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";
import { toolApis } from "./toolApis";

type ToolAuthenticationMethod = "none" | "bearer_token";
type ToolRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ToolParameter = {
  name: string;
  description?: string;
  type: "string" | "number";
  in: "body" | "query" | "path";
  required: boolean;
};
type ToolParameters = ToolParameter[];
type ToolHeaders = Record<string, string>;
export type Tool = typeof tools.$inferSelect;

export const tools = pgTable(
  "tools",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text().notNull(),
    description: text().notNull(),
    mailboxId: bigint({ mode: "number" }).notNull(),
    slug: text().notNull(),
    requestMethod: text().notNull().$type<ToolRequestMethod>(),
    url: text().notNull(),
    headers: jsonb().default("{}").$type<ToolHeaders>(),
    parameters: jsonb().default("[]").$type<ToolParameters>(),
    authenticationMethod: text().notNull().default("none").$type<ToolAuthenticationMethod>(),
    authenticationToken: nativeEncryptedField(),
    toolApiId: bigint({ mode: "number" }),
    enabled: boolean().notNull().default(true),
    availableInChat: boolean().notNull().default(false),
    customerEmailParameter: text(),
  },
  (table) => ({
    toolsMailboxIdIdx: index("tools_mailbox_id_idx").on(table.mailboxId),
    toolsToolApiIdIdx: index("tools_tool_api_id_idx").on(table.toolApiId),
    uniqueSlugIdx: uniqueIndex("unique_slug_idx").on(table.slug),
  })
);

export const toolsRelations = relations(tools, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [tools.mailboxId],
    references: [mailboxes.id],
  }),
  toolApi: one(toolApis, {
    fields: [tools.toolApiId],
    references: [toolApis.id],
  }),
}));
