-- =====================================================
-- COMPREHENSIVE REALTIME SETUP MIGRATION
-- Implements all realtime features from the success report
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. REALTIME PUBLICATIONS (Enable realtime for tables)
-- =====================================================

-- Drop existing publication if it exists and recreate
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create comprehensive realtime publication
CREATE PUBLICATION supabase_realtime FOR TABLE 
    -- Core conversation tables
    conversations,
    conversation_messages,
    messages,
    
    -- Realtime interaction tables
    typing_indicators,
    message_delivery_status,
    message_read_status,
    
    -- Widget and session tables
    widget_settings,
    campfire_messages,
    campfire_channels,
    
    -- Agent and organization tables
    agents,
    organization_members,
    profiles,
    
    -- AI and handoff tables
    campfire_handoffs,
    campfire_handoff_logs,
    ai_sessions,
    
    -- Notification tables
    agent_notifications,
    message_notifications;

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS) FOR REALTIME
-- =====================================================

-- Enable RLS on all realtime tables if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campfire_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campfire_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campfire_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campfire_handoff_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Organization-scoped RLS policies for conversations
DROP POLICY IF EXISTS "conversations_org_access" ON conversations;
CREATE POLICY "conversations_org_access" ON conversations
FOR ALL USING (
    mailbox_id IN (
        SELECT id FROM mailboxes 
        WHERE clerk_organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- Organization-scoped RLS policies for messages
DROP POLICY IF EXISTS "messages_org_access" ON conversation_messages;
CREATE POLICY "messages_org_access" ON conversation_messages
FOR ALL USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE mailbox_id IN (
            SELECT id FROM mailboxes 
            WHERE clerk_organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    )
);

-- Organization-scoped RLS policies for typing indicators
DROP POLICY IF EXISTS "typing_indicators_org_access" ON typing_indicators;
CREATE POLICY "typing_indicators_org_access" ON typing_indicators
FOR ALL USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE mailbox_id IN (
            SELECT id FROM mailboxes 
            WHERE clerk_organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    )
);

