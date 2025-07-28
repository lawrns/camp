-- Fix inbox errors: profiles, organization_members, and realtime issues
-- This migration fixes the 406 and 500 errors in the inbox

-- 1. Fix profiles table structure and RLS
-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID,
  role TEXT DEFAULT 'agent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create new comprehensive policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" ON profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypass (for API operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 2. Fix organization_members table and RLS
-- Ensure the table exists (should already exist from previous migrations)
DO $$
BEGIN
  -- Check if organization_members exists and has correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
  ) THEN
    RAISE EXCEPTION 'organization_members table does not exist. Run previous migrations first.';
  END IF;
END
$$;

-- Fix RLS policies for organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can invite new members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Organization owners can remove members" ON organization_members;
DROP POLICY IF EXISTS "Service role can manage all memberships" ON organization_members;

-- Recreate policies with proper permissions
-- Users can always see their own memberships
CREATE POLICY "Users can view their own memberships" ON organization_members
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see other members in their organizations
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Service role bypass
CREATE POLICY "Service role can manage all memberships" ON organization_members
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 3. Ensure default data exists
-- Insert default organization if not exists
INSERT INTO organizations (id, name, slug, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Campfire Default Organization',
  'campfire-default',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, email, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    '550e8400-e29b-41d4-a716-446655440000' -- Default organization
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Add user to default organization
  INSERT INTO public.organization_members (
    user_id,
    organization_id,
    mailbox_id,
    role,
    status,
    joined_at
  ) VALUES (
    NEW.id,
    '550e8400-e29b-41d4-a716-446655440000',
    1, -- Default mailbox
    'agent',
    'active',
    NOW()
  ) ON CONFLICT (user_id, organization_id, mailbox_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix typing indicators table for realtime
-- Ensure typing_indicators table is properly configured
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Service role bypass" ON typing_indicators;

-- Allow viewing typing indicators in conversations user has access to
CREATE POLICY "View typing indicators" ON typing_indicators
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
      )
    )
  );

-- Users can insert/update/delete their own typing indicators
CREATE POLICY "Manage own typing indicators" ON typing_indicators
  FOR ALL USING (
    user_id = auth.uid() OR 
    auth.jwt()->>'role' = 'service_role'
  );

-- 5. Fix message delivery status table
ALTER TABLE message_delivery_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view delivery status in their conversations" ON message_delivery_status;
DROP POLICY IF EXISTS "Users can manage their own delivery status" ON message_delivery_status;

CREATE POLICY "View delivery status" ON message_delivery_status
  FOR SELECT USING (
    message_id IN (
      SELECT cm.id FROM conversation_messages cm
      JOIN conversations c ON c.id = cm.conversation_id
      WHERE c.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
      )
    )
  );

CREATE POLICY "Manage delivery status" ON message_delivery_status
  FOR ALL USING (
    user_id = auth.uid() OR 
    auth.jwt()->>'role' = 'service_role'
  );

-- 6. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON message_delivery_status TO authenticated;

-- Also grant to anon for widget support
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON organization_members TO anon;
GRANT ALL ON typing_indicators TO anon;
GRANT ALL ON message_delivery_status TO anon;

-- 7. Create helper function to check user access
CREATE OR REPLACE FUNCTION user_has_access_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Refresh the realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS conversations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS conversation_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS typing_indicators;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS message_delivery_status;

-- Re-add with proper configuration
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE message_delivery_status;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Inbox error fixes applied successfully';
END
$$;