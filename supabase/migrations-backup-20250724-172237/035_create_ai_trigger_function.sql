-- First, ensure the messages table exists before creating triggers
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    -- Message content and metadata
    content TEXT NOT NULL,
    sender_id TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai_assistant', 'tool')),
    sender_name TEXT,
    sender_email TEXT,

    -- Message properties
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response', 'handover')),
    content_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',

    -- Flags
    is_internal BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,

    -- AI-related fields
    confidence_score FLOAT,
    escalation_required BOOLEAN DEFAULT false,
    ai_metadata JSONB DEFAULT '{}',
    assignedtoai BOOLEAN DEFAULT false,

    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure conversations table exists
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    mailbox_id INTEGER,

    -- Conversation properties
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'pending')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Assignment
    assignee_type TEXT DEFAULT 'human',
    assignee_id TEXT,
    assigned_agent_id UUID,

    -- Customer information
    customer JSONB DEFAULT '{}',
    customer_id UUID,
    customer_email TEXT,
    customer_name TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    rag_enabled BOOLEAN DEFAULT false,
    ticket_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_conversation_id_fkey'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_conversation_id_fkey
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create AI trigger function for autonomous responses
CREATE OR REPLACE FUNCTION notify_ai_needed()
RETURNS trigger AS $$
BEGIN
  IF NEW.sender_type = 'visitor' THEN
    PERFORM extensions.http_post(
      'https://yvntokkncxbhapqjesti.supabase.co/functions/v1/ai-processor'::text,
      jsonb_build_object(
         'conversation_id', NEW.conversation_id,
         'user_msg', NEW.content
      ),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NTE1NCwiZXhwIjoyMDYwMDYxMTU0fQ.JSWc3lQWc3qKQaju1gGu7MSLhZn41DDd24n5Ojm0KLQ'
      ),
      '{}'::jsonb,
      5000
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on messages table (now that it exists)
DROP TRIGGER IF EXISTS trigger_ai_needed ON messages;
CREATE TRIGGER trigger_ai_needed
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_ai_needed();
