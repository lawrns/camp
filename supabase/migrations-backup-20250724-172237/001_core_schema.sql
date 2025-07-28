-- =====================================================
-- CORE SCHEMA MIGRATION - Essential Tables Only
-- =====================================================
-- This replaces 80+ conflicting migrations with a clean foundation
-- Date: 2025-01-08
-- Purpose: Create minimal, production-ready database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. ORGANIZATIONS (Multi-tenant root)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}',
    widget_api_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. PROFILES (User profiles linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ORGANIZATION MEMBERS (Many-to-many relationship)
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'agent', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- 4. MAILBOXES (For organizing conversations)
-- =====================================================
CREATE TABLE IF NOT EXISTS mailboxes (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    widget_hmac_secret TEXT,
    gmail_support_email_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- =====================================================
-- 5. CONVERSATIONS (Core conversation table)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mailbox_id INTEGER REFERENCES mailboxes(id),
    
    -- Conversation properties
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'pending')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment (standardized)
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assignment_metadata JSONB DEFAULT '{}',
    assigned_at TIMESTAMPTZ,
    
    -- Customer information
    customer JSONB DEFAULT '{}',
    customer_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    customer_verified BOOLEAN DEFAULT false,
    customer_online BOOLEAN DEFAULT false,
    customer_ip INET,
    customer_browser TEXT,
    customer_os TEXT,
    customer_device_type TEXT DEFAULT 'desktop',
    
    -- AI and RAG
    rag_enabled BOOLEAN DEFAULT false,
    ai_handover_active BOOLEAN DEFAULT false,
    ai_persona TEXT DEFAULT 'friendly',
    ai_confidence_score FLOAT DEFAULT 0.0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- =====================================================
-- 6. MESSAGES (Messages within conversations)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Message content and metadata
    content TEXT NOT NULL,
    sender_id TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai_assistant', 'tool')),
    sender_name TEXT,
    sender_email TEXT,
    
    -- Message properties
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response', 'handover')),
    content_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',
    
    -- Flags
    is_internal BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    
    -- AI-related fields
    confidence_score FLOAT,
    escalation_required BOOLEAN DEFAULT false,
    ai_metadata JSONB DEFAULT '{}',
    
    -- Attachments and metadata
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. SLA TRACKING (Fixed to work without tickets table)
-- =====================================================
CREATE TABLE IF NOT EXISTS sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sla_type TEXT NOT NULL CHECK (sla_type IN ('response_time', 'resolution_time', 'first_response')),
    target_time_minutes INTEGER NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'met', 'breached', 'cancelled')),
    breach_time TIMESTAMPTZ,
    assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. TYPING INDICATORS (Real-time communication)
-- =====================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id TEXT,
    is_typing BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(visitor_id, ''))
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_widget_api_key ON organizations(widget_api_key);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Organization members
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- Mailboxes
CREATE INDEX IF NOT EXISTS idx_mailboxes_organization_id ON mailboxes(organization_id);
CREATE INDEX IF NOT EXISTS idx_mailboxes_slug ON mailboxes(organization_id, slug);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to_user_id ON conversations(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ai_handover ON conversations(ai_handover_active) WHERE ai_handover_active = true;
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_email ON conversations(customer_email);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type, sender_id);

-- SLA Tracking
CREATE INDEX IF NOT EXISTS idx_sla_tracking_org_id ON sla_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_conversation_id ON sla_tracking(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_active ON sla_tracking(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_agent_id ON sla_tracking(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_breach_time ON sla_tracking(breach_time);

-- Typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_organization_id ON typing_indicators(organization_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view organizations they're members of
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Profiles: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Organization members: Users can view members of their organizations
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Mailboxes: Organization scoped
CREATE POLICY "Users can access mailboxes in their organization" ON mailboxes
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Conversations: Organization scoped
CREATE POLICY "Users can access conversations in their organization" ON conversations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Messages: Organization scoped
CREATE POLICY "Users can access messages in their organization" ON messages
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- SLA Tracking: Organization scoped
CREATE POLICY "Users can access SLA tracking in their organization" ON sla_tracking
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Typing indicators: Organization scoped
CREATE POLICY "Users can access typing indicators in their organization" ON typing_indicators
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
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mailboxes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sla_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON typing_indicators TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON organizations TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON mailboxes TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON messages TO service_role;
GRANT ALL ON sla_tracking TO service_role;
GRANT ALL ON typing_indicators TO service_role;

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mailboxes_updated_at BEFORE UPDATE ON mailboxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_tracking_updated_at BEFORE UPDATE ON sla_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_typing_indicators_updated_at BEFORE UPDATE ON typing_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS TABLE (
    sla_id UUID,
    organization_id UUID,
    conversation_id UUID,
    sla_type TEXT,
    breach_time TIMESTAMPTZ,
    minutes_overdue INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id,
        st.organization_id,
        st.conversation_id,
        st.sla_type,
        NOW() as breach_time,
        EXTRACT(EPOCH FROM (NOW() - st.start_time)) / 60 - st.target_time_minutes as minutes_overdue
    FROM sla_tracking st
    WHERE st.status = 'active'
        AND st.start_time + (st.target_time_minutes || ' minutes')::INTERVAL < NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_sla_breaches TO authenticated;
GRANT EXECUTE ON FUNCTION check_sla_breaches TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant root table for organizations';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE organization_members IS 'Many-to-many relationship between users and organizations';
COMMENT ON TABLE mailboxes IS 'Mailboxes for organizing conversations within organizations';
COMMENT ON TABLE conversations IS 'Customer support conversations';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE sla_tracking IS 'Service Level Agreement tracking for conversations';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';

COMMENT ON COLUMN conversations.status IS 'Conversation status: open, closed, archived, pending';
COMMENT ON COLUMN messages.sender_type IS 'Type of sender: visitor, agent, system, ai_assistant, tool';
COMMENT ON COLUMN sla_tracking.sla_type IS 'Type of SLA: response_time, resolution_time, first_response';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Refresh schema cache for Supabase
NOTIFY pgrst, 'reload schema'; 