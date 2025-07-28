-- MASS UPGRADE: Transform to unified operators model
-- Remove all AI/bot indicators and create seamless experience

-- Step 1: Create unified operators table
CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Hidden internal classification (never exposed to UI)
  internal_classification TEXT DEFAULT 'human' CHECK (internal_classification IN ('human', 'rag')),
  
  -- Typing characteristics for natural behavior
  typing_speed_wpm INTEGER DEFAULT 55 CHECK (typing_speed_wpm BETWEEN 40 AND 70),
  typing_variance DECIMAL(3,2) DEFAULT 0.15 CHECK (typing_variance BETWEEN 0.10 AND 0.20),
  typing_accuracy DECIMAL(3,2) DEFAULT 0.97 CHECK (typing_accuracy BETWEEN 0.95 AND 0.99),
  
  -- Operator status
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create typing indicators table for real-time character preview
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  
  -- Character-by-character preview
  preview_text TEXT DEFAULT '',
  current_position INTEGER DEFAULT 0,
  is_typing BOOLEAN DEFAULT false,
  
  -- Typing behavior tracking
  started_typing_at TIMESTAMPTZ,
  last_character_at TIMESTAMPTZ,
  
  -- Natural pause tracking
  pause_type TEXT CHECK (pause_type IN ('thinking', 'sentence_end', 'comma', 'word_break')),
  pause_started_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one typing indicator per operator per conversation
  UNIQUE(conversation_id, operator_id)
);

-- Step 3: Create operator presence table
CREATE TABLE IF NOT EXISTS public.operator_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  
  -- Real-time presence tracking
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  
  -- Workload tracking
  active_conversations INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(operator_id)
);

