-- Setup test data for E2E tests
-- This ensures the test user jam@jam.com has proper organization access

-- Insert default organization if it doesn't exist
INSERT INTO organizations (id, name, slug, description, email, settings)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Campfire Test Organization',
    'test-org',
    'Default organization for testing',
    'test@campfire.com',
    '{}'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Function to setup test user profile and organization membership
CREATE OR REPLACE FUNCTION setup_test_user(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Insert or update profile
    INSERT INTO profiles (id, user_id, email, full_name, organization_id, metadata)
    VALUES (
        gen_random_uuid(),
        user_uuid,
        user_email,
        'Test User',
        org_id,
        '{"test_user": true}'
    ) ON CONFLICT (user_id) DO UPDATE SET
        organization_id = org_id,
        full_name = COALESCE(profiles.full_name, 'Test User'),
        updated_at = NOW();
    
    -- Insert or update organization membership
    INSERT INTO organization_members (organization_id, user_id, role, status)
    VALUES (org_id, user_uuid, 'admin', 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        updated_at = NOW();
    
    -- Update user metadata to include organization_id
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || jsonb_build_object('organization_id', org_id::text)
    WHERE id = user_uuid;
    
    RETURN user_uuid;
END;
$$;

-- Setup the test user jam@jam.com
-- Note: This will only work if the user already exists in auth.users
-- The user should be created through the normal signup process first

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION setup_test_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_test_user(TEXT) TO anon;

-- Create a simpler function that can be called from the application
CREATE OR REPLACE FUNCTION ensure_user_has_organization()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID := auth.uid();
    org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    user_email TEXT;
BEGIN
    IF user_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    -- Insert or update profile
    INSERT INTO profiles (id, user_id, email, full_name, organization_id, metadata)
    VALUES (
        gen_random_uuid(),
        user_uuid,
        user_email,
        'User',
        org_id,
        '{}'
    ) ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(profiles.organization_id, org_id),
        updated_at = NOW();
    
    -- Insert or update organization membership
    INSERT INTO organization_members (organization_id, user_id, role, status)
    VALUES (org_id, user_uuid, 'member', 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        status = 'active',
        updated_at = NOW();
    
    -- Update user metadata to include organization_id
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || jsonb_build_object('organization_id', org_id::text)
    WHERE id = user_uuid;
    
    RETURN org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_user_has_organization() TO authenticated;