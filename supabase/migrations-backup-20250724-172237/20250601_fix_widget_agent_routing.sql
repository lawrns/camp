-- Fix Widget to Agent Dashboard Routing
-- This migration ensures proper message flow from widget to agent dashboard

-- 1. Ensure conversations table has all required columns for both widget and agent dashboard
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assignee_id UUID,
ADD COLUMN IF NOT EXISTS assignee_type TEXT DEFAULT 'human',
ADD COLUMN IF NOT EXISTS initiator_id UUID,
ADD COLUMN IF NOT EXISTS initiator_type TEXT DEFAULT 'visitor',
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'widget',
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Ensure messages table has all required columns
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS sender_id UUID,
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'visitor',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_assignee_id ON conversations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_assignee ON conversations(organization_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status_updated ON conversations(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_organization_sender ON messages(organization_id, sender_type);

-- 4. Create trigger to auto-assign new widget conversations
CREATE OR REPLACE FUNCTION auto_assign_widget_conversation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-assign if it's a widget conversation and not already assigned
    IF NEW.channel = 'widget' AND NEW.assignee_id IS NULL THEN
        NEW.assignee_id := assign_conversation_to_available_agent(NEW.id, NEW.organization_id);
        NEW.assignee_type := 'human';
        NEW.status := 'open';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_widget_conversation ON conversations;
CREATE TRIGGER trigger_auto_assign_widget_conversation
    BEFORE INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_widget_conversation();

-- 5. Create function to handle widget message creation with proper routing
CREATE OR REPLACE FUNCTION create_widget_message(
    p_conversation_id UUID,
    p_organization_id UUID,
    p_content TEXT,
    p_sender_type TEXT DEFAULT 'visitor',
    p_sender_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_conversation_exists BOOLEAN;
BEGIN
    -- Generate message ID
    v_message_id := gen_random_uuid();
    
    -- Check if conversation exists
    SELECT EXISTS(SELECT 1 FROM conversations WHERE id = p_conversation_id) INTO v_conversation_exists;
    
    IF NOT v_conversation_exists THEN
        RAISE EXCEPTION 'Conversation % does not exist', p_conversation_id;
    END IF;
    
    -- Insert message
    INSERT INTO messages (
        id,
        conversation_id,
        organization_id,
        content,
        sender_type,
        sender_id,
        message_type,
        metadata,
        is_deleted,
        is_private,
        created_at,
        updated_at
    ) VALUES (
        v_message_id,
        p_conversation_id,
        p_organization_id,
        p_content,
        p_sender_type,
        p_sender_id,
        'text',
        p_metadata,
        false,
        false,
        NOW(),
        NOW()
    );
    
    -- Update conversation last_message_at
    UPDATE conversations 
    SET last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Update RLS policies for widget access
-- Allow widget to create conversations
CREATE POLICY "Allow widget conversation creation" ON conversations
    FOR INSERT WITH CHECK (
        channel = 'widget' AND 
        organization_id IS NOT NULL
    );

-- Allow widget to create messages
CREATE POLICY "Allow widget message creation" ON messages
    FOR INSERT WITH CHECK (
        sender_type IN ('visitor', 'customer') AND
        organization_id IS NOT NULL
    );

-- Allow agents to view widget conversations
CREATE POLICY "Agents can view widget conversations" ON conversations
    FOR SELECT USING (
        assignee_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid() AND role = 'agent'
        )
    );

-- Allow agents to view widget messages
CREATE POLICY "Agents can view widget messages" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE assignee_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid() AND role = 'agent'
            )
        )
    );

-- 7. Enable realtime for widget conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 8. Create notification function for new widget messages
CREATE OR REPLACE FUNCTION notify_agent_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_assignee_id UUID;
    v_organization_id UUID;
BEGIN
    -- Get conversation details
    SELECT assignee_id, organization_id 
    INTO v_assignee_id, v_organization_id
    FROM conversations 
    WHERE id = NEW.conversation_id;
    
    -- Notify assigned agent if message is from visitor/customer
    IF NEW.sender_type IN ('visitor', 'customer') AND v_assignee_id IS NOT NULL THEN
        -- This will trigger realtime notifications
        PERFORM pg_notify(
            'agent_message_' || v_assignee_id::text,
            json_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'content', NEW.content,
                'sender_type', NEW.sender_type,
                'organization_id', v_organization_id
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agent notifications
DROP TRIGGER IF EXISTS trigger_notify_agent_new_message ON messages;
CREATE TRIGGER trigger_notify_agent_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_agent_new_message();

-- 9. Ensure marko@marko.com has proper agent availability record
INSERT INTO agent_availability (
    agent_id,
    organization_id,
    status,
    auto_assign,
    max_concurrent_chats,
    current_chat_count,
    priority_score,
    working_hours,
    timezone,
    last_active,
    updated_at
) VALUES (
    '968ec5a9-d8cd-44d7-9fde-1ba06bef5844', -- marko's user_id
    '0690e12c-9aaf-4c12-9c2a-8bfa8f14db16', -- correct organization_id
    'online',
    true,
    10,
    0,
    100,
    '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}'::jsonb,
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (agent_id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    status = 'online',
    auto_assign = true,
    updated_at = NOW();