-- Step 4: Migrate existing agents/users to operators
INSERT INTO public.operators (user_id, name, avatar_url, email, internal_classification, typing_speed_wpm)
SELECT 
  id as user_id,
  COALESCE(full_name, email) as name,
  COALESCE(avatar_url, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id::text) as avatar_url,
  email,
  'human' as internal_classification,
  45 + FLOOR(RANDOM() * 20) as typing_speed_wpm
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Step 5: Add natural human names for RAG operators
INSERT INTO public.operators (name, avatar_url, email, internal_classification, typing_speed_wpm, typing_variance, typing_accuracy)
VALUES 
  ('Sarah Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'sarah.chen@support.campfire.com', 'rag', 62, 0.12, 0.98),
  ('Michael Rodriguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael', 'michael.rodriguez@support.campfire.com', 'rag', 58, 0.15, 0.97),
  ('Emma Thompson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', 'emma.thompson@support.campfire.com', 'rag', 65, 0.13, 0.98),
  ('James Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 'james.wilson@support.campfire.com', 'rag', 55, 0.18, 0.96),
  ('Olivia Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia', 'olivia.martinez@support.campfire.com', 'rag', 60, 0.14, 0.97);

-- Step 6: Update conversations table - remove AI indicators
ALTER TABLE public.conversations 
DROP COLUMN IF EXISTS assignee_type CASCADE;

ALTER TABLE public.conversations
DROP COLUMN IF EXISTS assigned_to CASCADE;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS assigned_operator_id UUID REFERENCES public.operators(id);

-- Step 7: Update messages table to reference operators
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.operators(id);

-- Step 8: Calculate and add typing duration for natural behavior
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS typing_duration_ms INTEGER;

-- Step 9: Create function to calculate typing duration
CREATE OR REPLACE FUNCTION calculate_typing_duration(
  message_text TEXT,
  wpm INTEGER DEFAULT 55,
  variance DECIMAL DEFAULT 0.15
) RETURNS INTEGER AS $$
DECLARE
  char_count INTEGER;
  base_duration INTEGER;
  variance_factor DECIMAL;
  pause_time INTEGER DEFAULT 0;
  thinking_pause INTEGER;
BEGIN
  -- Get character count
  char_count := LENGTH(message_text);
  
  -- Base calculation: (chars / 5) / wpm * 60000ms
  base_duration := (char_count::DECIMAL / 5 / wpm * 60000)::INTEGER;
  
  -- Add variance
  variance_factor := 1 + (RANDOM() * 2 - 1) * variance;
  base_duration := (base_duration * variance_factor)::INTEGER;
  
  -- Add natural pauses
  -- Sentence endings
  pause_time := pause_time + (LENGTH(message_text) - LENGTH(REPLACE(message_text, '.', ''))) * (300 + RANDOM() * 400)::INTEGER;
  pause_time := pause_time + (LENGTH(message_text) - LENGTH(REPLACE(message_text, '!', ''))) * (300 + RANDOM() * 400)::INTEGER;
  pause_time := pause_time + (LENGTH(message_text) - LENGTH(REPLACE(message_text, '?', ''))) * (300 + RANDOM() * 400)::INTEGER;
  
  -- Commas
  pause_time := pause_time + (LENGTH(message_text) - LENGTH(REPLACE(message_text, ',', ''))) * (150 + RANDOM() * 150)::INTEGER;
  
  -- Thinking pause every ~50 characters
  thinking_pause := (char_count / 50) * (500 + RANDOM() * 1500)::INTEGER;
  
  -- Ensure minimum 1 second thinking time
  RETURN GREATEST(1000, base_duration + pause_time + thinking_pause);
END;
$$ LANGUAGE plpgsql;

-- Step 10: Drop old AI/bot related tables and columns
DROP TABLE IF EXISTS public.campfire_handoffs CASCADE;
DROP TABLE IF EXISTS public.bots CASCADE;
DROP TABLE IF EXISTS public.ai_agents CASCADE;

-- Step 11: Create indexes for performance
CREATE INDEX idx_operators_internal_classification ON public.operators(internal_classification);
CREATE INDEX idx_operators_is_online ON public.operators(is_online);
CREATE INDEX idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_active ON public.typing_indicators(is_typing) WHERE is_typing = true;
CREATE INDEX idx_operator_presence_status ON public.operator_presence(status);
CREATE INDEX idx_messages_operator ON public.messages(operator_id);
CREATE INDEX idx_conversations_operator ON public.conversations(assigned_operator_id);

-- Step 12: Enable real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.operators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_presence;

-- Step 13: Add RLS policies
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_presence ENABLE ROW LEVEL SECURITY;

-- Operators are visible to authenticated users
CREATE POLICY "Operators visible to authenticated users" ON public.operators
  FOR SELECT USING (auth.role() = 'authenticated');

-- Typing indicators visible for conversations user has access to
CREATE POLICY "Typing indicators for accessible conversations" ON public.typing_indicators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.customer_id = auth.uid() OR c.assigned_operator_id IN (
        SELECT id FROM public.operators WHERE user_id = auth.uid()
      ))
    )
  );

-- Operator presence visible to authenticated users
CREATE POLICY "Operator presence visible to authenticated" ON public.operator_presence
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 14: Create trigger to update typing duration on message insert
CREATE OR REPLACE FUNCTION set_message_typing_duration()
RETURNS TRIGGER AS $$
DECLARE
  operator_wpm INTEGER;
  operator_variance DECIMAL;
BEGIN
  -- Get operator's typing characteristics
  SELECT typing_speed_wpm, typing_variance 
  INTO operator_wpm, operator_variance
  FROM public.operators 
  WHERE id = NEW.operator_id;
  
  -- Calculate typing duration if operator found
  IF operator_wpm IS NOT NULL THEN
    NEW.typing_duration_ms := calculate_typing_duration(
      NEW.content, 
      operator_wpm, 
      operator_variance
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_typing_duration_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_typing_duration();

-- Step 15: Update existing messages with typing durations
UPDATE public.messages
SET typing_duration_ms = calculate_typing_duration(content, 55, 0.15)
WHERE typing_duration_ms IS NULL;

COMMENT ON TABLE public.operators IS 'Unified operators table - all support staff appear identical to customers';
COMMENT ON COLUMN public.operators.internal_classification IS 'Internal use only - NEVER expose to UI or API responses';
COMMENT ON TABLE public.typing_indicators IS 'Real-time character-by-character typing preview for natural conversation flow';