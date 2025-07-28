-- Create ticket sequence function for better ticket numbering
-- This provides sequential ticket numbers instead of timestamp-based ones

-- Create sequence table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_sequences (
  organization_id UUID PRIMARY KEY,
  current_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create or replace the function
CREATE OR REPLACE FUNCTION increment_ticket_sequence(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Insert or update the sequence for this organization
  INSERT INTO ticket_sequences (organization_id, current_number)
  VALUES (org_id, 1)
  ON CONFLICT (organization_id) 
  DO UPDATE SET 
    current_number = ticket_sequences.current_number + 1,
    updated_at = NOW()
  RETURNING current_number INTO next_number;
  
  RETURN next_number;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_ticket_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ticket_sequence TO service_role;

-- Add RLS policy to ticket_sequences table
ALTER TABLE ticket_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can access their own ticket sequences"
  ON ticket_sequences
  FOR ALL
  TO authenticated
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);

CREATE POLICY "Service role can access all ticket sequences"
  ON ticket_sequences
  FOR ALL
  TO service_role
  USING (true);