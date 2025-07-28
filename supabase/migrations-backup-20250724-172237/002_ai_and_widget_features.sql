-- =====================================================
-- AI AND WIDGET FEATURES MIGRATION
-- =====================================================
-- This adds AI features, widget functionality, and knowledge base
-- Date: 2025-01-08
-- Purpose: Add essential AI and widget features to core schema

-- =====================================================
-- 1. AI SESSIONS (AI interaction tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL DEFAULT 'chat' CHECK (session_type IN ('chat', 'handover', 'escalation')),
    ai_model TEXT,
    ai_persona TEXT DEFAULT 'friendly',
    confidence_threshold FLOAT DEFAULT 0.7,
    session_metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'escalated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- =====================================================
-- 2. AI PROCESSING LOGS (AI operation tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    ai_session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'message_processing',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. KNOWLEDGE BASE TABLES
-- =====================================================

-- Knowledge documents (articles, FAQs, etc.)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'faq', 'guide', 'policy')),
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge chunks (for vector search)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. WIDGET CONFIGURATION TABLES
-- =====================================================

-- Widget settings per organization
CREATE TABLE IF NOT EXISTS widget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    widget_title TEXT DEFAULT 'Chat with us',
    widget_subtitle TEXT DEFAULT 'We''re here to help!',
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#1F2937',
    position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    is_enabled BOOLEAN DEFAULT true,
    show_avatar BOOLEAN DEFAULT true,
    show_typing_indicator BOOLEAN DEFAULT true,
    auto_open BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Widget welcome messages
CREATE TABLE IF NOT EXISTS widget_welcome_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    trigger_type TEXT DEFAULT 'page_load' CHECK (trigger_type IN ('page_load', 'time_delay', 'scroll', 'click')),
    trigger_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget quick replies
CREATE TABLE IF NOT EXISTS widget_quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    is_enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. FAQ CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ESCALATIONS (AI-to-human handoffs)
-- =====================================================
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    escalation_type TEXT NOT NULL CHECK (escalation_type IN ('low_confidence', 'user_request', 'complex_query', 'error', 'manual', 'timeout')),
    escalation_reason TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0.0 AND ai_confidence_score <= 1.0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'cancelled')),
    escalated_to_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    escalated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    escalated_by_ai BOOLEAN DEFAULT true,
    escalated_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    handover_context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. ATTACHMENTS (File uploads)
-- =====================================================
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CONVERSATION SUMMARIES (AI-generated summaries)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_points TEXT[],
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_confidence FLOAT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- AI Sessions
CREATE INDEX IF NOT EXISTS idx_ai_sessions_org_id ON ai_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_conversation_id ON ai_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_sessions(status);

-- AI Processing Logs
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_org_id ON ai_processing_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_conversation_id ON ai_processing_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_status ON ai_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);

-- Knowledge Base
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_org_id ON knowledge_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active ON knowledge_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tags ON knowledge_documents USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_org_id ON knowledge_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- Widget Configuration
CREATE INDEX IF NOT EXISTS idx_widget_settings_org_id ON widget_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_widget_welcome_config_org_id ON widget_welcome_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_widget_quick_replies_org_id ON widget_quick_replies(organization_id);
CREATE INDEX IF NOT EXISTS idx_widget_quick_replies_enabled ON widget_quick_replies(is_enabled);

-- FAQ Categories
CREATE INDEX IF NOT EXISTS idx_faq_categories_org_id ON faq_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_categories_public ON faq_categories(is_public);

-- Escalations
CREATE INDEX IF NOT EXISTS idx_escalations_org_id ON escalations(organization_id);
CREATE INDEX IF NOT EXISTS idx_escalations_conversation_id ON escalations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_agent_id ON escalations(escalated_to_agent_id);

-- Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_org_id ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);

