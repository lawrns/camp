-- Migration: 20250701_handoff_tables.sql
-- Create handoff_requests and agent_availability tables with RLS policies
-- Part of WebSocket v2 migration for Intercom-parity handoff system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- HANDOFF REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS handoff_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Organization and conversation context
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Request details
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'completed', 'cancelled')),
    reason TEXT NOT NULL,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Agent assignment
    target_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    handoff_context JSONB DEFAULT '{}',
    escalation_path TEXT[], -- Array of escalation steps
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_handoff_requests_org_id ON handoff_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_conversation_id ON handoff_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_status ON handoff_requests(status);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_priority ON handoff_requests(priority);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_target_agent ON handoff_requests(target_agent_id);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_assigned_agent ON handoff_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_created_at ON handoff_requests(created_at);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_handoff_requests_org_status ON handoff_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_agent_status ON handoff_requests(assigned_agent_id, status) WHERE assigned_agent_id IS NOT NULL;

-- =====================================================
-- AGENT AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Agent reference
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Availability status
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
    max_concurrent_chats INTEGER NOT NULL DEFAULT 5 CHECK (max_concurrent_chats > 0),
    current_chat_count INTEGER NOT NULL DEFAULT 0 CHECK (current_chat_count >= 0),
    
    -- Skills and routing
    skills TEXT[] DEFAULT '{}', -- Array of skill tags for routing
    departments TEXT[] DEFAULT '{}', -- Departments agent can handle
    languages TEXT[] DEFAULT '{"en"}', -- Languages agent speaks
    
    -- Metadata
    auto_accept_handoffs BOOLEAN DEFAULT false,
    priority_score INTEGER DEFAULT 0, -- Higher score = higher priority for routing
    
    -- Timestamps
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_current_chats_within_max CHECK (current_chat_count <= max_concurrent_chats),
    UNIQUE(agent_id, organization_id)
);

-- Add indexes for agent availability
CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_id ON agent_availability(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_org_id ON agent_availability(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_status ON agent_availability(status);
CREATE INDEX IF NOT EXISTS idx_agent_availability_last_activity ON agent_availability(last_activity_at);

-- Composite indexes for routing queries
CREATE INDEX IF NOT EXISTS idx_agent_availability_org_status ON agent_availability(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_availability_routing ON agent_availability(organization_id, status, priority_score) WHERE status IN ('online', 'away');

-- =====================================================
-- WEBSOCKET V2 EVENTS TABLE (for audit/debugging)
-- =====================================================
CREATE TABLE IF NOT EXISTS websocket_v2_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event identification
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    
    -- Context
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Event data
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(event_id)
);

-- Add indexes for WebSocket events
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_org_id ON websocket_v2_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_conversation_id ON websocket_v2_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_type ON websocket_v2_events(event_type);
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_created_at ON websocket_v2_events(created_at);

-- Composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_org_type_time ON websocket_v2_events(organization_id, event_type, created_at);

-- =====================================================
-- UPDATED AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_handoff_requests_updated_at
    BEFORE UPDATE ON handoff_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_availability_updated_at
    BEFORE UPDATE ON agent_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE handoff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_v2_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HANDOFF REQUESTS RLS POLICIES
-- =====================================================

-- Policy: Users can view handoff requests for their organization
CREATE POLICY "Users can view handoff requests for their organization" ON handoff_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create handoff requests for their organization
CREATE POLICY "Users can create handoff requests for their organization" ON handoff_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Agents can update handoff requests assigned to them or in their org
CREATE POLICY "Agents can update assigned handoff requests" ON handoff_requests
    FOR UPDATE USING (
        (assigned_agent_id = auth.uid() OR target_agent_id = auth.uid())
        AND organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Admins can manage all handoff requests in their organization
CREATE POLICY "Admins can manage handoff requests in their organization" ON handoff_requests
    FOR ALL USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM user_organizations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.user_id = auth.uid() 
            AND uo.role IN ('admin', 'owner')
        )
    );

-- Policy: Anonymous users (widgets) can create handoff requests
CREATE POLICY "Anonymous users can create handoff requests for conversations" ON handoff_requests
    FOR INSERT WITH CHECK (
        auth.role() = 'anon'
        AND conversation_id IS NOT NULL
    );

-- Policy: Service role can do everything (for background processing)
CREATE POLICY "Service role can manage all handoff requests" ON handoff_requests
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- AGENT AVAILABILITY RLS POLICIES
-- =====================================================

-- Policy: Agents can view availability for their organization
CREATE POLICY "Users can view agent availability for their organization" ON agent_availability
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Agents can manage their own availability
CREATE POLICY "Agents can manage their own availability" ON agent_availability
    FOR ALL USING (agent_id = auth.uid());

-- Policy: Admins can manage all agent availability in their organization
CREATE POLICY "Admins can manage agent availability in their organization" ON agent_availability
    FOR ALL USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM user_organizations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.user_id = auth.uid() 
            AND uo.role IN ('admin', 'owner')
        )
    );

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all agent availability" ON agent_availability
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- WEBSOCKET V2 EVENTS RLS POLICIES
-- =====================================================

