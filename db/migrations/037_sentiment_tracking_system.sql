-- Sentiment Tracking System Migration
-- Creates tables for real-time sentiment analysis and alerting

-- Table for tracking sentiment analysis of individual messages
CREATE TABLE IF NOT EXISTS conversation_sentiment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Sentiment analysis results
    sentiment_type TEXT NOT NULL CHECK (sentiment_type IN ('frustrated', 'angry', 'confused', 'happy', 'neutral', 'technical')),
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    emotions TEXT[] DEFAULT '{}',
    urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    complexity TEXT NOT NULL CHECK (complexity IN ('simple', 'moderate', 'complex')),
    keywords TEXT[] DEFAULT '{}',
    
    -- Conversation trend analysis
    conversation_trend JSONB DEFAULT NULL,
    
    -- Metadata
    analyzed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table for sentiment alerts
CREATE TABLE IF NOT EXISTS sentiment_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type TEXT NOT NULL CHECK (alert_type IN ('negative_sentiment', 'escalation_risk', 'sentiment_decline')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    
    -- Sentiment data that triggered the alert
    sentiment_data JSONB NOT NULL,
    conversation_trend JSONB DEFAULT NULL,
    recommended_actions TEXT[] DEFAULT '{}',
    
    -- Resolution tracking
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    resolved_by UUID DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Performance indexes for sentiment tracking
CREATE INDEX IF NOT EXISTS idx_sentiment_tracking_conversation 
    ON conversation_sentiment_tracking(conversation_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_tracking_organization 
    ON conversation_sentiment_tracking(organization_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_tracking_sentiment_type 
    ON conversation_sentiment_tracking(sentiment_type, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_tracking_urgency 
    ON conversation_sentiment_tracking(urgency, analyzed_at DESC);

-- Performance indexes for sentiment alerts
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_conversation 
    ON sentiment_alerts(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_organization 
    ON sentiment_alerts(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_severity 
    ON sentiment_alerts(severity, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_active 
    ON sentiment_alerts(status, created_at DESC) WHERE status = 'active';

-- Enable RLS on sentiment tables
ALTER TABLE conversation_sentiment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_sentiment_tracking
-- Users can view sentiment data in their organization
CREATE POLICY "Users can view sentiment tracking in their organization" 
    ON conversation_sentiment_tracking FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- System can insert sentiment data
CREATE POLICY "System can insert sentiment tracking data" 
    ON conversation_sentiment_tracking FOR INSERT
    WITH CHECK (true);

-- Users can update sentiment data in their organization
CREATE POLICY "Users can update sentiment tracking in their organization" 
    ON conversation_sentiment_tracking FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- RLS Policies for sentiment_alerts
-- Users can view alerts in their organization
CREATE POLICY "Users can view sentiment alerts in their organization" 
    ON sentiment_alerts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- System can insert alerts
CREATE POLICY "System can insert sentiment alerts" 
    ON sentiment_alerts FOR INSERT
    WITH CHECK (true);

-- Users can update alerts in their organization
CREATE POLICY "Users can update sentiment alerts in their organization" 
    ON sentiment_alerts FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_sentiment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER sentiment_tracking_updated_at
    BEFORE UPDATE ON conversation_sentiment_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_updated_at();

CREATE TRIGGER sentiment_alerts_updated_at
    BEFORE UPDATE ON sentiment_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_updated_at();

-- Function to get sentiment summary for a conversation
CREATE OR REPLACE FUNCTION get_conversation_sentiment_summary(p_conversation_id UUID)
RETURNS TABLE (
    total_messages BIGINT,
    avg_confidence REAL,
    dominant_sentiment TEXT,
    urgency_distribution JSONB,
    latest_trend JSONB,
    active_alerts_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_messages,
        AVG(cst.confidence)::REAL as avg_confidence,
        MODE() WITHIN GROUP (ORDER BY cst.sentiment_type) as dominant_sentiment,
        jsonb_object_agg(cst.urgency, urgency_count) as urgency_distribution,
        (SELECT conversation_trend FROM conversation_sentiment_tracking 
         WHERE conversation_id = p_conversation_id 
         ORDER BY analyzed_at DESC LIMIT 1) as latest_trend,
        (SELECT COUNT(*)::BIGINT FROM sentiment_alerts 
         WHERE conversation_id = p_conversation_id AND status = 'active') as active_alerts_count
    FROM conversation_sentiment_tracking cst
    LEFT JOIN (
        SELECT urgency, COUNT(*) as urgency_count
        FROM conversation_sentiment_tracking 
        WHERE conversation_id = p_conversation_id
        GROUP BY urgency
    ) urgency_counts ON cst.urgency = urgency_counts.urgency
    WHERE cst.conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization sentiment dashboard data
CREATE OR REPLACE FUNCTION get_organization_sentiment_dashboard(p_organization_id UUID)
RETURNS TABLE (
    total_conversations BIGINT,
    conversations_with_alerts BIGINT,
    active_alerts_count BIGINT,
    avg_sentiment_confidence REAL,
    sentiment_distribution JSONB,
    alert_severity_distribution JSONB,
    recent_trends JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cst.conversation_id)::BIGINT as total_conversations,
        COUNT(DISTINCT sa.conversation_id)::BIGINT as conversations_with_alerts,
        COUNT(sa.id)::BIGINT as active_alerts_count,
        AVG(cst.confidence)::REAL as avg_sentiment_confidence,
        (SELECT jsonb_object_agg(sentiment_type, sentiment_count)
         FROM (
             SELECT sentiment_type, COUNT(*) as sentiment_count
             FROM conversation_sentiment_tracking 
             WHERE organization_id = p_organization_id
             AND analyzed_at >= NOW() - INTERVAL '24 hours'
             GROUP BY sentiment_type
         ) sentiment_dist) as sentiment_distribution,
        (SELECT jsonb_object_agg(severity, severity_count)
         FROM (
             SELECT severity, COUNT(*) as severity_count
             FROM sentiment_alerts 
             WHERE organization_id = p_organization_id
             AND status = 'active'
             GROUP BY severity
         ) severity_dist) as alert_severity_distribution,
        jsonb_build_object(
            'last_24h_sentiment_trend', 
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'hour', EXTRACT(hour FROM analyzed_at),
                    'avg_confidence', AVG(confidence),
                    'dominant_sentiment', MODE() WITHIN GROUP (ORDER BY sentiment_type)
                )
            )
            FROM conversation_sentiment_tracking 
            WHERE organization_id = p_organization_id
            AND analyzed_at >= NOW() - INTERVAL '24 hours'
            GROUP BY EXTRACT(hour FROM analyzed_at)
            ORDER BY EXTRACT(hour FROM analyzed_at))
        ) as recent_trends
    FROM conversation_sentiment_tracking cst
    LEFT JOIN sentiment_alerts sa ON sa.conversation_id = cst.conversation_id AND sa.status = 'active'
    WHERE cst.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE conversation_sentiment_tracking IS 'Tracks sentiment analysis results for individual messages in conversations';
COMMENT ON TABLE sentiment_alerts IS 'Stores alerts triggered by negative sentiment or escalation risk';
COMMENT ON FUNCTION get_conversation_sentiment_summary IS 'Returns sentiment summary statistics for a specific conversation';
COMMENT ON FUNCTION get_organization_sentiment_dashboard IS 'Returns organization-wide sentiment dashboard data'; 