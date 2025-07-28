-- Create slack_integrations table
CREATE TABLE IF NOT EXISTS public.slack_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Slack app credentials (encrypted)
  bot_token_encrypted TEXT NOT NULL,
  signing_secret_encrypted TEXT NOT NULL,
  app_token_encrypted TEXT,
  
  -- Slack team information
  team_id TEXT,
  team_name TEXT,
  bot_user_id TEXT,
  scopes TEXT[],
  
  -- Integration status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Configuration
  notification_channel TEXT, -- Default channel for notifications
  notification_events TEXT[] DEFAULT '{}', -- Events to notify about
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one integration per organization
  UNIQUE(organization_id)
);

-- Create indexes
CREATE INDEX idx_slack_integrations_organization_id ON public.slack_integrations(organization_id);
CREATE INDEX idx_slack_integrations_status ON public.slack_integrations(status);
CREATE INDEX idx_slack_integrations_team_id ON public.slack_integrations(team_id);

-- Enable Row Level Security
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's Slack integration"
  ON public.slack_integrations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organization's Slack integration"
  ON public.slack_integrations
  FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.profiles p ON p.user_id = om.user_id
      WHERE p.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
        AND om.status = 'active'
    )
  );

-- Service role can manage all integrations
CREATE POLICY "Service role can manage all Slack integrations"
  ON public.slack_integrations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_slack_integrations_updated_at
  BEFORE UPDATE ON public.slack_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create notification log table
CREATE TABLE IF NOT EXISTS public.slack_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification details
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  message_text TEXT NOT NULL,
  slack_ts TEXT, -- Slack message timestamp (ID)
  
  -- Context
  conversation_id UUID REFERENCES conversations(id),
  event_type TEXT,
  urgency VARCHAR(10) CHECK (urgency IN ('low', 'medium', 'high')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for notification log
CREATE INDEX idx_slack_notifications_integration_id ON public.slack_notifications(integration_id);
CREATE INDEX idx_slack_notifications_organization_id ON public.slack_notifications(organization_id);
CREATE INDEX idx_slack_notifications_conversation_id ON public.slack_notifications(conversation_id);
CREATE INDEX idx_slack_notifications_created_at ON public.slack_notifications(created_at DESC);
CREATE INDEX idx_slack_notifications_status ON public.slack_notifications(status);

-- Enable RLS for notifications
ALTER TABLE public.slack_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their organization's Slack notifications"
  ON public.slack_notifications
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all notifications
CREATE POLICY "Service role can manage all Slack notifications"
  ON public.slack_notifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to encrypt sensitive data (placeholder - implement proper encryption)
CREATE OR REPLACE FUNCTION encrypt_slack_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TODO: Implement proper encryption using pgcrypto or external service
  -- For now, just return the token (NOT SECURE - implement proper encryption)
  RETURN token;
END;
$$;

-- Function to decrypt sensitive data (placeholder - implement proper decryption)
CREATE OR REPLACE FUNCTION decrypt_slack_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TODO: Implement proper decryption
  -- For now, just return the encrypted token (NOT SECURE - implement proper decryption)
  RETURN encrypted_token;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION encrypt_slack_token TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION decrypt_slack_token TO authenticated, service_role;

-- Comment on tables
COMMENT ON TABLE public.slack_integrations IS 'Slack integration configurations per organization';
COMMENT ON TABLE public.slack_notifications IS 'Log of Slack notifications sent';