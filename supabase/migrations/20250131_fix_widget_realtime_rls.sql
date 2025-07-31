-- Fix Widget Real-time RLS Policies
-- This migration adds proper RLS policies to support widget real-time connections

-- =====================================================
-- HELPER FUNCTIONS FOR WIDGET AUTHENTICATION
-- =====================================================

-- Function to extract organization_id from JWT for widget sessions
CREATE OR REPLACE FUNCTION get_widget_organization_id()
RETURNS UUID AS $$
BEGIN
  -- For authenticated users, use the standard function
  IF auth.role() = 'authenticated' THEN
    RETURN (auth.jwt() ->> 'organization_id')::UUID;
  END IF;
  
  -- For anonymous widget sessions, extract from JWT
  IF auth.role() = 'anon' THEN
    RETURN (auth.jwt() ->> 'organization_id')::UUID;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current session is a widget session
CREATE OR REPLACE FUNCTION is_widget_session()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'anon' AND 
         (auth.jwt() ->> 'organization_id') IS NOT NULL AND
         (auth.jwt() ->> 'iss') = 'campfire-widget';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONVERSATIONS TABLE RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view conversations in their workspace" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations in their workspace" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their workspace" ON conversations;

-- Create comprehensive policies for conversations
-- 1. Authenticated users can access conversations in their organization
CREATE POLICY "conversations_authenticated_access" ON conversations
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 2. Widget sessions can access conversations in their organization context
CREATE POLICY "conversations_widget_access" ON conversations
    FOR ALL 
    USING (
        is_widget_session() AND
        organization_id = get_widget_organization_id()
    )
    WITH CHECK (
        is_widget_session() AND
        organization_id = get_widget_organization_id()
    );

-- 3. Service role has full access (for API endpoints)
CREATE POLICY "conversations_service_role_access" ON conversations
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- MESSAGES TABLE RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view messages in accessible conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations" ON messages;

-- Create comprehensive policies for messages
-- 1. Authenticated users can access messages in their organization's conversations
CREATE POLICY "messages_authenticated_access" ON messages
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

-- 2. Widget sessions can access messages in their organization's conversations
CREATE POLICY "messages_widget_access" ON messages
    FOR ALL 
    USING (
        is_widget_session() AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id = get_widget_organization_id()
        )
    )
    WITH CHECK (
        is_widget_session() AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id = get_widget_organization_id()
        )
    );

-- 3. Service role has full access (for API endpoints)
CREATE POLICY "messages_service_role_access" ON messages
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- TYPING INDICATORS TABLE RLS POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view typing indicators in their workspace" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;

-- Create comprehensive policies for typing indicators
-- 1. Authenticated users can access typing indicators in their organization
CREATE POLICY "typing_indicators_authenticated_access" ON typing_indicators
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 2. Widget sessions can access typing indicators in their organization
CREATE POLICY "typing_indicators_widget_access" ON typing_indicators
    FOR ALL 
    USING (
        is_widget_session() AND
        organization_id = get_widget_organization_id()
    )
    WITH CHECK (
        is_widget_session() AND
        organization_id = get_widget_organization_id()
    );

-- 3. Service role has full access
CREATE POLICY "typing_indicators_service_role_access" ON typing_indicators
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- ENSURE REALTIME PUBLICATION INCLUDES ALL TABLES
-- =====================================================

-- Ensure all tables are included in the realtime publication
DO $$
BEGIN
    -- Add tables to supabase_realtime publication if they're not already included
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'typing_indicators'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
    END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS FOR REALTIME
-- =====================================================

-- Grant necessary permissions for anon role (widget sessions)
GRANT SELECT ON conversations TO anon;
GRANT INSERT ON conversations TO anon;
GRANT UPDATE ON conversations TO anon;

GRANT SELECT ON messages TO anon;
GRANT INSERT ON messages TO anon;
GRANT UPDATE ON messages TO anon;

GRANT SELECT ON typing_indicators TO anon;
GRANT INSERT ON typing_indicators TO anon;
GRANT UPDATE ON typing_indicators TO anon;
GRANT DELETE ON typing_indicators TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- VERIFICATION QUERIES (FOR TESTING)
-- =====================================================

-- These queries can be used to verify the policies work correctly
-- (They will be commented out in production)

/*
-- Test widget session detection
SELECT is_widget_session() as is_widget, get_widget_organization_id() as org_id;

-- Test conversation access for widget
SELECT id, organization_id, status 
FROM conversations 
WHERE organization_id = get_widget_organization_id()
LIMIT 5;

-- Test message access for widget
SELECT m.id, m.content, c.organization_id 
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.organization_id = get_widget_organization_id()
LIMIT 5;
*/
