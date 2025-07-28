-- =====================================================
-- 🔧 CRITICAL FIX: Normalized State Schema Migration
-- =====================================================
-- This migration adds missing columns required for the 
-- consolidated real-time messaging architecture
--
-- Date: 2025-06-21
-- Purpose: Support normalized state structure in unified-campfire-store
-- Impact: Enables fast conversation preview lookups and unread counting

-- =====================================================
-- 1️⃣ ADD MISSING COLUMNS TO CONVERSATIONS TABLE
-- =====================================================

-- Add last_message_preview for fast preview lookups
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Add unread_count for efficient unread message counting
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN conversations.last_message_preview IS 'Cached preview of the last message content (max 100 chars) for fast UI rendering';
COMMENT ON COLUMN conversations.unread_count IS 'Count of unread messages in this conversation for efficient badge display';

-- =====================================================
-- 2️⃣ CREATE PERFORMANCE INDEXES
-- =====================================================

-- Index for unread conversations filtering
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count 
ON conversations(organization_id, unread_count) 
WHERE unread_count > 0;

-- Index for conversation list ordering with previews
CREATE INDEX IF NOT EXISTS idx_conversations_org_updated_preview 
ON conversations(organization_id, updated_at DESC, last_message_preview);

-- =====================================================
-- 3️⃣ CREATE TRIGGER FUNCTION FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update conversation preview and unread count
CREATE OR REPLACE FUNCTION update_conversation_preview()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation with new message info
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW(),
    -- Increment unread count only for visitor messages
    unread_count = CASE 
      WHEN NEW.sender_type = 'visitor' THEN COALESCE(unread_count, 0) + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic preview updates
DROP TRIGGER IF EXISTS update_conversation_preview_trigger ON messages;
CREATE TRIGGER update_conversation_preview_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_preview();

-- =====================================================
-- 4️⃣ BACKFILL EXISTING DATA
-- =====================================================

-- Update existing conversations with last message previews
UPDATE conversations 
SET 
  last_message_preview = (
    SELECT LEFT(content, 100)
    FROM messages 
    WHERE messages.conversation_id = conversations.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  unread_count = (
    SELECT COUNT(*)
    FROM messages 
    WHERE messages.conversation_id = conversations.id 
    AND messages.sender_type = 'visitor'
    -- Consider messages from last 30 days as potentially unread
    AND messages.created_at > NOW() - INTERVAL '30 days'
  )
WHERE id IN (
  SELECT DISTINCT conversation_id 
  FROM messages 
  WHERE conversation_id IS NOT NULL
);

-- =====================================================
-- 5️⃣ CREATE HELPER FUNCTIONS FOR UNREAD MANAGEMENT
-- =====================================================

-- Function to mark conversation as read (reset unread count)
CREATE OR REPLACE FUNCTION mark_conversation_read(conv_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations 
  SET unread_count = 0, updated_at = NOW()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count for organization
CREATE OR REPLACE FUNCTION get_organization_unread_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(unread_count), 0)
    FROM conversations 
    WHERE organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6️⃣ VALIDATE MIGRATION SUCCESS
-- =====================================================

-- Check that columns were added successfully
DO $$
DECLARE
  preview_exists BOOLEAN;
  unread_exists BOOLEAN;
BEGIN
  -- Check if last_message_preview column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message_preview'
  ) INTO preview_exists;
  
  -- Check if unread_count column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'unread_count'
  ) INTO unread_exists;
  
  -- Raise notice about migration status
  IF preview_exists AND unread_exists THEN
    RAISE NOTICE '✅ Migration successful: Both columns added to conversations table';
  ELSE
    RAISE EXCEPTION '❌ Migration failed: Missing columns in conversations table';
  END IF;
END $$;

-- =====================================================
-- 7️⃣ GRANT PERMISSIONS
-- =====================================================

-- Ensure service role can access new columns
GRANT SELECT, UPDATE ON conversations TO service_role;
GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_organization_unread_count(UUID) TO service_role;

-- Ensure authenticated users can read new columns
GRANT SELECT ON conversations TO authenticated;

-- =====================================================
-- 8️⃣ MIGRATION COMPLETION LOG
-- =====================================================

-- Log successful migration
INSERT INTO public.migration_log (
  migration_name,
  applied_at,
  description,
  status
) VALUES (
  '20250621_fix_normalized_state_schema',
  NOW(),
  'Added last_message_preview and unread_count columns to conversations table for normalized state architecture',
  'completed'
) ON CONFLICT DO NOTHING;

-- Final success message
RAISE NOTICE '🎉 Normalized State Schema Migration Completed Successfully!';
RAISE NOTICE '📊 Conversations table now supports fast preview lookups and unread counting';
RAISE NOTICE '⚡ Performance indexes created for optimal query speed';
RAISE NOTICE '🔄 Automatic triggers configured for real-time updates';
