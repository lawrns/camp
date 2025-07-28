import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Compliance logs for privacy and regulatory compliance events
 * Used for audit trails, reporting, and demonstrating compliance with regulations
 * such as GDPR, CCPA, and other privacy laws.
 */
export const complianceLogs = pgTable("compliance_logs", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Event metadata
  eventType: text("event_type").notNull(),
  userId: text("user_id"),
  organizationId: text("organization_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Event details stored as JSON
  details: jsonb("details").notNull(),

  // References to specific regulations (e.g., ['GDPR', 'CCPA'])
  regulationReferences: jsonb("regulation_references").notNull().default("[]"),

  // Retention period for this log entry in days
  retentionPeriod: integer("retention_period").notNull().default(1825), // Default 5 years
});
