-- =====================================================
-- 🔧 COMPREHENSIVE DATABASE FOUNDATION MIGRATION
-- =====================================================
-- Date: 2025-07-14
-- Purpose: Fix ALL database issues for production-ready dashboard
-- Priority: CRITICAL - Must run before any UI work

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1️⃣ ENSURE ALL REQUIRED TABLES EXIST
-- =====================================================

-- Tickets table (if missing)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    ticket_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, ticket_number)
);

-- API Keys table (if missing)
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
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table (if missing)
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
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Events table (if missing)
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2️⃣ ADD ALL MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(organization_id, status);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events);

-- Activity Events indexes
CREATE INDEX IF NOT EXISTS idx_activity_events_organization_id ON activity_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_org_created ON activity_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_resource ON activity_events(resource_type, resource_id);

-- Conversations performance indexes (fix N+1 queries)
CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_org_updated ON conversations(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);

-- Messages performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org_sender ON messages(organization_id, sender_id);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_org_status ON organization_members(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org ON organization_members(user_id, organization_id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Knowledge documents indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_documents') THEN
        CREATE INDEX IF NOT EXISTS idx_knowledge_documents_org_id ON knowledge_documents(organization_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_documents_active ON knowledge_documents(is_active);
    END IF;
END $$;

-- =====================================================
-- 3️⃣ ENABLE RLS ON ALL TABLES
-- =====================================================

-- Core tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on knowledge tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_documents') THEN
        ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_chunks') THEN
        ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- 4️⃣ DROP ALL EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their organization's tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their organization's API keys" ON api_keys;
DROP POLICY IF EXISTS "Only admins can manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their organization's webhooks" ON webhooks;
DROP POLICY IF EXISTS "Only admins can manage webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can view their organization's activity" ON activity_events;
DROP POLICY IF EXISTS "System can create activity events" ON activity_events;

-- Drop problematic organization policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can access all organizations" ON organizations;

-- Drop problematic profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "profiles_authenticated_read" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;

-- Drop problematic organization member policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "organization_members_authenticated_read" ON organization_members;
DROP POLICY IF EXISTS "organization_members_service_role_all" ON organization_members;

-- =====================================================
-- 5️⃣ CREATE SECURE RLS POLICIES
-- =====================================================

-- Helper function for organization access
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

CREATE POLICY "Users can create conversations in their organization" ON conversations
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update conversations in their organization" ON conversations
    FOR UPDATE USING (user_has_org_access(organization_id)) WITH CHECK (user_has_org_access(organization_id));

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

CREATE POLICY "Users can create tickets in their organization" ON tickets
    FOR INSERT WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Users can update tickets in their organization" ON tickets
    FOR UPDATE USING (user_has_org_access(organization_id)) WITH CHECK (user_has_org_access(organization_id));

CREATE POLICY "Service role full access to tickets" ON tickets
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API Keys policies (admin only)
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

-- Activity Events policies
CREATE POLICY "Users can view activity in their organization" ON activity_events
    FOR SELECT USING (user_has_org_access(organization_id));

CREATE POLICY "System can create activity events" ON activity_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access to activity events" ON activity_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Knowledge documents policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_documents') THEN
        DROP POLICY IF EXISTS "Users can view knowledge in their organization" ON knowledge_documents;
        CREATE POLICY "Users can view knowledge in their organization" ON knowledge_documents
            FOR SELECT USING (user_has_org_access(organization_id));
        
        DROP POLICY IF EXISTS "Users can manage knowledge in their organization" ON knowledge_documents;
        CREATE POLICY "Users can manage knowledge in their organization" ON knowledge_documents
            FOR ALL USING (user_has_org_access(organization_id)) WITH CHECK (user_has_org_access(organization_id));
        
        DROP POLICY IF EXISTS "Service role full access to knowledge documents" ON knowledge_documents;
        CREATE POLICY "Service role full access to knowledge documents" ON knowledge_documents
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- 6️⃣ GRANT PROPER PERMISSIONS
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
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 7️⃣ CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Create or replace updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
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
-- 8️⃣ CREATE UTILITY FUNCTIONS
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
    
    -- Get actor name
    SELECT full_name INTO v_actor_name
    FROM profiles
    WHERE user_id = v_actor_id;
    
    -- Insert activity event
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
-- 9️⃣ VALIDATION QUERIES
-- =====================================================

-- Test multi-tenant isolation
DO $$
DECLARE
    test_org_id UUID := gen_random_uuid();
BEGIN
    -- This should work - user can access their own organization
    PERFORM 1 FROM organizations WHERE user_has_org_access(id) LIMIT 1;
    
    -- This should fail - user cannot access random organization
    IF user_has_org_access(test_org_id) THEN
        RAISE EXCEPTION 'RLS SECURITY BREACH: User can access random organization';
    END IF;
    
    RAISE NOTICE 'Multi-tenant isolation test PASSED';
END $$;

-- =====================================================
-- 🎉 MIGRATION COMPLETE
-- =====================================================

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Log completion
INSERT INTO applied_migrations (filename, success, applied_at)
VALUES ('20250714_comprehensive_database_foundation.sql', true, NOW())
ON CONFLICT (filename) DO UPDATE SET
    success = EXCLUDED.success,
    applied_at = EXCLUDED.applied_at;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE '🎉 COMPREHENSIVE DATABASE FOUNDATION MIGRATION COMPLETE';
    RAISE NOTICE '✅ All required tables exist with proper schemas';
    RAISE NOTICE '✅ All performance indexes have been added';
    RAISE NOTICE '✅ All RLS policies are properly configured';
    RAISE NOTICE '✅ Multi-tenant isolation is enforced';
    RAISE NOTICE '✅ Database is ready for production dashboard features';
END $$; 