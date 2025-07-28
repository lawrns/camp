-- Migration: Create Organization Members Bridge Table
-- Purpose: Enable Supabase-native multi-tenant architecture with proper RLS support
-- Dependencies: Requires auth.users table from Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organization_members table to bridge users, organizations, and mailboxes
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to Supabase auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Organization identifier (maps to existing clerkOrganizationId)
  organization_id UUID NOT NULL,
  
  -- Reference to mailbox (tenant) - will add FK constraint after mailbox table exists
  mailbox_id BIGINT NOT NULL,
  
  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  permissions JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_mailbox_id ON organization_members(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_mailbox ON organization_members(user_id, mailbox_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_org_members_mailbox_role ON organization_members(mailbox_id, role);

-- Unique constraint to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_unique_membership 
ON organization_members(user_id, organization_id, mailbox_id);

-- Enable Row Level Security
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own memberships
CREATE POLICY "Users can view their own organization memberships"
ON organization_members FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Organization owners/admins can view all memberships in their organizations
CREATE POLICY "Organization admins can view organization memberships"
ON organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- RLS Policy: Organization owners/admins can insert new members
CREATE POLICY "Organization admins can invite new members"
ON organization_members FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- RLS Policy: Organization owners/admins can update memberships in their organizations
CREATE POLICY "Organization admins can update organization memberships"
ON organization_members FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- RLS Policy: Organization owners can delete memberships (except their own if they're the only owner)
CREATE POLICY "Organization owners can remove members"
ON organization_members FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
    AND status = 'active'
  )
  AND NOT (
    -- Prevent deleting the last owner
    role = 'owner' 
    AND (
      SELECT COUNT(*) 
      FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND role = 'owner' 
      AND status = 'active'
    ) = 1
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_updated_at();

-- Create function to validate role hierarchy
CREATE OR REPLACE FUNCTION validate_role_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure at least one owner exists per organization
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    IF (
      SELECT COUNT(*) 
      FROM organization_members 
      WHERE organization_id = OLD.organization_id 
      AND role = 'owner' 
      AND status = 'active'
      AND id != OLD.id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner of an organization';
    END IF;
  END IF;
  
  -- Ensure role changes maintain at least one owner
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
    IF (
      SELECT COUNT(*) 
      FROM organization_members 
      WHERE organization_id = NEW.organization_id 
      AND role = 'owner' 
      AND status = 'active'
      AND id != NEW.id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot change role of the last owner';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role hierarchy validation
CREATE TRIGGER validate_role_hierarchy_trigger
  BEFORE UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_hierarchy();

-- Create function to automatically set joined_at for new members
CREATE OR REPLACE FUNCTION set_joined_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    NEW.joined_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting joined_at
CREATE TRIGGER set_joined_at_trigger
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION set_joined_at();

-- Add comments for documentation
COMMENT ON TABLE organization_members IS 'Bridge table connecting Supabase auth.users with organizations and mailboxes for multi-tenant architecture';
COMMENT ON COLUMN organization_members.user_id IS 'Reference to Supabase auth.users table';
COMMENT ON COLUMN organization_members.organization_id IS 'Organization identifier (maps to clerkOrganizationId in mailboxes)';
COMMENT ON COLUMN organization_members.mailbox_id IS 'Reference to mailbox (tenant) - each org can have multiple mailboxes';
COMMENT ON COLUMN organization_members.role IS 'User role within the organization: owner, admin, agent, viewer';
COMMENT ON COLUMN organization_members.status IS 'Membership status: active, inactive, pending';
COMMENT ON COLUMN organization_members.permissions IS 'Additional permissions and feature flags for the user';
COMMENT ON COLUMN organization_members.last_seen_at IS 'Last time the user was active in this organization';

-- Migration completed successfully
-- Next steps: 
-- 1. Migrate existing data from mailboxes.clerkOrganizationId
-- 2. Update application code to use organization_members for authorization
-- 3. Implement RLS policies on all tenant-scoped tables 