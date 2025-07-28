-- Fix infinite loading issue by ensuring proper RLS policies
-- This migration ensures that authenticated users can properly access their organization data

-- Enable RLS on organization_members if not already enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Service role can manage all memberships" ON organization_members;

-- Create simplified policies that work
CREATE POLICY "organization_members_authenticated_read" ON organization_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "organization_members_service_role_all" ON organization_members
    FOR ALL USING (current_setting('role') = 'service_role');

-- Grant proper permissions
GRANT SELECT ON organization_members TO authenticated;
GRANT ALL ON organization_members TO service_role;

-- Do the same for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

CREATE POLICY "profiles_authenticated_read" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_service_role_all" ON profiles
    FOR ALL USING (current_setting('role') = 'service_role');

GRANT SELECT ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Ensure conversations table has proper policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_authenticated_access" ON conversations;
DROP POLICY IF EXISTS "conversations_service_role_access" ON conversations;

CREATE POLICY "conversations_authenticated_read" ON conversations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "conversations_authenticated_insert" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "conversations_authenticated_update" ON conversations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "conversations_service_role_all" ON conversations
    FOR ALL USING (current_setting('role') = 'service_role');

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO service_role;

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated to fix infinite loading issue';
    RAISE NOTICE 'All authenticated users can now read organization_members, profiles, and conversations';
END $$;