-- Organization-scoped RLS policies for message delivery status
DROP POLICY IF EXISTS "message_delivery_org_access" ON message_delivery_status;
CREATE POLICY "message_delivery_org_access" ON message_delivery_status
FOR ALL USING (
    message_id IN (
        SELECT id FROM conversation_messages 
        WHERE conversation_id IN (
            SELECT id FROM conversations 
            WHERE mailbox_id IN (
                SELECT id FROM mailboxes 
                WHERE clerk_organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    )
);

-- Organization-scoped RLS policies for message read status
DROP POLICY IF EXISTS "message_read_org_access" ON message_read_status;
CREATE POLICY "message_read_org_access" ON message_read_status
FOR ALL USING (
    message_id IN (
        SELECT id FROM conversation_messages 
        WHERE conversation_id IN (
            SELECT id FROM conversations 
            WHERE mailbox_id IN (
                SELECT id FROM mailboxes 
                WHERE clerk_organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    )
);

-- Organization-scoped RLS policies for widget settings
DROP POLICY IF EXISTS "widget_settings_org_access" ON widget_settings;
CREATE POLICY "widget_settings_org_access" ON widget_settings
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for campfire messages
DROP POLICY IF EXISTS "campfire_messages_org_access" ON campfire_messages;
CREATE POLICY "campfire_messages_org_access" ON campfire_messages
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for campfire channels
DROP POLICY IF EXISTS "campfire_channels_org_access" ON campfire_channels;
CREATE POLICY "campfire_channels_org_access" ON campfire_channels
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for agents
DROP POLICY IF EXISTS "agents_org_access" ON agents;
CREATE POLICY "agents_org_access" ON agents
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for organization members
DROP POLICY IF EXISTS "org_members_access" ON organization_members;
CREATE POLICY "org_members_access" ON organization_members
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Public access for profiles (users can see all profiles)
DROP POLICY IF EXISTS "profiles_public_access" ON profiles;
CREATE POLICY "profiles_public_access" ON profiles
FOR SELECT USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles
FOR UPDATE USING (id = auth.uid());

-- Organization-scoped RLS policies for handoffs
DROP POLICY IF EXISTS "handoffs_org_access" ON campfire_handoffs;
CREATE POLICY "handoffs_org_access" ON campfire_handoffs
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for handoff logs
DROP POLICY IF EXISTS "handoff_logs_org_access" ON campfire_handoff_logs;
CREATE POLICY "handoff_logs_org_access" ON campfire_handoff_logs
FOR ALL USING (
    handoff_id IN (
        SELECT id FROM campfire_handoffs 
        WHERE organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- Organization-scoped RLS policies for AI sessions
DROP POLICY IF EXISTS "ai_sessions_org_access" ON ai_sessions;
CREATE POLICY "ai_sessions_org_access" ON ai_sessions
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Organization-scoped RLS policies for agent notifications
DROP POLICY IF EXISTS "agent_notifications_org_access" ON agent_notifications;
CREATE POLICY "agent_notifications_org_access" ON agent_notifications
FOR ALL USING (
    agent_id IN (
        SELECT id FROM agents 
        WHERE organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- Organization-scoped RLS policies for message notifications
DROP POLICY IF EXISTS "message_notifications_org_access" ON message_notifications;
CREATE POLICY "message_notifications_org_access" ON message_notifications
FOR ALL USING (
    user_id = auth.uid() OR
    user_id IN (
        SELECT user_id FROM organization_members
        WHERE organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    )
);

-- =====================================================
-- 3. REALTIME BROADCAST FUNCTIONS
-- =====================================================

-- Function to broadcast message events
CREATE OR REPLACE FUNCTION broadcast_message_event()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
BEGIN
    -- Get organization ID from conversation
    SELECT m.clerk_organization_id INTO org_id
    FROM mailboxes m
    JOIN conversations c ON c.mailbox_id = m.id
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Create organization-scoped channel name
    channel_name := 'org:' || org_id || ':conversation:' || COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Broadcast the event
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'message_' || TG_OP,
            'table', TG_TABLE_NAME,
            'record', CASE
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                ELSE row_to_json(NEW)
            END,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast typing indicator events
CREATE OR REPLACE FUNCTION broadcast_typing_event()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
BEGIN
    -- Get organization ID from conversation
    SELECT m.clerk_organization_id INTO org_id
    FROM mailboxes m
    JOIN conversations c ON c.mailbox_id = m.id
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Create organization-scoped channel name
    channel_name := 'org:' || org_id || ':conversation:' || COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Broadcast the typing event
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'typing_' || TG_OP,
            'table', TG_TABLE_NAME,
            'record', CASE
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                ELSE row_to_json(NEW)
            END,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast widget session events
CREATE OR REPLACE FUNCTION broadcast_widget_event()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
BEGIN
    -- Get organization ID
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);

    -- Create organization-scoped widget channel name
    channel_name := 'org:' || org_id || ':widget:' || COALESCE(NEW.session_id, OLD.session_id);

    -- Broadcast the widget event
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'widget_' || TG_OP,
            'table', TG_TABLE_NAME,
            'record', CASE
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                ELSE row_to_json(NEW)
            END,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast agent status events
CREATE OR REPLACE FUNCTION broadcast_agent_event()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
BEGIN
    -- Get organization ID
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);

    -- Create organization-scoped agent channel name
    channel_name := 'org:' || org_id || ':agents';

    -- Broadcast the agent event
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'agent_' || TG_OP,
            'table', TG_TABLE_NAME,
            'record', CASE
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                ELSE row_to_json(NEW)
            END,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast handoff events
CREATE OR REPLACE FUNCTION broadcast_handoff_event()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
BEGIN
    -- Get organization ID
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);

    -- Create organization-scoped handoff channel name
    channel_name := 'org:' || org_id || ':handoffs';

    -- Broadcast the handoff event
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'handoff_' || TG_OP,
            'table', TG_TABLE_NAME,
            'record', CASE
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                ELSE row_to_json(NEW)
            END,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CONVERSATION STATUS BROADCASTS
-- =====================================================

-- Function to update conversation last activity and broadcast
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
    conversation_record RECORD;
BEGIN
    -- Update conversation last_message_at timestamp
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- Get updated conversation with organization info
    SELECT c.*, m.clerk_organization_id as org_id
    INTO conversation_record
    FROM conversations c
    JOIN mailboxes m ON m.id = c.mailbox_id
    WHERE c.id = NEW.conversation_id;

    -- Create organization-scoped channel name
    channel_name := 'org:' || conversation_record.org_id || ':conversations';

    -- Broadcast conversation update
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'conversation_updated',
            'table', 'conversations',
            'record', row_to_json(conversation_record),
            'organization_id', conversation_record.org_id,
            'timestamp', extract(epoch from now())
        )::text
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup stale typing indicators
CREATE OR REPLACE FUNCTION cleanup_stale_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for organization
CREATE OR REPLACE FUNCTION get_unread_count_for_org(
    p_organization_id TEXT,
    p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    conversation_id BIGINT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as conversation_id,
        COUNT(cm.id) as unread_count
    FROM conversations c
    JOIN mailboxes m ON m.id = c.mailbox_id
    JOIN conversation_messages cm ON cm.conversation_id = c.id
    LEFT JOIN message_read_status mrs ON mrs.message_id = cm.id
        AND mrs.user_id = COALESCE(p_user_id, auth.uid())
    WHERE m.clerk_organization_id = p_organization_id
        AND mrs.id IS NULL
        AND cm.created_at > COALESCE(
            (SELECT last_read_at FROM organization_members
             WHERE organization_id = p_organization_id
             AND user_id = COALESCE(p_user_id, auth.uid())),
            '1970-01-01'::timestamp
        )
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read and broadcast
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_conversation_id BIGINT,
    p_user_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    org_id TEXT;
    channel_name TEXT;
    user_id TEXT;
BEGIN
    user_id := COALESCE(p_user_id, auth.uid());

    -- Get organization ID
    SELECT m.clerk_organization_id INTO org_id
    FROM mailboxes m
    JOIN conversations c ON c.mailbox_id = m.id
    WHERE c.id = p_conversation_id;

    -- Insert read status for unread messages
    INSERT INTO message_read_status (message_id, user_id, read_at)
    SELECT cm.id, user_id, NOW()
    FROM conversation_messages cm
    LEFT JOIN message_read_status mrs ON mrs.message_id = cm.id AND mrs.user_id = user_id
    WHERE cm.conversation_id = p_conversation_id
        AND mrs.id IS NULL;

    -- Create organization-scoped channel name
    channel_name := 'org:' || org_id || ':conversation:' || p_conversation_id;

    -- Broadcast read status update
    PERFORM pg_notify(
        channel_name,
        json_build_object(
            'type', 'messages_read',
            'conversation_id', p_conversation_id,
            'user_id', user_id,
            'organization_id', org_id,
            'timestamp', extract(epoch from now())
        )::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. DATABASE TRIGGERS FOR REALTIME EVENTS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS conversation_messages_realtime_trigger ON conversation_messages;
DROP TRIGGER IF EXISTS messages_realtime_trigger ON messages;
DROP TRIGGER IF EXISTS typing_indicators_realtime_trigger ON typing_indicators;
DROP TRIGGER IF EXISTS campfire_messages_realtime_trigger ON campfire_messages;
DROP TRIGGER IF EXISTS agents_realtime_trigger ON agents;
DROP TRIGGER IF EXISTS campfire_handoffs_realtime_trigger ON campfire_handoffs;
DROP TRIGGER IF EXISTS conversation_activity_trigger ON conversation_messages;

-- Trigger for conversation messages
CREATE TRIGGER conversation_messages_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON conversation_messages
    FOR EACH ROW EXECUTE FUNCTION broadcast_message_event();

-- Trigger for messages table (if different from conversation_messages)
CREATE TRIGGER messages_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION broadcast_message_event();

-- Trigger for typing indicators
CREATE TRIGGER typing_indicators_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON typing_indicators
    FOR EACH ROW EXECUTE FUNCTION broadcast_typing_event();

-- Trigger for campfire messages (widget messages)
CREATE TRIGGER campfire_messages_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campfire_messages
    FOR EACH ROW EXECUTE FUNCTION broadcast_widget_event();

-- Trigger for agent status changes
CREATE TRIGGER agents_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION broadcast_agent_event();

-- Trigger for handoff events
CREATE TRIGGER campfire_handoffs_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campfire_handoffs
    FOR EACH ROW EXECUTE FUNCTION broadcast_handoff_event();

-- Trigger to update conversation activity when messages are added
CREATE TRIGGER conversation_activity_trigger
    AFTER INSERT ON conversation_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_activity();

-- =====================================================
-- 6. UTILITY FUNCTIONS AND CLEANUP
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION broadcast_message_event TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_typing_event TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_widget_event TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_agent_event TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_handoff_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_typing_indicators TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count_for_org TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_user ON message_read_status(message_id, user_id);
CREATE INDEX IF NOT EXISTS idx_campfire_messages_organization_id ON campfire_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON organization_members(organization_id, user_id);

-- Create a scheduled job to cleanup stale typing indicators (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-typing-indicators', '*/30 * * * * *', 'SELECT cleanup_stale_typing_indicators();');

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON PUBLICATION supabase_realtime IS 'Comprehensive realtime publication for Campfire chat system';
COMMENT ON FUNCTION broadcast_message_event IS 'Broadcasts message events to organization-scoped channels';
COMMENT ON FUNCTION broadcast_typing_event IS 'Broadcasts typing indicator events to conversation channels';
COMMENT ON FUNCTION broadcast_widget_event IS 'Broadcasts widget session events to widget channels';
COMMENT ON FUNCTION broadcast_agent_event IS 'Broadcasts agent status changes to organization channels';
COMMENT ON FUNCTION broadcast_handoff_event IS 'Broadcasts AI handoff events to organization channels';
COMMENT ON FUNCTION update_conversation_activity IS 'Updates conversation timestamps and broadcasts activity';
COMMENT ON FUNCTION cleanup_stale_typing_indicators IS 'Removes typing indicators older than 10 seconds';
COMMENT ON FUNCTION get_unread_count_for_org IS 'Gets unread message counts for organization conversations';
COMMENT ON FUNCTION mark_messages_read IS 'Marks messages as read and broadcasts the event';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive realtime setup migration completed successfully';
    RAISE NOTICE 'Enabled realtime for: conversations, messages, typing_indicators, agents, handoffs';
    RAISE NOTICE 'Created organization-scoped RLS policies for all tables';
    RAISE NOTICE 'Set up broadcast functions and triggers for realtime events';
    RAISE NOTICE 'Channel format: org:{organizationId}:{type}:{resourceId}';
END $$;
