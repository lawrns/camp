import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
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
 * Widget File Attachments Schema
 * Tracks file uploads from the widget with detailed upload status and security
 */
export const widgetFileAttachments = pgTable(
  "widget_file_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: bigint("message_id", { mode: "number" }).references(() => conversationMessages.id, {
      onDelete: "cascade",
    }),
    conversationId: bigint("conversation_id", { mode: "number" })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull(), // References organizations table

    // File information
    filename: text("filename").notNull(),
    originalFilename: text("original_filename").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(), // in bytes
    mimeType: text("mime_type").notNull(),
    fileUrl: text("file_url").notNull(), // S3 or storage URL
    thumbnailUrl: text("thumbnail_url"), // for images/videos

    // Upload tracking
    uploadStatus: text("upload_status", {
      enum: ["pending", "uploading", "completed", "failed", "cancelled"],
    })
      .notNull()
      .default("pending"),
    uploadProgress: integer("upload_progress").default(0),
    uploadStartedAt: timestamp("upload_started_at", { withTimezone: true }),
    uploadCompletedAt: timestamp("upload_completed_at", { withTimezone: true }),
    uploadError: text("upload_error"),

    // Security and access
    isPublic: boolean("is_public").default(false),
    accessToken: text("access_token"), // temporary access token for private files
    expiresAt: timestamp("expires_at", { withTimezone: true }), // expiration for access token
    uploadedBy: text("uploaded_by").notNull(), // visitor ID or user ID
    uploadedByType: text("uploaded_by_type", {
      enum: ["visitor", "agent", "system"],
    })
      .notNull()
      .default("visitor"),

    // Metadata
    metadata: jsonb("metadata")
      .$type<{
        width?: number;
        height?: number;
        duration?: number; // for videos/audio
        pages?: number; // for PDFs
        [key: string]: any;
      }>()
      .default({}),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    messageIdIdx: index("idx_widget_file_attachments_message_id").on(table.messageId),
    conversationIdIdx: index("idx_widget_file_attachments_conversation_id").on(table.conversationId),
    organizationIdIdx: index("idx_widget_file_attachments_organization_id").on(table.organizationId),
    uploadStatusIdx: index("idx_widget_file_attachments_upload_status").on(table.uploadStatus),
    createdAtIdx: index("idx_widget_file_attachments_created_at").on(table.createdAt),
    accessTokenIdx: index("idx_widget_file_attachments_access_token")
      .on(table.accessToken)
      .where(sql`access_token IS NOT NULL`),

    // Constraints
    uploadProgressCheck: check("upload_progress_check", sql`upload_progress >= 0 AND upload_progress <= 100`),
  })
);

// Relations
export const widgetFileAttachmentsRelations = relations(widgetFileAttachments, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [widgetFileAttachments.messageId],
    references: [conversationMessages.id],
  }),
  conversation: one(conversations, {
    fields: [widgetFileAttachments.conversationId],
    references: [conversations.id],
  }),
}));

// Type exports
export type WidgetFileAttachment = typeof widgetFileAttachments.$inferSelect;
export type NewWidgetFileAttachment = typeof widgetFileAttachments.$inferInsert;

// Status type export
export type UploadStatus = "pending" | "uploading" | "completed" | "failed" | "cancelled";
