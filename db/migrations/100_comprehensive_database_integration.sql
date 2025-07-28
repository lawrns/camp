-- ==============================================================================
-- COMPREHENSIVE DATABASE INTEGRATION PLAN
-- Version: 1.0.0
-- Date: 2025-01-23
-- Purpose: Replace all mock data with real database tables and queries
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search performance

-- ==============================================================================
-- SECTION 1: CREATE MISSING TABLES
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Activity/Audit Log Table
-- Purpose: Replace mock activity feed data in ActivityFeed.tsx
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity classification
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'message', 'ticket', 'user', 'system', 'ai', 'achievement', 
        'conversation', 'assignment', 'handover', 'escalation'
    )),
    action TEXT NOT NULL, -- replied, resolved, escalated, joined, etc.
    description TEXT NOT NULL,
    
    -- Actor information
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_type TEXT CHECK (actor_type IN ('user', 'system', 'ai', 'api')),
    actor_name TEXT,
    actor_email TEXT,
    actor_role TEXT,
    
    -- Related entities
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    ticket_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Tracking
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_activity_logs_organization (organization_id),
    INDEX idx_activity_logs_actor (actor_id),
    INDEX idx_activity_logs_conversation (conversation_id),
    INDEX idx_activity_logs_created_at (created_at DESC),
    INDEX idx_activity_logs_type_action (activity_type, action),
    INDEX idx_activity_logs_priority (priority) WHERE priority IS NOT NULL
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view activity logs" ON activity_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 1.2 Customer Satisfaction Ratings Table
-- Purpose: Track customer satisfaction scores and feedback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_satisfaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Rating details
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    
    -- Customer information
    customer_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    
    -- Agent information
    agent_id UUID REFERENCES profiles(id),
    agent_name TEXT,
    
    -- Categories
    categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    source TEXT DEFAULT 'widget', -- widget, email, api, etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_satisfaction_organization (organization_id),
    INDEX idx_satisfaction_conversation (conversation_id),
    INDEX idx_satisfaction_rating (rating),
    INDEX idx_satisfaction_created_at (created_at DESC),
    INDEX idx_satisfaction_agent (agent_id),
    INDEX idx_satisfaction_sentiment (sentiment)
);

-- Enable RLS
ALTER TABLE customer_satisfaction ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view satisfaction ratings" ON customer_satisfaction
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Customers can insert their own ratings" ON customer_satisfaction
    FOR INSERT
    WITH CHECK (true); -- Additional validation in application layer

-- -----------------------------------------------------------------------------
-- 1.3 Conversation Metrics Table
-- Purpose: Aggregated metrics for dashboard analytics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Time bucket for aggregation
    time_bucket TIMESTAMPTZ NOT NULL,
    bucket_type TEXT NOT NULL CHECK (bucket_type IN ('minute', 'hour', 'day', 'week', 'month')),
    
    -- Conversation metrics
    total_conversations INTEGER DEFAULT 0,
    new_conversations INTEGER DEFAULT 0,
    resolved_conversations INTEGER DEFAULT 0,
    escalated_conversations INTEGER DEFAULT 0,
    
    -- Response metrics
    avg_response_time_seconds INTEGER,
    avg_resolution_time_minutes INTEGER,
    first_response_within_sla INTEGER DEFAULT 0,
    
    -- Message metrics
    total_messages INTEGER DEFAULT 0,
    agent_messages INTEGER DEFAULT 0,
    visitor_messages INTEGER DEFAULT 0,
    ai_messages INTEGER DEFAULT 0,
    
    -- Satisfaction metrics
    total_ratings INTEGER DEFAULT 0,
    avg_satisfaction_score NUMERIC(3, 2),
    satisfaction_scores JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',
    
    -- AI metrics
    ai_handled_conversations INTEGER DEFAULT 0,
    ai_handover_rate NUMERIC(5, 2),
    ai_resolution_rate NUMERIC(5, 2),
    avg_ai_confidence NUMERIC(3, 2),
    
    -- Agent metrics
    active_agents INTEGER DEFAULT 0,
    agent_utilization_rate NUMERIC(5, 2),
    
    -- Channel distribution
    channel_distribution JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(organization_id, time_bucket, bucket_type),
    
    -- Indexes
    INDEX idx_metrics_organization (organization_id),
    INDEX idx_metrics_time_bucket (time_bucket DESC),
    INDEX idx_metrics_bucket_type (bucket_type),
    INDEX idx_metrics_org_time (organization_id, time_bucket DESC)
);

