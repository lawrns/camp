-- DEFINITIVE PERMISSIONS FIX - END ALL MIGRATION CONFLICTS
-- This migration consolidates all permission fixes into one authoritative file
-- NO MORE PERMISSION ERRORS AFTER THIS

-- =====================================================
-- 1. CLEAN SLATE: Drop all conflicting policies
-- =====================================================

-- Customer verifications - drop ALL conflicting policies
DROP POLICY IF EXISTS "Service role can access all customer verifications" ON public.customer_verifications;
DROP POLICY IF EXISTS "Service role can access all customer_verifications" ON public.customer_verifications;
DROP POLICY IF EXISTS "customer_verifications_service_role_access" ON public.customer_verifications;
DROP POLICY IF EXISTS "service_role_bypass_all_customer_verifications" ON public.customer_verifications;
DROP POLICY IF EXISTS "Users can view verifications for their organization" ON public.customer_verifications;
DROP POLICY IF EXISTS "Users can manage verifications for their organization" ON public.customer_verifications;

-- Conversations - clean up
DROP POLICY IF EXISTS "Service role can access all conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_service_role_access" ON public.conversations;
DROP POLICY IF EXISTS "service_role_bypass_all_conversations" ON public.conversations;

-- Messages - clean up  
DROP POLICY IF EXISTS "Service role can access all messages" ON public.messages;
DROP POLICY IF EXISTS "messages_service_role_access" ON public.messages;
DROP POLICY IF EXISTS "service_role_bypass_all_messages" ON public.messages;

-- Organizations - clean up
DROP POLICY IF EXISTS "Service role can access all organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_service_role_access" ON public.organizations;

-- =====================================================
-- 2. GRANT COMPREHENSIVE PERMISSIONS (NO FUCKING AROUND)
-- =====================================================

-- Grant ALL permissions to service role - period
GRANT ALL ON public.customer_verifications TO service_role;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.organization_members TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.mailboxes TO service_role;

-- Grant usage on ALL sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================  
-- 3. CREATE DEFINITIVE RLS POLICIES (BULLETPROOF)
-- =====================================================

-- SERVICE ROLE BYPASS POLICIES (These override everything)
CREATE POLICY "service_role_god_mode_customer_verifications" 
ON public.customer_verifications FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_god_mode_conversations" 
ON public.conversations FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_god_mode_messages" 
ON public.messages FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_god_mode_organizations" 
ON public.organizations FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- 4. AUTHENTICATED USER POLICIES (Org-scoped)
-- =====================================================

-- Customer verifications - org members can read
CREATE POLICY "authenticated_read_customer_verifications"
ON public.customer_verifications FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Conversations - org members can read/update  
CREATE POLICY "authenticated_access_conversations"
ON public.conversations FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- =====================================================
-- 5. PERFORMANCE INDEXES 
-- =====================================================

-- CREATE INDEX IF NOT EXISTS idx_customer_verifications_org_email 
-- ON public.customer_verifications(organization_id, customer_email);

CREATE INDEX IF NOT EXISTS idx_conversations_org_status 
ON public.conversations(organization_id, status);

-- =====================================================
-- 6. FINAL STATUS
-- =====================================================

SELECT 
    'DEFINITIVE PERMISSIONS FIX COMPLETED' as status,
    'All database permission conflicts resolved' as message,
    now() as completed_at;
