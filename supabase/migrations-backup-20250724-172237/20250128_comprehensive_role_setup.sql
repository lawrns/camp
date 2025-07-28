-- Comprehensive Database Setup Migration
-- This migration sets up all user roles, organizations, and proper data

-- 1. First, ensure we have a platform organization
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Default Organization', 'default-organization', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'Campfire Platform', 'campfire-platform', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    updated_at = NOW();

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "allow_all_conversations" ON conversations;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles access" ON profiles;
DROP POLICY IF EXISTS "Organization members access" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can invite new members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can remove members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON conversations;

-- 3. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 4. Create helper functions
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  -- Check if user is platform admin (in platform organization)
  SELECT om.role INTO v_role
  FROM organization_members om
  WHERE om.user_id = p_user_id
    AND om.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND om.status = 'active';

  IF v_role IS NOT NULL THEN
    RETURN 'platform_' || v_role;
  END IF;

  -- Otherwise get regular role
  SELECT om.role INTO v_role
  FROM organization_members om
  WHERE om.user_id = p_user_id
    AND om.status = 'active'
  LIMIT 1;

  RETURN COALESCE(v_role, 'visitor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = p_user_id
      AND om.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND om.role IN ('admin', 'owner')
      AND om.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id uuid)
RETURNS SETOF uuid AS $$
BEGIN
  -- Platform admins can see all organizations
  IF is_platform_admin(p_user_id) THEN
    RETURN QUERY SELECT id FROM organizations;
  ELSE
    -- Regular users see their organizations
    RETURN QUERY
    SELECT DISTINCT organization_id
    FROM organization_members
    WHERE user_id = p_user_id
      AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create profiles policies with role hierarchy
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in their organizations"
  ON profiles FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Platform admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their organization"
  ON profiles FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
        AND status = 'active'
    )
  );

-- 6. Create organization_members policies
CREATE POLICY "Users can view their own memberships"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Admins can manage members in their organization"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members om2
      WHERE om2.user_id = auth.uid()
        AND om2.role IN ('admin', 'owner')
        AND om2.status = 'active'
    )
  );

-- 7. Create conversations policies with proper access control
CREATE POLICY "Visitors can view their own conversations"
  ON conversations FOR SELECT
  USING (
    -- Check if conversation has this visitor's email/ID in customer data
    (customer_email = (SELECT email FROM profiles WHERE user_id = auth.uid()))
    OR (visitor_id = auth.uid()::text)
  );

CREATE POLICY "Agents can view conversations in their organizations"
  ON conversations FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
    OR (assignee_type = 'human' AND assignee_id::uuid = auth.uid())
  );

CREATE POLICY "Agents can create conversations in their organizations"
  ON conversations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('agent', 'admin', 'owner')
        AND status = 'active'
    )
  );

CREATE POLICY "Agents can update assigned conversations"
  ON conversations FOR UPDATE
  USING (
    (assignee_type = 'human' AND assignee_id::uuid = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('agent', 'admin', 'owner')
        AND status = 'active'
    )
  );

-- 8. Create organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT get_user_organizations(auth.uid()))
  );

CREATE POLICY "Owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- 9. Create trigger to ensure profile exists with proper defaults
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_role text;
BEGIN
  -- Determine organization and role from metadata
  v_org_id := COALESCE(
    (NEW.raw_user_meta_data->>'organization_id')::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid
  );

  -- Set role based on metadata or default to agent
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
    WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
    ELSE 'agent'
  END;

  -- Create profile (without role column)
  INSERT INTO profiles (id, user_id, organization_id, email, full_name)
  VALUES (
    uuid_generate_v4(),
    NEW.id,
    v_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Create organization membership (role is stored here)
  INSERT INTO organization_members (user_id, organization_id, role, status)
  VALUES (
    NEW.id,
    v_org_id,
    v_role,
    'active'
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 11. Create some test data for development
DO $$
BEGIN
  -- Only insert test data if we're in development
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Organization') THEN
    -- Create test organization
    INSERT INTO organizations (id, name, slug)
    VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'Test Organization', 'test-organization');

    -- Create test mailbox if mailboxes table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mailboxes') THEN
      INSERT INTO mailboxes (organization_id, name, email_address)
      VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'Support', 'support@test.com')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- 12. Ensure existing users have proper profiles
INSERT INTO profiles (id, user_id, organization_id, email, full_name)
SELECT
  uuid_generate_v4(),
  au.id,
  COALESCE(p.organization_id, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', p.full_name, 'User')
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 13. Ensure organization memberships exist for all users
INSERT INTO organization_members (user_id, organization_id, role, status)
SELECT
  p.user_id,
  p.organization_id,
  'agent', -- Default role
  'active'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = p.user_id
    AND om.organization_id = p.organization_id
)
ON CONFLICT DO NOTHING;

-- 14. Add comments for documentation
COMMENT ON FUNCTION get_user_role(uuid) IS 'Returns the user role, with platform_ prefix for platform admins';
COMMENT ON FUNCTION is_platform_admin(uuid) IS 'Checks if user is a platform administrator';
COMMENT ON FUNCTION get_user_organizations(uuid) IS 'Returns all organizations a user can access';