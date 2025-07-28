import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { conversationMessages } from "./conversationMessages";

export type DeliveryStatus = "sending" | "sent" | "delivered" | "read" | "error";

export const messageDeliveryStatus = pgTable(
  "message_delivery_status",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    messageId: bigint({ mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    status: text().notNull().$type<DeliveryStatus>(),
    errorMessage: text(),
  },
  (table) => {
    return {
      messageIdIdx: index("idx_message_delivery_status_message_id").on(table.messageId),
      statusIdx: index("idx_message_delivery_status_status").on(table.status),
      uniqueConstraint: index("message_delivery_status_message_unique").on(table.messageId),
    };
  }
);

export const messageDeliveryStatusRelations = relations(messageDeliveryStatus, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [messageDeliveryStatus.messageId],
    references: [conversationMessages.id],
  }),
}));
