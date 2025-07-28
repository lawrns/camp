-- Secure service role permissions with principle of least privilege
-- Migration: 20250701000001_secure_service_role_permissions.sql

-- First, revoke all existing permissions to start fresh
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant specific permissions on tables using principle of least privilege
-- Core tables - service role needs full access for API operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailboxes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO service_role;

-- Customer verification and payments - sensitive tables, limit to necessary operations
GRANT SELECT, INSERT, UPDATE ON public.customer_verifications TO service_role;
GRANT SELECT, INSERT ON public.payments TO service_role; -- No UPDATE/DELETE on payments for audit trail

-- AI and processing tables
GRANT SELECT, INSERT, UPDATE ON public.ai_processing_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ai_handover_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ai_sessions TO service_role;

-- Knowledge base and support
GRANT SELECT ON public.knowledge_base TO service_role;
GRANT SELECT ON public.knowledge_documents TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.tickets TO service_role;

-- User tables - limited access
GRANT SELECT ON public.users TO service_role;
GRANT SELECT ON public.user_organizations TO service_role;

-- Grant usage on sequences for tables that need INSERT
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Drop all existing weak RLS policies that use USING (true)
DROP POLICY IF EXISTS "Service role can access all customer verifications" ON public.customer_verifications;
DROP POLICY IF EXISTS "Service role can access all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can access all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Service role can access all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can access conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can access messages" ON public.messages;

-- Create secure RLS policies with proper organization-level isolation

-- Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to organizations"
ON public.organizations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

-- Organization Members RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to organization members"
ON public.organization_members FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view organization members"
ON public.organization_members FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members om2
        WHERE om2.user_id = auth.uid() 
        AND om2.status = 'active'
    )
);

-- Conversations RLS with organization isolation
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages conversations"
ON public.conversations FOR ALL
TO service_role
USING (true)
WITH CHECK (
    -- Ensure organization_id is always set
    organization_id IS NOT NULL
);

CREATE POLICY "Users access conversations in their organizations"
ON public.conversations FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

CREATE POLICY "Users can update assigned conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('admin', 'agent', 'owner')
    )
    AND (
        assigned_agent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
            AND organization_id = conversations.organization_id
            AND role IN ('admin', 'owner')
        )
    )
);

-- Messages RLS with conversation-level access control
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages messages"
ON public.messages FOR ALL
TO service_role
USING (true)
WITH CHECK (
    -- Ensure organization_id and conversation_id are always set
    organization_id IS NOT NULL 
    AND conversation_id IS NOT NULL
);

CREATE POLICY "Users read messages in accessible conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND c.organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
);

CREATE POLICY "Users create messages in accessible conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND c.organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
);

-- Customer Verifications RLS - strict access control
ALTER TABLE public.customer_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages customer verifications"
ON public.customer_verifications FOR ALL
TO service_role
USING (true)
WITH CHECK (
    -- Ensure organization_id is always set
    organization_id IS NOT NULL
);

CREATE POLICY "Organization admins view customer verifications"
ON public.customer_verifications FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('admin', 'owner')
    )
);

-- Payments RLS - very strict access control
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role reads and creates payments"
ON public.payments FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role inserts payments"
ON public.payments FOR INSERT
TO service_role
WITH CHECK (
    -- Ensure all required fields are set
    organization_id IS NOT NULL
    AND amount IS NOT NULL
    AND status IS NOT NULL
);

CREATE POLICY "Organization owners view payments"
ON public.payments FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'owner'
    )
);

-- AI Processing Logs RLS
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages AI logs"
ON public.ai_processing_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (
    organization_id IS NOT NULL
    AND conversation_id IS NOT NULL
);

CREATE POLICY "Users view AI logs for their conversations"
ON public.ai_processing_logs FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('admin', 'agent', 'owner')
    )
);

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages profiles"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- Users can see their own profile
    user_id = auth.uid()
    OR
    -- Users can see profiles in their organization
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

CREATE POLICY "Users update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Mailboxes RLS
ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages mailboxes"
ON public.mailboxes FOR ALL
TO service_role
USING (true)
WITH CHECK (organization_id IS NOT NULL);

CREATE POLICY "Users view mailboxes in their organization"
ON public.mailboxes FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

-- Tickets RLS (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tickets' AND schemaname = 'public') THEN
        ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
        
        EXECUTE 'CREATE POLICY "Service role manages tickets" ON public.tickets FOR ALL TO service_role USING (true) WITH CHECK (organization_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Users view tickets in their organization" ON public.tickets FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active''))';
    END IF;
END $$;

-- Create function to check user organization membership
CREATE OR REPLACE FUNCTION public.user_has_organization_access(org_id UUID, required_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Service role always has access
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is an active member of the organization
    IF required_roles IS NULL THEN
        RETURN EXISTS (
            SELECT 1 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND organization_id = org_id
            AND status = 'active'
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 
            FROM public.organization_members 
            WHERE user_id = auth.uid() 
            AND organization_id = org_id
            AND status = 'active'
            AND role = ANY(required_roles)
        );
    END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_has_organization_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_organization_access TO service_role;

-- Create indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_status ON organization_members(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_org ON messages(conversation_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_org ON customer_verifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);

-- Log migration completion
SELECT 'Secure service role permissions implemented with organization-level data isolation' as migration_status;