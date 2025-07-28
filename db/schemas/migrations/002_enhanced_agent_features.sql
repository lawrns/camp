-- Enhanced Agent Features Migration
-- This migration adds tables and features for:
-- 1. Canned Responses (Quick Reply Templates)
-- 2. Internal Notes (Private Agent Notes)
-- 3. Enhanced Agent Performance Tracking

-- =====================================================
-- CANNED RESPONSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS canned_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Response content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    
    -- Visibility and organization
    is_public BOOLEAN DEFAULT false, -- If true, visible to all agents in org
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT canned_responses_title_length CHECK (char_length(title) >= 1),
    CONSTRAINT canned_responses_content_length CHECK (char_length(content) >= 1)
);

-- Indexes for canned_responses
CREATE INDEX IF NOT EXISTS idx_canned_responses_org_id ON canned_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_created_by ON canned_responses(created_by);
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_usage ON canned_responses(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_canned_responses_public ON canned_responses(organization_id, is_public) WHERE is_active = true;

-- =====================================================
-- INTERNAL NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Note content
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'important', 'resolved')),
    
    -- Visibility
    is_visible BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT internal_notes_content_length CHECK (char_length(content) >= 1)
);

-- Indexes for internal_notes
CREATE INDEX IF NOT EXISTS idx_internal_notes_conversation ON internal_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_org_id ON internal_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_created_by ON internal_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_internal_notes_visible ON internal_notes(conversation_id, is_visible);

-- =====================================================
-- AGENT PERFORMANCE METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time period for metrics
    date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    
    -- Response time metrics (in minutes)
    avg_first_response_time DECIMAL(10,2) DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    median_response_time DECIMAL(10,2) DEFAULT 0,
    
    -- Conversation metrics
    total_conversations INTEGER DEFAULT 0,
    resolved_conversations INTEGER DEFAULT 0,
    active_conversations INTEGER DEFAULT 0,
    escalated_conversations INTEGER DEFAULT 0,
    
    -- Message metrics
    total_messages_sent INTEGER DEFAULT 0,
    avg_messages_per_conversation DECIMAL(10,2) DEFAULT 0,
    
    -- Quality metrics
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0, -- 1.00 to 5.00
    customer_satisfaction_count INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Time tracking (in minutes)
    online_time INTEGER DEFAULT 0,
    active_chat_time INTEGER DEFAULT 0,
    
    -- Productivity metrics
    messages_per_hour DECIMAL(10,2) DEFAULT 0,
    conversations_per_day DECIMAL(10,2) DEFAULT 0,
    
    -- AI assistance metrics
    ai_handover_count INTEGER DEFAULT 0,
    ai_suggestion_usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per agent per date per period
    UNIQUE(organization_id, agent_id, date, period_type)
);

-- Indexes for agent_performance_metrics
CREATE INDEX IF NOT EXISTS idx_agent_performance_org_agent ON agent_performance_metrics(organization_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_date ON agent_performance_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_performance_period ON agent_performance_metrics(period_type, date DESC);

-- =====================================================
-- CONVERSATION RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Rating details
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    rating_type VARCHAR(50) DEFAULT 'satisfaction' CHECK (rating_type IN ('satisfaction', 'resolution', 'speed')),
    
    -- Source of rating
    rated_by_type VARCHAR(20) DEFAULT 'customer' CHECK (rated_by_type IN ('customer', 'agent', 'supervisor')),
    rated_by_id UUID, -- Can be null for anonymous customer ratings
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one rating per conversation per type
    UNIQUE(conversation_id, rating_type)
);

-- Indexes for conversation_ratings
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_conv_id ON conversation_ratings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_org_id ON conversation_ratings(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_rating ON conversation_ratings(rating, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Canned Responses RLS
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view canned responses in their organization" ON canned_responses
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND (is_public = true OR created_by = auth.uid())
        AND is_active = true
    );

CREATE POLICY "Users can create canned responses in their organization" ON canned_responses
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own canned responses" ON canned_responses
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own canned responses" ON canned_responses
    FOR DELETE USING (created_by = auth.uid());

-- Internal Notes RLS
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view internal notes in their organization conversations" ON internal_notes
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND is_visible = true
    );

CREATE POLICY "Users can create internal notes in their organization conversations" ON internal_notes
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own internal notes" ON internal_notes
    FOR UPDATE USING (created_by = auth.uid());

-- Agent Performance Metrics RLS
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view performance metrics in their organization" ON agent_performance_metrics
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert performance metrics" ON agent_performance_metrics
    FOR INSERT WITH CHECK (true); -- Allow system inserts

CREATE POLICY "System can update performance metrics" ON agent_performance_metrics
    FOR UPDATE USING (true); -- Allow system updates

-- Conversation Ratings RLS
ALTER TABLE conversation_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings in their organization conversations" ON conversation_ratings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create ratings for conversations in their organization" ON conversation_ratings
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_canned_responses_updated_at 
    BEFORE UPDATE ON canned_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_notes_updated_at 
    BEFORE UPDATE ON internal_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_metrics_updated_at 
    BEFORE UPDATE ON agent_performance_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment canned response usage
CREATE OR REPLACE FUNCTION increment_canned_response_usage(response_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE canned_responses 
    SET 
        usage_count = usage_count + 1,
        last_used = NOW()
    WHERE id = response_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (Optional - for development)
-- =====================================================

-- Note: Sample data insertion would be handled by the application
-- This ensures proper organization_id and user_id references

COMMENT ON TABLE canned_responses IS 'Quick response templates for agents';
COMMENT ON TABLE internal_notes IS 'Private notes for agents on conversations';
COMMENT ON TABLE agent_performance_metrics IS 'Performance tracking for agents';
COMMENT ON TABLE conversation_ratings IS 'Customer satisfaction and quality ratings';

-- Grant necessary permissions
GRANT ALL ON canned_responses TO authenticated;
GRANT ALL ON internal_notes TO authenticated;
GRANT ALL ON agent_performance_metrics TO authenticated;
GRANT ALL ON conversation_ratings TO authenticated;