-- Conversation Summaries
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_org_id ON conversation_summaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id ON conversation_summaries(conversation_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_welcome_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

-- AI Sessions: Organization scoped
CREATE POLICY "Users can access AI sessions in their organization" ON ai_sessions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- AI Processing Logs: Organization scoped
CREATE POLICY "Users can access AI processing logs in their organization" ON ai_processing_logs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Knowledge Documents: Organization scoped with public read option
CREATE POLICY "Users can access knowledge documents in their organization" ON knowledge_documents
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Knowledge Chunks: Organization scoped
CREATE POLICY "Users can access knowledge chunks in their organization" ON knowledge_chunks
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Widget Settings: Organization scoped
CREATE POLICY "Users can access widget settings in their organization" ON widget_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Widget Welcome Config: Organization scoped
CREATE POLICY "Users can access widget welcome config in their organization" ON widget_welcome_config
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Widget Quick Replies: Organization scoped
CREATE POLICY "Users can access widget quick replies in their organization" ON widget_quick_replies
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- FAQ Categories: Organization scoped with public read option
CREATE POLICY "Users can access FAQ categories in their organization" ON faq_categories
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Escalations: Organization scoped
CREATE POLICY "Users can access escalations in their organization" ON escalations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Attachments: Organization scoped
CREATE POLICY "Users can access attachments in their organization" ON attachments
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Conversation Summaries: Organization scoped
CREATE POLICY "Users can access conversation summaries in their organization" ON conversation_summaries
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON ai_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_processing_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON knowledge_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON knowledge_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON widget_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON widget_welcome_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON widget_quick_replies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON faq_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON escalations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_summaries TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ai_sessions TO service_role;
GRANT ALL ON ai_processing_logs TO service_role;
GRANT ALL ON knowledge_documents TO service_role;
GRANT ALL ON knowledge_chunks TO service_role;
GRANT ALL ON widget_settings TO service_role;
GRANT ALL ON widget_welcome_config TO service_role;
GRANT ALL ON widget_quick_replies TO service_role;
GRANT ALL ON faq_categories TO service_role;
GRANT ALL ON escalations TO service_role;
GRANT ALL ON attachments TO service_role;
GRANT ALL ON conversation_summaries TO service_role;

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_ai_sessions_updated_at BEFORE UPDATE ON ai_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_processing_logs_updated_at BEFORE UPDATE ON ai_processing_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_settings_updated_at BEFORE UPDATE ON widget_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_welcome_config_updated_at BEFORE UPDATE ON widget_welcome_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_quick_replies_updated_at BEFORE UPDATE ON widget_quick_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faq_categories_updated_at BEFORE UPDATE ON faq_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON escalations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversation_summaries_updated_at BEFORE UPDATE ON conversation_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to search knowledge chunks by similarity
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    org_id uuid
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.document_id,
        kc.content,
        1 - (kc.embedding <=> query_embedding) as similarity
    FROM knowledge_chunks kc
    WHERE kc.organization_id = org_id
        AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_knowledge_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_chunks TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE ai_sessions IS 'AI interaction tracking for billing and analytics';
COMMENT ON TABLE ai_processing_logs IS 'AI operation tracking and cost monitoring';
COMMENT ON TABLE knowledge_documents IS 'Knowledge base articles for AI context';
COMMENT ON TABLE knowledge_chunks IS 'Vector embeddings for knowledge base search';
COMMENT ON TABLE widget_settings IS 'Widget configuration per organization';
COMMENT ON TABLE widget_welcome_config IS 'Welcome messages for widget';
COMMENT ON TABLE widget_quick_replies IS 'Quick reply options for widget';
COMMENT ON TABLE faq_categories IS 'FAQ categories for knowledge organization';
COMMENT ON TABLE escalations IS 'AI-to-human handoff tracking';
COMMENT ON TABLE attachments IS 'File uploads and attachments';
COMMENT ON TABLE conversation_summaries IS 'AI-generated conversation summaries';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Refresh schema cache for Supabase
NOTIFY pgrst, 'reload schema'; 