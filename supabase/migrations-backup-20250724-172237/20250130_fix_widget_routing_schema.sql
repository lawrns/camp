-- Fix Widget-to-Agent Routing Schema Issues
-- This migration ensures proper relationships and schema for widget routing

-- 1. Ensure conversations table has all required fields
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- 2. Ensure messages table has organization_id for proper routing
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 3. Update existing widget conversations to have proper organization_id in messages
UPDATE messages 
SET organization_id = c.organization_id 
FROM conversations c 
WHERE messages.conversation_id = c.id 
AND messages.organization_id IS NULL;

-- 4. Ensure profiles table has proper foreign key to organizations
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- 5. Create index for better performance on widget queries
CREATE INDEX IF NOT EXISTS idx_conversations_organization_channel 
ON conversations(organization_id, channel);

CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id 
ON conversations(visitor_id) WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_organization_conversation 
ON messages(organization_id, conversation_id);

-- 6. Ensure marko@marko.com has proper organization setup
DO $$
DECLARE
    marko_profile_id UUID;
    marko_org_id UUID := '03874396-1b2d-4899-953d-f14fd39416a7';
BEGIN
    -- Check if marko's profile exists
    SELECT id INTO marko_profile_id 
    FROM profiles 
    WHERE email = 'marko@marko.com';
    
    IF marko_profile_id IS NOT NULL THEN
        -- Update marko's profile to have correct organization
        UPDATE profiles 
        SET organization_id = marko_org_id,
            updated_at = NOW()
        WHERE id = marko_profile_id;
        
        RAISE NOTICE 'Updated marko@marko.com profile with organization ID: %', marko_org_id;
    ELSE
        RAISE NOTICE 'marko@marko.com profile not found - will be created on next login';
    END IF;
    
    -- Ensure organization exists
    INSERT INTO organizations (id, name, created_at, updated_at)
    VALUES (marko_org_id, 'Marko Organization', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
        
    RAISE NOTICE 'Ensured organization exists: %', marko_org_id;
END $$;

-- 7. Create or update widget configuration for marko's organization
INSERT INTO widget_configurations (organization_id, is_public, allowed_origins, created_at, updated_at)
VALUES ('03874396-1b2d-4899-953d-f14fd39416a7', true, ARRAY['*'], NOW(), NOW())
ON CONFLICT (organization_id) DO UPDATE SET
    updated_at = NOW();

-- 8. Add RLS policies for widget conversations if not exists
DO $$
BEGIN
    -- Policy for widget conversations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations' 
        AND policyname = 'Widget conversations are accessible by organization members'
    ) THEN
        CREATE POLICY "Widget conversations are accessible by organization members"
        ON conversations FOR ALL
        USING (
            organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
            OR channel = 'widget' -- Allow widget access
        );
    END IF;
    
    -- Policy for widget messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Widget messages are accessible by organization members'
    ) THEN
        CREATE POLICY "Widget messages are accessible by organization members"
        ON messages FOR ALL
        USING (
            organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
            OR conversation_id IN (
                SELECT id FROM conversations WHERE channel = 'widget'
            )
        );
    END IF;
END $$;

-- 9. Create function to ensure message organization_id consistency
CREATE OR REPLACE FUNCTION ensure_message_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If organization_id is not set, get it from the conversation
    IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM conversations
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically set organization_id on messages
DROP TRIGGER IF EXISTS trigger_ensure_message_organization_id ON messages;
CREATE TRIGGER trigger_ensure_message_organization_id
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION ensure_message_organization_id();

-- 11. Update any existing messages that might be missing organization_id
UPDATE messages 
SET organization_id = c.organization_id 
FROM conversations c 
WHERE messages.conversation_id = c.id 
AND (messages.organization_id IS NULL OR messages.organization_id != c.organization_id);

-- 12. Add helpful indexes for widget performance
CREATE INDEX IF NOT EXISTS idx_conversations_metadata_source 
ON conversations USING GIN ((metadata->>'source')) 
WHERE metadata->>'source' = 'widget';

CREATE INDEX IF NOT EXISTS idx_messages_sender_type_visitor 
ON messages(conversation_id, created_at) 
WHERE sender_type = 'visitor';

-- 13. Create view for widget conversation summary (optional, for debugging)
CREATE OR REPLACE VIEW widget_conversation_summary AS
SELECT 
    c.id as conversation_id,
    c.organization_id,
    c.status,
    c.channel,
    c.visitor_id,
    c.customer_email,
    c.created_at,
    c.metadata->>'visitor_name' as visitor_name,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.channel = 'widget'
GROUP BY c.id, c.organization_id, c.status, c.channel, c.visitor_id, c.customer_email, c.created_at, c.metadata;

-- 14. Grant necessary permissions
GRANT SELECT ON widget_conversation_summary TO authenticated;
GRANT SELECT ON widget_conversation_summary TO anon;

-- 15. Add helpful comments
COMMENT ON COLUMN conversations.channel IS 'Communication channel: chat, email, widget, etc.';
COMMENT ON COLUMN conversations.visitor_id IS 'Widget visitor identifier for anonymous users';
COMMENT ON COLUMN messages.organization_id IS 'Organization ID for proper message routing and RLS';
COMMENT ON VIEW widget_conversation_summary IS 'Summary view of widget conversations for debugging and monitoring';

-- Migration completed
SELECT 'Widget routing schema migration completed successfully' as result;
