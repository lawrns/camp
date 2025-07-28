-- Critical RLS Security Fix Migration
-- P0-T4: Ensure no table uses USING(true) for security
-- This migration hardens Row Level Security across all tables

-- ===== PHASE 1: DROP INSECURE POLICIES =====

-- Remove any policies that use USING(true) - these are security risks
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop all policies with USING(true) 
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual = 'true'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Dropped insecure policy %.% on %.%', 
                     policy_record.schemaname, policy_record.policyname,
                     policy_record.schemaname, policy_record.tablename;
    END LOOP;
END $$;

-- ===== PHASE 2: SECURE ORGANIZATION-SCOPED POLICIES =====

-- Organizations table - owners and members can access their org
DROP POLICY IF EXISTS "organizations_policy" ON organizations;
CREATE POLICY "organizations_policy" ON organizations
    FOR ALL TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
            AND role IN ('owner', 'admin')
        )
    );

-- Profiles table - users can only access their own profile
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
CREATE POLICY "profiles_policy" ON profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Organization members table - users can see members of their org
DROP POLICY IF EXISTS "organization_members_policy" ON organization_members;
CREATE POLICY "organization_members_policy" ON organization_members
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members AS om 
            WHERE om.user_id = auth.uid() 
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members AS om 
            WHERE om.user_id = auth.uid() 
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Conversations table - scoped to organization
DROP POLICY IF EXISTS "conversations_policy" ON conversations;
CREATE POLICY "conversations_policy" ON conversations
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Messages table - scoped to organization via conversation
DROP POLICY IF EXISTS "messages_policy" ON messages;
CREATE POLICY "messages_policy" ON messages
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Agents table - scoped to organization
DROP POLICY IF EXISTS "agents_policy" ON agents;
CREATE POLICY "agents_policy" ON agents
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Knowledge base tables - scoped to organization
DROP POLICY IF EXISTS "knowledge_documents_policy" ON knowledge_documents;
CREATE POLICY "knowledge_documents_policy" ON knowledge_documents
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Customers table - scoped to organization
DROP POLICY IF EXISTS "customers_policy" ON customers;
CREATE POLICY "customers_policy" ON customers
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- ===== PHASE 3: ENABLE RLS ON ALL TABLES =====

-- Ensure RLS is enabled on all critical tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on knowledge base tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_documents') THEN
        ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_chunks') THEN
        ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===== PHASE 4: VALIDATION =====

-- Create a function to validate no insecure policies exist
CREATE OR REPLACE FUNCTION validate_rls_security() 
RETURNS TABLE(table_name text, policy_name text, is_secure boolean) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (schemaname || '.' || tablename)::text as table_name,
        policyname::text as policy_name,
        (qual != 'true')::boolean as is_secure
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_rls_security() TO authenticated;

-- Run validation and log results
DO $$
DECLARE
    validation_record RECORD;
    insecure_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'RLS Security Validation Results:';
    RAISE NOTICE '=====================================';
    
    FOR validation_record IN SELECT * FROM validate_rls_security() LOOP
        IF NOT validation_record.is_secure THEN
            RAISE WARNING 'INSECURE POLICY: % on table %', 
                         validation_record.policy_name, 
                         validation_record.table_name;
            insecure_count := insecure_count + 1;
        ELSE
            RAISE NOTICE 'SECURE: % on %', 
                        validation_record.policy_name, 
                        validation_record.table_name;
        END IF;
    END LOOP;
    
    IF insecure_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All RLS policies are secure!';
    ELSE
        RAISE WARNING 'SECURITY ISSUE: Found % insecure policies', insecure_count;
    END IF;
END;
$$;

-- ===== PHASE 5: PERFORMANCE OPTIMIZATION =====

-- Create indexes to support RLS policies efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user_org_status 
    ON organization_members(user_id, organization_id, status) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_organization_id 
    ON conversations(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_organization_id 
    ON messages(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_organization_id 
    ON agents(organization_id);

-- ===== COMPLETION MESSAGE =====

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RLS Security Hardening Migration Complete!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'All tables now use secure RLS policies';
    RAISE NOTICE 'No USING(true) policies remain';
    RAISE NOTICE 'Performance indexes have been added';
END;
$$; 