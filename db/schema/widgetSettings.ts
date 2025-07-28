import { bigint, boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { mailboxes } from "./mailboxes";

/**
 * Widget Settings Schema
 * Stores customizable widget configuration per mailbox/organization
 */
export const widgetSettings = pgTable("widget_settings", {
  ...withTimestamps,
  id: uuid("id").primaryKey().defaultRandom(),
  mailboxId: bigint("mailbox_id", { mode: "number" })
    .references(() => mailboxes.id, { onDelete: "cascade" })
    .notNull(),

  // Branding & Appearance
  primaryColor: text("primary_color").default("#3B82F6"), // Blue-500
  backgroundColor: text("background_color").default("#FFFFFF"),
  textColor: text("text_color").default("#1F2937"), // Gray-800
  borderRadius: integer("border_radius").default(8), // px
  fontFamily: text("font_family").default("Inter"),

  // Widget Behavior
  welcomeMessage: text("welcome_message").default("Hi! How can we help you today?"),
  placeholderText: text("placeholder_text").default("Type your message..."),
  autoOpenDelay: integer("auto_open_delay_ms").default(0), // 0 = never auto-open
  showTypingIndicator: boolean("show_typing_indicator").default(true),
  enableSoundNotifications: boolean("enable_sound_notifications").default(true),

  // Positioning & Size
  position: text("position").default("bottom-right"), // bottom-right, bottom-left, top-right, top-left
  offsetX: integer("offset_x").default(20), // px from edge
  offsetY: integer("offset_y").default(20), // px from edge
  width: integer("width").default(400), // px
  height: integer("height").default(600), // px

  // Business Hours & Availability
  businessHours: jsonb("business_hours")
    .$type<{
      enabled: boolean;
      timezone: string;
      schedule: {
        [key: string]: {
          // monday, tuesday, etc.
          enabled: boolean;
          start: string; // "09:00"
          end: string; // "17:00"
        };
      };
    }>()
    .default({
      enabled: false,
      timezone: "UTC",
      schedule: {
        monday: { enabled: true, start: "09:00", end: "17:00" },
        tuesday: { enabled: true, start: "09:00", end: "17:00" },
        wednesday: { enabled: true, start: "09:00", end: "17:00" },
        thursday: { enabled: true, start: "09:00", end: "17:00" },
        friday: { enabled: true, start: "09:00", end: "17:00" },
        saturday: { enabled: false, start: "09:00", end: "17:00" },
        sunday: { enabled: false, start: "09:00", end: "17:00" },
      },
    }),

  offlineMessage: text("offline_message").default(
    "We're currently offline. Leave us a message and we'll get back to you soon!"
  ),

  // Pre-chat Form
  requireEmail: boolean("require_email").default(false),
  requireName: boolean("require_name").default(false),
  customFields: jsonb("custom_fields")
    .$type<
      Array<{
        id: string;
        name: string;
        label: string;
        type: "text" | "email" | "phone" | "select" | "textarea";
        required: boolean;
        options?: string[]; // for select type
      }>
    >()
    .default([]),

  // AI Settings
  enableAI: boolean("enable_ai").default(true),
  aiWelcomeMessage: text("ai_welcome_message").default(
    "I'm an AI assistant. I can help you with common questions, or connect you with a human agent."
  ),
  aiHandoffTriggers: jsonb("ai_handoff_triggers")
    .$type<{
      lowConfidenceThreshold: number; // 0-1
      userRequestsHuman: boolean;
      maxAIResponses: number;
      keywords: string[];
    }>()
    .default({
      lowConfidenceThreshold: 0.3,
      userRequestsHuman: true,
      maxAIResponses: 5,
      keywords: ["speak to human", "human agent", "representative"],
    }),

  // GDPR & Privacy
  showGDPRNotice: boolean("show_gdpr_notice").default(false),
  gdprNoticeText: text("gdpr_notice_text").default(
    "We use cookies and collect data to improve your experience. By continuing, you agree to our privacy policy."
  ),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsOfServiceUrl: text("terms_of_service_url"),

  // Advanced Configuration
  customCSS: text("custom_css"), // For advanced styling
  customJS: text("custom_js"), // For custom behavior
  webhookUrl: text("webhook_url"), // For external integrations
  allowFileUploads: boolean("allow_file_uploads").default(true),
  maxFileSize: integer("max_file_size_mb").default(10),
  allowedFileTypes: jsonb("allowed_file_types").$type<string[]>().default(["image/*", ".pdf", ".doc", ".docx", ".txt"]),

  // Metadata & Tracking
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WidgetSettings = typeof widgetSettings.$inferSelect;
export type NewWidgetSettings = typeof widgetSettings.$inferInsert;
