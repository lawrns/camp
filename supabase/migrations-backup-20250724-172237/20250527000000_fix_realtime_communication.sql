-- Fix Real-time Communication Issues Migration
-- This migration addresses database schema issues for real-time communication

-- 1. Ensure conversations table has proper columns
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Ensure messages table has proper structure
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Create typing indicators table if not exists
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  visitor_id text,
  is_typing boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(visitor_id, ''))
);

-- 4. Create message delivery status table
CREATE TABLE IF NOT EXISTS message_delivery_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  visitor_id text,
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
  timestamp timestamptz DEFAULT now(),
  CONSTRAINT unique_delivery_status UNIQUE (message_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(visitor_id, ''))
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_message_id ON message_delivery_status(message_id);

-- 6. Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS message_delivery_status;

-- 7. Create function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updating last_message_at
DROP TRIGGER IF EXISTS update_last_message_at ON conversation_messages;
CREATE TRIGGER update_last_message_at
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_at();

-- 9. Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < now() - interval '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- 10. Create RLS policies
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_status ENABLE ROW LEVEL SECURITY;

-- RLS for typing_indicators
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.assignee_id = auth.uid() OR c.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
  FOR ALL USING (user_id = auth.uid());

-- RLS for message_delivery_status
CREATE POLICY "Users can view delivery status in their conversations" ON message_delivery_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_messages cm
      JOIN conversations c ON c.id = cm.conversation_id
      WHERE cm.id = message_delivery_status.message_id
      AND (c.assignee_id = auth.uid() OR c.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage their own delivery status" ON message_delivery_status
  FOR ALL USING (user_id = auth.uid());

-- 11. Grant permissions
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON message_delivery_status TO authenticated;
GRANT ALL ON typing_indicators TO anon;
GRANT ALL ON message_delivery_status TO anon;