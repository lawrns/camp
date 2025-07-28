-- Cleanup old permission migrations
-- Migration: 20250701000004_cleanup_old_permissions.sql

-- This migration comments on the security issues with the old migrations
-- The actual file removal should be done via version control

-- Add a security notice table to track deprecated migrations
CREATE TABLE IF NOT EXISTS public.deprecated_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    replaced_by TEXT,
    deprecated_at TIMESTAMPTZ DEFAULT now()
);

-- Record the deprecated migrations
INSERT INTO public.deprecated_migrations (migration_name, reason, replaced_by) VALUES
    ('20250701000000_fix_service_role_permissions.sql', 
     'Used overly permissive GRANT ALL statements and weak RLS policies with USING (true)',
     '20250701000001_secure_service_role_permissions.sql'),
    ('20250701_fix_service_role_permissions.sql', 
     'Duplicate of 20250701000000 with same security issues',
     '20250701000001_secure_service_role_permissions.sql');

-- Add comments to existing tables about security requirements
COMMENT ON TABLE public.organizations IS 'Core organization table. All RLS policies must enforce organization-level isolation.';
COMMENT ON TABLE public.conversations IS 'Conversation table. Access must be restricted by organization membership.';
COMMENT ON TABLE public.messages IS 'Message table. Access controlled through conversation ownership.';
COMMENT ON TABLE public.payments IS 'Payment records. UPDATE and DELETE operations are forbidden to maintain audit trail.';
COMMENT ON TABLE public.customer_verifications IS 'Customer verification records. Sensitive data requiring admin-only access.';

-- Add security check function
CREATE OR REPLACE FUNCTION public.check_table_security()
RETURNS TABLE(
    table_name TEXT,
    has_rls BOOLEAN,
    policy_count INT,
    has_weak_policies BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname)::INT,
        EXISTS(
            SELECT 1 
            FROM pg_policies p2 
            WHERE p2.tablename = t.tablename 
            AND p2.qual = 'true'
        ) as has_weak_policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'organizations', 'conversations', 'messages', 
        'customer_verifications', 'payments', 'profiles',
        'organization_members', 'mailboxes'
    )
    GROUP BY t.tablename, t.rowsecurity;
END;
$$;

-- Grant execute to service role for monitoring
GRANT EXECUTE ON FUNCTION public.check_table_security TO service_role;

-- Create a view for monitoring permission grants
CREATE OR REPLACE VIEW public.permission_audit AS
SELECT 
    grantor,
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND grantee = 'service_role'
ORDER BY table_name, privilege_type;

-- Grant select on audit view to service role
GRANT SELECT ON public.permission_audit TO service_role;

-- Log completion
SELECT 'Security cleanup completed. Old migrations marked as deprecated.' as migration_status;