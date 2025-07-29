-- Enhanced AI Features Migration (Adapted for Existing Schema)
-- Extends existing tables for enhanced AI analytics, team assignments, and integrations

-- Extend AIInteraction table with enhanced metrics
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) DEFAULT 'neutral';
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS handover_triggered BOOLEAN DEFAULT false;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS handover_reason TEXT;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS sources_used INTEGER DEFAULT 0;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS empathy_score DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS user_satisfaction INTEGER;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS response_category VARCHAR(50) DEFAULT 'detailed_response';
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT 0;
ALTER TABLE "AIInteraction" ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Indexes for enhanced AIInteraction table
CREATE INDEX IF NOT EXISTS idx_ai_interaction_org_date
    ON "AIInteraction"(organization_id, "createdAt");
CREATE INDEX IF NOT EXISTS idx_ai_interaction_handover
    ON "AIInteraction"(handover_triggered, "createdAt");
CREATE INDEX IF NOT EXISTS idx_ai_interaction_confidence
    ON "AIInteraction"(confidence, "createdAt");

-- Extend MessageThread table for team assignments
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS assigned_to TEXT REFERENCES "User"(id);
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS assigned_by TEXT REFERENCES "User"(id);
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS assignment_reason TEXT;
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS assignment_status VARCHAR(20) DEFAULT 'unassigned';
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Indexes for enhanced MessageThread table
CREATE INDEX IF NOT EXISTS idx_message_thread_assignment
    ON "MessageThread"(assigned_to, assignment_status);
CREATE INDEX IF NOT EXISTS idx_message_thread_org
    ON "MessageThread"(organization_id, "updatedAt");

-- Extend Channel table for integrations (since it already handles external channels)
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50);
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}';
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add new channel types for customer support integrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChannelType' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'SLACK')) THEN
        ALTER TYPE "ChannelType" ADD VALUE 'SLACK';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChannelType' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'DISCORD')) THEN
        ALTER TYPE "ChannelType" ADD VALUE 'DISCORD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChannelType' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'TEAMS')) THEN
        ALTER TYPE "ChannelType" ADD VALUE 'TEAMS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChannelType' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'WEBHOOK')) THEN
        ALTER TYPE "ChannelType" ADD VALUE 'WEBHOOK';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChannelType' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'CHAT_WIDGET')) THEN
        ALTER TYPE "ChannelType" ADD VALUE 'CHAT_WIDGET';
    END IF;
END $$;

-- AI Reply Suggestions Cache Table (minimal addition)
CREATE TABLE IF NOT EXISTS ai_reply_suggestions_cache (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    message_hash VARCHAR(64) NOT NULL,
    suggestions JSONB NOT NULL DEFAULT '[]',
    context_hash VARCHAR(64),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, message_hash, context_hash)
);

-- Index for reply suggestions cache
CREATE INDEX IF NOT EXISTS idx_ai_reply_cache_org_hash
    ON ai_reply_suggestions_cache(organization_id, message_hash);
CREATE INDEX IF NOT EXISTS idx_ai_reply_cache_expires
    ON ai_reply_suggestions_cache(expires_at);

-- Performance Metrics Table (minimal addition)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id UUID REFERENCES organizations(id),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_name
    ON performance_metrics(metric_type, metric_name, created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org_date
    ON performance_metrics(organization_id, created_at);

-- Update triggers for existing tables (following existing pattern)
-- Note: The existing schema uses "updatedAt" column naming convention

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to MessageThread if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_message_thread_updated_at') THEN
        CREATE TRIGGER update_message_thread_updated_at
            BEFORE UPDATE ON "MessageThread"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Row Level Security (RLS) policies for new tables only
-- Note: Existing tables already have RLS configured

ALTER TABLE ai_reply_suggestions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_reply_suggestions_cache
CREATE POLICY "Users can access reply suggestions for their organization" ON ai_reply_suggestions_cache
    FOR ALL USING (
        organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- RLS Policies for performance_metrics
CREATE POLICY "Users can view performance metrics for their organization" ON performance_metrics
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id FROM organization_members om
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        ) OR organization_id IS NULL -- Allow global metrics
    );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE ai_reply_suggestions_cache IS 'Caches AI-generated reply suggestions';
COMMENT ON TABLE performance_metrics IS 'Stores application performance metrics';
COMMENT ON COLUMN "AIInteraction".confidence IS 'AI confidence score (0.0 to 1.0)';
COMMENT ON COLUMN "AIInteraction".sentiment IS 'Customer sentiment analysis result';
COMMENT ON COLUMN "AIInteraction".handover_triggered IS 'Whether AI triggered handover to human';
COMMENT ON COLUMN "MessageThread".assigned_to IS 'User ID of assigned team member';
COMMENT ON COLUMN "MessageThread".assignment_status IS 'Current assignment status';
COMMENT ON COLUMN "Channel".integration_type IS 'Type of external integration (slack, discord, etc.)';

-- Insert sample data for testing (optional - only if tables are empty)
DO $$
BEGIN
    -- Only insert if AIInteraction table is empty to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM "AIInteraction" LIMIT 1) THEN
        INSERT INTO "AIInteraction" (
            id, "userId", "createdAt", "updatedAt", confidence, sentiment,
            sources_used, empathy_score, response_category, response_time_ms
        ) VALUES
            (gen_random_uuid()::text, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.85, 'positive', 3, 0.8, 'detailed_response', 1200),
            (gen_random_uuid()::text, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.92, 'neutral', 2, 0.7, 'quick_reply', 800),
            (gen_random_uuid()::text, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.45, 'negative', 1, 0.9, 'escalation', 2100);
    END IF;
END $$;
