-- Create conversation notes table for internal agent notes
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT conversation_notes_conversation_id_idx INDEX (conversation_id),
  CONSTRAINT conversation_notes_organization_id_idx INDEX (organization_id),
  CONSTRAINT conversation_notes_created_by_idx INDEX (created_by)
);

-- Enable RLS
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see notes in their organization
CREATE POLICY "Users can view notes in their organization" ON conversation_notes
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Users can create notes in their organization
CREATE POLICY "Users can create notes in their organization" ON conversation_notes
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
    AND created_by = auth.uid()
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes" ON conversation_notes
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes" ON conversation_notes
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_notes_updated_at
  BEFORE UPDATE ON conversation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_notes_updated_at();