-- Fix typing_indicators table schema
-- Add missing visitor_id column and other required fields

-- First, check if the table exists and add missing columns
ALTER TABLE typing_indicators 
ADD COLUMN IF NOT EXISTS visitor_id text,
ADD COLUMN IF NOT EXISTS user_name text,
ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'visitor',
ADD COLUMN IF NOT EXISTS content text DEFAULT '';

-- Update the unique constraint to handle both user_id and visitor_id
DROP CONSTRAINT IF EXISTS unique_typing_indicator;

-- Create new constraint that works with nullable fields
ALTER TABLE typing_indicators 
ADD CONSTRAINT unique_typing_indicator_v2 
UNIQUE (conversation_id, COALESCE(user_id::text, ''), COALESCE(visitor_id, ''));

-- Update RLS policies to handle visitor_id
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "View typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Manage own typing indicators" ON typing_indicators;

-- Create comprehensive RLS policies
CREATE POLICY "Anyone can view typing indicators" ON typing_indicators
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage typing indicators" ON typing_indicators
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON typing_indicators TO anon;

-- Ensure realtime is enabled
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_visitor_id ON typing_indicators(visitor_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_visitor ON typing_indicators(conversation_id, visitor_id);
