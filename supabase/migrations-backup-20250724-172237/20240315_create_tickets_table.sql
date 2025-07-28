-- Create Tickets Table Migration
-- This creates a comprehensive tickets system with proper organization scoping

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT tickets_title_not_empty CHECK (trim(title) != ''),
  CONSTRAINT tickets_resolved_after_created CHECK (resolved_at IS NULL OR resolved_at >= created_at),
  CONSTRAINT tickets_closed_after_created CHECK (closed_at IS NULL OR closed_at >= created_at)
);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
CREATE POLICY "Tickets are scoped to organization" ON tickets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Additional policies for more granular access
CREATE POLICY "Users can view tickets in their organization" ON tickets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tickets in their organization" ON tickets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tickets in their organization" ON tickets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tickets in their organization" ON tickets
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation_id ON tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customer_email);

-- GIN index for tags array and metadata JSONB
CREATE INDEX IF NOT EXISTS idx_tickets_tags ON tickets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tickets_metadata ON tickets USING GIN(metadata);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Automatically set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  -- Automatically set closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  -- Clear resolved_at if status changes away from resolved
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  -- Clear closed_at if status changes away from closed
  IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.closed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Create activity_events table if it doesn't exist (for ticket activity tracking)
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'ai')),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for activity_events
CREATE POLICY "Activity events are scoped to organization" ON activity_events
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for activity_events
CREATE INDEX IF NOT EXISTS idx_activity_events_organization_id ON activity_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_conversation_id ON activity_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_ticket_id ON activity_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_details ON activity_events USING GIN(details);

-- Data integrity check function
CREATE OR REPLACE FUNCTION check_tickets_data_integrity()
RETURNS TABLE(
  issue_type TEXT,
  issue_count BIGINT,
  issue_description TEXT
) AS $$
BEGIN
  -- Check for tickets without organization_id
  RETURN QUERY
  SELECT 
    'missing_organization_id'::TEXT,
    COUNT(*)::BIGINT,
    'Tickets without organization_id'::TEXT
  FROM tickets
  WHERE organization_id IS NULL;
  
  -- Check for tickets with invalid organization references
  RETURN QUERY
  SELECT 
    'invalid_organization_ref'::TEXT,
    COUNT(*)::BIGINT,
    'Tickets referencing non-existent organizations'::TEXT
  FROM tickets t
  LEFT JOIN organizations o ON t.organization_id = o.id
  WHERE o.id IS NULL;
  
  -- Check for tickets with invalid conversation references
  RETURN QUERY
  SELECT 
    'invalid_conversation_ref'::TEXT,
    COUNT(*)::BIGINT,
    'Tickets referencing non-existent conversations'::TEXT
  FROM tickets t
  LEFT JOIN conversations c ON t.conversation_id = c.id
  WHERE t.conversation_id IS NOT NULL AND c.id IS NULL;
  
  -- Check for tickets with invalid user references
  RETURN QUERY
  SELECT 
    'invalid_user_ref'::TEXT,
    COUNT(*)::BIGINT,
    'Tickets with invalid assigned_to or created_by references'::TEXT
  FROM tickets t
  LEFT JOIN profiles p1 ON t.assigned_to = p1.id
  LEFT JOIN profiles p2 ON t.created_by = p2.id
  WHERE (t.assigned_to IS NOT NULL AND p1.id IS NULL)
     OR (t.created_by IS NOT NULL AND p2.id IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Run data integrity check
DO $$
DECLARE
  integrity_issues RECORD;
  total_issues BIGINT := 0;
BEGIN
  FOR integrity_issues IN 
    SELECT * FROM check_tickets_data_integrity()
  LOOP
    IF integrity_issues.issue_count > 0 THEN
      RAISE WARNING 'Data integrity issue: % (% records)', 
        integrity_issues.issue_description, 
        integrity_issues.issue_count;
      total_issues := total_issues + integrity_issues.issue_count;
    END IF;
  END LOOP;
  
  IF total_issues > 0 THEN
    RAISE EXCEPTION 'Found % data integrity issues. Please fix before proceeding.', total_issues;
  ELSE
    RAISE NOTICE 'Tickets table migration completed successfully. No data integrity issues found.';
  END IF;
END $$;
