-- Inbox Performance Optimizations Migration
-- This migration creates specialized indexes, views, and functions for the inbox feature
-- to improve query performance and reduce database load

-- ============================================
-- 1. ADDITIONAL PERFORMANCE INDEXES
-- ============================================

-- Composite index for inbox conversation list queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_inbox_list 
  ON public.conversations(organization_id, status, last_message_at DESC NULLS LAST, updated_at DESC)
  WHERE status IN ('open', 'pending');

-- Index for unread message counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread_count 
  ON public.messages(conversation_id, is_read, created_at)
  WHERE is_read = FALSE;

-- Index for customer-based conversation lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_customer_lookup 
  ON public.conversations(organization_id, customer_email, created_at DESC);

-- Index for agent workload queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_agent_workload 
  ON public.conversations(assigned_to, status, priority)
  WHERE assigned_to IS NOT NULL AND status IN ('open', 'pending');

-- Index for message search within conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_search 
  ON public.messages USING gin(to_tsvector('english', content));

-- ============================================
-- 2. MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================

-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS conversation_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS agent_workload_summary CASCADE;

-- Conversation statistics view
CREATE MATERIALIZED VIEW conversation_stats AS
SELECT 
  c.id,
  c.organization_id,
  c.status,
  c.priority,
  c.assigned_to,
  c.customer_email,
  c.customer_name,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'visitor') AS visitor_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'agent') AS agent_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'ai') AS ai_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_read = FALSE) AS unread_messages,
  MAX(m.created_at) AS latest_message_at,
  EXTRACT(EPOCH FROM (COALESCE(c.first_response_at, NOW()) - c.created_at)) AS response_time_seconds,
  EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) AS resolution_time_seconds
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id
GROUP BY c.id;

-- Create indexes on the materialized view
CREATE INDEX idx_conversation_stats_org_status 
  ON conversation_stats(organization_id, status);
CREATE INDEX idx_conversation_stats_assigned 
  ON conversation_stats(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_conversation_stats_updated 
  ON conversation_stats(organization_id, updated_at DESC);

-- Agent workload summary view
CREATE MATERIALIZED VIEW agent_workload_summary AS
SELECT 
  p.id AS agent_id,
  p.organization_id,
  p.full_name AS agent_name,
  p.email AS agent_email,
  p.status AS agent_status,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'open') AS open_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'pending') AS pending_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'urgent') AS urgent_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'high') AS high_priority_conversations,
  AVG(EXTRACT(EPOCH FROM (NOW() - c.last_message_at))) FILTER (WHERE c.status = 'open') AS avg_last_response_seconds,
  MAX(c.last_message_at) AS most_recent_activity
FROM public.profiles p
LEFT JOIN public.conversations c ON c.assigned_to = p.id AND c.status IN ('open', 'pending')
WHERE p.role IN ('agent', 'admin')
GROUP BY p.id;

-- Create indexes on the workload view
CREATE INDEX idx_agent_workload_org 
  ON agent_workload_summary(organization_id);
CREATE INDEX idx_agent_workload_status 
  ON agent_workload_summary(agent_status);

-- ============================================
-- 3. FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Function to get inbox conversations with all metadata
CREATE OR REPLACE FUNCTION get_inbox_conversations(
  p_organization_id UUID,
  p_status VARCHAR[] DEFAULT ARRAY['open', 'pending'],
  p_assigned_to UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  customer_name VARCHAR,
  customer_email VARCHAR,
  customer_avatar TEXT,
  status VARCHAR,
  priority VARCHAR,
  assigned_to UUID,
  assigned_agent_name VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  last_message_preview TEXT,
  last_message_sender_type VARCHAR,
  tags TEXT[]
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (conversation_id)
      conversation_id,
      content,
      sender_type,
      created_at
    FROM public.messages
    WHERE organization_id = p_organization_id
    ORDER BY conversation_id, created_at DESC
  ),
  unread_counts AS (
    SELECT 
      conversation_id,
      COUNT(*) AS unread_count
    FROM public.messages
    WHERE organization_id = p_organization_id
      AND is_read = FALSE
    GROUP BY conversation_id
  )
  SELECT 
    c.id AS conversation_id,
    c.customer_name,
    c.customer_email,
    c.customer_avatar,
    c.status,
    c.priority,
    c.assigned_to,
    p.full_name AS assigned_agent_name,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    COALESCE(uc.unread_count, 0)::INTEGER AS unread_count,
    LEFT(lm.content, 100) AS last_message_preview,
    lm.sender_type AS last_message_sender_type,
    c.tags
  FROM public.conversations c
  LEFT JOIN public.profiles p ON p.id = c.assigned_to
  LEFT JOIN latest_messages lm ON lm.conversation_id = c.id
  LEFT JOIN unread_counts uc ON uc.conversation_id = c.id
  WHERE c.organization_id = p_organization_id
    AND (p_status IS NULL OR c.status = ANY(p_status))
    AND (p_assigned_to IS NULL OR c.assigned_to = p_assigned_to)
  ORDER BY 
    CASE WHEN c.priority = 'urgent' THEN 1 
         WHEN c.priority = 'high' THEN 2 
         WHEN c.priority = 'normal' THEN 3 
         ELSE 4 END,
    c.last_message_at DESC NULLS LAST,
    c.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to batch update message read status
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.messages
  SET 
    is_read = TRUE,
    read_at = NOW(),
    read_by = p_user_id
  WHERE conversation_id = p_conversation_id
    AND is_read = FALSE
    AND sender_type != 'agent'; -- Don't mark own messages as read
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Log read receipt event
  INSERT INTO public.message_read_status (
    message_id,
    user_id,
    read_at
  )
  SELECT 
    id,
    p_user_id,
    NOW()
  FROM public.messages
  WHERE conversation_id = p_conversation_id
    AND sender_type != 'agent'
  ON CONFLICT (message_id, user_id) DO NOTHING;
  
  RETURN v_updated_count;