-- Enable RLS
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view metrics" ON conversation_metrics
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "System can manage metrics" ON conversation_metrics
    FOR ALL
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 1.4 System Settings & Feature Flags Tables
-- Purpose: Manage system configuration and feature toggles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Setting identification
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT CHECK (setting_type IN ('global', 'organization', 'user')),
    
    -- Metadata
    description TEXT,
    category TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    
    -- Audit
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, setting_key),
    
    -- Indexes
    INDEX idx_settings_organization (organization_id),
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_category (category)
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag identification
    flag_key TEXT NOT NULL UNIQUE,
    flag_name TEXT NOT NULL,
    description TEXT,
    
    -- Configuration
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Targeting
    enabled_organizations UUID[] DEFAULT ARRAY[]::UUID[],
    enabled_users UUID[] DEFAULT ARRAY[]::UUID[],
    conditions JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Audit
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_feature_flags_key (flag_key),
    INDEX idx_feature_flags_enabled (is_enabled)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Organization admins can manage their settings" ON system_settings
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for feature_flags
CREATE POLICY "Authenticated users can read feature flags" ON feature_flags
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage feature flags" ON feature_flags
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND metadata->>'is_super_admin' = 'true'
        )
    );

-- ==============================================================================
-- SECTION 2: ALTER EXISTING TABLES
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 Add missing columns to conversations table
-- -----------------------------------------------------------------------------
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
ADD COLUMN IF NOT EXISTS resolution_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS first_response_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS last_agent_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_status TEXT CHECK (sla_status IN ('met', 'at_risk', 'breached')),
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'widget',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS browser_info JSONB;

-- -----------------------------------------------------------------------------
-- 2.2 Add missing columns to messages table
-- -----------------------------------------------------------------------------
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reaction_emojis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3, 2),
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS translation JSONB;

-- -----------------------------------------------------------------------------
-- 2.3 Add missing columns to profiles table
-- -----------------------------------------------------------------------------
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_conversations_handled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_satisfaction_score NUMERIC(3, 2),
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ==============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Conversation search and filtering
CREATE INDEX IF NOT EXISTS idx_conversations_search ON conversations 
    USING gin(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(customer_name, '') || ' ' || COALESCE(customer_email, '')));

CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_satisfaction ON conversations(satisfaction_score) WHERE satisfaction_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_sla_status ON conversations(sla_status) WHERE sla_status IS NOT NULL;

-- Message search
CREATE INDEX IF NOT EXISTS idx_messages_search ON messages 
    USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment_score) WHERE sentiment_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_automated ON messages(is_automated) WHERE is_automated = true;

