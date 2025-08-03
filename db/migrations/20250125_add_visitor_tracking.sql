-- Migration: Add visitor tracking to conversations table
-- Date: 2025-01-25
-- Purpose: Enable persistent visitor identification and conversation continuity

-- Add visitor tracking columns to conversations table
ALTER TABLE conversations ADD COLUMN visitor_id TEXT;
ALTER TABLE conversations ADD COLUMN session_fingerprint TEXT;
ALTER TABLE conversations ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for efficient visitor lookup
CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_session_fingerprint ON conversations(session_fingerprint);
CREATE INDEX idx_conversations_org_visitor_status ON conversations(organization_id, visitor_id, status);

-- Update existing conversations to have last_activity_at based on created_at
UPDATE conversations SET last_activity_at = created_at WHERE last_activity_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN conversations.visitor_id IS 'Persistent visitor identifier for conversation continuity';
COMMENT ON COLUMN conversations.session_fingerprint IS 'Browser fingerprint for session tracking';
COMMENT ON COLUMN conversations.last_activity_at IS 'Timestamp of last activity in conversation';

-- Create function to automatically update last_activity_at
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity_at on message insert
CREATE TRIGGER trigger_update_conversation_activity
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_activity();
