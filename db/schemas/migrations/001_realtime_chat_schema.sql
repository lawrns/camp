-- =====================================================
-- Campfire Real-time Chat Schema Migration
-- Version: 001
-- Description: Complete schema for real-time chat functionality
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    channel VARCHAR(255) NOT NULL, -- Real-time channel identifier
    title VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Participant information
    customer_id UUID,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    assigned_agent_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- RAG and AI context
    rag_context JSONB DEFAULT '{}',
    ai_summary TEXT,
    escalation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT conversations_workspace_channel_unique UNIQUE (workspace_id, channel)
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response', 'handover')),
    
    -- Sender information
    sender_id UUID,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'ai', 'system')),
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    
    -- Message metadata
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    
    -- Delivery tracking
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- AI and RAG context
    ai_confidence DECIMAL(3,2),
    rag_sources JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TYPING INDICATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    
    -- Typing user information
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'agent')),
    
    -- Typing state
    is_typing BOOLEAN DEFAULT true,
    
    -- Timestamps (auto-expire after 10 seconds)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
    
    -- Unique constraint to prevent duplicate typing indicators
    CONSTRAINT typing_indicators_unique UNIQUE (conversation_id, user_id)
);

-- =====================================================
-- PRESENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    
    -- User information
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'agent')),
    user_email VARCHAR(255),
    
    -- Presence state
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    
    -- Connection information
    connection_id VARCHAR(255),
    channel VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for user presence per workspace
    CONSTRAINT presence_workspace_user_unique UNIQUE (workspace_id, user_id)
);

-- =====================================================
-- CONVERSATION PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Participant information
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'agent')),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    
    -- Participation metadata
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'owner', 'observer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Read tracking
    last_read_message_id UUID REFERENCES messages(id),
    last_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint
    CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

-- =====================================================
-- RAG HANDOVER LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rag_handover_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Handover details
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('confidence_threshold', 'explicit_request', 'escalation_keyword', 'timeout', 'manual')),
    trigger_value TEXT,
    
    -- AI context at handover
    ai_confidence DECIMAL(3,2),
    ai_summary TEXT,
    rag_context JSONB DEFAULT '{}',
    
    -- Agent assignment
    assigned_agent_id UUID,
    assignment_method VARCHAR(50) CHECK (assignment_method IN ('automatic', 'manual', 'round_robin', 'skill_based')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_messages_content_gin ON messages USING gin(to_tsvector('english', content));

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_workspace_id ON typing_indicators(workspace_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON typing_indicators(expires_at);

-- Presence indexes
CREATE INDEX IF NOT EXISTS idx_presence_workspace_id ON presence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_status ON presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen_at ON presence(last_seen_at);

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- RAG handover log indexes
CREATE INDEX IF NOT EXISTS idx_rag_handover_log_conversation_id ON rag_handover_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rag_handover_log_trigger_type ON rag_handover_log(trigger_type);
CREATE INDEX IF NOT EXISTS idx_rag_handover_log_created_at ON rag_handover_log(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update conversations.updated_at on any change
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at_trigger
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- Update conversations.last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message_at();

-- Auto-cleanup expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_typing_indicators_trigger
    AFTER INSERT OR UPDATE ON typing_indicators
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_expired_typing_indicators();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_handover_log ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "Users can view conversations in their workspace" ON conversations
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations in their workspace" ON conversations
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update conversations in their workspace" ON conversations
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    );

-- Messages RLS policies
CREATE POLICY "Users can view messages in accessible conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE workspace_id IN (
                SELECT workspace_id FROM user_workspaces 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert messages in accessible conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE workspace_id IN (
                SELECT workspace_id FROM user_workspaces 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Typing indicators RLS policies
CREATE POLICY "Users can view typing indicators in their workspace" ON typing_indicators
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (user_id = auth.uid());

-- Presence RLS policies
CREATE POLICY "Users can view presence in their workspace" ON presence
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own presence" ON presence
    FOR ALL USING (user_id = auth.uid());

-- Conversation participants RLS policies
CREATE POLICY "Users can view participants in accessible conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE workspace_id IN (
                SELECT workspace_id FROM user_workspaces 
                WHERE user_id = auth.uid()
            )
        )
    );

-- RAG handover log RLS policies
CREATE POLICY "Users can view handover logs in accessible conversations" ON rag_handover_log
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE workspace_id IN (
                SELECT workspace_id FROM user_workspaces 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================

-- Create publication for real-time subscriptions
DROP PUBLICATION IF EXISTS campfire_realtime;
CREATE PUBLICATION campfire_realtime FOR TABLE 
    conversations,
    messages,
    typing_indicators,
    presence,
    conversation_participants,
    rag_handover_log;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get active conversations for a workspace
CREATE OR REPLACE FUNCTION get_active_conversations(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    channel VARCHAR,
    title VARCHAR,
    status VARCHAR,
    customer_name VARCHAR,
    assigned_agent_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.channel,
        c.title,
        c.status,
        c.customer_name,
        c.assigned_agent_id,
        c.last_message_at,
        COALESCE(
            (SELECT COUNT(*) FROM messages m 
             WHERE m.conversation_id = c.id 
             AND m.created_at > COALESCE(
                 (SELECT last_read_at FROM conversation_participants cp 
                  WHERE cp.conversation_id = c.id AND cp.user_id = auth.uid()), 
                 '1970-01-01'::timestamp
             )), 
             0
        ) as unread_count
    FROM conversations c
    WHERE c.workspace_id = p_workspace_id
    AND c.status = 'active'
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_conversation_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
    VALUES (p_conversation_id, p_user_id, NOW())
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update presence
CREATE OR REPLACE FUNCTION update_user_presence(
    p_workspace_id UUID,
    p_user_id UUID,
    p_user_name VARCHAR,
    p_status VARCHAR DEFAULT 'online',
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO presence (workspace_id, user_id, user_name, status, metadata, last_seen_at)
    VALUES (p_workspace_id, p_user_id, p_user_name, p_status, p_metadata, NOW())
    ON CONFLICT (workspace_id, user_id)
    DO UPDATE SET 
        status = p_status,
        metadata = p_metadata,
        last_seen_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- =====================================================

-- Uncomment the following lines to insert sample data for testing
/*
INSERT INTO conversations (workspace_id, channel, title, customer_email, customer_name) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'widget-demo-1', 'Demo Conversation 1', 'demo@example.com', 'Demo User'),
    ('550e8400-e29b-41d4-a716-446655440000', 'widget-demo-2', 'Demo Conversation 2', 'test@example.com', 'Test User');

INSERT INTO messages (conversation_id, content, sender_type, sender_name) VALUES
    ((SELECT id FROM conversations WHERE channel = 'widget-demo-1'), 'Hello, I need help with my account', 'customer', 'Demo User'),
    ((SELECT id FROM conversations WHERE channel = 'widget-demo-1'), 'Hi! I''d be happy to help you with your account. What specific issue are you experiencing?', 'ai', 'Campfire AI');
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Campfire Real-time Chat Schema Migration 001 completed successfully';
    RAISE NOTICE 'Tables created: conversations, messages, typing_indicators, presence, conversation_participants, rag_handover_log';
    RAISE NOTICE 'Indexes, triggers, RLS policies, and utility functions have been set up';
    RAISE NOTICE 'Real-time publication "campfire_realtime" has been created';
END $$; 