-- Create handover analytics table for tracking handover events
CREATE TABLE IF NOT EXISTS handover_analytics (
  id TEXT PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_handler TEXT NOT NULL CHECK (from_handler IN ('ai', 'human')),
  to_handler TEXT NOT NULL CHECK (to_handler IN ('ai', 'human')),
  persona TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  duration INTEGER, -- milliseconds
  error_reason TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  -- Indexes for performance
  CONSTRAINT handover_analytics_conversation_idx_key UNIQUE (id, conversation_id),
  CONSTRAINT handover_analytics_org_idx_key UNIQUE (id, organization_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_handover_analytics_conversation ON handover_analytics(conversation_id, timestamp DESC);
CREATE INDEX idx_handover_analytics_organization ON handover_analytics(organization_id, timestamp DESC);
CREATE INDEX idx_handover_analytics_timestamp ON handover_analytics(timestamp DESC);
CREATE INDEX idx_handover_analytics_success ON handover_analytics(success);
CREATE INDEX idx_handover_analytics_handler_type ON handover_analytics(from_handler, to_handler);
CREATE INDEX idx_handover_analytics_persona ON handover_analytics(persona) WHERE persona IS NOT NULL;

-- Enable RLS
ALTER TABLE handover_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view handover analytics for their organization"
  ON handover_analytics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM operators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert handover analytics for their organization"
  ON handover_analytics
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM operators 
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON handover_analytics TO authenticated;
GRANT SELECT ON handover_analytics TO service_role;

-- Add AI-related columns to conversations table if they don't exist
DO $$ 
BEGIN
  -- Add ai_persona column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'ai_persona') THEN
    ALTER TABLE conversations ADD COLUMN ai_persona TEXT;
  END IF;
  
  -- Add ai_confidence_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'ai_confidence_score') THEN
    ALTER TABLE conversations ADD COLUMN ai_confidence_score DECIMAL(3,2);
  END IF;
  
  -- Add ai_handover_session_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' AND column_name = 'ai_handover_session_id') THEN
    ALTER TABLE conversations ADD COLUMN ai_handover_session_id TEXT;
  END IF;
END $$;

-- Create a function to get handover metrics
CREATE OR REPLACE FUNCTION get_handover_metrics(
  p_organization_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_handovers INTEGER,
  successful_handovers INTEGER,
  failed_handovers INTEGER,
  avg_duration_ms INTEGER,
  handovers_by_type JSONB,
  handovers_by_persona JSONB,
  failure_reasons JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH handover_stats AS (
    SELECT 
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE success = true)::INTEGER AS successful,
      COUNT(*) FILTER (WHERE success = false)::INTEGER AS failed,
      AVG(duration)::INTEGER AS avg_duration
    FROM handover_analytics
    WHERE organization_id = p_organization_id
      AND timestamp >= p_start_date
      AND timestamp <= p_end_date
  ),
  type_stats AS (
    SELECT jsonb_object_agg(
      CONCAT(from_handler, '_to_', to_handler),
      count
    ) AS by_type
    FROM (
      SELECT from_handler, to_handler, COUNT(*)::INTEGER AS count
      FROM handover_analytics
      WHERE organization_id = p_organization_id
        AND timestamp >= p_start_date
        AND timestamp <= p_end_date
      GROUP BY from_handler, to_handler
    ) t
  ),
  persona_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(persona, 'none'),
      count
    ) AS by_persona
    FROM (
      SELECT persona, COUNT(*)::INTEGER AS count
      FROM handover_analytics
      WHERE organization_id = p_organization_id
        AND timestamp >= p_start_date
        AND timestamp <= p_end_date
        AND persona IS NOT NULL
      GROUP BY persona
    ) p
  ),
  failure_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(error_reason, 'unknown'),
      count
    ) AS reasons
    FROM (
      SELECT error_reason, COUNT(*)::INTEGER AS count
      FROM handover_analytics
      WHERE organization_id = p_organization_id
        AND timestamp >= p_start_date
        AND timestamp <= p_end_date
        AND success = false
        AND error_reason IS NOT NULL
      GROUP BY error_reason
    ) f
  )
  SELECT 
    hs.total,
    hs.successful,
    hs.failed,
    hs.avg_duration,
    COALESCE(ts.by_type, '{}'::jsonb),
    COALESCE(ps.by_persona, '{}'::jsonb),
    COALESCE(fs.reasons, '{}'::jsonb)
  FROM handover_stats hs
  CROSS JOIN type_stats ts
  CROSS JOIN persona_stats ps
  CROSS JOIN failure_stats fs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;