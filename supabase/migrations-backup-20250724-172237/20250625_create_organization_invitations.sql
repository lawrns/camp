-- Create organization_invitations table for team member invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires_at ON organization_invitations(expires_at);

-- Enable RLS
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invitations for their organizations" ON organization_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations" ON organization_invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role can access all invitations" ON organization_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organization_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$;

-- Create a scheduled job to run the expiration function (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('expire-invitations', '0 * * * *', 'SELECT expire_old_invitations();');
