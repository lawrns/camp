CREATE TABLE IF NOT EXISTS "compliance_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" text NOT NULL,
  "user_id" text,
  "organization_id" text,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "details" jsonb NOT NULL,
  "regulation_references" jsonb NOT NULL DEFAULT '[]',
  "retention_period" integer NOT NULL DEFAULT 1825 -- Default 5 years (1825 days)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "compliance_logs_event_type_idx" ON "compliance_logs" ("event_type");
CREATE INDEX IF NOT EXISTS "compliance_logs_user_id_idx" ON "compliance_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "compliance_logs_organization_id_idx" ON "compliance_logs" ("organization_id");
CREATE INDEX IF NOT EXISTS "compliance_logs_timestamp_idx" ON "compliance_logs" ("timestamp");

-- Create a GIN index for the JSONB regulation_references field to support containment queries
CREATE INDEX IF NOT EXISTS "compliance_logs_regulation_references_idx" ON "compliance_logs" USING GIN ("regulation_references");

-- Add comment for clarity
COMMENT ON TABLE "compliance_logs" IS 'Audit logs for compliance and privacy-related events';