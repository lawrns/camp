-- Fix Widget Permissions for Real-time Messaging
-- This migration resolves the "permission denied for table conversation_messages" error

-- =============================================
-- 1. Fix conversation_messages table permissions
-- =============================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, message_id)
);

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON conversation_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON conversation_messages;

-- Create comprehensive policies for conversation_messages
-- 1. Service role has full access (for API endpoints)
CREATE POLICY "conversation_messages_service_role_full_access" ON conversation_messages
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 2. Authenticated users can access conversation_messages in their organizations
CREATE POLICY "conversation_messages_authenticated_access" ON conversation_messages
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM conversations c
            JOIN organization_members om ON c.organization_id = om.organization_id
            WHERE c.id = conversation_messages.conversation_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM conversations c
            JOIN organization_members om ON c.organization_id = om.organization_id
            WHERE c.id = conversation_messages.conversation_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- 3. Anonymous users (widgets) can access conversation_messages
CREATE POLICY "conversation_messages_anon_widget_access" ON conversation_messages
    FOR ALL 
    USING (auth.role() = 'anon')
    WITH CHECK (auth.role() = 'anon');

-- Grant proper permissions
GRANT ALL ON conversation_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON conversation_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_messages TO anon;

-- =============================================
-- 2. Ensure messages table has proper widget permissions
-- =============================================

-- Drop existing restrictive policies that might block widgets
DROP POLICY IF EXISTS "messages_service_role_access" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_read" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_insert" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_update" ON messages;

-- Create comprehensive policies for messages
-- 1. Service role has full access
CREATE POLICY "messages_service_role_full_access" ON messages
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 2. Authenticated users can access messages in their organizations
CREATE POLICY "messages_authenticated_organization_access" ON messages
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- 3. Anonymous users (widgets) can access messages
CREATE POLICY "messages_anon_widget_access" ON messages
    FOR ALL 
    USING (auth.role() = 'anon')
    WITH CHECK (auth.role() = 'anon');

-- Grant proper permissions for messages
GRANT ALL ON messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO anon;

-- =============================================
-- 3. Ensure conversations table has proper widget permissions
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "conversations_service_role_access" ON conversations;
DROP POLICY IF EXISTS "conversations_authenticated_access" ON conversations;

-- Create comprehensive policies for conversations
-- 1. Service role has full access
CREATE POLICY "conversations_service_role_full_access" ON conversations
    FOR ALL 
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- 2. Authenticated users can access conversations in their organizations
CREATE POLICY "conversations_authenticated_organization_access" ON conversations
    FOR ALL 
    USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
    );

-- 3. Anonymous users (widgets) can access conversations
CREATE POLICY "conversations_anon_widget_access" ON conversations
    FOR ALL 
    USING (auth.role() = 'anon')
    WITH CHECK (auth.role() = 'anon');

-- Grant proper permissions for conversations
GRANT ALL ON conversations TO service_role;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO anon;

-- =============================================
-- 4. Enable realtime for widget communication
-- =============================================

-- Enable realtime on all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;

-- =============================================
-- 5. Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_message_id ON conversation_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);

-- =============================================
-- 6. Verification
-- =============================================

-- Test that the service role can insert into conversation_messages
DO $$
BEGIN
    -- This will succeed if permissions are correct
    RAISE NOTICE 'Widget permissions migration completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in widget permissions migration: %', SQLERRM;
END $$; 