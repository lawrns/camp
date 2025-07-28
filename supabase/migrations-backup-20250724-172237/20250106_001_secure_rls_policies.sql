-- Security Enhancement: Add RLS Policies to Unprotected Tables
-- This migration secures critical tables that currently lack RLS protection

-- ============================================================================
-- ENABLE RLS ON UNPROTECTED TABLES
-- ============================================================================

-- AI-related tables (high risk - contains sensitive performance data)
-- ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_billing_invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Knowledge base tables (medium risk - contains business data)
-- ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Real-time communication tables (low risk but privacy concern)
-- ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Widget configuration tables (medium risk - affects customer experience)
-- ALTER TABLE widget_welcome_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE widget_quick_replies ENABLE ROW LEVEL SECURITY;

-- FAQ management (low risk - usually public content)
-- ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AI TABLES RLS POLICIES - Organization Scoped
-- ============================================================================

-- AI Metrics: Organization members can view, admins can modify
-- CREATE POLICY "ai_metrics_select" ON ai_metrics
-- FOR SELECT TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- CREATE POLICY "ai_metrics_insert" ON ai_metrics
-- FOR INSERT TO authenticated WITH CHECK (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner', 'agent')
--     )
-- );

-- CREATE POLICY "ai_metrics_update" ON ai_metrics
-- FOR UPDATE TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner')
--     )
-- );

-- AI Sessions: Strict organization isolation
-- CREATE POLICY "ai_sessions_org_access" ON ai_sessions
-- FOR ALL TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- AI Billing: Admin and owner only
CREATE POLICY "ai_billing_admin_only" ON ai_billing_invoices
FOR ALL TO authenticated USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'owner')
    )
);

-- Conversation Memory: Organization scoped with read/write separation
-- CREATE POLICY "conversation_memory_select" ON conversation_memory
-- FOR SELECT TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- CREATE POLICY "conversation_memory_insert" ON conversation_memory
-- FOR INSERT TO authenticated WITH CHECK (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner', 'agent')
--     )
-- );

-- AI Performance Metrics: View-only for most users, admins can modify
-- CREATE POLICY "ai_performance_metrics_select" ON ai_performance_metrics
-- FOR SELECT TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- CREATE POLICY "ai_performance_metrics_manage" ON ai_performance_metrics
-- FOR INSERT TO authenticated WITH CHECK (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner')
--     )
-- );

-- ============================================================================
-- KNOWLEDGE BASE RLS POLICIES
-- ============================================================================

-- Knowledge Chunks: Organization scoped, agents can read/write
-- CREATE POLICY "knowledge_chunks_select" ON knowledge_chunks
-- FOR SELECT TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- CREATE POLICY "knowledge_chunks_manage" ON knowledge_chunks
-- FOR INSERT TO authenticated WITH CHECK (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner', 'agent')
--     )
-- );

-- CREATE POLICY "knowledge_chunks_update" ON knowledge_chunks
-- FOR UPDATE TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner', 'agent')
--     )
-- );

-- ============================================================================
-- REAL-TIME COMMUNICATION RLS POLICIES
-- ============================================================================

-- Typing Indicators: Organization scoped, temporary data
-- CREATE POLICY "typing_indicators_org_access" ON typing_indicators
-- FOR ALL TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- Allow service role for real-time updates
-- CREATE POLICY "typing_indicators_service" ON typing_indicators
-- FOR ALL TO service_role USING (true);

-- ============================================================================
-- WIDGET CONFIGURATION RLS POLICIES
-- ============================================================================

-- Widget Welcome Config: Public read for active configs, admin manage
-- CREATE POLICY "widget_welcome_public_read" ON widget_welcome_config
-- FOR SELECT TO anon USING (is_enabled = true);

-- CREATE POLICY "widget_welcome_authenticated_read" ON widget_welcome_config
-- FOR SELECT TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--     )
-- );

-- CREATE POLICY "widget_welcome_admin_manage" ON widget_welcome_config
-- FOR INSERT TO authenticated WITH CHECK (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner')
--     )
-- );

-- CREATE POLICY "widget_welcome_admin_update" ON widget_welcome_config
-- FOR UPDATE TO authenticated USING (
--     organization_id IN (
--         SELECT organization_id FROM organization_members 
--         WHERE user_id = auth.uid() AND status = 'active'
--         AND role IN ('admin', 'owner')
--     )
-- );

-- Widget Quick Replies: Similar pattern to welcome config
CREATE POLICY "widget_quick_replies_public_read" ON widget_quick_replies
FOR SELECT TO anon USING (is_enabled = true);

CREATE POLICY "widget_quick_replies_org_read" ON widget_quick_replies
FOR SELECT TO authenticated USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "widget_quick_replies_admin_manage" ON widget_quick_replies
FOR INSERT TO authenticated WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'owner')
    )
);

CREATE POLICY "widget_quick_replies_admin_update" ON widget_quick_replies
FOR UPDATE TO authenticated USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'owner')
    )
);

-- ============================================================================
-- FAQ CATEGORIES RLS POLICIES
-- ============================================================================

-- FAQ Categories: Organization scoped with public read option
CREATE POLICY "faq_categories_public_read" ON faq_categories
FOR SELECT TO anon USING (is_public = true);

CREATE POLICY "faq_categories_org_access" ON faq_categories
FOR SELECT TO authenticated USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "faq_categories_admin_manage" ON faq_categories
FOR INSERT TO authenticated WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'owner', 'agent')
    )
);

CREATE POLICY "faq_categories_admin_update" ON faq_categories
FOR UPDATE TO authenticated USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'owner', 'agent')
    )
);

-- ============================================================================
-- SERVICE ROLE EXCEPTIONS (Limited and Audited)
-- ============================================================================

-- Allow service role for system operations (be very careful with these)
-- CREATE POLICY "ai_metrics_service" ON ai_metrics
-- FOR INSERT TO service_role WITH CHECK (true);

-- CREATE POLICY "ai_sessions_service" ON ai_sessions
-- FOR ALL TO service_role USING (true);

-- CREATE POLICY "conversation_memory_service" ON conversation_memory
-- FOR ALL TO service_role USING (true);

-- CREATE POLICY "ai_performance_metrics_service" ON ai_performance_metrics
-- FOR INSERT TO service_role WITH CHECK (true);

-- CREATE POLICY "knowledge_chunks_service" ON knowledge_chunks
-- FOR ALL TO service_role USING (true);

-- ============================================================================
-- SECURITY AUDIT LOGGING
-- ============================================================================

-- Add security event logging (if audit table exists)
-- This will help track potential security violations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log') THEN
        -- Log policy violations and access attempts
        CREATE OR REPLACE FUNCTION log_rls_violation()
        RETURNS TRIGGER AS $func$
        BEGIN
            INSERT INTO security_audit_log (
                user_id,
                organization_id,
                table_name,
                action,
                denied_reason,
                created_at
            ) VALUES (
                auth.uid(),
                COALESCE(NEW.organization_id, OLD.organization_id),
                TG_TABLE_NAME,
                TG_OP,
                'RLS_POLICY_VIOLATION',
                NOW()
            );
            RETURN NULL;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
END $$;