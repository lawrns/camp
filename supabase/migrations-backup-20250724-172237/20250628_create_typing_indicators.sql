-- Create typing_indicators table for real-time typing status
-- This table tracks which users are currently typing in which conversations

-- Create the typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 seconds'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE typing_indicators IS 'Tracks real-time typing status for users in conversations';
COMMENT ON COLUMN typing_indicators.conversation_id IS 'The conversation where typing is occurring';
COMMENT ON COLUMN typing_indicators.user_id IS 'The user who is typing';
COMMENT ON COLUMN typing_indicators.organization_id IS 'The organization context for RLS policies';
COMMENT ON COLUMN typing_indicators.is_typing IS 'Whether the user is currently typing';
COMMENT ON COLUMN typing_indicators.started_at IS 'When the user started typing';
COMMENT ON COLUMN typing_indicators.expires_at IS 'Auto-expiry time to handle stale indicators';

-- Create indexes for performance
CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX idx_typing_indicators_organization_id ON typing_indicators(organization_id);
CREATE INDEX idx_typing_indicators_expires_at ON typing_indicators(expires_at);
CREATE INDEX idx_typing_indicators_conversation_user ON typing_indicators(conversation_id, user_id);

-- Create a unique constraint to prevent duplicate active typing indicators
CREATE UNIQUE INDEX idx_typing_indicators_unique_active 
  ON typing_indicators(conversation_id, user_id) 
  WHERE is_typing = true;

-- Enable Row Level Security
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view typing indicators for conversations they have access to
CREATE POLICY "Users can view typing indicators in their conversations" 
  ON typing_indicators
  FOR SELECT
  USING (
    -- User must be a member of the organization
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    AND
    -- User must have access to the conversation
    conversation_id IN (
      SELECT c.id 
      FROM conversations c
      WHERE c.organization_id = typing_indicators.organization_id
      AND (
        -- User is the initiator
        c.initiator_id = auth.uid()
        OR
        -- User is assigned to the conversation
        c.assignee_id = auth.uid()
        OR
        -- User has sent messages in the conversation
        EXISTS (
          SELECT 1 FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.sender_id = auth.uid()
        )
        OR
        -- User is an admin/owner of the organization
        EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = c.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Policy: Users can insert their own typing indicators
CREATE POLICY "Users can create their own typing indicators" 
  ON typing_indicators
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() = user_id
    AND
    -- User must be a member of the organization
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    AND
    -- User must have access to the conversation
    conversation_id IN (
      SELECT c.id 
      FROM conversations c
      WHERE c.organization_id = typing_indicators.organization_id
      AND (
        -- User is the initiator
        c.initiator_id = auth.uid()
        OR
        -- User is assigned to the conversation
        c.assignee_id = auth.uid()
        OR
        -- User has sent messages in the conversation
        EXISTS (
          SELECT 1 FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.sender_id = auth.uid()
        )
        OR
        -- User is an admin/owner of the organization
        EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = c.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Policy: Users can update their own typing indicators
CREATE POLICY "Users can update their own typing indicators" 
  ON typing_indicators
  FOR UPDATE
  USING (
    -- User can only update their own indicators
    user_id = auth.uid()
    AND
    -- User must be a member of the organization
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
  WITH CHECK (
    -- Ensure user_id cannot be changed
    user_id = auth.uid()
  );

-- Policy: Users can delete their own typing indicators
CREATE POLICY "Users can delete their own typing indicators" 
  ON typing_indicators
  FOR DELETE
  USING (
    -- User can only delete their own indicators
    user_id = auth.uid()
    AND
    -- User must be a member of the organization
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role can manage all typing indicators" 
  ON typing_indicators
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_typing_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_typing_indicators_updated_at_trigger
  BEFORE UPDATE ON typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_indicators_updated_at();

-- Create function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE expires_at < CURRENT_TIMESTAMP
  OR is_typing = false;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired indicators (requires pg_cron extension)
-- Note: This is commented out as pg_cron needs to be enabled separately
-- SELECT cron.schedule('cleanup-typing-indicators', '*/30 * * * *', 'SELECT cleanup_expired_typing_indicators()');

-- Grant necessary permissions
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON typing_indicators TO service_role;

-- Create Realtime publication for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;