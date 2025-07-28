-- Add AI-related columns to conversations table for sophisticated AI system

-- Add AI handover columns
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assigned_to_ai BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_persona TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS ai_handover_session_id TEXT,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Update existing conversations with default values
UPDATE conversations 
SET 
  assigned_to_ai = FALSE,
  ai_confidence_score = 0.0
WHERE 
  assigned_to_ai IS NULL 
  OR ai_confidence_score IS NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to_ai 
ON conversations(assigned_to_ai) WHERE assigned_to_ai = true;

CREATE INDEX IF NOT EXISTS idx_conversations_ai_persona 
ON conversations(ai_persona);

CREATE INDEX IF NOT EXISTS idx_conversations_ai_confidence 
ON conversations(ai_confidence_score);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name IN ('assigned_to_ai', 'ai_persona', 'ai_confidence_score', 'ai_handover_session_id', 'escalation_reason')
ORDER BY column_name;
