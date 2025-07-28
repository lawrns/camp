-- Standardize Assignment Columns Migration
-- This migration consolidates multiple assignment columns into a single standard

-- 1. First, let's see what data we have in each column
-- (This is for reference, the actual migration will handle data preservation)

-- 2. Create a new standardized assignment column if it doesn't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id);

-- 3. Migrate data from existing columns to the new standard column
-- Priority: assigned_to > assigned_operator_id > assigned_agent_id > assignee_id

UPDATE conversations 
SET assigned_to_user_id = COALESCE(
  assigned_to,
  assigned_operator_id,
  assigned_agent_id,
  CASE 
    WHEN assignee_id IS NOT NULL AND assignee_id != '' 
    THEN assignee_id::UUID 
    ELSE NULL 
  END
)
WHERE assigned_to_user_id IS NULL;

-- 4. Create index for the new column
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to_user_id 
ON conversations(assigned_to_user_id);

-- 5. Add assignment metadata column for tracking assignment history
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assignment_metadata JSONB DEFAULT '{}';

-- 6. Update assignment metadata with current assignment info
UPDATE conversations 
SET assignment_metadata = jsonb_build_object(
  'assigned_at', COALESCE(assigned_at, updated_at, created_at),
  'assigned_by', 'system_migration',
  'assignment_type', CASE 
    WHEN assigned_to_ai = true THEN 'ai'
    WHEN assigned_to_user_id IS NOT NULL THEN 'human'
    ELSE 'unassigned'
  END,
  'migration_source', CASE
    WHEN assigned_to IS NOT NULL THEN 'assigned_to'
    WHEN assigned_operator_id IS NOT NULL THEN 'assigned_operator_id'
    WHEN assigned_agent_id IS NOT NULL THEN 'assigned_agent_id'
    WHEN assignee_id IS NOT NULL THEN 'assignee_id'
    ELSE 'none'
  END
)
WHERE assignment_metadata = '{}' OR assignment_metadata IS NULL;

-- 7. Create a view for backward compatibility during transition
CREATE OR REPLACE VIEW conversation_assignments AS
SELECT 
  id,
  organization_id,
  assigned_to_user_id,
  assigned_to_ai,
  assignment_metadata,
  -- Backward compatibility columns
  assigned_to_user_id as assigned_to,
  assigned_to_user_id as assigned_operator_id,
  assigned_to_user_id as assigned_agent_id,
  assigned_to_user_id::text as assignee_id,
  (assignment_metadata->>'assigned_at')::timestamptz as assigned_at
FROM conversations;

-- 8. Add RLS policy for the new column
CREATE POLICY "Users can view assignments in their organization" 
ON conversations FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- 9. Add trigger to automatically update assignment_metadata on assignment changes
CREATE OR REPLACE FUNCTION update_assignment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if assigned_to_user_id or assigned_to_ai changed
  IF (OLD.assigned_to_user_id IS DISTINCT FROM NEW.assigned_to_user_id) 
     OR (OLD.assigned_to_ai IS DISTINCT FROM NEW.assigned_to_ai) THEN
    
    NEW.assignment_metadata = jsonb_build_object(
      'assigned_at', NOW(),
      'assigned_by', COALESCE(current_setting('request.jwt.claim.sub', true), 'system'),
      'assignment_type', CASE 
        WHEN NEW.assigned_to_ai = true THEN 'ai'
        WHEN NEW.assigned_to_user_id IS NOT NULL THEN 'human'
        ELSE 'unassigned'
      END,
      'previous_assignee', OLD.assigned_to_user_id,
      'previous_ai_assigned', OLD.assigned_to_ai
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_assignment_metadata ON conversations;
CREATE TRIGGER trigger_update_assignment_metadata
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_metadata();

-- 10. Add helpful functions for assignment queries
CREATE OR REPLACE FUNCTION get_agent_workload(agent_id UUID, org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM conversations 
    WHERE assigned_to_user_id = agent_id 
    AND organization_id = org_id
    AND status IN ('open', 'pending')
  );
END;
$$ LANGUAGE plpgsql;

-- 11. Add function to get available agents
CREATE OR REPLACE FUNCTION get_available_agents(org_id UUID)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  current_workload INTEGER,
  max_capacity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    om.role,
    get_agent_workload(om.user_id, org_id) as current_workload,
    10 as max_capacity -- TODO: Make this configurable
  FROM organization_members om
  JOIN profiles p ON om.user_id = p.user_id
  WHERE om.organization_id = org_id
  AND om.status = 'active'
  AND om.role IN ('admin', 'agent', 'owner')
  ORDER BY current_workload ASC, p.full_name ASC;
END;
$$ LANGUAGE plpgsql;

-- 12. Add comments for documentation
COMMENT ON COLUMN conversations.assigned_to_user_id IS 'Standardized assignment column - references auth.users(id)';
COMMENT ON COLUMN conversations.assignment_metadata IS 'JSON metadata about assignment history and context';
COMMENT ON FUNCTION get_agent_workload IS 'Returns current conversation count for an agent';
COMMENT ON FUNCTION get_available_agents IS 'Returns available agents with workload information';

-- 13. Grant necessary permissions
GRANT SELECT ON conversation_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_workload TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_agents TO authenticated;
