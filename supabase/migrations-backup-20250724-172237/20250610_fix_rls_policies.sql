-- Fix RLS policies to allow service role access
-- This migration creates development-friendly RLS policies

-- 1. Create permissive policies for development
-- Allow service role to access profiles table
DROP POLICY IF EXISTS "Service role can access all profiles" ON profiles;
CREATE POLICY "Service role can access all profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix organization_members policies
DROP POLICY IF EXISTS "Service role can access all organization_members" ON organization_members;
CREATE POLICY "Service role can access all organization_members"
  ON organization_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own memberships
DROP POLICY IF EXISTS "Users can read own memberships" ON organization_members;
CREATE POLICY "Users can read own memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Fix organizations policies
DROP POLICY IF EXISTS "Service role can access all organizations" ON organizations;
CREATE POLICY "Service role can access all organizations"
  ON organizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read organizations they belong to
DROP POLICY IF EXISTS "Users can read their organizations" ON organizations;
CREATE POLICY "Users can read their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 4. Grant necessary permissions to service_role
GRANT ALL ON profiles TO service_role;
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON organizations TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON messages TO service_role;
GRANT ALL ON mailboxes TO service_role;
GRANT ALL ON ai_processing_logs TO service_role;

-- 5. Grant read permissions to authenticated users
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON organization_members TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON conversations TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON mailboxes TO authenticated;

-- 6. For development: temporarily allow anon to read profiles (remove in production)
GRANT SELECT ON profiles TO anon;

-- 7. Refresh schema cache
NOTIFY pgrst, 'reload schema';
