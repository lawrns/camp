-- Realtime Optimization Migration
-- Implements selective realtime triggers and performance optimizations
-- for <100ms latency AI handovers

-- ============================================================================
-- SELECTIVE REALTIME TRIGGERS
-- ============================================================================

-- Enable realtime only on specific tables that need it
-- This reduces overhead and improves performance

-- Messages table - Core realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Conversations table - Status updates and assignments
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Typing indicators - Real-time typing status
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE widget_typing_indicators;

-- Realtime optimized views
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_conversations;

-- Remove tables that don't need realtime to reduce overhead
-- (These can be added back if needed)
-- ALTER PUBLICATION supabase_realtime DROP TABLE activity_logs;
-- ALTER PUBLICATION supabase_realtime DROP TABLE attachments;
-- ALTER PUBLICATION supabase_realtime DROP TABLE knowledge_documents;

-- ============================================================================
-- PERFORMANCE INDEXES FOR REALTIME QUERIES
-- ============================================================================

-- Composite index for organization + conversation realtime filtering
CREATE INDEX IF NOT EXISTS idx_messages_org_conv_created 
ON messages (organization_id, conversation_id, created_at DESC);

-- Index for typing indicator cleanup (last_activity based)
CREATE INDEX IF NOT EXISTS idx_typing_indicators_cleanup 
ON typing_indicators (last_activity) 
WHERE is_typing = false;

-- Index for widget typing indicator cleanup
CREATE INDEX IF NOT EXISTS idx_widget_typing_cleanup 
ON widget_typing_indicators (last_activity) 
WHERE is_typing = false;

-- Partial index for active conversations only
CREATE INDEX IF NOT EXISTS idx_conversations_active_realtime 
ON conversations (organization_id, last_message_at DESC) 
WHERE closed_at IS NULL;

-- Index for AI handover conversations (high priority)
CREATE INDEX IF NOT EXISTS idx_conversations_ai_handover_realtime 
ON conversations (organization_id, ai_handover_active, last_message_at DESC) 
WHERE ai_handover_active = true;

-- ============================================================================
-- BURST BUFFERING FUNCTIONS
-- ============================================================================

-- Function to batch insert messages for burst scenarios
CREATE OR REPLACE FUNCTION batch_insert_messages(
  message_batch jsonb[]
) RETURNS void AS $$
DECLARE
  msg jsonb;
