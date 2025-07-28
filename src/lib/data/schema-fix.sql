-- Comprehensive Database Schema and RLS Policy Fix
-- Addresses infinite recursion, permission denied, and missing column issues

-- 1. Drop existing problematic RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "organization_members_select_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_insert_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_update_policy" ON organization_members;
DROP POLICY IF EXISTS "organization_members_delete_policy" ON organization_members;

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "agents_select_policy" ON agents;
DROP POLICY IF EXISTS "agents_insert_policy" ON agents;
DROP POLICY IF EXISTS "agents_update_policy" ON agents;
DROP POLICY IF EXISTS "agents_delete_policy" ON agents;

-- 2. Ensure all required tables exist with proper structure
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'agent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mailbox_id INTEGER DEFAULT 1,
    role TEXT DEFAULT 'agent',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 3. Fix agents table - ensure organization_id column exists
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Create simple, non-recursive RLS policies

-- Organizations: Allow all authenticated users to read
CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Profiles: Users can only access their own profile
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Organization Members: Users can access memberships for their organizations
CREATE POLICY "organization_members_select_policy" ON organization_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "organization_members_insert_policy" ON organization_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "organization_members_update_policy" ON organization_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Agents: Users can access agents in their organization
CREATE POLICY "agents_select_policy" ON agents
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "agents_insert_policy" ON agents
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "agents_update_policy" ON agents
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);

-- 7. Insert default organization and agent if they don't exist
INSERT INTO organizations (id, name, slug, description)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Campfire Default Organization',
    'campfire-default',
    'Default organization for Campfire users'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO agents (id, organization_id, email, name, role, status)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'laurence@fyves.com',
    'Laurence (Agent)',
    'admin',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 8. Create function to safely get user organization
CREATE OR REPLACE FUNCTION get_user_organization_id(user_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM profiles
    WHERE user_id = user_uuid;
    
    IF org_id IS NULL THEN
        RETURN '550e8400-e29b-41d4-a716-446655440000'::UUID;
    END IF;
    
    RETURN org_id;
END;
$$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id(UUID) TO authenticated;
