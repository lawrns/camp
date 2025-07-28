import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text } from "drizzle-orm/pg-core";
import { nativeEncryptedField } from "../lib/encryptedField";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";
import { tools } from "./tools";

const toolApis = pgTable(
  "tool_apis",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text().notNull(),
    mailboxId: bigint({ mode: "number" }).notNull(),
    baseUrl: text(),
    schema: text(),
    authenticationToken: nativeEncryptedField(),
  },
  (table) => ({
    toolApisMailboxIdIdx: index("tool_apis_mailbox_id_idx").on(table.mailboxId),
  })
);

export const toolApisRelations = relations(toolApis, ({ many, one }) => ({
  tools: many(tools),
  mailbox: one(mailboxes, {
    fields: [toolApis.mailboxId],
    references: [mailboxes.id],
  }),
}));

export { toolApis };
export type ToolApi = typeof toolApis.$inferSelect;