BEGIN
  -- Insert messages in batch to reduce individual insert overhead
  FOREACH msg IN ARRAY message_batch
  LOOP
    INSERT INTO messages (
      id, conversation_id, organization_id, content, 
      sender_type, sender_id, sender_name, sender_email,
      created_at, updated_at
    ) VALUES (
      (msg->>'id')::uuid,
      (msg->>'conversation_id')::uuid,
      (msg->>'organization_id')::uuid,
      msg->>'content',
      msg->>'sender_type',
      msg->>'sender_id',
      msg->>'sender_name',
      msg->>'sender_email',
      COALESCE((msg->>'created_at')::timestamptz, NOW()),
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old typing indicators (prevents table bloat)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators() 
RETURNS void AS $$
BEGIN
  -- Remove typing indicators older than 30 seconds
  DELETE FROM typing_indicators 
  WHERE last_activity < NOW() - INTERVAL '30 seconds';
  
  DELETE FROM widget_typing_indicators 
  WHERE last_activity < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REALTIME PERFORMANCE MONITORING
-- ============================================================================

-- Table to track realtime performance metrics
CREATE TABLE IF NOT EXISTS realtime_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  metric_type text NOT NULL, -- 'latency', 'throughput', 'connection_count'
  metric_value numeric NOT NULL,
  measurement_timestamp timestamptz DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for performance metrics queries
CREATE INDEX IF NOT EXISTS idx_realtime_metrics_org_type_time 
ON realtime_performance_metrics (organization_id, metric_type, measurement_timestamp DESC);

-- Function to record realtime metrics
CREATE OR REPLACE FUNCTION record_realtime_metric(
  p_organization_id uuid,
  p_metric_type text,
  p_metric_value numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO realtime_performance_metrics (
    organization_id, metric_type, metric_value, metadata
  ) VALUES (
    p_organization_id, p_metric_type, p_metric_value, p_metadata
  );
  
  -- Keep only last 24 hours of metrics to prevent bloat
  DELETE FROM realtime_performance_metrics 
  WHERE measurement_timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- OPTIMIZED REALTIME VIEWS
-- ============================================================================

-- Materialized view for high-frequency conversation queries
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_conversations_optimized AS
SELECT 
  c.id,
  c.organization_id,
  c.customer_name,
  c.customer_email,
  c.status,
  c.priority,
  c.assigned_to_user_id,
  c.ai_handover_active,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  -- Precompute message count for performance
  COALESCE(msg_stats.message_count, 0) as message_count,
  -- Precompute last message preview
  last_msg.content as last_message_content,
  last_msg.sender_type as last_message_sender_type
FROM conversations c
LEFT JOIN (
  SELECT 
    conversation_id,
    COUNT(*) as message_count
  FROM messages 
  GROUP BY conversation_id
) msg_stats ON c.id = msg_stats.conversation_id
LEFT JOIN LATERAL (
  SELECT content, sender_type
  FROM messages m
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
) last_msg ON true
WHERE c.closed_at IS NULL; -- Only active conversations

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_realtime_conv_opt_id 
ON realtime_conversations_optimized (id);

CREATE INDEX IF NOT EXISTS idx_realtime_conv_opt_org_updated 
ON realtime_conversations_optimized (organization_id, last_message_at DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_realtime_conversations() 
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY realtime_conversations_optimized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTOMATED CLEANUP JOBS
-- ============================================================================

-- Function to run periodic realtime cleanup
CREATE OR REPLACE FUNCTION realtime_maintenance() 
RETURNS void AS $$
BEGIN
  -- Cleanup old typing indicators
  PERFORM cleanup_old_typing_indicators();
  
  -- Refresh materialized view for better performance
  PERFORM refresh_realtime_conversations();
  
  -- Cleanup old performance metrics
  DELETE FROM realtime_performance_metrics 
  WHERE measurement_timestamp < NOW() - INTERVAL '24 hours';
  
  -- Log maintenance completion
  INSERT INTO activity_logs (action, details, created_at)
  VALUES (
    'realtime_maintenance_completed',
    jsonb_build_object(
      'timestamp', NOW(),
      'typing_indicators_cleaned', true,
      'materialized_view_refreshed', true,
      'metrics_cleaned', true
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REALTIME TRIGGERS FOR MATERIALIZED VIEW UPDATES
-- ============================================================================

-- Trigger function to update materialized view on conversation changes
CREATE OR REPLACE FUNCTION trigger_refresh_realtime_conversations()
RETURNS trigger AS $$
BEGIN
  -- Refresh the materialized view when conversations or messages change
  -- Use a background job to avoid blocking the main transaction
  PERFORM pg_notify('refresh_realtime_view', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic refresh
DROP TRIGGER IF EXISTS trigger_conversations_realtime_refresh ON conversations;
CREATE TRIGGER trigger_conversations_realtime_refresh
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_realtime_conversations();

DROP TRIGGER IF EXISTS trigger_messages_realtime_refresh ON messages;
CREATE TRIGGER trigger_messages_realtime_refresh
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_realtime_conversations();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR REALTIME
-- ============================================================================

-- Ensure RLS policies are optimized for realtime queries
-- Policy for messages - organization-based access
DROP POLICY IF EXISTS "messages_realtime_policy" ON messages;
CREATE POLICY "messages_realtime_policy" ON messages
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for typing indicators - organization-based access
DROP POLICY IF EXISTS "typing_indicators_realtime_policy" ON typing_indicators;
CREATE POLICY "typing_indicators_realtime_policy" ON typing_indicators
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for widget typing indicators - organization-based access
DROP POLICY IF EXISTS "widget_typing_realtime_policy" ON widget_typing_indicators;
CREATE POLICY "widget_typing_realtime_policy" ON widget_typing_indicators
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PERFORMANCE MONITORING SETUP
-- ============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION batch_insert_messages(jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_typing_indicators() TO authenticated;
GRANT EXECUTE ON FUNCTION record_realtime_metric(uuid, text, numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_realtime_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION realtime_maintenance() TO authenticated;

-- Grant access to performance metrics table
GRANT SELECT, INSERT ON realtime_performance_metrics TO authenticated;

-- Grant access to optimized view
GRANT SELECT ON realtime_conversations_optimized TO authenticated;

-- ============================================================================
-- INITIAL DATA AND SETUP
-- ============================================================================

-- Refresh the materialized view initially
SELECT refresh_realtime_conversations();

-- Record migration completion
INSERT INTO activity_logs (action, details, created_at)
VALUES (
  'realtime_optimization_migration_completed',
  jsonb_build_object(
    'version', '20250804_realtime_optimization',
    'features', jsonb_build_array(
      'selective_realtime_triggers',
      'performance_indexes',
      'burst_buffering',
      'automated_cleanup',
      'materialized_views',
      'performance_monitoring'
    ),
    'timestamp', NOW()
  ),
  NOW()
);

-- Add comment for documentation
COMMENT ON FUNCTION batch_insert_messages(jsonb[]) IS 'Batch insert messages for burst scenarios to reduce overhead';
COMMENT ON FUNCTION cleanup_old_typing_indicators() IS 'Remove old typing indicators to prevent table bloat';
COMMENT ON FUNCTION record_realtime_metric(uuid, text, numeric, jsonb) IS 'Record realtime performance metrics';
COMMENT ON FUNCTION realtime_maintenance() IS 'Periodic maintenance for realtime system optimization';
COMMENT ON MATERIALIZED VIEW realtime_conversations_optimized IS 'Optimized view for high-frequency conversation queries';