-- Activity log performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent ON activity_logs(created_at DESC, organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_recent ON activity_logs(actor_id, created_at DESC);

-- Metrics performance
CREATE INDEX IF NOT EXISTS idx_metrics_recent ON conversation_metrics(organization_id, bucket_type, time_bucket DESC);

-- ==============================================================================
-- SECTION 4: HELPER FUNCTIONS
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 Function to log activity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_activity(
    p_organization_id UUID,
    p_activity_type TEXT,
    p_action TEXT,
    p_description TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_conversation_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_actor_name TEXT;
    v_actor_email TEXT;
    v_actor_role TEXT;
BEGIN
    -- Get actor information if provided
    IF p_actor_id IS NOT NULL THEN
        SELECT 
            p.full_name,
            p.email,
            om.role
        INTO v_actor_name, v_actor_email, v_actor_role
        FROM profiles p
        LEFT JOIN organization_members om ON om.user_id = p.user_id AND om.organization_id = p_organization_id
        WHERE p.id = p_actor_id;
    END IF;
    
    -- Insert activity log
    INSERT INTO activity_logs (
        organization_id,
        activity_type,
        action,
        description,
        actor_id,
        actor_type,
        actor_name,
        actor_email,
        actor_role,
        conversation_id,
        metadata
    ) VALUES (
        p_organization_id,
        p_activity_type,
        p_action,
        p_description,
        p_actor_id,
        CASE WHEN p_actor_id IS NOT NULL THEN 'user' ELSE 'system' END,
        v_actor_name,
        v_actor_email,
        v_actor_role,
        p_conversation_id,
        p_metadata
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4.2 Function to calculate conversation metrics
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_conversation_metrics(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_bucket_type TEXT DEFAULT 'hour'
) RETURNS VOID AS $$
BEGIN
    -- Insert or update metrics for the time period
    INSERT INTO conversation_metrics (
        organization_id,
        time_bucket,
        bucket_type,
        total_conversations,
        new_conversations,
        resolved_conversations,
        total_messages,
        agent_messages,
        visitor_messages,
        ai_messages,
        avg_satisfaction_score,
        ai_handled_conversations,
        active_agents
    )
    SELECT 
        p_organization_id,
        date_trunc(p_bucket_type, c.created_at) as time_bucket,
        p_bucket_type,
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= p_start_date) as new_conversations,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'closed') as resolved_conversations,
        COUNT(m.id) as total_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'agent') as agent_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'visitor') as visitor_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'ai_assistant') as ai_messages,
        AVG(c.satisfaction_score) as avg_satisfaction_score,
        COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true) as ai_handled_conversations,
        COUNT(DISTINCT m.sender_id) FILTER (WHERE m.sender_type = 'agent') as active_agents
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.organization_id = p_organization_id
        AND c.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY date_trunc(p_bucket_type, c.created_at)
    ON CONFLICT (organization_id, time_bucket, bucket_type)
    DO UPDATE SET
        total_conversations = EXCLUDED.total_conversations,
        new_conversations = EXCLUDED.new_conversations,
        resolved_conversations = EXCLUDED.resolved_conversations,
        total_messages = EXCLUDED.total_messages,
        agent_messages = EXCLUDED.agent_messages,
        visitor_messages = EXCLUDED.visitor_messages,
        ai_messages = EXCLUDED.ai_messages,
        avg_satisfaction_score = EXCLUDED.avg_satisfaction_score,
        ai_handled_conversations = EXCLUDED.ai_handled_conversations,
        active_agents = EXCLUDED.active_agents,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 5: MAIN QUERIES TO REPLACE MOCK DATA
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 Dashboard Metrics Aggregation Query
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- Conversation metrics
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'open') as open_conversations,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'closed') as closed_conversations,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= NOW() - INTERVAL '24 hours') as new_conversations_24h,
    
    -- Response metrics
    AVG(c.first_response_time_seconds) as avg_first_response_time,
    AVG(c.resolution_time_minutes) as avg_resolution_time,
    COUNT(c.id) FILTER (WHERE c.sla_status = 'met') * 100.0 / NULLIF(COUNT(c.id), 0) as sla_compliance_rate,
    
    -- Satisfaction metrics
    AVG(c.satisfaction_score) as avg_satisfaction_score,
    COUNT(c.satisfaction_score) as total_ratings,
    
    -- AI metrics
    COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true) as ai_handled_conversations,
    COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true AND c.status = 'closed') * 100.0 / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true), 0) as ai_resolution_rate,
    
    -- Agent metrics
    COUNT(DISTINCT m.sender_id) FILTER (WHERE m.sender_type = 'agent') as active_agents,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'agent') as total_agent_messages,
    
    -- Real-time metrics
    COUNT(DISTINCT c.id) FILTER (WHERE c.last_message_at >= NOW() - INTERVAL '5 minutes') as active_conversations,
    COUNT(DISTINCT m.sender_id) FILTER (WHERE m.sender_type = 'agent' AND m.created_at >= NOW() - INTERVAL '5 minutes') as online_agents
    
