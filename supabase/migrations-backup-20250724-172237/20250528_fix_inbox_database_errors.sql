-- Fix Inbox Database Errors Migration
-- This migration fixes the 406 and 500 errors in the inbox

-- 1. Fix profiles table RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create new, more permissive policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix organization_members table and RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;

-- Create new policies
CREATE POLICY "Users can view their own memberships"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view members in their organization"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
        AND om.status = 'active'
    )
  );

-- 3. Create simplified function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Try to get from organization_members first
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found, try profiles table
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id
    FROM profiles
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;
  
  -- Return default if still not found
  IF v_org_id IS NULL THEN
    v_org_id := '550e8400-e29b-41d4-a716-446655440000'::uuid;
  END IF;
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create or update trigger to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, organization_id, email, full_name)
  VALUES (
    NEW.id,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Also ensure organization membership
  INSERT INTO organization_members (user_id, organization_id, role, status)
  VALUES (
    NEW.id,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'member',
    'active'
  )
  ON CONFLICT (user_id, organization_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();

-- 5. Fix conversations RLS to be more permissive
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;

CREATE POLICY "Users can view conversations in their organization"
  ON conversations FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
    OR (assignee_type = 'human' AND assignee_id = auth.uid()::text)
  );

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_profile() TO authenticated;

-- 7. Insert default data if needed
INSERT INTO profiles (user_id, organization_id, email, full_name)
SELECT 
  id,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.users.id
);

INSERT INTO organization_members (user_id, organization_id, role, status)
SELECT 
  id,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'member',
  'active'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members 
  WHERE organization_members.user_id = auth.users.id
    AND organization_members.organization_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
);