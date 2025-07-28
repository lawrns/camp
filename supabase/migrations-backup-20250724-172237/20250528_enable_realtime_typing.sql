-- Enable realtime for typing_indicators table
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Grant necessary permissions
GRANT SELECT ON typing_indicators TO authenticated;
GRANT INSERT ON typing_indicators TO authenticated;
GRANT UPDATE ON typing_indicators TO authenticated;
GRANT DELETE ON typing_indicators TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for typing indicators
DROP POLICY IF EXISTS "typing_indicators_authenticated_all" ON typing_indicators;

CREATE POLICY "typing_indicators_authenticated_all" ON typing_indicators
  FOR ALL USING (true) WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_updated 
  ON typing_indicators(conversation_id, updated_at DESC);