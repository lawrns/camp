-- Migration: Fix RAG Handover System
-- Description: Fixes all database trigger issues, missing functions, and schema inconsistencies
-- Created: 2025-06-10T12:00:00Z

-- =====================================
-- 1. Fix AI Message Trigger (use 'messages' table with correct columns)
-- =====================================

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS ai_message_trigger ON messages;
DROP TRIGGER IF EXISTS ai_message_trigger ON conversation_messages;

-- Drop the old function
DROP FUNCTION IF EXISTS notify_ai_message();

-- Create the corrected AI message notification function
CREATE OR REPLACE FUNCTION notify_ai_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process user messages in AI-enabled conversations
  -- Use 'role' column from messages table (not sender_type)
  IF (NEW.role = 'user') AND 
     NOT (NEW.metadata ? 'ai_generated' AND (NEW.metadata->>'ai_generated')::boolean = true) THEN
    
    -- Check if conversation has AI enabled via campfire_handoffs or ai_sessions
    IF EXISTS (
      SELECT 1 FROM campfire_handoffs h
      WHERE h.conversation_id = NEW.conversation_id::text
      AND h.ai_active = true
      AND h.status = 'active'
    ) OR EXISTS (
      SELECT 1 FROM ai_sessions s
      WHERE s.conversation_id = NEW.conversation_id::text
      AND s.status = 'active'
    ) THEN
    
      -- Send notification to AI handler via PostgreSQL NOTIFY
      PERFORM pg_notify('ai_message_queue', 
        json_build_object(
          'messageId', NEW.id,
          'conversationId', NEW.conversation_id,
          'content', COALESCE(NEW.body, NEW.clean_up_text, ''), -- Use 'body' or fallback
          'role', NEW.role,
          'createdAt', NEW.created_at,
          'metadata', NEW.metadata
        )::text
      );
      
      -- Log the trigger activation for debugging
      INSERT INTO ai_processing_logs (
        message_id,
        conversation_id,
        trigger_type,
        status,
        created_at
      ) VALUES (
        NEW.id::text,
        NEW.conversation_id::text,
        'message_trigger',
        'triggered',
        NOW()
      ) ON CONFLICT DO NOTHING;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the corrected trigger on messages table
CREATE TRIGGER ai_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_ai_message();

-- =====================================
-- 2. Create Missing SQL Functions
-- =====================================

