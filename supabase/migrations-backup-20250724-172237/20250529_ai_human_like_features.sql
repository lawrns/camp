-- Migration: AI Human-like Features
-- Description: Adds tables and functions for AI suggested replies and seamless handover

-- AI Suggestions table for caching and analytics
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL, -- Array of suggestion objects
  context_embedding vector(1536), -- For similarity search
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  selected_suggestion TEXT,
  response_time_ms INTEGER,
  
  -- Indexes for performance
  CONSTRAINT unique_message_suggestions UNIQUE (message_id)
);

CREATE INDEX idx_ai_suggestions_conversation ON ai_suggestions(conversation_id);
CREATE INDEX idx_ai_suggestions_created ON ai_suggestions(created_at DESC);
CREATE INDEX idx_ai_suggestions_embedding ON ai_suggestions USING ivfflat (context_embedding vector_cosine_ops);

-- AI Handover Sessions table
CREATE TABLE IF NOT EXISTS ai_handover_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ai_persona TEXT NOT NULL CHECK (ai_persona IN ('friendly', 'professional', 'supportive')),
  total_messages INTEGER DEFAULT 0,
  avg_confidence_score FLOAT,
  escalated_to_human BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Performance metrics
  avg_response_time_ms INTEGER,
  total_tokens_used INTEGER,
  
  CONSTRAINT check_session_dates CHECK (ended_at IS NULL OR ended_at > started_at)
);

CREATE INDEX idx_handover_conversation ON ai_handover_sessions(conversation_id);
CREATE INDEX idx_handover_active ON ai_handover_sessions(ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_handover_organization ON ai_handover_sessions(organization_id);

-- Extend conversations table with AI fields
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT DEFAULT 1.0 CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS ai_handover_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_handover_session_id UUID REFERENCES ai_handover_sessions(id),
ADD COLUMN IF NOT EXISTS ai_persona TEXT CHECK (ai_persona IN ('friendly', 'professional', 'supportive', NULL));

-- AI Response Patterns table for human-like behavior
CREATE TABLE IF NOT EXISTS ai_response_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('greeting', 'filler', 'uncertainty', 'escalation', 'affirmation')),
  persona TEXT NOT NULL CHECK (persona IN ('friendly', 'professional', 'supportive')),
  content TEXT NOT NULL,
  context_tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial response patterns
INSERT INTO ai_response_patterns (pattern_type, persona, content, context_tags) VALUES
-- Friendly persona patterns
('greeting', 'friendly', 'Hey there! 👋', ARRAY['morning', 'casual']),
('greeting', 'friendly', 'Hi! How can I help you today?', ARRAY['default']),
('greeting', 'friendly', 'Good evening! What brings you here?', ARRAY['evening']),
('filler', 'friendly', 'hmm...', ARRAY['thinking']),
('filler', 'friendly', 'let me check that for you...', ARRAY['searching']),
('uncertainty', 'friendly', 'I''m not 100% sure about that, let me double-check...', ARRAY['low_confidence']),
('escalation', 'friendly', 'Let me get one of my colleagues to help you with this!', ARRAY['handover']),
('affirmation', 'friendly', 'That''s a great question!', ARRAY['positive']),

-- Professional persona patterns
('greeting', 'professional', 'Good morning. How may I assist you?', ARRAY['morning', 'formal']),
('greeting', 'professional', 'Welcome. How can I help you today?', ARRAY['default']),
('filler', 'professional', 'Let me verify that information...', ARRAY['searching']),
('uncertainty', 'professional', 'I need to confirm this detail for accuracy...', ARRAY['low_confidence']),
('escalation', 'professional', 'I''ll connect you with a specialist who can better assist with this matter.', ARRAY['handover']),
('affirmation', 'professional', 'I understand your concern.', ARRAY['acknowledgment']),

-- Supportive persona patterns
('greeting', 'supportive', 'Hello! I''m here to help 😊', ARRAY['default']),
('filler', 'supportive', 'I''m looking into this for you...', ARRAY['searching']),
('uncertainty', 'supportive', 'I want to make sure I give you the right information, let me verify...', ARRAY['low_confidence']),
('escalation', 'supportive', 'I''d like to get you the best help possible - let me bring in an expert!', ARRAY['handover']),
('affirmation', 'supportive', 'I completely understand how you feel.', ARRAY['empathy'])
ON CONFLICT DO NOTHING;

