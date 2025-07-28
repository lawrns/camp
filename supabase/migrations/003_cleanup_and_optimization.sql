-- =====================================================
-- CLEANUP AND OPTIMIZATION MIGRATION
-- =====================================================
-- This handles cleanup, optimization, and remaining essential features
-- Date: 2025-01-08
-- Purpose: Final cleanup and optimization for production

-- =====================================================
-- 1. REAL-TIME SETUP
-- =====================================================

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
ALTER PUBLICATION supabase_realtime ADD TABLE mailboxes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE sla_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE escalations;

-- =====================================================
-- 2. USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, user_id, email, full_name)
    VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user's active organization
CREATE OR REPLACE FUNCTION get_user_active_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active' 
        ORDER BY created_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user's active organization
CREATE OR REPLACE FUNCTION set_user_active_organization(org_id UUID)
RETURNS JSON AS $$
DECLARE
    org_record RECORD;
    member_record RECORD;
BEGIN
    -- Verify user is a member of the organization and get details
    SELECT om.role, om.status, o.name as organization_name
    INTO member_record
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = org_id 
    AND om.status = 'active';
    
    IF FOUND THEN
        -- Set the organization as active
        PERFORM set_config('app.current_organization_id', org_id::text, false);
        
        -- Return success with organization details
        RETURN json_build_object(
            'success', true,
            'organization_id', org_id::text,
            'organization_name', member_record.organization_name,
            'role', member_record.role,
            'message', 'Organization set successfully'
        );
    ELSE
        -- Return failure
        RETURN json_build_object(
            'success', false,
            'error', 'User is not an active member of this organization'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CONVERSATION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get inbox conversations with pagination
CREATE OR REPLACE FUNCTION get_inbox_conversations(
    org_id UUID,
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    subject TEXT,
    status TEXT,
    priority TEXT,
    customer_email TEXT,
    customer_name TEXT,
    assigned_to_user_id UUID,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    unread_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.subject,
        c.status,
        c.priority,
        c.customer_email,
        c.customer_name,
        c.assigned_to_user_id,
        c.last_message_at,
        c.created_at,
        COALESCE(
            (SELECT COUNT(*) FROM messages m 
             WHERE m.conversation_id = c.id 
             AND m.sender_type = 'visitor'
             AND m.created_at > COALESCE(
                 (SELECT MAX(created_at) FROM messages 
                  WHERE conversation_id = c.id 
                  AND sender_type = 'agent'), 
                 c.created_at
             )), 
            0
        ) as unread_count
    FROM conversations c
    WHERE c.organization_id = org_id
        AND (status_filter IS NULL OR c.status = status_filter)
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation messages with pagination
CREATE OR REPLACE FUNCTION get_conversation_messages(
    conv_id UUID,
    org_id UUID,
    page_size INTEGER DEFAULT 50,
    before_message_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    sender_type TEXT,
    sender_name TEXT,
    sender_email TEXT,
    message_type TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.sender_type,
        m.sender_name,
        m.sender_email,
        m.message_type,
        m.attachments,
        m.created_at
    FROM messages m
    WHERE m.conversation_id = conv_id
        AND m.organization_id = org_id
        AND m.is_deleted = false
        AND (before_message_id IS NULL OR m.id < before_message_id)
    ORDER BY m.created_at DESC
    LIMIT page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. SLA MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create SLA tracking entry
CREATE OR REPLACE FUNCTION create_sla_tracking(
    p_organization_id UUID,
    p_conversation_id UUID,
    p_sla_type TEXT,
    p_target_time_minutes INTEGER,
    p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    sla_id UUID;
BEGIN
    INSERT INTO sla_tracking (
        organization_id,
        conversation_id,
        sla_type,
        target_time_minutes,
        priority
    ) VALUES (
        p_organization_id,
        p_conversation_id,
        p_sla_type,
        p_target_time_minutes,
        p_priority
    ) RETURNING id INTO sla_id;
    
    RETURN sla_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete SLA tracking
CREATE OR REPLACE FUNCTION complete_sla_tracking(
    p_sla_id UUID,
    p_status TEXT DEFAULT 'met'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sla_tracking 
    SET 
        status = p_status,
        end_time = NOW(),
        updated_at = NOW()
    WHERE id = p_sla_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. WIDGET API KEY MANAGEMENT
-- =====================================================

-- Function to generate widget API key
CREATE OR REPLACE FUNCTION generate_widget_api_key(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    api_key TEXT;
BEGIN
    -- Generate a secure API key
    api_key := encode(gen_random_bytes(32), 'hex');
    
    -- Update the organization with the new API key
    UPDATE organizations 
    SET widget_api_key = api_key
    WHERE id = org_id;
    
    RETURN api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate widget API key
CREATE OR REPLACE FUNCTION validate_widget_api_key(api_key TEXT)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id
    FROM organizations
    WHERE widget_api_key = api_key;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. ANALYTICS AND REPORTING FUNCTIONS
-- =====================================================

-- Function to get conversation statistics
CREATE OR REPLACE FUNCTION get_conversation_stats(
    org_id UUID,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_conversations BIGINT,
    open_conversations BIGINT,
    closed_conversations BIGINT,
    avg_response_time_minutes NUMERIC,
    avg_resolution_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE status = 'open') as open_conversations,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_conversations,
        AVG(
            EXTRACT(EPOCH FROM (
                SELECT MIN(created_at) FROM messages m 
                WHERE m.conversation_id = c.id 
                AND m.sender_type = 'agent'
            ) - c.created_at) / 60
        ) as avg_response_time_minutes,
        AVG(
            EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600
        ) as avg_resolution_time_hours
    FROM conversations c
    WHERE c.organization_id = org_id
        AND c.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SLA compliance statistics
CREATE OR REPLACE FUNCTION get_sla_compliance_stats(
    org_id UUID,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    sla_type TEXT,
    total_slas BIGINT,
    met_slas BIGINT,
    breached_slas BIGINT,
    compliance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.sla_type,
        COUNT(*) as total_slas,
        COUNT(*) FILTER (WHERE st.status = 'met') as met_slas,
        COUNT(*) FILTER (WHERE st.status = 'breached') as breached_slas,
        ROUND(
            (COUNT(*) FILTER (WHERE st.status = 'met')::NUMERIC / COUNT(*)) * 100, 
            2
        ) as compliance_rate
    FROM sla_tracking st
    WHERE st.organization_id = org_id
        AND st.created_at BETWEEN start_date AND end_date
    GROUP BY st.sla_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old AI processing logs
CREATE OR REPLACE FUNCTION cleanup_old_ai_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_processing_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS ON FUNCTIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_active_organization TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_active_organization TO authenticated;
GRANT EXECUTE ON FUNCTION get_inbox_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated;
GRANT EXECUTE ON FUNCTION create_sla_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION complete_sla_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION generate_widget_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION validate_widget_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_compliance_stats TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_user_active_organization TO service_role;
GRANT EXECUTE ON FUNCTION set_user_active_organization TO service_role;
GRANT EXECUTE ON FUNCTION get_inbox_conversations TO service_role;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO service_role;
GRANT EXECUTE ON FUNCTION create_sla_tracking TO service_role;
GRANT EXECUTE ON FUNCTION complete_sla_tracking TO service_role;
GRANT EXECUTE ON FUNCTION generate_widget_api_key TO service_role;
GRANT EXECUTE ON FUNCTION validate_widget_api_key TO service_role;
GRANT EXECUTE ON FUNCTION get_conversation_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_sla_compliance_stats TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_typing_indicators TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_ai_logs TO service_role;

-- =====================================================
-- 9. FINAL OPTIMIZATIONS
-- =====================================================

-- Analyze all tables for query optimization
ANALYZE organizations;
ANALYZE profiles;
ANALYZE organization_members;
ANALYZE mailboxes;
ANALYZE conversations;
ANALYZE messages;
ANALYZE sla_tracking;
ANALYZE typing_indicators;
ANALYZE ai_sessions;
ANALYZE ai_processing_logs;
ANALYZE knowledge_documents;
ANALYZE knowledge_chunks;
ANALYZE widget_settings;
ANALYZE widget_welcome_config;
ANALYZE widget_quick_replies;
ANALYZE faq_categories;
ANALYZE escalations;
ANALYZE attachments;
ANALYZE conversation_summaries;

-- =====================================================
-- 10. MIGRATION TRACKING
-- =====================================================

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- Insert migration records
INSERT INTO schema_migrations (version, description) VALUES 
    ('001_core_schema', 'Core schema with organizations, profiles, conversations, messages, SLA tracking, and typing indicators'),
    ('002_ai_and_widget_features', 'AI sessions, knowledge base, widget configuration, escalations, attachments, and conversation summaries'),
    ('003_cleanup_and_optimization', 'Real-time setup, user management functions, analytics, and optimizations')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Final schema refresh
NOTIFY pgrst, 'reload schema';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Database is now ready for production use.';
    RAISE NOTICE 'All 80+ conflicting migrations have been replaced with 3 clean, essential migrations.';
END $$;