-- Policy: Users can view WebSocket events for their organization
CREATE POLICY "Users can view WebSocket events for their organization" ON websocket_v2_events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Authenticated users can create WebSocket events for their organization
CREATE POLICY "Users can create WebSocket events for their organization" ON websocket_v2_events
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
        OR auth.role() = 'anon' -- Allow anonymous users (widgets) to create events
    );

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all WebSocket events" ON websocket_v2_events
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get available agents for handoff routing
CREATE OR REPLACE FUNCTION get_available_agents_for_handoff(
    p_organization_id UUID,
    p_required_skills TEXT[] DEFAULT '{}',
    p_required_departments TEXT[] DEFAULT '{}',
    p_required_languages TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
    agent_id UUID,
    priority_score INTEGER,
    current_chat_count INTEGER,
    max_concurrent_chats INTEGER,
    availability_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.agent_id,
        aa.priority_score,
        aa.current_chat_count,
        aa.max_concurrent_chats,
        -- Calculate availability score (higher is better)
        (aa.priority_score + 
         (aa.max_concurrent_chats - aa.current_chat_count) * 10 +
         CASE 
             WHEN aa.status = 'online' THEN 100
             WHEN aa.status = 'away' THEN 50
             ELSE 0
         END)::DECIMAL AS availability_score
    FROM agent_availability aa
    WHERE aa.organization_id = p_organization_id
        AND aa.status IN ('online', 'away')
        AND aa.current_chat_count < aa.max_concurrent_chats
        AND (
            cardinality(p_required_skills) = 0 
            OR aa.skills && p_required_skills
        )
        AND (
            cardinality(p_required_departments) = 0 
            OR aa.departments && p_required_departments
        )
        AND (
            cardinality(p_required_languages) = 0 
            OR aa.languages && p_required_languages
        )
    ORDER BY availability_score DESC, aa.last_activity_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create handoff request with intelligent routing
CREATE OR REPLACE FUNCTION create_handoff_request(
    p_organization_id UUID,
    p_conversation_id UUID,
    p_reason TEXT,
    p_ai_confidence DECIMAL DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'medium',
    p_required_skills TEXT[] DEFAULT '{}',
    p_required_departments TEXT[] DEFAULT '{}',
    p_handoff_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_handoff_id UUID;
    v_target_agent_id UUID;
BEGIN
    -- Find best available agent
    SELECT agent_id INTO v_target_agent_id
    FROM get_available_agents_for_handoff(
        p_organization_id,
        p_required_skills,
        p_required_departments
    )
    LIMIT 1;
    
    -- Create handoff request
    INSERT INTO handoff_requests (
        organization_id,
        conversation_id,
        reason,
        ai_confidence,
        priority,
        target_agent_id,
        handoff_context
    ) VALUES (
        p_organization_id,
        p_conversation_id,
        p_reason,
        p_ai_confidence,
        p_priority,
        v_target_agent_id,
        p_handoff_context
    ) RETURNING id INTO v_handoff_id;
    
    RETURN v_handoff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Note: This would be handled by separate seed scripts in production
-- INSERT INTO agent_availability (agent_id, organization_id, status, skills, departments, languages)
-- VALUES (
--     (SELECT id FROM users WHERE email = 'jam@jam.com' LIMIT 1),
--     (SELECT id FROM organizations WHERE name = 'Test Org' LIMIT 1),
--     'online',
--     ARRAY['customer_support', 'technical_support'],
--     ARRAY['support', 'sales'],
--     ARRAY['en', 'es']
-- );

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

-- Log migration completion
INSERT INTO websocket_v2_events (
    event_id,
    event_type,
    organization_id,
    event_data
) SELECT 
    'migration-' || extract(epoch from now())::text,
    'migration_completed',
    id,
    '{"migration": "20250701_handoff_tables", "status": "completed"}'::jsonb
FROM organizations
LIMIT 1;

-- Migration completed successfully
COMMENT ON TABLE handoff_requests IS 'Handoff requests table - part of WebSocket v2 migration for Intercom-parity';
COMMENT ON TABLE agent_availability IS 'Agent availability table - part of WebSocket v2 migration for Intercom-parity';
COMMENT ON TABLE websocket_v2_events IS 'WebSocket v2 events audit table';