import { relations } from "drizzle-orm";
import { bigint, boolean, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { mailboxes } from "@/db/schema/mailboxes";
import { withTimestamps } from "../lib/withTimestamps";

export const mailboxesMetadataApi = pgTable(
  "mailboxes_metadataapi",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    url: text().notNull(),
    hmacSecret: text().notNull(),
    isEnabled: boolean().notNull(),
    mailboxId: bigint({ mode: "number" }).notNull(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => {
    return {
      createdAtIdx: index("mailboxes_metadataapi_created_at_1ee2d2c2").on(table.createdAt),
      mailboxIdUnique: unique("mailboxes_metadataapi_mailbox_id_key").on(table.mailboxId),
    };
  }
);

export const mailboxesMetadataApiRelations = relations(mailboxesMetadataApi, ({ one }) => ({
  mailbox: one(mailboxes, {
    fields: [mailboxesMetadataApi.mailboxId],
    references: [mailboxes.id],
  }),
}));
