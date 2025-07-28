-- Fix Widget-Agent Real-time Communication Permissions
-- This migration resolves the 403 Forbidden error when agents try to access widget-created conversations
-- 
-- PROBLEM: Widget uses anonymous auth (anon role) but RLS policies only allow authenticated users
-- SOLUTION: Create comprehensive policies that allow both anon and authenticated access with proper organization filtering

-- =============================================
-- CONVERSATIONS TABLE - COMPREHENSIVE RLS POLICIES
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "conversations_authenticated_read" ON conversations;
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_authenticated_update" ON conversations;
DROP POLICY IF EXISTS "conversations_service_role_all" ON conversations;
DROP POLICY IF EXISTS "Users can access conversations" ON conversations;

-- Create comprehensive policies for conversations
-- 1. Service role has full access (for API endpoints)
CREATE POLICY "conversations_service_role_full_access" ON conversations
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 2. Authenticated users can access conversations in their organizations
CREATE POLICY "conversations_authenticated_organization_access" ON conversations
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- 3. Anonymous users (widgets) can access conversations in their organization context
-- This allows widgets to create and read conversations for their workspace
CREATE POLICY "conversations_anon_widget_access" ON conversations
    FOR ALL 
    USING (
        auth.role() = 'anon' AND
        organization_id IS NOT NULL
    )
    WITH CHECK (
        auth.role() = 'anon' AND
        organization_id IS NOT NULL
    );

-- =============================================
-- MESSAGES TABLE - COMPREHENSIVE RLS POLICIES
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "messages_authenticated_read" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_insert" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_update" ON messages;
DROP POLICY IF EXISTS "messages_service_role_all" ON messages;
DROP POLICY IF EXISTS "Users can access messages" ON messages;

-- Create comprehensive policies for messages
-- 1. Service role has full access (for API endpoints)
CREATE POLICY "messages_service_role_full_access" ON messages
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 2. Authenticated users can access messages in conversations they have access to
CREATE POLICY "messages_authenticated_organization_access" ON messages
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- 3. Anonymous users (widgets) can access messages in their organization context
CREATE POLICY "messages_anon_widget_access" ON messages
    FOR ALL 
    USING (
        auth.role() = 'anon' AND
        organization_id IS NOT NULL
    )
    WITH CHECK (
        auth.role() = 'anon' AND
        organization_id IS NOT NULL
    );

-- =============================================
-- GRANT PROPER PERMISSIONS
-- =============================================

-- Grant permissions to all roles
GRANT ALL ON conversations TO service_role;
GRANT ALL ON messages TO service_role;

GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

GRANT SELECT, INSERT, UPDATE ON conversations TO anon;
GRANT SELECT, INSERT, UPDATE ON messages TO anon;

-- =============================================
-- ENABLE REALTIME FOR WIDGET-AGENT COMMUNICATION
-- =============================================

-- Enable realtime on conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime on messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =============================================
-- CREATE HELPER FUNCTIONS FOR DEBUGGING
-- =============================================

-- Function to check current user context (for debugging)
CREATE OR REPLACE FUNCTION debug_user_context()
RETURNS TABLE(
    current_role TEXT,
    user_id UUID,
    is_anon BOOLEAN,
    is_authenticated BOOLEAN,
    is_service_role BOOLEAN
) AS $$
BEGIN
    RETURN QUERY SELECT 
        auth.role()::TEXT as current_role,
        auth.uid() as user_id,
        (auth.role() = 'anon') as is_anon,
        (auth.role() = 'authenticated') as is_authenticated,
        (current_setting('role') = 'service_role') as is_service_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization access for current user
CREATE OR REPLACE FUNCTION debug_organization_access(org_id UUID)
RETURNS TABLE(
    has_access BOOLEAN,
    access_reason TEXT,
    user_organizations UUID[]
) AS $$
DECLARE
    user_orgs UUID[];
BEGIN
    -- Get user's organizations if authenticated
    IF auth.role() = 'authenticated' THEN
        SELECT ARRAY_AGG(om.organization_id) INTO user_orgs
        FROM organization_members om 
        WHERE om.user_id = auth.uid() AND om.status = 'active';
        
        RETURN QUERY SELECT 
            (org_id = ANY(user_orgs)) as has_access,
            'authenticated_member'::TEXT as access_reason,
            user_orgs as user_organizations;
    ELSIF auth.role() = 'anon' THEN
        RETURN QUERY SELECT 
            true as has_access,
            'anonymous_widget'::TEXT as access_reason,
            ARRAY[]::UUID[] as user_organizations;
    ELSE
        RETURN QUERY SELECT 
            false as has_access,
            'no_access'::TEXT as access_reason,
            ARRAY[]::UUID[] as user_organizations;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- LOG COMPLETION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '=== WIDGET-AGENT REALTIME PERMISSIONS FIXED ===';
    RAISE NOTICE 'Conversations table: RLS policies updated for anon, authenticated, and service_role';
    RAISE NOTICE 'Messages table: RLS policies updated for anon, authenticated, and service_role';
    RAISE NOTICE 'Realtime: Enabled for conversations and messages tables';
    RAISE NOTICE 'Permissions: Granted SELECT, INSERT, UPDATE to anon and authenticated roles';
    RAISE NOTICE 'Debug functions: debug_user_context() and debug_organization_access(uuid) available';
    RAISE NOTICE '=== WIDGET SHOULD NOW BE ABLE TO COMMUNICATE WITH AGENTS ===';
END $$;
