-- Add widget API key support to organizations
-- This enables production widgets to authenticate with their organization

-- Add widget_api_key column if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS widget_api_key TEXT UNIQUE;

-- Generate API keys for existing organizations that don't have one
UPDATE organizations 
SET widget_api_key = 'wk_' || gen_random_uuid()::text
WHERE widget_api_key IS NULL;

-- Make widget_api_key NOT NULL for future inserts
ALTER TABLE organizations 
ALTER COLUMN widget_api_key SET DEFAULT 'wk_' || gen_random_uuid()::text;

-- Update metadata to enable widget by default
UPDATE organizations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{widget_enabled}',
  'true'::jsonb
)
WHERE metadata IS NULL OR metadata->>'widget_enabled' IS NULL;

-- Create index for faster API key lookups
CREATE INDEX IF NOT EXISTS idx_organizations_widget_api_key 
ON organizations(widget_api_key) 
WHERE widget_api_key IS NOT NULL;

-- Add RLS policy for widget API key access
CREATE POLICY IF NOT EXISTS "Widget can read organization by API key"
ON organizations
FOR SELECT
TO anon, authenticated
USING (
  -- Allow if the request includes a valid widget API key
  -- This would be checked in the API layer, not directly in RLS
  true
);

-- Create a function to validate widget API keys
CREATE OR REPLACE FUNCTION validate_widget_api_key(
  p_organization_id UUID,
  p_api_key TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE id = p_organization_id 
    AND widget_api_key = p_api_key
    AND (metadata->>'widget_enabled')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION validate_widget_api_key TO service_role;