FROM organizations o
LEFT JOIN conversations c ON c.organization_id = o.id
LEFT JOIN messages m ON m.conversation_id = c.id AND m.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY o.id, o.name;

-- Grant access to the view
GRANT SELECT ON dashboard_metrics TO authenticated;

-- -----------------------------------------------------------------------------
-- 5.2 Activity Feed Query
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_activity_feed(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_activity_types TEXT[] DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    action TEXT,
    description TEXT,
    actor_name TEXT,
    actor_email TEXT,
    actor_role TEXT,
    actor_avatar TEXT,
    conversation_id UUID,
    priority TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.activity_type,
        al.action,
        al.description,
        COALESCE(al.actor_name, 'System') as actor_name,
        al.actor_email,
        al.actor_role,
        CASE 
            WHEN p.avatar_url IS NOT NULL THEN p.avatar_url
            WHEN al.actor_email IS NOT NULL THEN 
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' || al.actor_email
            ELSE NULL
        END as actor_avatar,
        al.conversation_id,
        al.priority,
        al.metadata,
        al.created_at
    FROM activity_logs al
    LEFT JOIN profiles p ON p.id = al.actor_id
    WHERE al.organization_id = p_organization_id
        AND (p_activity_types IS NULL OR al.activity_type = ANY(p_activity_types))
        AND (p_start_date IS NULL OR al.created_at >= p_start_date)
        AND (p_end_date IS NULL OR al.created_at <= p_end_date)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 5.3 Real-time Conversation Stats Query
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_realtime_stats(
    p_organization_id UUID
) RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    change_percentage NUMERIC,
    trend TEXT
) AS $$
DECLARE
    v_current_hour_start TIMESTAMPTZ := date_trunc('hour', NOW());
    v_previous_hour_start TIMESTAMPTZ := v_current_hour_start - INTERVAL '1 hour';
