-- Fix service role permissions for customer_verifications and other tables
-- Migration: 20250701000000_fix_service_role_permissions.sql

-- Grant service role access to customer_verifications table
GRANT ALL ON public.customer_verifications TO service_role;
GRANT ALL ON public.payments TO service_role;

-- Add service role exceptions to RLS policies for customer_verifications
DROP POLICY IF EXISTS "Service role can access all customer verifications" ON public.customer_verifications;
CREATE POLICY "Service role can access all customer verifications"
ON public.customer_verifications FOR ALL
USING (auth.role() = 'service_role');

-- Add service role exceptions to RLS policies for payments
DROP POLICY IF EXISTS "Service role can access all payments" ON public.payments;
CREATE POLICY "Service role can access all payments"
ON public.payments FOR ALL
USING (auth.role() = 'service_role');

-- Grant service role access to other essential tables if needed
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.user_organizations TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure service role can bypass RLS on essential tables
DROP POLICY IF EXISTS "Service role can access all conversations" ON public.conversations;
CREATE POLICY "Service role can access all conversations"
ON public.conversations FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access all messages" ON public.messages;
CREATE POLICY "Service role can access all messages"
ON public.messages FOR ALL
USING (auth.role() = 'service_role');

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_customer_verifications_lookup 
ON public.customer_verifications(customer_email, organization_id, status);

-- Log migration completion
SELECT 'Service role permissions fixed for customer_verifications and related tables' as migration_status; 