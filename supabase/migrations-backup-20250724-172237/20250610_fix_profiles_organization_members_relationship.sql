-- Fix the relationship between profiles and organization_members tables
-- This migration ensures proper foreign key relationships and schema cache recognition

-- 1. Ensure both tables have the correct structure
-- Profiles table should reference organizations
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Organization_members should reference both auth.users and organizations
-- (These should already exist, but ensuring they're correct)
DO $$
BEGIN
    -- Check if organization_id column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organization_members' 
        AND column_name = 'organization_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE organization_members 
        ALTER COLUMN organization_id TYPE UUID USING organization_id::UUID;
    END IF;
END $$;

-- 2. Add proper foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key from organization_members to organizations if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_members_organization_id_fkey'
        AND table_name = 'organization_members'
    ) THEN
        ALTER TABLE organization_members 
        ADD CONSTRAINT organization_members_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from organization_members to auth.users if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_members_user_id_fkey'
        AND table_name = 'organization_members'
    ) THEN
        ALTER TABLE organization_members 
        ADD CONSTRAINT organization_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from profiles to organizations if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_organization_id_fkey'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create indexes for better performance on joins
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org ON organization_members(user_id, organization_id);

-- 4. Refresh the schema cache to ensure Supabase recognizes the relationships
NOTIFY pgrst, 'reload schema';

-- 5. Test the relationship by creating a view that joins the tables
-- This helps Supabase understand the relationship
CREATE OR REPLACE VIEW user_organization_info AS
SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    om.role,
    om.status,
    om.created_at as membership_created_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN organization_members om ON p.user_id = om.user_id AND p.organization_id = om.organization_id;

-- 6. Grant permissions on the view
GRANT SELECT ON user_organization_info TO authenticated;
GRANT SELECT ON user_organization_info TO anon;

-- 7. Validation query to ensure relationships work
DO $$
DECLARE
    relationship_count INTEGER;
BEGIN
    -- Test if we can join profiles with organization_members
    SELECT COUNT(*) INTO relationship_count
    FROM profiles p
    JOIN organization_members om ON p.user_id = om.user_id;
    
    RAISE NOTICE 'Successfully joined profiles with organization_members: % records', relationship_count;
    
    -- Test if we can join with organizations
    SELECT COUNT(*) INTO relationship_count
    FROM profiles p
    JOIN organization_members om ON p.user_id = om.user_id
    JOIN organizations o ON om.organization_id = o.id;
    
    RAISE NOTICE 'Successfully joined profiles + organization_members + organizations: % records', relationship_count;
END $$;

-- 8. Update any existing profiles to ensure they have organization_id set
UPDATE profiles p
SET organization_id = om.organization_id
FROM organization_members om
WHERE p.user_id = om.user_id
AND p.organization_id IS NULL
AND om.status = 'active';

-- 9. Final schema cache refresh
NOTIFY pgrst, 'reload schema';
