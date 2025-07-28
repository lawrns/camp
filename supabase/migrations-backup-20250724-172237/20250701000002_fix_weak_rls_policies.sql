-- Fix weak RLS policies that use USING (true)
-- Migration: 20250701000002_fix_weak_rls_policies.sql

-- Fix typing_indicators table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'typing_indicators' AND schemaname = 'public') THEN
        ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
        
        -- Drop weak policies
        DROP POLICY IF EXISTS "Allow all operations on typing indicators" ON public.typing_indicators;
        DROP POLICY IF EXISTS "Allow public read on typing indicators" ON public.typing_indicators;
        DROP POLICY IF EXISTS "Allow all for typing indicators" ON public.typing_indicators;
        
        -- Create secure policies
        EXECUTE 'CREATE POLICY "Service role manages typing indicators" ON public.typing_indicators FOR ALL TO service_role USING (true) WITH CHECK (conversation_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Users manage typing in their conversations" ON public.typing_indicators FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = typing_indicators.conversation_id AND c.organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active''))) WITH CHECK (user_id = auth.uid() AND conversation_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Users view typing in their conversations" ON public.typing_indicators FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = typing_indicators.conversation_id AND c.organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'')))';
    END IF;
END $$;

-- Fix widget_welcome_config table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'widget_welcome_config' AND schemaname = 'public') THEN
        ALTER TABLE public.widget_welcome_config ENABLE ROW LEVEL SECURITY;
        
        -- Drop weak policies
        DROP POLICY IF EXISTS "widget_welcome_select_policy" ON public.widget_welcome_config;
        DROP POLICY IF EXISTS "widget_welcome_update_policy" ON public.widget_welcome_config;
        
        -- Create secure policies
        EXECUTE 'CREATE POLICY "Service role manages widget config" ON public.widget_welcome_config FOR ALL TO service_role USING (true) WITH CHECK (organization_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Public reads widget config by organization" ON public.widget_welcome_config FOR SELECT TO anon USING (is_enabled = true)';
        
        EXECUTE 'CREATE POLICY "Organization admins manage widget config" ON public.widget_welcome_config FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'' AND role IN (''admin'', ''owner''))) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'' AND role IN (''admin'', ''owner'')))';
    END IF;
END $$;

-- Fix widget_quick_replies table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'widget_quick_replies' AND schemaname = 'public') THEN
        ALTER TABLE public.widget_quick_replies ENABLE ROW LEVEL SECURITY;
        
        -- Drop weak policies
        DROP POLICY IF EXISTS "quick_replies_select_policy" ON public.widget_quick_replies;
        
        -- Create secure policies
        EXECUTE 'CREATE POLICY "Service role manages quick replies" ON public.widget_quick_replies FOR ALL TO service_role USING (true) WITH CHECK (organization_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Public reads enabled quick replies" ON public.widget_quick_replies FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.widget_welcome_config wc WHERE wc.organization_id = widget_quick_replies.organization_id AND wc.is_enabled = true))';
        
        EXECUTE 'CREATE POLICY "Organization members manage quick replies" ON public.widget_quick_replies FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'' AND role IN (''admin'', ''owner''))) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'' AND role IN (''admin'', ''owner'')))';
    END IF;
END $$;

-- Fix faq_categories table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'faq_categories' AND schemaname = 'public') THEN
        ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
        
        -- Drop weak policies
        DROP POLICY IF EXISTS "faq_categories_select_policy" ON public.faq_categories;
        
        -- Create secure policies
        EXECUTE 'CREATE POLICY "Service role manages FAQ categories" ON public.faq_categories FOR ALL TO service_role USING (true) WITH CHECK (organization_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Public reads published FAQ categories" ON public.faq_categories FOR SELECT TO anon USING (is_published = true)';
        
        EXECUTE 'CREATE POLICY "Organization members manage FAQ categories" ON public.faq_categories FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'')) WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'' AND role IN (''admin'', ''owner'')))';
    END IF;
END $$;

-- Fix any message-related weak policies
DO $$
BEGIN
    -- Drop any remaining weak message policies
    DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
    DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
    
    -- Ensure proper message policies exist (created in previous migration)
END $$;

-- Fix conversation_messages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'conversation_messages' AND schemaname = 'public') THEN
        ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
        
        -- Drop weak policies
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversation_messages;
        
        -- Create secure policies
        EXECUTE 'CREATE POLICY "Service role manages conversation messages" ON public.conversation_messages FOR ALL TO service_role USING (true) WITH CHECK (conversation_id IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Users read messages in their conversations" ON public.conversation_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_messages.conversation_id AND c.organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'')))';
        
        EXECUTE 'CREATE POLICY "Users create messages in their conversations" ON public.conversation_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_messages.conversation_id AND c.organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = ''active'')))';
    END IF;
END $$;

-- Create a function to validate organization context for API calls
CREATE OR REPLACE FUNCTION public.validate_organization_context(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Service role bypasses validation
    IF auth.role() = 'service_role' THEN
        -- But still check that org exists
        RETURN EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id);
    END IF;
    
    -- For authenticated users, check membership
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = org_id
        AND status = 'active'
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_organization_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_organization_context TO service_role;

-- Create a function to get user's active organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id UUID, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id, om.role
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.status = 'active';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_organizations TO authenticated;

-- Add audit log for RLS policy violations (optional but recommended)
CREATE TABLE IF NOT EXISTS public.rls_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    organization_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.rls_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can read audit logs
CREATE POLICY "Service role reads audit logs"
ON public.rls_audit_log FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Organization admins read their audit logs"
ON public.rls_audit_log FOR SELECT
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

-- Create function to log RLS violations
CREATE OR REPLACE FUNCTION public.log_rls_violation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rls_audit_log (
        table_name,
        operation,
        user_id,
        organization_id,
        details
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        COALESCE(NEW.organization_id, OLD.organization_id),
        jsonb_build_object(
            'attempted_at', now(),
            'auth_role', auth.role()
        )
    );
    RETURN NULL;
END;
$$;

-- Log migration completion
SELECT 'Fixed all weak RLS policies with proper organization-level isolation' as migration_status;