-- Function to get AI response patterns
CREATE OR REPLACE FUNCTION get_ai_response_pattern(
  p_pattern_type TEXT,
  p_persona TEXT,
  p_context_tags TEXT[] DEFAULT '{}'
)
RETURNS TEXT AS $$
DECLARE
  v_pattern TEXT;
BEGIN
  -- Try to find pattern matching all context tags
  SELECT content INTO v_pattern
  FROM ai_response_patterns
  WHERE pattern_type = p_pattern_type
    AND persona = p_persona
    AND (p_context_tags = '{}' OR context_tags && p_context_tags)
  ORDER BY 
    CASE WHEN p_context_tags != '{}' THEN cardinality(context_tags) ELSE 0 END DESC,
    random()
  LIMIT 1;
  
  -- Fallback to default if no match
  IF v_pattern IS NULL THEN
    SELECT content INTO v_pattern
    FROM ai_response_patterns
    WHERE pattern_type = p_pattern_type
      AND persona = p_persona
      AND 'default' = ANY(context_tags)
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  -- Update usage count
  IF v_pattern IS NOT NULL THEN
    UPDATE ai_response_patterns
    SET usage_count = usage_count + 1
    WHERE content = v_pattern;
  END IF;
  
  RETURN v_pattern;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate typing duration based on message length and WPM
CREATE OR REPLACE FUNCTION calculate_typing_duration(
  p_message_length INTEGER,
  p_wpm INTEGER DEFAULT 70 -- Average typing speed
)
RETURNS INTEGER AS $$
DECLARE
  v_words INTEGER;
  v_base_duration INTEGER;
  v_variance INTEGER;
BEGIN
  -- Estimate word count (average 5 characters per word)
  v_words := GREATEST(1, p_message_length / 5);
  
  -- Calculate base duration in milliseconds
  v_base_duration := (v_words * 60 * 1000) / p_wpm;
  
  -- Add 10-20% variance for natural feel
  v_variance := v_base_duration * (0.1 + random() * 0.1);
  
  -- Add thinking pauses based on message length
  IF v_words > 20 THEN
    v_base_duration := v_base_duration + (500 + random() * 1500); -- 0.5-2s pause
  ELSIF v_words > 10 THEN
    v_base_duration := v_base_duration + (300 + random() * 700); -- 0.3-1s pause
  END IF;
  
  RETURN v_base_duration + v_variance;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_handover_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_patterns ENABLE ROW LEVEL SECURITY;

-- AI Suggestions policies
CREATE POLICY "Users can view AI suggestions for their org conversations"
  ON ai_suggestions FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage AI suggestions"
  ON ai_suggestions FOR ALL
  USING (auth.role() = 'service_role');

-- AI Handover policies
CREATE POLICY "Users can view handover sessions for their org"
  ON ai_handover_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage handover sessions"
  ON ai_handover_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Response patterns are read-only for all authenticated users
CREATE POLICY "Authenticated users can read response patterns"
  ON ai_response_patterns FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create function to start AI handover
CREATE OR REPLACE FUNCTION start_ai_handover(
  p_conversation_id UUID,
  p_organization_id UUID,
  p_persona TEXT DEFAULT 'friendly'
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- End any existing active session
  UPDATE ai_handover_sessions
  SET ended_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND ended_at IS NULL;
  
  -- Create new session
  INSERT INTO ai_handover_sessions (
    conversation_id,
    organization_id,
    ai_persona
  ) VALUES (
    p_conversation_id,
    p_organization_id,
    p_persona
  ) RETURNING id INTO v_session_id;
  
  -- Update conversation
  UPDATE conversations
  SET ai_handover_active = TRUE,
      ai_handover_session_id = v_session_id,
      ai_persona = p_persona
  WHERE id = p_conversation_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to end AI handover
CREATE OR REPLACE FUNCTION end_ai_handover(
  p_session_id UUID,
  p_escalated BOOLEAN DEFAULT FALSE,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update session
  UPDATE ai_handover_sessions
  SET ended_at = NOW(),
      escalated_to_human = p_escalated,
      escalation_reason = p_reason
  WHERE id = p_session_id;
  
  -- Update conversation
  UPDATE conversations
  SET ai_handover_active = FALSE
  WHERE ai_handover_session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX idx_conversations_ai_handover ON conversations(ai_handover_active) WHERE ai_handover_active = TRUE;
CREATE INDEX idx_conversations_confidence ON conversations(ai_confidence_score);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ai_response_patterns TO anon, authenticated;
GRANT ALL ON ai_suggestions TO authenticated;
GRANT ALL ON ai_handover_sessions TO authenticated;