-- Create hybrid_search_documents function
CREATE OR REPLACE FUNCTION hybrid_search_documents(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 10,
  organization_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  url TEXT,
  similarity FLOAT,
  rank FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kd.id,
    kd.title,
    kd.content,
    kd.url,
    (1 - (kd.embedding <=> query_embedding)) AS similarity,
    -- Hybrid ranking: combine semantic similarity with text search
    (
      (1 - (kd.embedding <=> query_embedding)) * 0.7 + 
      COALESCE(ts_rank_cd(to_tsvector('english', kd.content), plainto_tsquery('english', query_text)), 0) * 0.3
    ) AS rank
  FROM knowledge_documents kd
  WHERE 
    (organization_filter IS NULL OR kd.organization_id = organization_filter)
    AND kd.embedding IS NOT NULL
    AND (1 - (kd.embedding <=> query_embedding)) > match_threshold
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create track_ai_performance function
CREATE OR REPLACE FUNCTION track_ai_performance(
  p_conversation_id UUID,
  p_organization_id UUID,
  p_response_time_ms INTEGER,
  p_confidence_score DECIMAL(3,2),
  p_model_used TEXT DEFAULT 'gpt-4',
  p_operation TEXT DEFAULT 'rag_response',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  -- Insert performance metric
  INSERT INTO ai_performance_metrics (
    id,
    organization_id,
    conversation_id,
    metric_type,
    value,
    metadata,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_organization_id,
    p_conversation_id,
    'response_time',
    p_response_time_ms,
    p_metadata || jsonb_build_object(
      'model', p_model_used,
      'operation', p_operation,
      'confidence', p_confidence_score
    ),
    NOW()
  ) RETURNING id INTO metric_id;
  
  -- Also track in ai_metrics table if it exists
  INSERT INTO ai_metrics (
    conversation_id,
    organization_id,
    latency_ms,
    tokens,
    model,
    operation,
    confidence,
    metadata,
    created_at
  ) VALUES (
    p_conversation_id,
    p_organization_id,
    p_response_time_ms,
    COALESCE((p_metadata->>'tokens')::int, 0),
    p_model_used,
    p_operation,
    p_confidence_score,
    p_metadata,
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 3. Fix Schema Inconsistencies
-- =====================================

-- Ensure ai_processing_logs table exists with correct structure
CREATE TABLE IF NOT EXISTS ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  organization_id UUID,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'triggered',
  error_message TEXT,
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  escalated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_message_id ON ai_processing_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_conversation_id ON ai_processing_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);

-- Enable RLS on ai_processing_logs
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_processing_logs
DROP POLICY IF EXISTS "ai_processing_logs_org_isolation" ON ai_processing_logs;
CREATE POLICY "ai_processing_logs_org_isolation" ON ai_processing_logs
FOR ALL USING (
  organization_id IN (
    SELECT om.organization_id::uuid 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
  OR auth.role() = 'service_role'
);

-- =====================================
-- 4. Create Helper Functions for RAG System
-- =====================================

-- Function to start AI handover
CREATE OR REPLACE FUNCTION start_ai_handover(
  p_conversation_id UUID,
  p_organization_id UUID,
  p_persona TEXT DEFAULT 'friendly',
  p_confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  handover_id UUID;
  session_id UUID;
BEGIN
  -- Create handover record
  INSERT INTO campfire_handoffs (
    id,
    conversation_id,
    organization_id,
    ai_active,
    persona,
    confidence_threshold,
    session_metadata,
    status,
    started_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_conversation_id::text,
    p_organization_id,
    true,
    p_persona,
    p_confidence_threshold,
    p_metadata,
    'active',
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO handover_id;
  
  -- Create AI session
  INSERT INTO ai_sessions (
    id,
    conversation_id,
    organization_id,
    status,
    persona,
    confidence_threshold,
    session_metadata,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_conversation_id::text,
    p_organization_id,
    'active',
    p_persona,
    p_confidence_threshold,
    p_metadata,
    NOW(),
    NOW()
  ) RETURNING id INTO session_id;
  
  -- Log the handover start
  INSERT INTO campfire_handoff_logs (
    id,
    handoff_id,
    conversation_id,
    organization_id,
    event_type,
    event_data,
    created_at
  ) VALUES (
    gen_random_uuid(),
    handover_id,
    p_conversation_id::text,
    p_organization_id,
    'handover_started',
    jsonb_build_object(
      'persona', p_persona,
      'confidence_threshold', p_confidence_threshold,
      'session_id', session_id
    ),
    NOW()
  );
  
  RETURN handover_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end AI handover
CREATE OR REPLACE FUNCTION end_ai_handover(
  p_handover_id UUID,
  p_reason TEXT DEFAULT 'manual_stop'
)
RETURNS BOOLEAN AS $$
DECLARE
  handover_record RECORD;
BEGIN
  -- Get handover details
  SELECT * INTO handover_record 
  FROM campfire_handoffs 
  WHERE id = p_handover_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update handover status
  UPDATE campfire_handoffs 
  SET 
    ai_active = false,
    status = 'completed',
    ended_at = NOW(),
    updated_at = NOW()
  WHERE id = p_handover_id;
  
  -- Update AI session
  UPDATE ai_sessions 
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE conversation_id = handover_record.conversation_id
  AND status = 'active';
  
  -- Log the handover end
  INSERT INTO campfire_handoff_logs (
    id,
    handoff_id,
    conversation_id,
    organization_id,
    event_type,
    event_data,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_handover_id,
    handover_record.conversation_id,
    handover_record.organization_id,
    'handover_ended',
    jsonb_build_object('reason', p_reason),
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 5. Grant Permissions
-- =====================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON ai_processing_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campfire_handoffs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campfire_handoff_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_sessions TO authenticated;
GRANT SELECT ON knowledge_documents TO authenticated;
GRANT SELECT, INSERT ON ai_performance_metrics TO authenticated;
GRANT SELECT, INSERT ON ai_metrics TO authenticated;

GRANT EXECUTE ON FUNCTION hybrid_search_documents TO authenticated;
GRANT EXECUTE ON FUNCTION track_ai_performance TO authenticated;
GRANT EXECUTE ON FUNCTION start_ai_handover TO authenticated;
GRANT EXECUTE ON FUNCTION end_ai_handover TO authenticated;
GRANT EXECUTE ON FUNCTION notify_ai_message TO authenticated;

-- =====================================
-- 6. Test the Setup
-- =====================================

-- Create a test function to verify everything works
CREATE OR REPLACE FUNCTION test_rag_handover_system()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test 1: Check if trigger exists and is enabled
  RETURN QUERY
  SELECT 
    'AI Message Trigger'::TEXT as component,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'ai_message_trigger' 
        AND event_object_table = 'messages'
      ) THEN 'OK'::TEXT
      ELSE 'MISSING'::TEXT
    END as status,
    'Trigger on messages table'::TEXT as details;
  
  -- Test 2: Check if functions exist
  RETURN QUERY
  SELECT 
    'SQL Functions'::TEXT as component,
    CASE 
      WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'hybrid_search_documents')
       AND EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'track_ai_performance')
       AND EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'start_ai_handover')
       AND EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'end_ai_handover')
      THEN 'OK'::TEXT
      ELSE 'MISSING'::TEXT
    END as status,
    'All required functions created'::TEXT as details;
  
  -- Test 3: Check if tables exist
  RETURN QUERY
  SELECT 
    'Database Tables'::TEXT as component,
    CASE 
      WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_processing_logs')
       AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'campfire_handoffs')
       AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_sessions')
      THEN 'OK'::TEXT
      ELSE 'MISSING'::TEXT
    END as status,
    'All required tables exist'::TEXT as details;
    
  -- Test 4: Check RLS policies
  RETURN QUERY
  SELECT 
    'RLS Policies'::TEXT as component,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_processing_logs' 
        AND policyname = 'ai_processing_logs_org_isolation'
      ) THEN 'OK'::TEXT
      ELSE 'MISSING'::TEXT
    END as status,
    'Row Level Security enabled'::TEXT as details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for test function
GRANT EXECUTE ON FUNCTION test_rag_handover_system TO authenticated;