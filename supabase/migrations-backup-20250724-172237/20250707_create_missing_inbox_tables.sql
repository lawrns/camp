-- Create Missing Tables for Inbox Functionality
-- This migration creates tables that are referenced but don't exist yet

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN ('mention', 'assignment', 'message', 'status_change', 'escalation', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Additional data
  data JSONB DEFAULT '{}',
  action_url TEXT,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery status
  is_delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  delivery_method VARCHAR(20) DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'push', 'sms')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_organization ON public.notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all notifications"
  ON public.notifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 2. ANALYTICS EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  
  -- User and session tracking
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  
  -- Event properties
  properties JSONB DEFAULT '{}',
  
  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_organization ON public.analytics_events(organization_id, timestamp DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, event_name);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's analytics"
  ON public.analytics_events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all analytics"
  ON public.analytics_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 3. CONVERSATION TAGS TABLE (Many-to-Many)
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  
  -- Metadata
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique constraint
  UNIQUE(conversation_id, tag_id)
);

-- Indexes
CREATE INDEX idx_conversation_tags_conversation ON public.conversation_tags(conversation_id);
CREATE INDEX idx_conversation_tags_tag ON public.conversation_tags(tag_id);

-- Enable RLS
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view conversation tags for their organization"
  ON public.conversation_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_tags.conversation_id
      AND c.organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage conversation tags for their organization"
  ON public.conversation_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_tags.conversation_id
      AND c.organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- 4. TAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tag details
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color
  description TEXT,
  
  -- Category for grouping
  category VARCHAR(50),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique tags per organization
  UNIQUE(organization_id, name)
);

-- Indexes
CREATE INDEX idx_tags_organization ON public.tags(organization_id);
CREATE INDEX idx_tags_category ON public.tags(category) WHERE category IS NOT NULL;
CREATE INDEX idx_tags_usage ON public.tags(usage_count DESC);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tags for their organization"
  ON public.tags
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tags for their organization"
  ON public.tags
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- 5. SAVED SEARCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Search details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Search criteria
  filters JSONB NOT NULL DEFAULT '{}',
  sort_by VARCHAR(50) DEFAULT 'updated_at',
  sort_order VARCHAR(4) DEFAULT 'desc' CHECK (sort_order IN ('asc', 'desc')),
  
  -- Visibility
  is_shared BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_organization ON public.saved_searches(organization_id);
CREATE INDEX idx_saved_searches_shared ON public.saved_searches(organization_id, is_shared) WHERE is_shared = TRUE;

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved searches"
  ON public.saved_searches
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared searches in their organization"
  ON public.saved_searches
  FOR SELECT
  USING (
    is_shared = TRUE AND
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own saved searches"
  ON public.saved_searches
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- 6. CONVERSATION FOLLOWERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notify_on_new_message BOOLEAN DEFAULT TRUE,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_assignment BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique constraint
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conversation_followers_conversation ON public.conversation_followers(conversation_id);
CREATE INDEX idx_conversation_followers_user ON public.conversation_followers(user_id);

-- Enable RLS
ALTER TABLE public.conversation_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view followers for conversations in their organization"
  ON public.conversation_followers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_followers.conversation_id
      AND c.organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own following status"
  ON public.conversation_followers
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- 7. TRIGGER FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment tag usage
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tags
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_tag_usage
  AFTER INSERT ON public.conversation_tags
  FOR EACH ROW
  EXECUTE FUNCTION increment_tag_usage();

-- Function to decrement tag usage
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tags
  SET usage_count = GREATEST(0, usage_count - 1)
  WHERE id = OLD.tag_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_tag_usage
  AFTER DELETE ON public.conversation_tags
  FOR EACH ROW
  EXECUTE FUNCTION decrement_tag_usage();