-- Create activity_events table
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'ticket', 'user', 'system', 'ai', 'achievement')),
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User who performed the action (optional for system events)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_avatar TEXT,
  user_role VARCHAR(100),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_events_organization_id ON public.activity_events(organization_id);
CREATE INDEX idx_activity_events_timestamp ON public.activity_events(timestamp DESC);
CREATE INDEX idx_activity_events_type ON public.activity_events(type);
CREATE INDEX idx_activity_events_user_id ON public.activity_events(user_id);

-- Enable Row Level Security
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view activity events for their organization"
  ON public.activity_events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all activity events"
  ON public.activity_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to log activity events
CREATE OR REPLACE FUNCTION log_activity_event(
  p_organization_id UUID,
  p_type VARCHAR(50),
  p_action VARCHAR(100),
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_name VARCHAR(255) DEFAULT NULL,
  p_user_avatar TEXT DEFAULT NULL,
  p_user_role VARCHAR(100) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.activity_events (
    organization_id,
    type,
    action,
    description,
    user_id,
    user_name,
    user_avatar,
    user_role,
    metadata
  ) VALUES (
    p_organization_id,
    p_type,
    p_action,
    p_description,
    p_user_id,
    p_user_name,
    p_user_avatar,
    p_user_role,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_activity_event TO authenticated, service_role;

-- Trigger to update updated_at
CREATE TRIGGER update_activity_events_updated_at
  BEFORE UPDATE ON public.activity_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some triggers to automatically log activity

-- Log when a message is sent
CREATE OR REPLACE FUNCTION log_message_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for non-internal messages
  IF NEW.is_internal_note IS FALSE OR NEW.is_internal_note IS NULL THEN
    PERFORM log_activity_event(
      NEW.organization_id,
      'message',
      CASE 
        WHEN NEW.sender_type = 'visitor' THEN 'received'
        WHEN NEW.sender_type = 'ai' THEN 'sent by AI'
        ELSE 'replied'
      END,
      CASE 
        WHEN NEW.sender_type = 'visitor' THEN 'a new message from ' || COALESCE(NEW.sender_name, 'visitor')
        ELSE 'to conversation #' || LEFT(NEW.conversation_id::TEXT, 8)
      END,
      NEW.sender_id,
      NEW.sender_name,
      NULL,
      NEW.sender_type,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_preview', LEFT(NEW.content, 100)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_message_activity
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION log_message_activity();

-- Log when a user status changes
CREATE OR REPLACE FUNCTION log_user_status_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity_event(
      NEW.organization_id,
      'user',
      CASE 
        WHEN NEW.status = 'online' THEN 'came online'
        WHEN NEW.status = 'offline' THEN 'went offline'
        WHEN NEW.status = 'away' THEN 'went away'
        ELSE 'changed status'
      END,
      'status changed to ' || NEW.status,
      NEW.id,
      NEW.full_name,
      NEW.avatar_url,
      NEW.role,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_user_status_activity
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_status_activity();