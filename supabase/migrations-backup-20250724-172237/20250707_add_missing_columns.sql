-- Add missing columns for inbox functionality

-- Add is_read column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add read_at column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add read_by column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_by UUID REFERENCES profiles(id);

-- Add sender_avatar column to messages table (if not exists)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

-- Add is_internal_note column to messages table (if not exists)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_internal_note BOOLEAN DEFAULT FALSE;

-- Create message_read_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique constraint
  UNIQUE(message_id, user_id)
);

-- Create index for message read status
CREATE INDEX IF NOT EXISTS idx_message_read_status_message 
  ON public.message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user 
  ON public.message_read_status(user_id);

-- Enable RLS on message_read_status
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for message_read_status
CREATE POLICY IF NOT EXISTS "Users can manage their own read status"
  ON public.message_read_status
  FOR ALL
  USING (user_id = auth.uid());

-- Add status column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline' 
CHECK (status IN ('online', 'offline', 'away', 'busy'));

-- Create customer_satisfaction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_satisfaction (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create index for customer satisfaction
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_conversation 
  ON public.customer_satisfaction(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_organization 
  ON public.customer_satisfaction(organization_id);

-- Enable RLS on customer_satisfaction
ALTER TABLE public.customer_satisfaction ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for customer_satisfaction
CREATE POLICY IF NOT EXISTS "Users can view satisfaction for their organization"
  ON public.customer_satisfaction
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create ai_suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL,
  suggestion_content TEXT NOT NULL,
  confidence_score FLOAT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for ai_suggestions
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_conversation 
  ON public.ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status 
  ON public.ai_suggestions(status);

-- Enable RLS on ai_suggestions
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_suggestions
CREATE POLICY IF NOT EXISTS "Users can manage suggestions for their organization"
  ON public.ai_suggestions
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create ai_routing_suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_routing_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  suggested_agent_id UUID REFERENCES profiles(id),
  confidence_score FLOAT,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for ai_routing_suggestions
CREATE INDEX IF NOT EXISTS idx_ai_routing_suggestions_conversation 
  ON public.ai_routing_suggestions(conversation_id);

-- Enable RLS on ai_routing_suggestions
ALTER TABLE public.ai_routing_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ai_routing_suggestions
CREATE POLICY IF NOT EXISTS "Users can view routing suggestions for their organization"
  ON public.ai_routing_suggestions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );