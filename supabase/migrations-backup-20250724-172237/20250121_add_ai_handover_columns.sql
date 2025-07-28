-- Add AI handover columns to conversations table
-- This migration adds the necessary columns for AI handover functionality

-- Add AI-related columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS ai_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ai_last_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_handover_reason TEXT;

-- Create AI handover events table for tracking
CREATE TABLE IF NOT EXISTS ai_handover_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('enable', 'disable')),
    reason VARCHAR(100),
    previous_ai_active BOOLEAN,
    new_ai_active BOOLEAN,
    confidence_at_handover FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_ai_active ON conversations(ai_active);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_handover_events_conversation ON ai_handover_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_handover_events_org ON ai_handover_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_handover_events_created ON ai_handover_events(created_at DESC);

-- Enable RLS on ai_handover_events table
ALTER TABLE ai_handover_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_handover_events (organization isolation)
CREATE POLICY "ai_handover_events_org_isolation" ON ai_handover_events
    FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Update existing conversations to have default AI state
UPDATE conversations 
SET ai_active = false, ai_confidence_score = 0.0 
WHERE ai_active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN conversations.ai_active IS 'Whether AI is currently handling this conversation';
COMMENT ON COLUMN conversations.ai_confidence_score IS 'AI confidence score for current conversation state (0.0-1.0)';
COMMENT ON COLUMN conversations.assigned_agent_id IS 'Agent assigned when AI is disabled';
COMMENT ON COLUMN conversations.ai_last_response_at IS 'Timestamp of last AI response';
COMMENT ON COLUMN conversations.ai_handover_reason IS 'Reason for last AI handover action';
COMMENT ON TABLE ai_handover_events IS 'Tracks AI handover events for analytics and auditing';