BEGIN
    RETURN QUERY
    WITH current_metrics AS (
        SELECT 
            COUNT(DISTINCT c.id) as conversations,
            COUNT(m.id) as messages,
            AVG(c.first_response_time_seconds) as avg_response_time,
            COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true) as ai_conversations
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.organization_id = p_organization_id
            AND c.created_at >= v_current_hour_start
    ),
    previous_metrics AS (
        SELECT 
            COUNT(DISTINCT c.id) as conversations,
            COUNT(m.id) as messages,
            AVG(c.first_response_time_seconds) as avg_response_time,
            COUNT(DISTINCT c.id) FILTER (WHERE c.assignedtoai = true) as ai_conversations
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.organization_id = p_organization_id
            AND c.created_at BETWEEN v_previous_hour_start AND v_current_hour_start
    )
    SELECT 
        'active_conversations'::TEXT,
        current_metrics.conversations::NUMERIC,
        CASE 
            WHEN previous_metrics.conversations > 0 THEN
                ((current_metrics.conversations - previous_metrics.conversations)::NUMERIC / previous_metrics.conversations) * 100
            ELSE 0
        END,
        CASE 
            WHEN current_metrics.conversations > previous_metrics.conversations THEN 'up'
            WHEN current_metrics.conversations < previous_metrics.conversations THEN 'down'
            ELSE 'stable'
        END
    FROM current_metrics, previous_metrics
    
    UNION ALL
    
    SELECT 
        'messages_per_hour'::TEXT,
        current_metrics.messages::NUMERIC,
        CASE 
            WHEN previous_metrics.messages > 0 THEN
                ((current_metrics.messages - previous_metrics.messages)::NUMERIC / previous_metrics.messages) * 100
            ELSE 0
        END,
        CASE 
            WHEN current_metrics.messages > previous_metrics.messages THEN 'up'
            WHEN current_metrics.messages < previous_metrics.messages THEN 'down'
            ELSE 'stable'
        END
    FROM current_metrics, previous_metrics
    
    UNION ALL
    
    SELECT 
        'avg_response_time_seconds'::TEXT,
        COALESCE(current_metrics.avg_response_time, 0)::NUMERIC,
        CASE 
            WHEN previous_metrics.avg_response_time > 0 THEN
                ((current_metrics.avg_response_time - previous_metrics.avg_response_time)::NUMERIC / previous_metrics.avg_response_time) * 100
            ELSE 0
        END,
        CASE 
            WHEN current_metrics.avg_response_time < previous_metrics.avg_response_time THEN 'up' -- Lower is better
            WHEN current_metrics.avg_response_time > previous_metrics.avg_response_time THEN 'down'
            ELSE 'stable'
        END
    FROM current_metrics, previous_metrics
    
    UNION ALL
    
    SELECT 
        'ai_handling_rate'::TEXT,
        CASE 
            WHEN current_metrics.conversations > 0 THEN
                (current_metrics.ai_conversations::NUMERIC / current_metrics.conversations) * 100
            ELSE 0
        END,
        0, -- Calculate change if needed
        'stable'
    FROM current_metrics, previous_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SECTION 6: SAMPLE DATA INSERTION
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 Insert default system settings
-- -----------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('dashboard.refresh_interval', '{"seconds": 30}', 'global', 'dashboard', 'Dashboard auto-refresh interval'),
('ai.confidence_threshold', '{"threshold": 0.75}', 'global', 'ai', 'Minimum confidence score for AI responses'),
('notifications.email_enabled', '{"enabled": true}', 'global', 'notifications', 'Enable email notifications'),
('sla.first_response_time', '{"minutes": 5}', 'global', 'sla', 'Target first response time'),
('sla.resolution_time', '{"hours": 24}', 'global', 'sla', 'Target resolution time')
ON CONFLICT (organization_id, setting_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6.2 Insert default feature flags
-- -----------------------------------------------------------------------------
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage) VALUES
('ai_suggestions', 'AI Response Suggestions', 'Enable AI-powered response suggestions', true, 100),
('bulk_actions', 'Bulk Conversation Actions', 'Enable bulk actions on conversations', true, 100),
('advanced_analytics', 'Advanced Analytics Dashboard', 'Show advanced analytics features', false, 0),
('voice_transcription', 'Voice Message Transcription', 'Transcribe voice messages automatically', false, 50),
('smart_routing', 'Smart Conversation Routing', 'AI-powered conversation routing', true, 80)
ON CONFLICT (flag_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6.3 Create sample activity logs (for development/testing)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_conv_id UUID;
BEGIN
    -- Only insert sample data in development environments
    IF current_setting('app.environment', true) = 'development' THEN
        -- Get a sample organization
        SELECT id INTO v_org_id FROM organizations LIMIT 1;
        
        -- Get a sample user
        SELECT id INTO v_user_id FROM profiles LIMIT 1;
        
        -- Get a sample conversation
        SELECT id INTO v_conv_id FROM conversations WHERE organization_id = v_org_id LIMIT 1;
        
        IF v_org_id IS NOT NULL THEN
            -- Insert sample activities
            PERFORM log_activity(
                v_org_id,
                'message',
                'replied',
                'to a customer inquiry about billing',
                v_user_id,
                v_conv_id,
                '{"priority": "high"}'::JSONB
            );
            
            PERFORM log_activity(
                v_org_id,
                'ticket',
                'resolved',
                'a technical support issue',
                v_user_id,
                v_conv_id,
                '{"satisfaction_score": 5}'::JSONB
            );
            
            PERFORM log_activity(
                v_org_id,
                'system',
                'deployed',
                'new AI model version 2.1',
                NULL,
                NULL,
                '{"version": "2.1.0", "features": ["improved accuracy", "faster responses"]}'::JSONB
            );
        END IF;
    END IF;
END $$;

-- ==============================================================================
-- SECTION 7: TRIGGERS AND AUTOMATION
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 7.1 Trigger to log conversation activities
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log conversation creation
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.organization_id,
            'conversation',
            'created',
            'New conversation started',
            NULL,
            NEW.id,
            jsonb_build_object(
                'channel', NEW.channel,
                'customer_email', NEW.customer_email,
                'priority', NEW.priority
            )
        );
    
    -- Log status changes
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        PERFORM log_activity(
            NEW.organization_id,
            'conversation',
            CASE NEW.status
                WHEN 'closed' THEN 'resolved'
                WHEN 'archived' THEN 'archived'
                ELSE 'updated'
            END,
            format('Conversation %s', NEW.status),
            NEW.assigned_agent_id,
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'resolution_time_minutes', NEW.resolution_time_minutes
            )
        );
    
    -- Log assignment changes
    ELSIF TG_OP = 'UPDATE' AND OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
        PERFORM log_activity(
            NEW.organization_id,
            'assignment',
            'assigned',
            CASE 
                WHEN NEW.assignedtoai THEN 'Conversation assigned to AI'
                WHEN NEW.assigned_agent_id IS NOT NULL THEN 'Conversation assigned to agent'
                ELSE 'Conversation unassigned'
            END,
            NEW.assigned_agent_id,
            NEW.id,
            jsonb_build_object(
                'assignee_type', NEW.assignee_type,
                'previous_assignee', OLD.assigned_agent_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER conversation_activity_trigger
AFTER INSERT OR UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION log_conversation_activity();

-- -----------------------------------------------------------------------------
-- 7.2 Trigger to update conversation metrics
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_conversation_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update first response time
    IF TG_OP = 'INSERT' AND NEW.sender_type IN ('agent', 'ai_assistant') THEN
        UPDATE conversations
        SET first_response_time_seconds = EXTRACT(EPOCH FROM (NEW.created_at - conversations.created_at))
        WHERE id = NEW.conversation_id
            AND first_response_time_seconds IS NULL;
    END IF;
    
    -- Update last message timestamp
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_metrics_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metrics();

-- -----------------------------------------------------------------------------
-- 7.3 Trigger to calculate satisfaction metrics
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_satisfaction_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update agent's average satisfaction score
    IF NEW.agent_id IS NOT NULL THEN
        UPDATE profiles
        SET avg_satisfaction_score = (
            SELECT AVG(rating)::NUMERIC(3,2)
            FROM customer_satisfaction
            WHERE agent_id = NEW.agent_id
        )
        WHERE id = NEW.agent_id;
    END IF;
    
    -- Update conversation satisfaction score
    UPDATE conversations
    SET satisfaction_score = NEW.rating
    WHERE id = NEW.conversation_id;
    
    -- Log the satisfaction rating activity
    PERFORM log_activity(
        NEW.organization_id,
        'achievement',
        'received',
        format('Customer satisfaction rating: %s stars', NEW.rating),
        NEW.agent_id,
        NEW.conversation_id,
        jsonb_build_object(
            'rating', NEW.rating,
            'feedback', NEW.feedback_text,
            'sentiment', NEW.sentiment
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER satisfaction_metrics_trigger
AFTER INSERT ON customer_satisfaction
FOR EACH ROW
EXECUTE FUNCTION update_satisfaction_metrics();

-- ==============================================================================
-- SECTION 8: MIGRATION STRATEGY
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 8.1 Migration Steps
-- -----------------------------------------------------------------------------
/*
MIGRATION STRATEGY:

1. PREPARATION PHASE:
   - Backup existing database
   - Review and test all SQL statements in development
   - Identify any custom modifications needed

2. EXECUTION PHASE:
   - Run this migration during maintenance window
   - Execute sections in order (1-7)
   - Monitor for any errors

3. VALIDATION PHASE:
   - Verify all tables created successfully
   - Check indexes are in place
   - Test RLS policies with different user roles
   - Verify triggers are functioning

4. DATA MIGRATION:
   - Migrate any existing activity data to activity_logs table
   - Calculate initial metrics for conversation_metrics
   - Set up scheduled jobs for metric aggregation

5. APPLICATION UPDATES:
   - Update API endpoints to use new tables
   - Replace mock data calls with database queries
   - Update real-time subscriptions

6. MONITORING:
   - Monitor query performance
   - Check for any errors in application logs
   - Verify data consistency
*/

-- ==============================================================================
-- SECTION 9: ROLLBACK PLAN
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 9.1 Rollback Script (ONLY USE IN EMERGENCY)
-- -----------------------------------------------------------------------------
/*
-- CAUTION: This will remove all data in the new tables!

-- Drop triggers
DROP TRIGGER IF EXISTS conversation_activity_trigger ON conversations;
DROP TRIGGER IF EXISTS message_metrics_trigger ON messages;
DROP TRIGGER IF EXISTS satisfaction_metrics_trigger ON customer_satisfaction;

-- Drop functions
DROP FUNCTION IF EXISTS log_conversation_activity();
DROP FUNCTION IF EXISTS update_conversation_metrics();
DROP FUNCTION IF EXISTS update_satisfaction_metrics();
DROP FUNCTION IF EXISTS log_activity(UUID, TEXT, TEXT, TEXT, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS calculate_conversation_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS get_activity_feed(UUID, INTEGER, INTEGER, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_realtime_stats(UUID);

-- Drop views
DROP VIEW IF EXISTS dashboard_metrics;

-- Drop new tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS customer_satisfaction CASCADE;
DROP TABLE IF EXISTS conversation_metrics CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Remove added columns (BE CAREFUL - This removes data!)
ALTER TABLE conversations 
DROP COLUMN IF EXISTS satisfaction_score,
DROP COLUMN IF EXISTS resolution_time_minutes,
DROP COLUMN IF EXISTS first_response_time_seconds,
DROP COLUMN IF EXISTS last_agent_response_at,
DROP COLUMN IF EXISTS sla_status,
DROP COLUMN IF EXISTS channel,
DROP COLUMN IF EXISTS source_url,
DROP COLUMN IF EXISTS browser_info;

ALTER TABLE messages 
DROP COLUMN IF EXISTS reaction_emojis,
DROP COLUMN IF EXISTS is_automated,
DROP COLUMN IF EXISTS sentiment_score,
DROP COLUMN IF EXISTS language_code,
DROP COLUMN IF EXISTS translation;

ALTER TABLE profiles 
DROP COLUMN IF EXISTS preferences,
DROP COLUMN IF EXISTS notification_settings,
DROP COLUMN IF EXISTS last_seen_at,
DROP COLUMN IF EXISTS total_conversations_handled,
DROP COLUMN IF EXISTS avg_satisfaction_score,
DROP COLUMN IF EXISTS skills;

-- Drop indexes
DROP INDEX IF EXISTS idx_conversations_search;
DROP INDEX IF EXISTS idx_conversations_channel;
DROP INDEX IF EXISTS idx_conversations_satisfaction;
DROP INDEX IF EXISTS idx_conversations_sla_status;
DROP INDEX IF EXISTS idx_messages_search;
DROP INDEX IF EXISTS idx_messages_sentiment;
DROP INDEX IF EXISTS idx_messages_automated;
DROP INDEX IF EXISTS idx_activity_logs_recent;
DROP INDEX IF EXISTS idx_metrics_recent;
*/

-- ==============================================================================
-- SECTION 10: SCHEDULED JOBS
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 10.1 Create scheduled job for metrics aggregation (using pg_cron or external scheduler)
-- -----------------------------------------------------------------------------
/*
-- Example pg_cron job (requires pg_cron extension)
SELECT cron.schedule(
    'calculate-hourly-metrics',
    '0 * * * *', -- Every hour
    $$
    SELECT calculate_conversation_metrics(
        organization_id,
        NOW() - INTERVAL '1 hour',
        NOW(),
        'hour'
    )
    FROM organizations
    WHERE created_at < NOW() - INTERVAL '1 hour';
    $$
);

-- Daily aggregation
SELECT cron.schedule(
    'calculate-daily-metrics',
    '0 2 * * *', -- 2 AM daily
    $$
    SELECT calculate_conversation_metrics(
        organization_id,
        NOW() - INTERVAL '1 day',
        NOW(),
        'day'
    )
    FROM organizations;
    $$
);
*/

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================

-- Notify that schema has been updated
NOTIFY pgrst, 'reload schema';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Database integration migration completed successfully at %', NOW();
END $$;