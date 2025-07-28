-- Create webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Webhook configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  secret VARCHAR(255), -- For webhook signature verification
  
  -- Events to subscribe to
  events TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['message.created', 'conversation.closed']
  
  -- Status and health
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failing')),
  enabled BOOLEAN DEFAULT true,
  
  -- Delivery settings
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Health tracking
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  
  -- Metadata
  headers JSONB DEFAULT '{}', -- Custom headers to send
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhooks_organization_id ON public.webhooks(organization_id);
CREATE INDEX idx_webhooks_status ON public.webhooks(status);
CREATE INDEX idx_webhooks_enabled ON public.webhooks(enabled);
CREATE INDEX idx_webhooks_events ON public.webhooks USING GIN(events);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view webhooks for their organization"
  ON public.webhooks
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create webhooks for their organization"
  ON public.webhooks
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's webhooks"
  ON public.webhooks
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's webhooks"
  ON public.webhooks
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Webhook delivery logs table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Delivery details
  event_type VARCHAR(50) NOT NULL,
  event_id VARCHAR(255),
  payload JSONB NOT NULL,
  
  -- Request/Response
  request_headers JSONB,
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  
  -- Timing
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook deliveries
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_organization_id ON public.webhook_deliveries(organization_id);
CREATE INDEX idx_webhook_deliveries_event_type ON public.webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_attempted_at ON public.webhook_deliveries(attempted_at DESC);
CREATE INDEX idx_webhook_deliveries_success ON public.webhook_deliveries(success);

-- Enable RLS
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook deliveries
CREATE POLICY "Users can view webhook deliveries for their organization"
  ON public.webhook_deliveries
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Function to trigger webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_organization_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Find all active webhooks for this event
  FOR v_webhook IN 
    SELECT * FROM public.webhooks
    WHERE organization_id = p_organization_id
      AND enabled = true
      AND status = 'active'
      AND p_event_type = ANY(events)
  LOOP
    -- Insert delivery record (actual HTTP call would be done by a background job)
    INSERT INTO public.webhook_deliveries (
      webhook_id,
      organization_id,
      event_type,
      payload
    ) VALUES (
      v_webhook.id,
      p_organization_id,
      p_event_type,
      p_event_data
    );
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_webhook TO authenticated, service_role;

-- Example trigger for message created events
CREATE OR REPLACE FUNCTION webhook_on_message_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM trigger_webhook(
    NEW.organization_id,
    'message.created',
    jsonb_build_object(
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'content', NEW.content,
      'sender_type', NEW.sender_type,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_webhook_on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION webhook_on_message_created();

-- Trigger to update updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();