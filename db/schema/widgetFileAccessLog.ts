import { relations } from "drizzle-orm";
import { bigint, boolean, index, inet, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { widgetFileAttachments } from "./widgetFileAttachments";

/**
 * Widget File Access Log Schema
 * Tracks all file access attempts for security and analytics
 */
export const widgetFileAccessLog = pgTable(
  "widget_file_access_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fileAttachmentId: uuid("file_attachment_id")
      .notNull()
      .references(() => widgetFileAttachments.id, { onDelete: "cascade" }),

    // Accessor information
    accessorId: text("accessor_id").notNull(),
    accessorType: text("accessor_type", {
      enum: ["visitor", "agent", "system", "anonymous"],
    })
      .notNull()
      .default("visitor"),

    // Access details
    accessType: text("access_type", {
      enum: ["view", "download", "preview", "thumbnail"],
    })
      .notNull()
      .default("view"),
    accessGranted: boolean("access_granted").default(true),
    accessTokenUsed: text("access_token_used"),

    // Request information
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    referer: text("referer"),

    // Response
    responseStatus: integer("response_status"),
    bytesServed: bigint("bytes_served", { mode: "number" }),

    // Timestamps
    accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    fileIdIdx: index("idx_widget_file_access_log_file_id").on(table.fileAttachmentId),
    accessorIdIdx: index("idx_widget_file_access_log_accessor_id").on(table.accessorId),
    accessedAtIdx: index("idx_widget_file_access_log_accessed_at").on(table.accessedAt),
  })
);

// Relations
export const widgetFileAccessLogRelations = relations(widgetFileAccessLog, ({ one }) => ({
  fileAttachment: one(widgetFileAttachments, {
    fields: [widgetFileAccessLog.fileAttachmentId],
    references: [widgetFileAttachments.id],
  }),
}));

// Type exports
export type WidgetFileAccessLog = typeof widgetFileAccessLog.$inferSelect;
export type NewWidgetFileAccessLog = typeof widgetFileAccessLog.$inferInsert;

// Access type exports
export type AccessorType = "visitor" | "agent" | "system" | "anonymous";
export type AccessType = "view" | "download" | "preview" | "thumbnail";
