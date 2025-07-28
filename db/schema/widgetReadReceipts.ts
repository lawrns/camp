import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { conversationMessages } from "./conversationMessages";
import { conversations } from "./conversations";

/**
 * Widget Read Receipts Schema
 * Tracks detailed read receipt information including device and session data
 */
export const widgetReadReceipts = pgTable(
  "widget_read_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: bigint("message_id", { mode: "number" })
      .notNull()
      .references(() => conversationMessages.id, { onDelete: "cascade" }),
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull(), // References organizations table

    // Reader information
    readerId: text("reader_id").notNull(), // visitor ID, agent ID, or system
    readerType: text("reader_type", {
      enum: ["visitor", "agent", "system", "bot"],
    })
      .notNull()
      .default("visitor"),

    // Session and device tracking
    sessionId: text("session_id"),
    deviceId: text("device_id"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),

    // Read tracking
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
    readCount: integer("read_count").default(1), // number of times message was viewed
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow().notNull(),

    // Engagement metrics
    timeSpentMs: integer("time_spent_ms"), // milliseconds spent reading
    viewportVisible: boolean("viewport_visible").default(true), // was message in viewport
    interactionType: text("interaction_type"), // clicked, hovered, scrolled, etc.

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        screenWidth?: number;
        screenHeight?: number;
        scrollDepth?: number;
        deviceType?: "mobile" | "tablet" | "desktop";
        browser?: string;
        os?: string;
        [key: string]: any;
      }>()
      .default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    messageIdIdx: index("idx_widget_read_receipts_message_id").on(table.messageId),
    conversationIdIdx: index("idx_widget_read_receipts_conversation_id").on(table.conversationId),
    readerIdIdx: index("idx_widget_read_receipts_reader_id").on(table.readerId),
    sessionIdIdx: index("idx_widget_read_receipts_session_id").on(table.sessionId),
    readAtIdx: index("idx_widget_read_receipts_read_at").on(table.readAt),

    // Ensure unique read receipt per reader per message per session
    uniqueReadReceipt: unique("unique_widget_read_receipt").on(table.messageId, table.readerId, table.sessionId),
  })
);

// Relations
export const widgetReadReceiptsRelations = relations(widgetReadReceipts, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [widgetReadReceipts.messageId],
    references: [conversationMessages.id],
  }),
  conversation: one(conversations, {
    fields: [widgetReadReceipts.conversationId],
    references: [conversations.id],
  }),
}));

// Type exports
export type WidgetReadReceipt = typeof widgetReadReceipts.$inferSelect;
export type NewWidgetReadReceipt = typeof widgetReadReceipts.$inferInsert;

// Reader type export
export type ReaderType = "visitor" | "agent" | "system" | "bot";
