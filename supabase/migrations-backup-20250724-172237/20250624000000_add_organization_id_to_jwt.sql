-- Migration: Add organization_id to JWT claims
-- This fixes the root cause of realtime authentication failures

-- Create function to add organization_id to JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  org_id uuid;
BEGIN
  -- Extract the claims from the event
  claims := event->'claims';
  
  -- Get the user ID from the event
  user_id := (event->'user_id')::uuid;
  
  -- Look up the user's organization_id from organization_members table
  SELECT organization_id INTO org_id
  FROM organization_members
  WHERE user_id = user_id
  LIMIT 1;
  
  -- If organization found, add it to claims
  IF org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(org_id::text));
  END IF;
  
  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id 
ON organization_members(user_id);

-- Record this migration
INSERT INTO applied_migrations (filename, success, applied_at)
VALUES ('20250624000000_add_organization_id_to_jwt.sql', true, NOW())
ON CONFLICT (filename) DO UPDATE SET
  success = EXCLUDED.success,
  applied_at = EXCLUDED.applied_at;
