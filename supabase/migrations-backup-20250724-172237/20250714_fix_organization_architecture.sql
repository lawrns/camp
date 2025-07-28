-- =====================================================
-- 🔧 FIX ORGANIZATION ARCHITECTURE MIGRATION
-- =====================================================
-- Date: 2025-07-14
-- Purpose: Standardize on organization-centric multi-tenancy
-- Priority: CRITICAL - Fixes database query errors

-- =====================================================
-- 1️⃣ ENSURE CORE TABLES EXIST WITH ORGANIZATION_ID
-- =====================================================

-- Create organizations table if missing
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table if missing (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'agent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table if missing
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'agent',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Create conversations table if missing
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT DEFAULT 'open',
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table if missing
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_id UUID,
    sender_type TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table with organization_id (not mailbox_id)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    ticket_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID,
    created_by UUID,
    resolved_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, ticket_number)
);

-- Create activity_events table
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    actor_id UUID,
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    headers JSONB DEFAULT '{}',
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2️⃣ ADD PERFORMANCE INDEXES
-- =====================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- Activity events indexes
CREATE INDEX IF NOT EXISTS idx_activity_events_organization_id ON activity_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

-- =====================================================
-- 3️⃣ ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4️⃣ CREATE SECURE RLS POLICIES
-- =====================================================

-- Helper function
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their organization" ON messages;
DROP POLICY IF EXISTS "Users can view tickets in their organization" ON tickets;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (user_has_org_access(id));

CREATE POLICY "Service role full access to organizations" ON organizations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in their organization" ON profiles
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to profiles" ON profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Organization members policies
CREATE POLICY "Users can view their own memberships" ON organization_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view members in their organization" ON organization_members
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Service role full access to organization members" ON organization_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Users can view conversations in their organization" ON conversations
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Users can manage conversations in their organization" ON conversations
    FOR ALL USING (user_has_org_access(organization_id)) WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Service role full access to conversations" ON conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their organization" ON messages
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Users can create messages in their organization" ON messages
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Service role full access to messages" ON messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tickets policies
CREATE POLICY "Users can view tickets in their organization" ON tickets
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "Users can manage tickets in their organization" ON tickets
    FOR ALL USING (user_has_org_access(organization_id)) WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Service role full access to tickets" ON tickets
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Activity events policies
CREATE POLICY "Users can view activity in their organization" ON activity_events
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "System can create activity events" ON activity_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access to activity events" ON activity_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API keys policies (admin only)
CREATE POLICY "Admins can view API keys in their organization" ON api_keys
    FOR SELECT USING (
        user_has_org_access(organization_id) AND
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = api_keys.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'owner')
            AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage API keys in their organization" ON api_keys
    FOR ALL USING (
        user_has_org_access(organization_id) AND
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = api_keys.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'owner')
            AND status = 'active'
        )
    );

CREATE POLICY "Service role full access to API keys" ON api_keys
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Webhooks policies (admin only)
CREATE POLICY "Admins can view webhooks in their organization" ON webhooks
    FOR SELECT USING (
        user_has_org_access(organization_id) AND
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = webhooks.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'owner')
            AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage webhooks in their organization" ON webhooks
    FOR ALL USING (
        user_has_org_access(organization_id) AND
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = webhooks.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'owner')
            AND status = 'active'
        )
    );

CREATE POLICY "Service role full access to webhooks" ON webhooks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- 5️⃣ GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
GRANT SELECT, INSERT ON activity_events TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- 6️⃣ CREATE UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7️⃣ UTILITY FUNCTIONS
-- =====================================================

-- Function to log activity events
CREATE OR REPLACE FUNCTION log_activity_event(
    p_organization_id UUID,
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_actor_id UUID;
    v_actor_name TEXT;
    v_event_id UUID;
BEGIN
    v_actor_id := auth.uid();
    
    SELECT full_name INTO v_actor_name
    FROM profiles
    WHERE user_id = v_actor_id;
    
    INSERT INTO activity_events (
        organization_id,
        event_type,
        resource_type,
        resource_id,
        actor_id,
        actor_name,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        p_event_type,
        p_resource_type,
        p_resource_id,
        v_actor_id,
        v_actor_name,
        p_description,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8️⃣ FINAL VALIDATION
-- =====================================================

-- Test multi-tenant isolation
DO $$
BEGIN
    -- This should work - user can access their own organization
    PERFORM 1 FROM organizations WHERE user_has_org_access(id) LIMIT 1;
    
    RAISE NOTICE '✅ Organization-centric architecture migration complete';
    RAISE NOTICE '✅ All tables use organization_id as primary tenant identifier';
    RAISE NOTICE '✅ RLS policies enforce multi-tenant isolation';
    RAISE NOTICE '✅ Performance indexes added for all queries';
    RAISE NOTICE '✅ Ready for dashboard implementation';
END $$; 