END;
$$;

-- Function to get conversation activity timeline
CREATE OR REPLACE FUNCTION get_conversation_timeline(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  event_type VARCHAR,
  event_time TIMESTAMPTZ,
  actor_name VARCHAR,
  actor_role VARCHAR,
  description TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  -- Messages
  SELECT 
    'message'::VARCHAR AS event_type,
    m.created_at AS event_time,
    m.sender_name AS actor_name,
    m.sender_type AS actor_role,
    CASE 
      WHEN m.sender_type = 'visitor' THEN 'sent a message'
      WHEN m.sender_type = 'agent' THEN 'replied'
      WHEN m.sender_type = 'ai' THEN 'AI responded'
      ELSE 'sent a message'
    END AS description,
    jsonb_build_object(
      'message_id', m.id,
      'preview', LEFT(m.content, 100),
      'attachments', m.attachments
    ) AS metadata
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
  
  UNION ALL
  
  -- Status changes
  SELECT 
    'status_change'::VARCHAR AS event_type,
    ae.timestamp AS event_time,
    ae.user_name AS actor_name,
    ae.user_role AS actor_role,
    ae.description,
    ae.metadata
  FROM public.activity_events ae
  WHERE ae.metadata->>'conversation_id' = p_conversation_id::TEXT
    AND ae.type = 'conversation'
    AND ae.action LIKE '%status%'
  
  UNION ALL
  
  -- Assignments
  SELECT 
    'assignment'::VARCHAR AS event_type,
    ae.timestamp AS event_time,
    ae.user_name AS actor_name,
    ae.user_role AS actor_role,
    ae.description,
    ae.metadata
  FROM public.activity_events ae
  WHERE ae.metadata->>'conversation_id' = p_conversation_id::TEXT
    AND ae.type = 'conversation'
    AND ae.action LIKE '%assign%'
  
  ORDER BY event_time DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- 4. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================

-- Function to refresh conversation stats
CREATE OR REPLACE FUNCTION refresh_conversation_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_stats;
END;
$$;

-- Function to refresh agent workload
CREATE OR REPLACE FUNCTION refresh_agent_workload()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_workload_summary;
END;
$$;

-- ============================================
-- 5. SCHEDULED REFRESH FOR MATERIALIZED VIEWS
-- ============================================

-- Create a cron job to refresh materialized views every 5 minutes
-- (Requires pg_cron extension)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule conversation stats refresh
    PERFORM cron.schedule(
      'refresh-conversation-stats',
      '*/5 * * * *',
      'SELECT refresh_conversation_stats();'
    );
    
    -- Schedule agent workload refresh
    PERFORM cron.schedule(
      'refresh-agent-workload',
      '*/5 * * * *',
      'SELECT refresh_agent_workload();'
    );
  END IF;
END $$;

-- ============================================
-- 6. GRANTS
-- ============================================

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_inbox_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_conversation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_agent_workload TO authenticated;

-- Grant permissions on views
GRANT SELECT ON conversation_stats TO authenticated;
GRANT SELECT ON agent_workload_summary TO authenticated;

-- ============================================
-- 7. INITIAL REFRESH
-- ============================================

-- Perform initial refresh of materialized views
REFRESH MATERIALIZED VIEW conversation_stats;
REFRESH MATERIALIZED VIEW agent_workload_summary;