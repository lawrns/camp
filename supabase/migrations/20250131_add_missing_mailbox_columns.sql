-- Add missing columns to mailboxes table to match Supabase types
-- Migration: 20250131_add_missing_mailbox_columns.sql

-- Add description column
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add settings column
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add agent_id column
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS agent_id UUID;

-- Add auto_assignment column
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS auto_assignment BOOLEAN DEFAULT false;

-- Add max_queue_size column
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS max_queue_size INTEGER DEFAULT 100;

-- Add comments for documentation
COMMENT ON COLUMN mailboxes.description IS 'Optional description for the mailbox';
COMMENT ON COLUMN mailboxes.settings IS 'JSON settings for mailbox configuration';
COMMENT ON COLUMN mailboxes.agent_id IS 'ID of the assigned AI agent';
COMMENT ON COLUMN mailboxes.auto_assignment IS 'Whether conversations are auto-assigned';
COMMENT ON COLUMN mailboxes.max_queue_size IS 'Maximum number of conversations in queue'; 