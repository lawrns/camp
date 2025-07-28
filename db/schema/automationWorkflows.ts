import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";

// Workflow types
export const WORKFLOW_TRIGGER_TYPES = [
  "new_conversation",
  "new_message",
  "tag_added",
  "status_changed",
  "scheduled",
  "api_webhook",
] as const;

export const WORKFLOW_ACTION_TYPES = [
  "send_slack_message",
  "send_teams_message",
  "send_whatsapp_message",
  "send_email",
  "update_conversation",
  "add_tag",
  "create_task",
  "api_request",
] as const;

// Automation workflows table
export const automationWorkflows = pgTable("automation_workflows", {
  ...withTimestamps,
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: text("organization_id").notNull(),
  isActive: boolean("is_active").default(true),
  triggerType: text("trigger_type").$type<(typeof WORKFLOW_TRIGGER_TYPES)[number]>().notNull(),
  triggerConfig: jsonb("trigger_config").$type<Record<string, any>>().default({}),
  actionType: text("action_type").$type<(typeof WORKFLOW_ACTION_TYPES)[number]>().notNull(),
  actionConfig: jsonb("action_config").$type<Record<string, any>>().default({}),
  conditions: jsonb("conditions").$type<Record<string, any>[]>().default([]),
  sortOrder: integer("sort_order").default(0),
});

// Workflow execution logs
export const automationExecutionLogs = pgTable("automation_execution_logs", {
  ...withTimestamps,
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id")
    .references(() => automationWorkflows.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").$type<"success" | "error" | "pending">().default("pending").notNull(),
  triggerData: jsonb("trigger_data").$type<Record<string, any>>().default({}),
  actionResult: jsonb("action_result").$type<Record<string, any>>().default({}),
  error: text("error"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Integration credentials
export const integrations = pgTable("integrations", {
  ...withTimestamps,
  id: serial("id").primaryKey(),
  type: text("type").$type<"slack" | "teams" | "whatsapp" | "email">().notNull(),
  organizationId: text("organization_id").notNull(),
  name: text("name"),
  credentials: jsonb("credentials").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
});
