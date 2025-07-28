-- Migration: Create set_active_organization function for JWT claims injection
-- This function allows authenticated users to switch their active organization context
-- which updates their JWT claims for proper RLS policy evaluation

-- Create the function to set active organization in user's app_metadata
CREATE OR REPLACE FUNCTION set_active_organization(target_organization_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    membership_record RECORD;
    updated_metadata JSONB;
    result JSON;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Verify the user is a member of the target organization
    SELECT om.*, o.name as organization_name
    INTO membership_record
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = current_user_id 
    AND om.organization_id = target_organization_id
    AND om.status = 'active';
    
    -- Check if membership exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is not a member of the specified organization'
        );
    END IF;
    
    -- Get current user metadata
    SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO updated_metadata
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- Update the app_metadata with the new organization_id
    updated_metadata := updated_metadata || jsonb_build_object(
        'organization_id', target_organization_id,
        'organization_name', membership_record.organization_name,
        'organization_role', membership_record.role,
        'updated_at', extract(epoch from now())
    );
    
    -- Update the user's app_metadata in auth.users table
    UPDATE auth.users 
    SET 
        raw_app_meta_data = updated_metadata,
        updated_at = now()
    WHERE id = current_user_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update user metadata'
        );
    END IF;
    
    -- Return success with organization details
    RETURN json_build_object(
        'success', true,
        'organization_id', target_organization_id,
        'organization_name', membership_record.organization_name,
        'role', membership_record.role,
        'message', 'Active organization updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return a generic error message
        RAISE LOG 'Error in set_active_organization: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Internal server error'
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_active_organization(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION set_active_organization(UUID) IS 
'Securely updates a user''s active organization context in their JWT claims. 
This function verifies organization membership before updating app_metadata, 
which triggers a JWT refresh with the new organization_id claim for RLS policies.';

-- Create a helper function to get user's available organizations
CREATE OR REPLACE FUNCTION get_user_available_organizations()
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    role TEXT,
    status TEXT,
    permissions JSONB,
    is_current BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_org_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get current organization from app_metadata
    SELECT (raw_app_meta_data->>'organization_id')::UUID INTO current_org_id
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- Return all organizations the user is a member of
    RETURN QUERY
    SELECT 
        om.organization_id,
        o.name as organization_name,
        o.slug as organization_slug,
        om.role,
        om.status,
        om.permissions,
        (om.organization_id = current_org_id) as is_current
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = current_user_id
    AND om.status = 'active'
    ORDER BY is_current DESC, o.name ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_available_organizations() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_user_available_organizations() IS 
'Returns all organizations that the current user is a member of, 
including their role and whether it''s their currently active organization.';
