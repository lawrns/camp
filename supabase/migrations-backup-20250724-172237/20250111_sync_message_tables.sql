-- Sync messages between messages and campfire_messages tables
-- This ensures messages are visible regardless of which table the API queries

-- First, let's check if both tables exist and create campfire_messages if needed
CREATE TABLE IF NOT EXISTS campfire_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system')),
  sender_id TEXT,
  sender_name TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  message_type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'sent',
  is_deleted BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for campfire_messages if they don't exist
CREATE INDEX IF NOT EXISTS idx_campfire_messages_conversation_id ON campfire_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_campfire_messages_organization_id ON campfire_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_campfire_messages_created_at ON campfire_messages(created_at DESC);

-- Enable RLS on campfire_messages
ALTER TABLE campfire_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campfire_messages (matching messages table policies)
CREATE POLICY IF NOT EXISTS "Users can read messages in their organization"
ON campfire_messages
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Service role can manage all messages"
ON campfire_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to sync message inserts
CREATE OR REPLACE FUNCTION sync_message_tables() 
RETURNS TRIGGER AS $$
DECLARE
  target_record RECORD;
BEGIN
  -- Prepare the record with consistent field names
  IF TG_TABLE_NAME = 'messages' THEN
    -- Sync from messages to campfire_messages
    INSERT INTO campfire_messages (
      id, conversation_id, organization_id, sender_type, 
      sender_id, sender_name, content, metadata, 
      message_type, status, is_deleted, is_private, 
      is_internal, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.conversation_id, NEW.organization_id, 
      NEW.sender_type, NEW.sender_id, NEW.sender_name, 
      NEW.content, NEW.metadata, NEW.message_type, 
      NEW.status, NEW.is_deleted, NEW.is_private, 
      NEW.is_internal, NEW.created_at, NEW.updated_at
    ) ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      updated_at = EXCLUDED.updated_at;
      
  ELSIF TG_TABLE_NAME = 'campfire_messages' THEN
    -- Sync from campfire_messages to messages
    -- First check if messages table has all required columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'organization_id'
    ) THEN
      INSERT INTO messages (
        id, conversation_id, organization_id, sender_type, 
        sender_id, sender_name, content, metadata, 
        message_type, status, is_deleted, is_private, 
        is_internal, created_at, updated_at
      ) VALUES (
        NEW.id, NEW.conversation_id, NEW.organization_id, 
        NEW.sender_type, NEW.sender_id, NEW.sender_name, 
        NEW.content, NEW.metadata, NEW.message_type, 
        NEW.status, NEW.is_deleted, NEW.is_private, 
        NEW.is_internal, NEW.created_at, NEW.updated_at
      ) ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the original insert
    RAISE WARNING 'Message sync failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bidirectional sync
DROP TRIGGER IF EXISTS sync_messages_to_campfire ON messages;
CREATE TRIGGER sync_messages_to_campfire
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION sync_message_tables();

DROP TRIGGER IF EXISTS sync_campfire_to_messages ON campfire_messages;
CREATE TRIGGER sync_campfire_to_messages
AFTER INSERT OR UPDATE ON campfire_messages
FOR EACH ROW
EXECUTE FUNCTION sync_message_tables();

-- Sync existing messages (one-time operation)
-- From messages to campfire_messages
INSERT INTO campfire_messages (
  id, conversation_id, organization_id, sender_type, 
  sender_id, sender_name, content, metadata, 
  message_type, status, is_deleted, is_private, 
  is_internal, created_at, updated_at
)
SELECT 
  id, conversation_id, organization_id, sender_type, 
  sender_id, sender_name, content, metadata, 
  message_type, status, is_deleted, is_private, 
  is_internal, created_at, updated_at
FROM messages
WHERE NOT EXISTS (
  SELECT 1 FROM campfire_messages 
  WHERE campfire_messages.id = messages.id
);

-- From campfire_messages to messages (if messages has all columns)
INSERT INTO messages (
  id, conversation_id, organization_id, sender_type, 
  sender_id, sender_name, content, metadata, 
  message_type, status, is_deleted, is_private, 
  is_internal, created_at, updated_at
)
SELECT 
  id, conversation_id, organization_id, sender_type, 
  sender_id, sender_name, content, metadata, 
  message_type, status, is_deleted, is_private, 
  is_internal, created_at, updated_at
FROM campfire_messages
WHERE NOT EXISTS (
  SELECT 1 FROM messages 
  WHERE messages.id = campfire_messages.id
)
AND EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'messages' 
  AND column_name = 'organization_id'
);