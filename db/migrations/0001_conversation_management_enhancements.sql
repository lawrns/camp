-- Conversation Management Enhancements
-- Adds proper enums, notes, history, and improved tagging
-- Applied to Supabase database on 2025-01-01

-- Create enums for better type safety
CREATE TYPE conversation_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE conversation_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed', 'snoozed');

-- Create tags table for proper tag management
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_tags junction table
CREATE TABLE IF NOT EXISTS conversation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, tag_id)
);

-- Create conversation_notes table
CREATE TABLE IF NOT EXISTS conversation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_history table for audit trail
CREATE TABLE IF NOT EXISTS conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation_id ON conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag_id ON conversation_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_conversation_id ON conversation_notes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_conversation_id ON conversation_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);

-- Update existing conversations table to use new enums
-- Note: This was done with temporary columns due to trigger conflicts

-- Step 1: Temporarily disable trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Step 2: Convert priority column
ALTER TABLE conversations ADD COLUMN priority_new conversation_priority DEFAULT 'medium';
UPDATE conversations SET priority_new = 
    CASE 
        WHEN priority = 'low' THEN 'low'::conversation_priority
        WHEN priority = 'medium' THEN 'medium'::conversation_priority
        WHEN priority = 'high' THEN 'high'::conversation_priority
        WHEN priority = 'urgent' THEN 'urgent'::conversation_priority
        WHEN priority = 'critical' THEN 'critical'::conversation_priority
        ELSE 'medium'::conversation_priority
    END;
ALTER TABLE conversations DROP COLUMN priority;
ALTER TABLE conversations RENAME COLUMN priority_new TO priority;

-- Step 3: Convert status column
ALTER TABLE conversations ADD COLUMN status_new conversation_status DEFAULT 'open';
UPDATE conversations SET status_new = 
    CASE 
        WHEN status = 'open' THEN 'open'::conversation_status
        WHEN status = 'in_progress' THEN 'in_progress'::conversation_status
        WHEN status = 'waiting' THEN 'waiting'::conversation_status
        WHEN status = 'resolved' THEN 'resolved'::conversation_status
        WHEN status = 'closed' THEN 'closed'::conversation_status
        WHEN status = 'snoozed' THEN 'snoozed'::conversation_status
        ELSE 'open'::conversation_status
    END;
ALTER TABLE conversations DROP COLUMN status;
ALTER TABLE conversations RENAME COLUMN status_new TO status;

-- Step 4: Recreate trigger with correct column name
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully
