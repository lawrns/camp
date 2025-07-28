-- Add missing tables for billing, API keys, webhooks, and activity events

-- 1. AI Billing Invoices table
CREATE TABLE IF NOT EXISTS ai_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  base_cost_cents INTEGER NOT NULL DEFAULT 0,
  usage_cost_cents INTEGER NOT NULL DEFAULT 0,
  overage_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  invoice_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars of key for identification
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret TEXT NOT NULL, -- For webhook signature verification
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activity Events table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'conversation', 'user', 'settings', 'billing', etc.
  actor_id UUID REFERENCES profiles(id),
  actor_type TEXT DEFAULT 'user', -- 'user', 'system', 'api'
  resource_type TEXT, -- 'conversation', 'message', 'user', etc.
  resource_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tickets table (if not exists)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  ticket_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, ticket_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_billing_invoices_org_id ON ai_billing_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_billing_invoices_status ON ai_billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ai_billing_invoices_due_date ON ai_billing_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

CREATE INDEX IF NOT EXISTS idx_activity_events_org_id ON activity_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_id ON activity_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON activity_events(event_type);
-- CREATE INDEX IF NOT EXISTS idx_activity_events_resource ON activity_events(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation_id ON tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Enable RLS
ALTER TABLE ai_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- AI Billing Invoices
CREATE POLICY "Users can view their organization's invoices" ON ai_billing_invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create invoices" ON ai_billing_invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update invoices" ON ai_billing_invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- API Keys
CREATE POLICY "Users can view their organization's API keys" ON api_keys
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage API keys" ON api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Webhooks
CREATE POLICY "Users can view their organization's webhooks" ON webhooks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage webhooks" ON webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Activity Events
CREATE POLICY "Users can view their organization's activity" ON activity_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create activity events" ON activity_events
  FOR INSERT WITH CHECK (true);

-- Tickets
CREATE POLICY "Users can view their organization's tickets" ON tickets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assigned tickets" ON tickets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    ) AND (
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = tickets.organization_id 
        AND user_id = auth.uid() 
        AND role IN ('admin', 'manager')
      )
    )
  );

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_ai_billing_invoices_updated_at BEFORE UPDATE ON ai_billing_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();