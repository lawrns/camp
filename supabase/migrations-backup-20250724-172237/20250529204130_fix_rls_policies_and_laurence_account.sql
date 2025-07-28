-- 🔧 COMPREHENSIVE FIX: RLS Policies + Laurence Account
-- This migration fixes all authentication issues and ensures laurence@fyves.com has complete setup

-- =====================================================
-- 1️⃣ FIX RLS POLICIES FOR ALL TABLES
-- =====================================================

-- Fix conversation_memory table policies
DROP POLICY IF EXISTS "Service role has full access to memory" ON conversation_memory;
DROP POLICY IF EXISTS "Users can view memory in their org" ON conversation_memory;
DROP POLICY IF EXISTS "Authenticated users can access conversation_memory" ON conversation_memory;

CREATE POLICY "conversation_memory_service_role_access" ON conversation_memory
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "conversation_memory_authenticated_access" ON conversation_memory
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON conversation_memory TO authenticated, service_role;

-- Fix ai_handover_sessions table policies
DROP POLICY IF EXISTS "Service role has full access to ai_handover_sessions" ON ai_handover_sessions;
DROP POLICY IF EXISTS "Authenticated users can access ai_handover_sessions" ON ai_handover_sessions;

CREATE POLICY "ai_handover_sessions_service_role_access" ON ai_handover_sessions
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "ai_handover_sessions_authenticated_access" ON ai_handover_sessions
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON ai_handover_sessions TO authenticated, service_role;

-- Fix knowledge_documents table policies
DROP POLICY IF EXISTS "Service role has full access to knowledge_documents" ON knowledge_documents;
DROP POLICY IF EXISTS "Authenticated users can access knowledge_documents" ON knowledge_documents;

CREATE POLICY "knowledge_documents_service_role_access" ON knowledge_documents
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "knowledge_documents_authenticated_access" ON knowledge_documents
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON knowledge_documents TO authenticated, service_role;

-- Fix campfire_handoffs table policies
DROP POLICY IF EXISTS "Service role has full access to handoffs" ON campfire_handoffs;
DROP POLICY IF EXISTS "Users can view handoffs in their org" ON campfire_handoffs;
DROP POLICY IF EXISTS "Authenticated users can access campfire_handoffs" ON campfire_handoffs;

CREATE POLICY "campfire_handoffs_service_role_access" ON campfire_handoffs
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "campfire_handoffs_authenticated_access" ON campfire_handoffs
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON campfire_handoffs TO authenticated, service_role;

-- Fix typing_indicators table policies
DROP POLICY IF EXISTS "Service role has full access to typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators for their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Authenticated users can access typing_indicators" ON typing_indicators;

CREATE POLICY "typing_indicators_service_role_access" ON typing_indicators
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "typing_indicators_authenticated_access" ON typing_indicators
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON typing_indicators TO authenticated, service_role;

-- Fix messages table policies
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON messages;
DROP POLICY IF EXISTS "Service role full access messages" ON messages;

CREATE POLICY "messages_service_role_access" ON messages
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "messages_authenticated_read" ON messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "messages_authenticated_insert" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "messages_authenticated_update" ON messages
    FOR UPDATE USING (auth.role() = 'authenticated');

GRANT ALL ON messages TO authenticated, service_role;

-- Fix conversations table policies
DROP POLICY IF EXISTS "conversations_service_role_access" ON conversations;
DROP POLICY IF EXISTS "conversations_authenticated_access" ON conversations;

CREATE POLICY "conversations_service_role_access" ON conversations
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "conversations_authenticated_access" ON conversations
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON conversations TO authenticated, service_role;

-- Fix agents table policies
DROP POLICY IF EXISTS "agents_service_role_access" ON agents;
DROP POLICY IF EXISTS "agents_authenticated_access" ON agents;

CREATE POLICY "agents_service_role_access" ON agents
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "agents_authenticated_access" ON agents
    FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON agents TO authenticated, service_role;

-- =====================================================
-- 2️⃣ FIX LAURENCE ACCOUNT SETUP
-- =====================================================

DO $laurence_fix$
DECLARE
    laurence_user_id UUID;
    laurence_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- Find laurence's user ID from auth.users
    SELECT id INTO laurence_user_id
    FROM auth.users
    WHERE email = 'laurence@fyves.com'
    LIMIT 1;

    IF laurence_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: laurence@fyves.com user not found in auth.users';
        RETURN;
    END IF;

    RAISE NOTICE 'Found laurence user ID: %', laurence_user_id;

    -- Ensure organization exists
    INSERT INTO organizations (id, name, domain, created_at, updated_at)
    VALUES (
        laurence_org_id,
        'Fyves Communications',
        'fyves.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        domain = EXCLUDED.domain,
        updated_at = NOW();

    RAISE NOTICE 'Organization ensured: %', laurence_org_id;

    -- Ensure profile exists and is complete
    INSERT INTO profiles (
        user_id,
        email,
        full_name,
        organization_id,
        role,
        created_at,
        updated_at
    )
    VALUES (
        laurence_user_id,
        'laurence@fyves.com',
        'Laurence Fyves',
        laurence_org_id,
        'owner',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        updated_at = NOW();

    RAISE NOTICE 'Profile ensured for user: %', laurence_user_id;

    -- Ensure organization membership
    INSERT INTO organization_members (
        id,
        user_id,
        organization_id,
        role,
        status,
        mailbox_id,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        laurence_user_id,
        laurence_org_id,
        'owner',
        'active',
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        mailbox_id = EXCLUDED.mailbox_id,
        updated_at = NOW();

    RAISE NOTICE 'Organization membership ensured';

    -- Ensure agent record exists
    INSERT INTO agents (
        id,
        profile_id,
        organization_id,
        display_name,
        email,
        avatar_url,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        laurence_user_id,
        laurence_org_id,
        'Laurence Fyves',
        'laurence@fyves.com',
        NULL,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (profile_id, organization_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    RAISE NOTICE 'Agent record ensured';

    -- Update any conversations that might be missing organization_id
    UPDATE conversations
    SET organization_id = laurence_org_id
    WHERE organization_id IS NULL OR organization_id != laurence_org_id;

    RAISE NOTICE 'Updated conversations to have proper organization_id';

    -- Create sample knowledge document
    INSERT INTO knowledge_documents (
        id,
        organization_id,
        title,
        content,
        document_type,
        metadata,
        embedding,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        laurence_org_id,
        'Welcome to Fyves Communications',
        'Welcome to Fyves Communications! We provide excellent customer service and support. Our team is here to help you with any questions or concerns you may have.',
        'faq',
        '{"category": "general", "tags": ["welcome", "introduction"]}',
        NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sample knowledge document created';

    -- Verification
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'User ID: %', laurence_user_id;
    RAISE NOTICE 'Organization ID: %', laurence_org_id;
    RAISE NOTICE 'Profile exists: %', EXISTS(SELECT 1 FROM profiles WHERE user_id = laurence_user_id);
    RAISE NOTICE 'Org member exists: %', EXISTS(SELECT 1 FROM organization_members WHERE user_id = laurence_user_id);
    RAISE NOTICE 'Agent exists: %', EXISTS(SELECT 1 FROM agents WHERE profile_id = laurence_user_id);
    RAISE NOTICE 'Organization exists: %', EXISTS(SELECT 1 FROM organizations WHERE id = laurence_org_id);

END $laurence_fix$;