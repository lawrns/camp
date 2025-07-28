import { relations } from "drizzle-orm";
import { boolean, integer, json, pgTable, real, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { conversations, modelVersions } from "./index";

export const aiFeedback = pgTable("ai_feedback", {
  id: serial("id").primaryKey(),
  messageId: varchar("message_id", { length: 255 }).notNull(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  modelVersionId: integer("model_version_id").references(() => modelVersions.id),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // thumbs_up, thumbs_down, rating, text, correction
  rating: integer("rating"), // 1-5 scale
  textFeedback: text("text_feedback"),
  correction: json("correction").$type<{
    originalResponse: string;
    correctedResponse: string;
    reason?: string;
  }>(),
  category: varchar("category", { length: 100 }),
  severity: varchar("severity", { length: 20 }), // low, medium, high, critical
  tags: json("tags").$type<string[]>().default([]),
  isAnonymous: boolean("is_anonymous").default(true),
  userId: varchar("user_id", { length: 255 }),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
});

export const aiFeedbackAnalysis = pgTable("ai_feedback_analysis", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => aiFeedback.id),
  sentiment: varchar("sentiment", { length: 20 }).notNull(), // positive, neutral, negative
  intent: varchar("intent", { length: 50 }).notNull(), // bug_report, feature_request, etc.
  urgency: varchar("urgency", { length: 20 }).notNull(), // low, medium, high, critical
  category: varchar("category", { length: 100 }).notNull(),
  themes: json("themes").$type<string[]>().default([]),
  entities: json("entities")
    .$type<
      Array<{
        type: string;
        value: string;
        confidence: number;
      }>
    >()
    .default([]),
  actionable: boolean("actionable").default(false),
  suggestedActions: json("suggested_actions").$type<string[]>().default([]),
  confidence: real("confidence").notNull(), // 0-1 scale
  processingTime: integer("processing_time"), // milliseconds
  analysisVersion: varchar("analysis_version", { length: 20 }).default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
});

export const aiFeedbackActions = pgTable("ai_feedback_actions", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id")
    .notNull()
    .references(() => aiFeedback.id),
  actionType: varchar("action_type", { length: 50 }).notNull(), // acknowledged, resolved, escalated, etc.
  actionBy: varchar("action_by", { length: 255 }).notNull(),
  actionDate: timestamp("action_date").notNull().defaultNow(),
  notes: text("notes"),
  resolution: text("resolution"),
  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, resolved, closed
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  assignedTo: varchar("assigned_to", { length: 255 }),
  estimatedResolutionTime: timestamp("estimated_resolution_time"),
  actualResolutionTime: timestamp("actual_resolution_time"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
});

export const aiFeedbackCategories = pgTable("ai_feedback_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // hex color
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations for aiFeedbackCategories
export const aiFeedbackCategoriesRelations = relations(aiFeedbackCategories, ({ one, many }) => ({
  parent: one(aiFeedbackCategories, {
    fields: [aiFeedbackCategories.parentId],
    references: [aiFeedbackCategories.id],
  }),
  children: many(aiFeedbackCategories),
}));

export const aiFeedbackTemplates = pgTable("ai_feedback_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => aiFeedbackCategories.id),
  template: json("template")
    .$type<{
      title: string;
      description: string;
      fields: Array<{
        name: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
    }>()
    .notNull(),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiFeedbackSummaries = pgTable("ai_feedback_summaries", {
  id: serial("id").primaryKey(),
  period: varchar("period", { length: 20 }).notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  modelVersionId: integer("model_version_id").references(() => modelVersions.id),
  totalFeedback: integer("total_feedback").default(0),
  positiveFeedback: integer("positive_feedback").default(0),
  negativeFeedback: integer("negative_feedback").default(0),
  averageRating: real("average_rating"),
  topIssues: json("top_issues")
    .$type<
      Array<{
        issue: string;
        count: number;
        severity: string;
      }>
    >()
    .default([]),
  topImprovements: json("top_improvements")
    .$type<
      Array<{
        improvement: string;
        count: number;
        impact: string;
      }>
    >()
    .default([]),
  sentimentDistribution: json("sentiment_distribution")
    .$type<{
      positive: number;
      neutral: number;
      negative: number;
    }>()
    .default({ positive: 0, neutral: 0, negative: 0 }),
  categoryBreakdown: json("category_breakdown").$type<Record<string, number>>().default({}),
  actionableItems: integer("actionable_items").default(0),
  resolvedItems: integer("resolved_items").default(0),
  avgResolutionTime: integer("avg_resolution_time"), // hours
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
});
