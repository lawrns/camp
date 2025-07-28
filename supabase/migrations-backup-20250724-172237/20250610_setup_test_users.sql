-- Setup Test Users for Authentication Testing
-- This migration creates/verifies test users for end-to-end validation

-- 1. Ensure organizations exist
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd'::uuid, 'Jam Test Organization', 'jam-test-org', NOW(), NOW()),
    ('0690e12c-9aaf-4c12-9c2a-8bfa8f14db16'::uuid, 'Ultimate Widget Test Org', 'ultimate-widget-test', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    updated_at = NOW();

-- 2. Create/verify jam@jam.com profile
INSERT INTO profiles (id, user_id, email, full_name, organization_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::uuid,
    'jam@jam.com',
    'Jam Test User',
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::uuid,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

-- 3. Create/verify jam@jam.com organization membership
INSERT INTO organization_members (id, user_id, organization_id, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::uuid,
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::uuid,
    'agent',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 4. Create/verify marko@marko.com profile (generate consistent user_id)
DO $$
DECLARE
    marko_user_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
BEGIN
    -- Insert/update marko profile
    INSERT INTO profiles (id, user_id, email, full_name, organization_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        marko_user_id,
        'marko@marko.com',
        'Marko Test User',
        '0690e12c-9aaf-4c12-9c2a-8bfa8f14db16'::uuid,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        updated_at = NOW();
    
    -- Insert/update marko organization membership
    INSERT INTO organization_members (id, user_id, organization_id, role, status, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        marko_user_id,
        '0690e12c-9aaf-4c12-9c2a-8bfa8f14db16'::uuid,
        'agent',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW();
        
    RAISE NOTICE 'Marko user setup complete with user_id: %', marko_user_id;
END $$;

-- 5. Create test mailboxes for both organizations
INSERT INTO mailboxes (organization_id, name, slug, description, created_at, updated_at)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd'::uuid, 'Jam Support', 'jam-support', 'Support mailbox for Jam org', NOW(), NOW()),
    ('0690e12c-9aaf-4c12-9c2a-8bfa8f14db16'::uuid, 'Widget Support', 'widget-support', 'Support mailbox for Widget org', NOW(), NOW())
ON CONFLICT (organization_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 6. Validation and reporting
DO $$
DECLARE
    jam_profile_count INTEGER;
    marko_profile_count INTEGER;
    jam_membership_count INTEGER;
    marko_membership_count INTEGER;
BEGIN
    -- Count profiles
    SELECT COUNT(*) INTO jam_profile_count FROM profiles WHERE email = 'jam@jam.com';
    SELECT COUNT(*) INTO marko_profile_count FROM profiles WHERE email = 'marko@marko.com';
    
    -- Count memberships
    SELECT COUNT(*) INTO jam_membership_count 
    FROM organization_members om 
    JOIN profiles p ON p.user_id = om.user_id 
    WHERE p.email = 'jam@jam.com' AND om.status = 'active';
    
    SELECT COUNT(*) INTO marko_membership_count 
    FROM organization_members om 
    JOIN profiles p ON p.user_id = om.user_id 
    WHERE p.email = 'marko@marko.com' AND om.status = 'active';
    
    -- Report results
    RAISE NOTICE '=== TEST USER SETUP VALIDATION ===';
    RAISE NOTICE 'jam@jam.com profiles: %', jam_profile_count;
    RAISE NOTICE 'marko@marko.com profiles: %', marko_profile_count;
    RAISE NOTICE 'jam@jam.com active memberships: %', jam_membership_count;
    RAISE NOTICE 'marko@marko.com active memberships: %', marko_membership_count;
    RAISE NOTICE '====================================';
END $$;
