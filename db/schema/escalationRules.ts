import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Configurable escalation rules for intelligent handoff triggering
 * Supports complex condition evaluation and priority scoring
 */
export const escalationRules = pgTable("escalation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id").notNull(),

  // Rule definition
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", {
    enum: ["sentiment", "keywords", "response_time", "ai_confidence", "customer_tier", "topic_complexity", "custom"],
  }).notNull(),

  // Rule conditions
  conditions: jsonb("conditions")
    .$type<{
      // Sentiment-based triggers
      sentiment?: {
        threshold: "positive" | "neutral" | "negative";
        operator: "equals" | "below" | "above";
      };

      // AI confidence triggers
      aiConfidence?: {
        threshold: number;
        operator: "below" | "above";
        consecutiveFailures?: number;
      };

      // Response time triggers
      responseTime?: {
        maxSeconds: number;
        includeBusinessHours: boolean;
      };

      // Keyword detection
      keywords?: {
        phrases: string[];
        matchType: "any" | "all" | "exact";
        caseSensitive: boolean;
      };

      // Customer tier
      customerTier?: {
        tiers: string[];
        priorityMultiplier: number;
      };

      // Topic complexity
      topicComplexity?: {
        threshold: "simple" | "medium" | "complex";
        operator: "equals" | "above";
      };

      // Custom conditions
      custom?: {
        expression: string; // JSON Logic expression
        variables: Record<string, any>;
      };

      // Conversation context
      conversationLength?: {
        minMessages: number;
        timeWindowMinutes?: number;
      };

      // Time-based conditions
      timeConditions?: {
        businessHoursOnly: boolean;
        timezone: string;
        excludeWeekends: boolean;
      };
    }>()
    .notNull(),

  // Action configuration
  action: jsonb("action")
    .$type<{
      type: "escalate" | "notify" | "route" | "flag";

      escalation?: {
        transferType: "ai-to-human" | "human-to-human";
        targetAgentId?: string;
        skillRequirements?: string[];
        priority: "low" | "medium" | "high" | "urgent";
        reason: string;
      };

      notification?: {
        channels: ("push" | "email" | "sms" | "webhook")[];
        recipients: string[];
        template: string;
        urgency: "low" | "medium" | "high";
      };

      routing?: {
        department: string;
        skillSet: string[];
        loadBalancing: "round_robin" | "least_loaded" | "skill_match";
      };

      flagging?: {
        tags: string[];
        reviewRequired: boolean;
        escalationLevel: number;
      };
    }>()
    .notNull(),

  // Priority and scoring
  priority: integer("priority").default(50), // 1-100, higher = more important
  scoreWeight: real("score_weight").default(1.0),

  // Execution settings
  enabled: boolean("enabled").default(true),
  cooldownMinutes: integer("cooldown_minutes").default(5), // Prevent rapid re-triggering
  maxTriggersPerHour: integer("max_triggers_per_hour").default(10),

  // Evaluation frequency
  evaluationMode: text("evaluation_mode", {
    enum: ["real_time", "periodic", "event_driven"],
  }).default("real_time"),
  evaluationIntervalSeconds: integer("evaluation_interval_seconds").default(30),

  // Conditions for rule activation
  activationConditions: jsonb("activation_conditions").$type<{
    dateRange?: {
      start: string;
      end: string;
    };
    timeRange?: {
      start: string; // HH:MM format
      end: string;
      timezone: string;
    };
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    channelTypes?: string[];
    customerSegments?: string[];
  }>(),

  // Success metrics
  successMetrics: jsonb("success_metrics").$type<{
    targetResolutionTime?: number;
    expectedSatisfactionScore?: number;
    costThreshold?: number;
    accuracyTarget?: number;
  }>(),

  // Audit and analytics
  triggerHistory: jsonb("trigger_history")
    .$type<
      Array<{
        timestamp: string;
        conversationId: string;
        conditionsMet: string[];
        actionTaken: string;
        outcome?: string;
      }>
    >()
    .default([]),

  // Performance tracking
  performance: jsonb("performance").$type<{
    totalTriggers: number;
    successfulEscalations: number;
    falsePositives: number;
    averageResolutionTime: number;
    customerSatisfactionImpact: number;
    lastOptimized: string;
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastTriggered: timestamp("last_triggered"),

  // Versioning for rule changes
  version: integer("version").default(1),
  parentRuleId: uuid("parent_rule_id"), // For rule history/rollback
});

/**
 * Rule execution logs for monitoring and optimization
 */
export const escalationRuleExecutions = pgTable("escalation_rule_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => escalationRules.id),
  conversationId: uuid("conversation_id").notNull(),
  handoffId: uuid("handoff_id"),

  // Execution details
  conditionResults: jsonb("condition_results")
    .$type<{
      [conditionName: string]: {
        met: boolean;
        value: any;
        threshold: any;
        score: number;
      };
    }>()
    .notNull(),

  finalScore: real("final_score").notNull(),
  thresholdMet: boolean("threshold_met").notNull(),
  actionTaken: boolean("action_taken").notNull(),

  // Context at execution time
  context: jsonb("context").$type<{
    messageCount: number;
    conversationDuration: number;
    customerSentiment: string;
    aiConfidence: number;
    agentLoad: number;
    businessHours: boolean;
  }>(),

  // Execution result
  result: jsonb("result").$type<{
    success: boolean;
    actionType: string;
    agentAssigned?: string;
    notificationsSent?: number;
    error?: string;
    executionTimeMs: number;
  }>(),

  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export type EscalationRule = typeof escalationRules.$inferSelect;
export type NewEscalationRule = typeof escalationRules.$inferInsert;
export type EscalationRuleExecution = typeof escalationRuleExecutions.$inferSelect;
export type NewEscalationRuleExecution = typeof escalationRuleExecutions.$inferInsert;
