-- Organization Switching Migration
-- Enables secure multi-tenant organization switching with JWT claims injection

-- =====================================================
-- 1. CREATE ORGANIZATION SWITCHING FUNCTION
-- =====================================================

-- Function to update user's organization claims in JWT
CREATE OR REPLACE FUNCTION public.update_user_organization_claims(new_organization_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    user_role TEXT;
    org_exists BOOLEAN;
    user_has_access BOOLEAN;
    result JSON;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Check if organization exists
    SELECT EXISTS(
        SELECT 1 FROM organizations WHERE id = new_organization_id
    ) INTO org_exists;
    
    IF NOT org_exists THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;

    -- Check if user has access to this organization
    SELECT 
        EXISTS(
            SELECT 1 FROM organization_members 
            WHERE user_id = update_user_organization_claims.user_id 
            AND organization_id = new_organization_id 
            AND status = 'active'
        ),
        COALESCE(
            (SELECT role FROM organization_members 
             WHERE user_id = update_user_organization_claims.user_id 
             AND organization_id = new_organization_id 
             AND status = 'active' 
             LIMIT 1), 
            'viewer'
        )
    INTO user_has_access, user_role;
    
    IF NOT user_has_access THEN
        RAISE EXCEPTION 'User does not have access to this organization';
    END IF;

    -- Update user's app metadata with new organization
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'organization_id', new_organization_id,
            'organization_role', user_role,
            'updated_at', NOW()
        )
    WHERE id = user_id;

    -- Return success result
    result := json_build_object(
        'success', true,
        'organization_id', new_organization_id,
        'role', user_role,
        'updated_at', NOW()
    );

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_organization_claims(UUID) TO authenticated;

-- =====================================================
-- 2. CREATE HELPER FUNCTIONS FOR ORGANIZATION ACCESS
-- =====================================================

-- Function to get user's current organization from JWT
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Try to get organization_id from JWT claims
    org_id := (auth.jwt() ->> 'organization_id')::UUID;
    
    -- If not in JWT, get from user metadata
    IF org_id IS NULL THEN
        org_id := (
            SELECT (raw_app_meta_data ->> 'organization_id')::UUID 
            FROM auth.users 
            WHERE id = auth.uid()
        );
    END IF;
    
    RETURN org_id;
END;
$$;

-- Function to check if user has access to an organization
CREATE OR REPLACE FUNCTION public.has_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = org_id
        AND status = 'active'
    );
END;
$$;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION public.get_user_organization_role(org_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    target_org_id UUID;
    user_role TEXT;
BEGIN
    -- Use provided org_id or get current organization
    target_org_id := COALESCE(org_id, get_user_organization_id());
    
    IF target_org_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT role INTO user_role
    FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = target_org_id
    AND status = 'active';
    
    RETURN user_role;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_organization_access(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_organization_role(UUID) TO authenticated, anon;

-- =====================================================
-- 3. UPDATE RLS POLICIES TO USE NEW FUNCTIONS
-- =====================================================

-- Update conversations RLS policy to use the new function
DROP POLICY IF EXISTS "tenant_isolation_conversations" ON conversations;
CREATE POLICY "tenant_isolation_conversations" ON conversations
FOR ALL USING (
    organization_id = get_user_organization_id() 
    OR has_organization_access(organization_id)
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- Update messages RLS policy
DROP POLICY IF EXISTS "tenant_isolation_messages" ON messages;
CREATE POLICY "tenant_isolation_messages" ON messages
FOR ALL USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE organization_id = get_user_organization_id()
        OR has_organization_access(organization_id)
    )
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- Update tickets RLS policy
DROP POLICY IF EXISTS "tenant_isolation_tickets" ON tickets;
CREATE POLICY "tenant_isolation_tickets" ON tickets
FOR ALL USING (
    organization_id = get_user_organization_id() 
    OR has_organization_access(organization_id)
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- Update organization_members RLS policy
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_members;
CREATE POLICY "Users can view their organization memberships" ON organization_members
FOR SELECT USING (
    user_id = auth.uid()
    OR (
        organization_id = get_user_organization_id()
        AND get_user_organization_role() IN ('owner', 'admin')
    )
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- =====================================================
-- 4. CREATE ORGANIZATION MANAGEMENT POLICIES
-- =====================================================

-- Organizations table policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
    OR auth.jwt() ->> 'role' = 'service_role'
);

DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
CREATE POLICY "Organization owners can update their organization" ON organizations
FOR UPDATE USING (
    id = get_user_organization_id()
    AND get_user_organization_role() = 'owner'
    OR auth.jwt() ->> 'role' = 'service_role'
);

-- Allow authenticated users to create organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations" ON organizations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 5. CREATE AUDIT LOGGING FOR ORGANIZATION SWITCHES
-- =====================================================

-- Create organization switch audit table
CREATE TABLE IF NOT EXISTS organization_switch_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    to_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE organization_switch_audit ENABLE ROW LEVEL SECURITY;

-- Create audit policy
CREATE POLICY "Users can view their own organization switches" ON organization_switch_audit
FOR SELECT USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_switch_audit_user_id ON organization_switch_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_org_switch_audit_created_at ON organization_switch_audit(created_at);

-- =====================================================
-- 6. CREATE TRIGGER FOR AUDIT LOGGING
-- =====================================================

-- Function to log organization switches
CREATE OR REPLACE FUNCTION public.log_organization_switch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log if organization_id actually changed
    IF OLD.raw_app_meta_data ->> 'organization_id' IS DISTINCT FROM NEW.raw_app_meta_data ->> 'organization_id' THEN
        INSERT INTO organization_switch_audit (
            user_id,
            from_organization_id,
            to_organization_id,
            user_role,
            ip_address,
            user_agent
        ) VALUES (
            NEW.id,
            (OLD.raw_app_meta_data ->> 'organization_id')::UUID,
            (NEW.raw_app_meta_data ->> 'organization_id')::UUID,
            NEW.raw_app_meta_data ->> 'organization_role',
            inet_client_addr(),
            current_setting('request.headers', true)::json ->> 'user-agent'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS trigger_log_organization_switch ON auth.users;
CREATE TRIGGER trigger_log_organization_switch
    AFTER UPDATE OF raw_app_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.log_organization_switch();

-- =====================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions for organization switching
GRANT SELECT, INSERT ON organization_switch_audit TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Comment the migration
COMMENT ON FUNCTION public.update_user_organization_claims(UUID) IS 
'Securely updates user JWT claims for organization switching with proper access control';

COMMENT ON FUNCTION public.get_user_organization_id() IS 
'Gets the current user organization ID from JWT claims or user metadata';

COMMENT ON TABLE organization_switch_audit IS 
'Audit log for organization switching events for security monitoring';
