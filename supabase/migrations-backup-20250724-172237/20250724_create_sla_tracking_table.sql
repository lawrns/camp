-- Create SLA Tracking Table
-- This table tracks Service Level Agreement metrics for conversations and tickets

CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ticket_id UUID, -- Removed foreign key reference since tickets table doesn't exist
  sla_type TEXT NOT NULL CHECK (sla_type IN ('response_time', 'resolution_time', 'first_response')),
  target_time_minutes INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'met', 'breached', 'cancelled')),
  breach_time TIMESTAMPTZ,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sla_tracking_org_id ON sla_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_conversation_id ON sla_tracking(conversation_id);
-- CREATE INDEX IF NOT EXISTS idx_sla_tracking_ticket_id ON sla_tracking(ticket_id); -- Commented out since tickets table doesn't exist
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_active ON sla_tracking(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_agent_id ON sla_tracking(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_breach_time ON sla_tracking(breach_time);

-- Enable RLS
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can access SLA tracking for their organization" ON sla_tracking
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sla_tracking TO authenticated;
GRANT ALL ON sla_tracking TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sla_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_sla_tracking_updated_at ON sla_tracking;
CREATE TRIGGER update_sla_tracking_updated_at
  BEFORE UPDATE ON sla_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_tracking_updated_at();

-- Function to check SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS TABLE (
  sla_id UUID,
  organization_id UUID,
  conversation_id UUID,
  ticket_id UUID,
  sla_type TEXT,
  breach_time TIMESTAMPTZ,
  minutes_overdue INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.organization_id,
    st.conversation_id,
    st.ticket_id,
    st.sla_type,
    NOW() as breach_time,
    EXTRACT(EPOCH FROM (NOW() - st.start_time)) / 60 - st.target_time_minutes as minutes_overdue
  FROM sla_tracking st
  WHERE st.status = 'active'
    AND st.start_time + (st.target_time_minutes || ' minutes')::INTERVAL < NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_sla_breaches TO authenticated;
GRANT EXECUTE ON FUNCTION check_sla_breaches TO service_role;

-- Add comments for documentation
COMMENT ON TABLE sla_tracking IS 'Service Level Agreement tracking for conversations and tickets';
COMMENT ON FUNCTION check_sla_breaches IS 'Check for SLA breaches and return overdue items'; 