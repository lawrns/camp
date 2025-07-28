-- Add organization_id to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Update existing profiles with default organization
UPDATE profiles 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Ensure organization_members table has proper columns
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS mailbox_id INTEGER,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);