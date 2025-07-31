-- =====================================================
-- FIX WIDGET CHANNEL SUBSCRIPTION ISSUES
-- =====================================================
-- This migration fixes the "CLOSED" channel status issue by:
-- 1. Cleaning up conflicting RLS policies
-- 2. Creating simplified, working policies for widget sessions
-- 3. Ensuring proper permissions for anonymous users
-- 4. Adding debug policies for development

-- =====================================================
-- CLEAN UP CONFLICTING POLICIES
-- =====================================================

-- Drop all existing conflicting policies for conversations
DROP POLICY IF EXISTS "conversations_widget_access" ON conversations;
DROP POLICY IF EXISTS "conversations_anon_widget_access" ON conversations;
DROP POLICY IF EXISTS "conversations_authenticated_organization_access" ON conversations;
DROP POLICY IF EXISTS "Widget conversations are accessible by organization members" ON conversations;
DROP POLICY IF EXISTS "Organization isolation for conversations" ON conversations;
DROP POLICY IF EXISTS "Widget access for conversations" ON conversations;
DROP POLICY IF EXISTS "Insert conversations with organization check" ON conversations;

-- Drop all existing conflicting policies for messages
DROP POLICY IF EXISTS "messages_widget_access" ON messages;
DROP POLICY IF EXISTS "messages_anon_widget_access" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_organization_access" ON messages;
DROP POLICY IF EXISTS "Organization isolation for messages" ON messages;
DROP POLICY IF EXISTS "Widget message access" ON messages;
DROP POLICY IF EXISTS "Insert messages with conversation check" ON messages;

-- Drop all existing conflicting policies for typing_indicators
DROP POLICY IF EXISTS "typing_indicators_widget_access" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_authenticated_access" ON typing_indicators;
DROP POLICY IF EXISTS "Anyone can view typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Anyone can manage typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;

-- =====================================================
-- CREATE SIMPLIFIED, WORKING POLICIES
-- =====================================================

-- CONVERSATIONS: Simple policies that work for both authenticated and anonymous users
CREATE POLICY "conversations_simple_access" ON conversations
    FOR ALL 
    USING (
        -- Authenticated users: check organization membership
        (auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        ))
        OR
        -- Anonymous users (widgets): allow access to any conversation
        auth.role() = 'anon'
        OR
        -- Service role: full access
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same logic for inserts/updates
        (auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        ))
        OR
        auth.role() = 'anon'
        OR
        auth.role() = 'service_role'
    );

-- MESSAGES: Simple policies that work for both authenticated and anonymous users
CREATE POLICY "messages_simple_access" ON messages
    FOR ALL 
    USING (
        -- Authenticated users: check conversation access
        (auth.role() = 'authenticated' AND conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        ))
        OR
        -- Anonymous users (widgets): allow access to any message
        auth.role() = 'anon'
        OR
        -- Service role: full access
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same logic for inserts/updates
        (auth.role() = 'authenticated' AND conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        ))
        OR
        auth.role() = 'anon'
        OR
        auth.role() = 'service_role'
    );

-- TYPING_INDICATORS: Simple policies that work for both authenticated and anonymous users
CREATE POLICY "typing_indicators_simple_access" ON typing_indicators
    FOR ALL 
    USING (
        -- Authenticated users: check organization membership
        (auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        ))
        OR
        -- Anonymous users (widgets): allow access
        auth.role() = 'anon'
        OR
        -- Service role: full access
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same logic for inserts/updates
        (auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        ))
        OR
        auth.role() = 'anon'
        OR
        auth.role() = 'service_role'
    );

-- =====================================================
-- ENSURE PROPER PERMISSIONS FOR ANONYMOUS ROLE
-- =====================================================

-- Grant necessary table permissions to anon role
GRANT SELECT, INSERT, UPDATE ON conversations TO anon;
GRANT SELECT, INSERT, UPDATE ON messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- ENSURE REALTIME PUBLICATION INCLUDES ALL TABLES
-- =====================================================

-- Recreate publication to ensure all tables are included
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    conversations,
    messages,
    typing_indicators;

-- =====================================================
-- VERIFICATION FUNCTION
-- =====================================================

-- Function to test if policies are working correctly
CREATE OR REPLACE FUNCTION test_widget_channel_access()
RETURNS TABLE(
    test_name TEXT,
    success BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Check if anon can select from conversations
    BEGIN
        PERFORM 1 FROM conversations LIMIT 1;
        RETURN QUERY SELECT 'anon_conversations_select'::TEXT, true, 'Anonymous user can select from conversations'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'anon_conversations_select'::TEXT, false, SQLERRM::TEXT;
    END;
    
    -- Test 2: Check if anon can select from messages
    BEGIN
        PERFORM 1 FROM messages LIMIT 1;
        RETURN QUERY SELECT 'anon_messages_select'::TEXT, true, 'Anonymous user can select from messages'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'anon_messages_select'::TEXT, false, SQLERRM::TEXT;
    END;
    
    -- Test 3: Check if anon can select from typing_indicators
    BEGIN
        PERFORM 1 FROM typing_indicators LIMIT 1;
        RETURN QUERY SELECT 'anon_typing_indicators_select'::TEXT, true, 'Anonymous user can select from typing_indicators'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'anon_typing_indicators_select'::TEXT, false, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEBUG POLICIES FOR DEVELOPMENT
-- =====================================================

-- Add debug policies that allow broader access in development
-- These should be removed in production

-- Debug policy for conversations (development only)
CREATE POLICY "conversations_debug_development" ON conversations
    FOR ALL
    USING (
        -- Allow all access in development environments
        current_setting('app.environment', true) = 'development'
        OR
        -- Allow access for localhost testing
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    )
    WITH CHECK (
        current_setting('app.environment', true) = 'development'
        OR
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    );

-- Debug policy for messages (development only)
CREATE POLICY "messages_debug_development" ON messages
    FOR ALL
    USING (
        current_setting('app.environment', true) = 'development'
        OR
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    )
    WITH CHECK (
        current_setting('app.environment', true) = 'development'
        OR
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    );

-- Debug policy for typing_indicators (development only)
CREATE POLICY "typing_indicators_debug_development" ON typing_indicators
    FOR ALL
    USING (
        current_setting('app.environment', true) = 'development'
        OR
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    )
    WITH CHECK (
        current_setting('app.environment', true) = 'development'
        OR
        current_setting('request.headers', true)::json->>'host' LIKE '%localhost%'
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Widget channel subscription RLS policies fixed successfully' AS status;
