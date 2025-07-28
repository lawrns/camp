import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { campfireChannels } from "./campfireChannels";
import { ragProfiles } from "./ragProfiles";

/**
 * Improved handoff queue entries with complete context preservation and delivery guarantees
 */
export const campfireHandoffs = pgTable("campfire_handoffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => campfireChannels.id),
  conversationId: uuid("conversation_id"),
  personaId: uuid("persona_id").references(() => ragProfiles.id),

  // Handoff details
  draft: text("draft"),
  reason: text("reason").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  transferType: text("transfer_type", {
    enum: ["ai-to-human", "human-to-human", "human-to-ai"],
  }).notNull(),

  // Agent assignment
  targetAgentId: text("target_agent_id"),
  assignedAgentId: text("assigned_agent_id"),
  queuePosition: integer("queue_position"),
  estimatedWaitTime: integer("estimated_wait_time_minutes"),

  // Context preservation
  conversationState: jsonb("conversation_state").$type<{
    messageHistory: Array<{
      id: string;
      sender: string;
      content: string;
      timestamp: string;
      metadata?: Record<string, any>;
    }>;
    aiContext: {
      lastModel: string;
      confidence: number;
      ragProfile?: string;
      knowledgeUsed?: string[];
    };
    customerInfo: {
      id?: string;
      name?: string;
      email?: string;
      tier?: string;
      previousInteractions?: number;
    };
    sessionVariables: Record<string, any>;
    tags: string[];
  }>(),

  // Customer context
  customerSentiment: text("customer_sentiment", {
    enum: ["positive", "neutral", "negative"],
  }).default("neutral"),
  topicComplexity: text("topic_complexity", {
    enum: ["simple", "medium", "complex"],
  }).default("medium"),
  urgencyScore: real("urgency_score").default(0.5),

  // Escalation triggers
  escalationTriggers: jsonb("escalation_triggers").$type<string[]>().default([]),
  automatedTriggers: jsonb("automated_triggers").$type<{
    sentimentThreshold: boolean;
    responseTimeExceeded: boolean;
    keywordDetected: boolean;
    customerRequest: boolean;
    aiConfidenceLow: boolean;
  }>(),

  // Message delivery guarantees
  messageQueue: jsonb("message_queue")
    .$type<
      Array<{
        id: string;
        content: string;
        sender: string;
        timestamp: string;
        delivered: boolean;
        retryCount: number;
      }>
    >()
    .default([]),

  deliveryGuarantees: jsonb("delivery_guarantees")
    .$type<{
      endToEndConfirmation: boolean;
      retryEnabled: boolean;
      maxRetries: number;
      timeoutMs: number;
      fallbackEnabled: boolean;
    }>()
    .default({
      endToEndConfirmation: true,
      retryEnabled: true,
      maxRetries: 3,
      timeoutMs: 30000,
      fallbackEnabled: true,
    }),

  // Status tracking
  status: text("status", {
    enum: ["pending", "assigned", "accepted", "in_progress", "completed", "failed", "expired", "cancelled"],
  })
    .default("pending")
    .notNull(),

  // Checkpoint system
  checkpoints: jsonb("checkpoints")
    .$type<
      Array<{
        id: string;
        timestamp: string;
        status: string;
        data: Record<string, any>;
        canRollback: boolean;
      }>
    >()
    .default([]),

  rollbackAvailable: boolean("rollback_available").default(true),
  lastCheckpointId: text("last_checkpoint_id"),

  // Performance metrics
  metrics: jsonb("metrics").$type<{
    responseTime?: number;
    customerSatisfaction?: number;
    resolutionTime?: number;
    agentEfficiency?: number;
  }>(),

  // Audit trail
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  feedback: jsonb("feedback").$type<{
    rating?: number;
    comment?: string;
    categories?: string[];
    agentFeedback?: string;
  }>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
});

export type CampfireHandoff = typeof campfireHandoffs.$inferSelect;
export type NewCampfireHandoff = typeof campfireHandoffs.$inferInsert;
