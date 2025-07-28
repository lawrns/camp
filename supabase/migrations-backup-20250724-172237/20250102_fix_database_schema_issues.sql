-- Fix Database Schema Issues
-- This migration addresses missing tables and RLS issues causing 404 errors

-- 1. Create organization_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  real_time_typing_enabled BOOLEAN DEFAULT true,
  auto_assign_enabled BOOLEAN DEFAULT false,
  rag_enabled BOOLEAN DEFAULT true,
  ai_handover_enabled BOOLEAN DEFAULT true,
  widget_enabled BOOLEAN DEFAULT true,
  notification_settings JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 2. Create indexes for organization_settings
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(organization_id);

-- 3. Enable RLS on organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for organization_settings
DROP POLICY IF EXISTS "Users can view organization settings" ON organization_settings;
CREATE POLICY "Users can view organization settings"
  ON organization_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update organization settings" ON organization_settings;
CREATE POLICY "Users can update organization settings"
  ON organization_settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner') 
      AND status = 'active'
    )
  );

-- 5. Insert default settings for existing organizations
INSERT INTO organization_settings (organization_id, real_time_typing_enabled, auto_assign_enabled, rag_enabled)
SELECT id, true, false, true
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_settings)
ON CONFLICT (organization_id) DO NOTHING;

-- 6. Fix users table access by ensuring proper RLS policies
-- The auth.users table should be accessible through proper policies

-- 7. Create a safe function to check if user exists
CREATE OR REPLACE FUNCTION user_exists(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT ALL ON organization_settings TO authenticated;
GRANT SELECT ON organization_settings TO anon;
GRANT EXECUTE ON FUNCTION user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_exists(UUID) TO anon;

-- 9. Create helper function for organization settings
CREATE OR REPLACE FUNCTION get_organization_settings(org_id UUID)
RETURNS organization_settings AS $$
DECLARE
  settings organization_settings;
BEGIN
  SELECT * INTO settings
  FROM organization_settings
  WHERE organization_id = org_id;
  
  -- If no settings exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO organization_settings (organization_id, real_time_typing_enabled, auto_assign_enabled, rag_enabled)
    VALUES (org_id, true, false, true)
    RETURNING * INTO settings;
  END IF;
  
  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION get_organization_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_settings(UUID) TO anon;

-- 11. Add helpful comments
COMMENT ON TABLE organization_settings IS 'Stores configuration settings for each organization';
COMMENT ON FUNCTION get_organization_settings(UUID) IS 'Safely retrieves organization settings, creating defaults if needed';
COMMENT ON FUNCTION user_exists(UUID) IS 'Safely checks if a user exists in auth.users table';

-- 12. Log completion
DO $$
BEGIN
  RAISE NOTICE 'Database schema fixes applied successfully';
  RAISE NOTICE 'Created organization_settings table with RLS policies';
  RAISE NOTICE 'Added helper functions for safe data access';
END $$;
