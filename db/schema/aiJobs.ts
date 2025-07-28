import { relations } from "drizzle-orm";
import { bigint, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { withTimestamps } from "../lib/withTimestamps";
import { organizations } from "./organizations";

export type AIJobStatus = "pending" | "processing" | "completed" | "error" | "expired";
export type AIJobType =
  | "generate_response"
  | "process_message"
  | "rag_query"
  | "handover_decision"
  | "confidence_analysis";

export const aiJobs = pgTable(
  "ai_jobs",
  {
    ...withTimestamps,
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    organizationId: varchar("organization_id").notNull(),
    conversationId: varchar("conversation_id"),
    messageId: bigint("message_id", { mode: "number" }),
    jobType: varchar("job_type").notNull().$type<AIJobType>(),
    status: varchar().notNull().$type<AIJobStatus>().default("pending"),
    payload: jsonb().notNull(),
    result: jsonb(),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // TTL field
    priority: integer().notNull().default(5), // 1=highest, 10=lowest
    processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
  },
  (table) => {
    return {
      organizationIdIdx: index("idx_ai_jobs_organization_id").on(table.organizationId),
      statusIdx: index("idx_ai_jobs_status").on(table.status),
      jobTypeIdx: index("idx_ai_jobs_job_type").on(table.jobType),
      nextRetryAtIdx: index("idx_ai_jobs_next_retry_at").on(table.nextRetryAt),
      expiresAtIdx: index("idx_ai_jobs_expires_at").on(table.expiresAt),
      priorityIdx: index("idx_ai_jobs_priority").on(table.priority),
      conversationIdIdx: index("idx_ai_jobs_conversation_id").on(table.conversationId),
      // Composite index for efficient queue processing
      queueProcessingIdx: index("idx_ai_jobs_queue_processing").on(table.status, table.nextRetryAt, table.priority),
    };
  }
);

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiJobs.organizationId],
    references: [organizations.id],
  }),
}));
