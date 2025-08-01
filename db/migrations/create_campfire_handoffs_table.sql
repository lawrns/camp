-- Create campfire_handoffs table
-- This table is critical for AI-to-human handover functionality
-- Referenced in: app/api/ai/enhanced-response/route.ts, lib/ai/handover.ts, hooks/useTenantSupabase.ts

CREATE TABLE IF NOT EXISTS campfire_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    persona_id UUID,

    -- Handoff details
    draft TEXT,
    reason TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('ai-to-human', 'human-to-human', 'human-to-ai')),

    -- Agent assignment
    target_agent_id TEXT,
    assigned_agent_id TEXT,
    queue_position INTEGER,
    estimated_wait_time_minutes INTEGER,

    -- Context preservation
    conversation_state JSONB DEFAULT '{}',

    -- Customer context
    customer_sentiment TEXT DEFAULT 'neutral' CHECK (customer_sentiment IN ('positive', 'neutral', 'negative')),
    topic_complexity TEXT DEFAULT 'medium' CHECK (topic_complexity IN ('simple', 'medium', 'complex')),
    urgency_score REAL DEFAULT 0.5,

    -- Escalation triggers
    escalation_triggers JSONB DEFAULT '[]',
    automated_triggers JSONB DEFAULT '{}',

    -- Message delivery guarantees
    message_queue JSONB DEFAULT '[]',
    delivery_guarantees JSONB DEFAULT '{
        "endToEndConfirmation": true,
        "retryEnabled": true,
        "maxRetries": 3,
        "timeoutMs": 30000,
        "fallbackEnabled": true
    }',

    -- Status tracking
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'failed', 'expired', 'cancelled')),

    -- Checkpoint system
    checkpoints JSONB DEFAULT '[]',
    rollback_available BOOLEAN DEFAULT TRUE,
    last_checkpoint_id TEXT,

    -- Performance metrics
    metrics JSONB DEFAULT '{}',

    -- Audit trail
    notes TEXT,
    internal_notes TEXT,
    feedback JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campfire_handoffs_organization_id ON campfire_handoffs(organization_id);
CREATE INDEX IF NOT EXISTS idx_campfire_handoffs_conversation_id ON campfire_handoffs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_campfire_handoffs_status ON campfire_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_campfire_handoffs_created_at ON campfire_handoffs(created_at);
CREATE INDEX IF NOT EXISTS idx_campfire_handoffs_priority ON campfire_handoffs(priority);

-- Create RLS policies for security
ALTER TABLE campfire_handoffs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users within their organization
CREATE POLICY "handoffs_organization_access" ON campfire_handoffs
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Policy for service role (for API operations)
CREATE POLICY "handoffs_service_role_access" ON campfire_handoffs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campfire_handoffs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campfire_handoffs_updated_at
    BEFORE UPDATE ON campfire_handoffs
    FOR EACH ROW
    EXECUTE FUNCTION update_campfire_handoffs_updated_at();
