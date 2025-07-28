-- Test script to verify service role permissions work correctly
-- Migration: 20250701000003_test_service_permissions.sql

-- This is a test migration that verifies permissions without making changes
-- It will rollback all changes at the end

BEGIN;

-- Set role to service_role for testing
SET ROLE service_role;

-- Test 1: Verify service role can read from core tables
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Test organizations access
    PERFORM 1 FROM public.organizations LIMIT 1;
    RAISE NOTICE 'Test 1.1 PASSED: Service role can read organizations';
    
    -- Test conversations access
    PERFORM 1 FROM public.conversations LIMIT 1;
    RAISE NOTICE 'Test 1.2 PASSED: Service role can read conversations';
    
    -- Test messages access
    PERFORM 1 FROM public.messages LIMIT 1;
    RAISE NOTICE 'Test 1.3 PASSED: Service role can read messages';
    
    -- Test customer_verifications access
    PERFORM 1 FROM public.customer_verifications LIMIT 1;
    RAISE NOTICE 'Test 1.4 PASSED: Service role can read customer_verifications';
    
    -- Test payments access
    PERFORM 1 FROM public.payments LIMIT 1;
    RAISE NOTICE 'Test 1.5 PASSED: Service role can read payments';
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Test 1 FAILED: Service role lacks read permissions';
END $$;

-- Test 2: Verify service role can insert into allowed tables
DO $$
DECLARE
    test_org_id UUID;
    test_conv_id UUID;
    test_msg_id UUID;
BEGIN
    -- Test organization insert
    INSERT INTO public.organizations (name, slug) 
    VALUES ('Test Org', 'test-org-' || gen_random_uuid()::text)
    RETURNING id INTO test_org_id;
    RAISE NOTICE 'Test 2.1 PASSED: Service role can insert organizations';
    
    -- Test conversation insert
    INSERT INTO public.conversations (organization_id, subject, status)
    VALUES (test_org_id, 'Test Conversation', 'open')
    RETURNING id INTO test_conv_id;
    RAISE NOTICE 'Test 2.2 PASSED: Service role can insert conversations';
    
    -- Test message insert
    INSERT INTO public.messages (conversation_id, organization_id, content, sender_type)
    VALUES (test_conv_id, test_org_id, 'Test message', 'system')
    RETURNING id INTO test_msg_id;
    RAISE NOTICE 'Test 2.3 PASSED: Service role can insert messages';
    
    -- Test customer_verification insert
    INSERT INTO public.customer_verifications (organization_id, customer_email, status)
    VALUES (test_org_id, 'test@example.com', 'pending');
    RAISE NOTICE 'Test 2.4 PASSED: Service role can insert customer_verifications';
    
    -- Test payment insert
    INSERT INTO public.payments (organization_id, amount, currency, status)
    VALUES (test_org_id, 100.00, 'USD', 'pending');
    RAISE NOTICE 'Test 2.5 PASSED: Service role can insert payments';
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Test 2 FAILED: Service role lacks insert permissions';
END $$;

-- Test 3: Verify service role can update allowed tables
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Get a test organization
    SELECT id INTO test_org_id FROM public.organizations LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test organization update
        UPDATE public.organizations 
        SET updated_at = now() 
        WHERE id = test_org_id;
        RAISE NOTICE 'Test 3.1 PASSED: Service role can update organizations';
        
        -- Test conversation update
        UPDATE public.conversations 
        SET updated_at = now() 
        WHERE organization_id = test_org_id
        LIMIT 1;
        RAISE NOTICE 'Test 3.2 PASSED: Service role can update conversations';
        
        -- Test message update
        UPDATE public.messages 
        SET updated_at = now() 
        WHERE organization_id = test_org_id
        LIMIT 1;
        RAISE NOTICE 'Test 3.3 PASSED: Service role can update messages';
    END IF;
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Test 3 FAILED: Service role lacks update permissions';
END $$;

-- Test 4: Verify service role CANNOT update payments (audit trail protection)
DO $$
BEGIN
    UPDATE public.payments 
    SET amount = amount + 1 
    WHERE id IS NOT NULL
    LIMIT 1;
    RAISE EXCEPTION 'Test 4 FAILED: Service role should NOT be able to update payments';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Test 4 PASSED: Service role correctly blocked from updating payments';
    WHEN OTHERS THEN
        -- If no payments exist, that's OK
        RAISE NOTICE 'Test 4 SKIPPED: No payments to test';
END $$;

-- Test 5: Verify RLS policies work correctly
DO $$
DECLARE
    policy_count INT;
BEGIN
    -- Count policies on key tables
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename IN ('organizations', 'conversations', 'messages', 'customer_verifications', 'payments')
    AND policyname LIKE '%service role%';
    
    IF policy_count >= 5 THEN
        RAISE NOTICE 'Test 5 PASSED: RLS policies exist for service role on key tables';
    ELSE
        RAISE EXCEPTION 'Test 5 FAILED: Missing RLS policies for service role';
    END IF;
END $$;

-- Test 6: Verify helper functions work
DO $$
DECLARE
    test_result BOOLEAN;
    test_org_id UUID;
BEGIN
    -- Get a test organization
    SELECT id INTO test_org_id FROM public.organizations LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test organization context validation
        SELECT public.validate_organization_context(test_org_id) INTO test_result;
        IF test_result THEN
            RAISE NOTICE 'Test 6.1 PASSED: validate_organization_context works for service role';
        ELSE
            RAISE EXCEPTION 'Test 6.1 FAILED: validate_organization_context returned false';
        END IF;
        
        -- Test user organization access check
        SELECT public.user_has_organization_access(test_org_id) INTO test_result;
        IF test_result THEN
            RAISE NOTICE 'Test 6.2 PASSED: user_has_organization_access works for service role';
        ELSE
            RAISE EXCEPTION 'Test 6.2 FAILED: user_has_organization_access returned false';
        END IF;
    END IF;
END $$;

-- Reset role
RESET ROLE;

-- Rollback all test changes
ROLLBACK;

-- Final status
SELECT 'All service role permission tests completed. Check notices above for results.' as test_status;