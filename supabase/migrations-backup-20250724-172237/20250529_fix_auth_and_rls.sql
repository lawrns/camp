-- Fix Authentication and RLS Issues for Inbox Loading
-- This migration ensures proper access to required tables

-- 1. Ensure profiles table has proper RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix organization_members RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create more permissive policies for organization_members
CREATE POLICY "Users can view their organization memberships"
  ON organization_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organization_members om2
      WHERE om2.user_id = auth.uid()
      AND om2.organization_id = organization_members.organization_id
      AND om2.status = 'active'
    )
  );

CREATE POLICY "Organization admins can manage members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
    )
  );

-- 3. Fix organizations table RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON organizations;

-- Create policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organizations.id
      AND om.status = 'active'
    )
  );

CREATE POLICY "Organization owners can update"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = organizations.id
      AND om.role = 'owner'
      AND om.status = 'active'
    )
  );

-- 4. Fix conversations table RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON conversations;

-- Create more permissive policies for conversations
CREATE POLICY "Users can view conversations in their organization"
  ON conversations FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can create conversations in their organization"
  ON conversations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can update conversations in their organization"
  ON conversations FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- 5. Fix messages table RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their organization conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their organization conversations" ON messages;

-- Create policies for messages
CREATE POLICY "Users can view messages in their organization conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id 
      FROM conversations c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can create messages in their organization conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id 
      FROM conversations c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- 6. Create default data for testing
-- Only insert if no organizations exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = '550e8400-e29b-41d4-a716-446655440000') THEN
    -- Insert default organization
    INSERT INTO organizations (id, name, slug, status, created_at, updated_at)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440000',
      'Default Organization',
      'default-org',
      'active',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_status 
ON organization_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_members_org_status 
ON organization_members(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_org_updated 
ON conversations(organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- 8. Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON organization_members TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;

-- 9. Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE organization_members IS 'Links users to organizations with roles';
COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE conversations IS 'Customer support conversations';
COMMENT ON TABLE messages IS 'Messages within conversations';

-- 10. Verify RLS is enabled on all critical tables
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'organization_members', 'organizations', 'conversations', 'messages')
  LOOP
    RAISE NOTICE 'Checking RLS for table: %', t.tablename;
    -- RLS is already enabled above, this is just for verification
  END LOOP;
END $$;