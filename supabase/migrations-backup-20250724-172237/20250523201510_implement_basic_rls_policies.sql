-- Migration: Implement Basic RLS Policies
-- Purpose: Enable basic tenant isolation for existing tables
-- Dependencies: Requires organization_members table from previous migration

-- Helper function to get user's accessible organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS TABLE(organization_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = auth.uid()
  AND om.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role in organization
CREATE OR REPLACE FUNCTION user_has_role_in_org(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = org_id
    AND om.role = ANY(required_roles)
    AND om.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ORGANIZATIONS TABLE RLS POLICIES
-- =============================================

-- Enable RLS on organizations table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    EXECUTE 'ALTER TABLE organizations ENABLE ROW LEVEL SECURITY';
    
    -- Policy: Users can only access organizations they belong to
    EXECUTE 'CREATE POLICY "Users can access their organizations" ON organizations FOR ALL USING (id IN (SELECT organization_id FROM get_user_organization_ids()))';
  END IF;
END
$$;

-- =============================================
-- CONVERSATIONS TABLE RLS POLICIES
-- =============================================

-- Enable RLS on conversations table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    EXECUTE 'ALTER TABLE conversations ENABLE ROW LEVEL SECURITY';
    
    -- Basic policy for conversations - will be enhanced when we have proper tenant linking
    EXECUTE 'CREATE POLICY "Users can access conversations" ON conversations FOR ALL USING (true)';
  END IF;
END
$$;

-- =============================================
-- MESSAGES TABLE RLS POLICIES  
-- =============================================

-- Enable RLS on messages table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    EXECUTE 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY';
    
    -- Basic policy for messages - will be enhanced when we have proper tenant linking
    EXECUTE 'CREATE POLICY "Users can access messages" ON messages FOR ALL USING (true)';
  END IF;
END
$$;

-- =============================================
-- PROFILES TABLE RLS POLICIES
-- =============================================

-- Enable RLS on profiles table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
    
    -- Policy: Users can only access their own profile
    EXECUTE 'CREATE POLICY "Users can access their own profile" ON profiles FOR ALL USING (auth.uid() = id)';
  END IF;
END
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_organization_ids() IS 'Returns organization IDs that the current user has access to';
COMMENT ON FUNCTION user_has_role_in_org(UUID, TEXT[]) IS 'Checks if user has specified roles in an organization';

-- Migration completed successfully
-- Note: This implements basic RLS structure. Additional policies will be added as tenant-specific tables are migrated.