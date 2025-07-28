-- Track A: Performance Optimization Migration - lastMessage* columns and indexes
-- Date: 2025-06-03
-- Purpose: Add lastMessage columns and optimize conversation queries

BEGIN;

-- ============================================================================
-- 1. ADD LAST MESSAGE COLUMNS TO CONVERSATIONS
-- ============================================================================

-- Add columns to track last message info for faster inbox loading
ALTER TABLE conversations_conversation 
ADD COLUMN IF NOT EXISTS last_message_id BIGINT,
ADD COLUMN IF NOT EXISTS last_message_content TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_message_sender_type TEXT,
ADD COLUMN IF NOT EXISTS last_message_sender_name TEXT;

-- Add foreign key constraint for last_message_id
ALTER TABLE conversations_conversation 
ADD CONSTRAINT fk_last_message_id 
FOREIGN KEY (last_message_id) 
REFERENCES messages_message(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index for fast conversation listing with last message data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_mailbox_last_message_at
ON conversations_conversation(mailbox_id, last_message_at DESC NULLS LAST)
WHERE deleted_at IS NULL;

-- Index for status-based conversation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status_last_message
ON conversations_conversation(status, last_message_at DESC NULLS LAST)
WHERE deleted_at IS NULL;

-- Composite index for assigned conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_assigned_last_message
ON conversations_conversation(assigned_to_id, last_message_at DESC NULLS LAST)
WHERE assigned_to_id IS NOT NULL AND deleted_at IS NULL;

-- Index for AI-assigned conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_ai_last_message
ON conversations_conversation(assigned_to_ai, last_message_at DESC NULLS LAST)
WHERE assigned_to_ai = true AND deleted_at IS NULL;

-- Index for RAG-enabled conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_rag_last_message
ON conversations_conversation(rag_enabled, last_message_at DESC NULLS LAST)
WHERE rag_enabled = true AND deleted_at IS NULL;

-- ============================================================================
-- 3. CREATE FUNCTION TO UPDATE LAST MESSAGE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is the most recent message
  IF NEW.created_at >= COALESCE(
    (SELECT last_message_at FROM conversations_conversation WHERE id = NEW.conversation_id),
    '1970-01-01'::timestamp
  ) THEN
    UPDATE conversations_conversation 
    SET 
      last_message_id = NEW.id,
      last_message_content = LEFT(NEW.content, 500), -- Truncate for performance
      last_message_at = NEW.created_at,
      last_message_sender_type = NEW.sender_type,
      last_message_sender_name = NEW.sender_name,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC UPDATES
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages_message;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT OR UPDATE ON messages_message
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- 5. BACKFILL EXISTING DATA
-- ============================================================================

-- Backfill last message data for existing conversations
UPDATE conversations_conversation 
SET 
  last_message_id = subq.last_message_id,
  last_message_content = LEFT(subq.content, 500),
  last_message_at = subq.created_at,
  last_message_sender_type = subq.sender_type,
  last_message_sender_name = subq.sender_name
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    id as last_message_id,
    content,
    created_at,
    sender_type,
    sender_name
  FROM messages_message 
  WHERE deleted_at IS NULL
  ORDER BY conversation_id, created_at DESC
) subq
WHERE conversations_conversation.id = subq.conversation_id;

-- ============================================================================
-- 6. ADD PERFORMANCE MONITORING
-- ============================================================================

-- Create view for monitoring last message performance
CREATE OR REPLACE VIEW v_conversation_last_message_stats AS
SELECT 
  COUNT(*) as total_conversations,
  COUNT(last_message_id) as conversations_with_last_message,
  ROUND(
    (COUNT(last_message_id)::decimal / COUNT(*)) * 100, 2
  ) as coverage_percentage,
  MAX(last_message_at) as latest_message,
  MIN(last_message_at) as oldest_message
FROM conversations_conversation
WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. UPDATE STATISTICS AND ANALYZE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE conversations_conversation;
ANALYZE messages_message;

-- Add comments for documentation
COMMENT ON COLUMN conversations_conversation.last_message_id IS 'Foreign key to the most recent message in this conversation';
COMMENT ON COLUMN conversations_conversation.last_message_content IS 'Truncated content of the last message for quick display';
COMMENT ON COLUMN conversations_conversation.last_message_at IS 'Timestamp of the last message for sorting';
COMMENT ON COLUMN conversations_conversation.last_message_sender_type IS 'Type of sender for the last message (user, agent, ai)';
COMMENT ON COLUMN conversations_conversation.last_message_sender_name IS 'Name of the sender for the last message';

COMMENT ON FUNCTION update_conversation_last_message() IS 'Trigger function to maintain last message data in conversations table';
COMMENT ON VIEW v_conversation_last_message_stats IS 'Monitoring view for last message data coverage';

COMMIT;