-- Conversation Views for Optimized Inbox Queries
-- This migration creates database views to simplify complex inbox queries

-- ============================================
-- 1. CONVERSATION SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  c.id,
  c.organization_id,
  c.customer_id,
  c.customer_name,
  c.customer_email,
  c.customer_avatar,
  c.status,
  c.priority,
  c.channel,
  c.assigned_to,
  c.tags,
  c.metadata,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.first_response_at,
  c.resolved_at,
  c.resolved_by,
  c.resolution_note,
  
  -- Agent information
  p.full_name AS assigned_agent_name,
  p.email AS assigned_agent_email,
  p.avatar_url AS assigned_agent_avatar,
  p.status AS assigned_agent_status,
  
  -- Message counts
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'visitor') AS visitor_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'agent') AS agent_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sender_type = 'ai') AS ai_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_read = FALSE) AS unread_messages,
  
  -- Latest message info
  MAX(m.created_at) AS latest_message_at,
  (
    SELECT jsonb_build_object(
      'id', lm.id,
      'content', LEFT(lm.content, 100),
      'sender_type', lm.sender_type,
      'sender_name', lm.sender_name,
      'created_at', lm.created_at
    )
    FROM messages lm
    WHERE lm.conversation_id = c.id
    ORDER BY lm.created_at DESC
    LIMIT 1
  ) AS latest_message,
  
  -- Response metrics
  EXTRACT(EPOCH FROM (COALESCE(c.first_response_at, NOW()) - c.created_at)) AS response_time_seconds,
  EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) AS resolution_time_seconds,
  
  -- Follower count
  (
    SELECT COUNT(*)
    FROM conversation_followers cf
    WHERE cf.conversation_id = c.id
  ) AS follower_count,
  
  -- Tag names
  (
    SELECT ARRAY_AGG(t.name ORDER BY t.name)
    FROM conversation_tags ct
    JOIN tags t ON t.id = ct.tag_id
    WHERE ct.conversation_id = c.id
  ) AS tag_names

FROM conversations c
LEFT JOIN profiles p ON p.id = c.assigned_to
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, p.id;

-- Create indexes on the underlying tables to support this view
CREATE INDEX IF NOT EXISTS idx_messages_conversation_summary 
  ON messages(conversation_id, sender_type, is_read, created_at);

-- ============================================
-- 2. AGENT INBOX VIEW
-- ============================================

CREATE OR REPLACE VIEW agent_inbox AS
SELECT 
  c.id AS conversation_id,
  c.organization_id,
  c.customer_name,
  c.customer_email,
  c.customer_avatar,
  c.status,
  c.priority,
  c.channel,
  c.assigned_to,
  c.tags,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  
  -- Unread count for the agent
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.is_read = FALSE
      AND m.sender_type != 'agent'
  ) AS unread_count,
  
  -- Latest message preview
  (
    SELECT LEFT(content, 100)
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) AS latest_message_preview,
  
  -- Latest message sender
  (
    SELECT sender_type
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) AS latest_message_sender_type,
  
  -- Waiting time (for open conversations)
  CASE 
    WHEN c.status = 'open' THEN 
      EXTRACT(EPOCH FROM (NOW() - COALESCE(c.last_message_at, c.created_at)))
    ELSE NULL
  END AS waiting_time_seconds,
  
  -- Is following
  EXISTS (
    SELECT 1
    FROM conversation_followers cf
    WHERE cf.conversation_id = c.id
      AND cf.user_id = auth.uid()
  ) AS is_following,
  
  -- Has AI suggestions
  EXISTS (
    SELECT 1
    FROM ai_suggestions s
    WHERE s.conversation_id = c.id
      AND s.status = 'pending'
  ) AS has_ai_suggestions

FROM conversations c
WHERE c.status IN ('open', 'pending');

-- ============================================
-- 3. CONVERSATION ACTIVITY VIEW
-- ============================================

CREATE OR REPLACE VIEW conversation_activity AS
SELECT 
  'message' AS activity_type,
  m.id AS activity_id,
  m.conversation_id,
  m.organization_id,
  m.created_at AS activity_time,
  m.sender_id AS actor_id,
  m.sender_name AS actor_name,
  m.sender_type AS actor_role,
  CASE 
    WHEN m.sender_type = 'visitor' THEN 'sent a message'
    WHEN m.sender_type = 'agent' THEN 'replied'
    WHEN m.sender_type = 'ai' THEN 'AI responded'
    ELSE 'sent a message'
  END AS activity_description,
  jsonb_build_object(
    'message_id', m.id,
    'preview', LEFT(m.content, 100),
    'attachments', m.attachments
  ) AS activity_data
FROM messages m

UNION ALL

SELECT 
  'status_change' AS activity_type,
  ae.id AS activity_id,
  (ae.metadata->>'conversation_id')::UUID AS conversation_id,
  ae.organization_id,
  ae.timestamp AS activity_time,
  ae.user_id AS actor_id,
  ae.user_name AS actor_name,
  ae.user_role AS actor_role,
  ae.description AS activity_description,
  ae.metadata AS activity_data
FROM activity_events ae
WHERE ae.type = 'conversation'
  AND ae.action LIKE '%status%'

UNION ALL

SELECT 
  'assignment' AS activity_type,
  ae.id AS activity_id,
  (ae.metadata->>'conversation_id')::UUID AS conversation_id,
  ae.organization_id,
  ae.timestamp AS activity_time,
  ae.user_id AS actor_id,
  ae.user_name AS actor_name,
  ae.user_role AS actor_role,
  ae.description AS activity_description,
  ae.metadata AS activity_data
FROM activity_events ae
WHERE ae.type = 'conversation'
  AND ae.action LIKE '%assign%'

UNION ALL

SELECT 
  'tag_change' AS activity_type,
  ae.id AS activity_id,
  (ae.metadata->>'conversation_id')::UUID AS conversation_id,
  ae.organization_id,
  ae.timestamp AS activity_time,
  ae.user_id AS actor_id,
  ae.user_name AS actor_name,
  ae.user_role AS actor_role,
  ae.description AS activity_description,
  ae.metadata AS activity_data
FROM activity_events ae
WHERE ae.type = 'conversation'
  AND ae.action LIKE '%tag%';

-- ============================================
-- 4. UNASSIGNED CONVERSATIONS VIEW
-- ============================================

CREATE OR REPLACE VIEW unassigned_conversations AS
SELECT 
  c.*,
  -- Time waiting for assignment
  EXTRACT(EPOCH FROM (NOW() - c.created_at)) AS waiting_seconds,
  
  -- Customer message count
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.sender_type = 'visitor'
  ) AS customer_message_count,
  
  -- Has attachments
  EXISTS (
    SELECT 1
    FROM messages m
    WHERE m.conversation_id = c.id
      AND jsonb_array_length(m.attachments) > 0
  ) AS has_attachments,
  
  -- Sentiment score (if available)
  (
    SELECT AVG((metadata->>'sentiment_score')::FLOAT)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.metadata->>'sentiment_score' IS NOT NULL
  ) AS avg_sentiment_score,
  
  -- Suggested agent (from AI routing)
  (
    SELECT metadata->>'suggested_agent_id'
    FROM ai_routing_suggestions ars
    WHERE ars.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) AS suggested_agent_id

FROM conversations c
WHERE c.assigned_to IS NULL
  AND c.status IN ('open', 'pending')
ORDER BY 
  CASE c.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'normal' THEN 3 
    ELSE 4 
  END,
  c.created_at ASC;

-- ============================================
-- 5. AGENT PERFORMANCE VIEW
-- ============================================

CREATE OR REPLACE VIEW agent_performance AS
SELECT 
  p.id AS agent_id,
  p.organization_id,
  p.full_name AS agent_name,
  p.email AS agent_email,
  p.status AS agent_status,
  p.role AS agent_role,
  
  -- Current workload
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'open') AS open_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'pending') AS pending_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'urgent') AS urgent_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'high') AS high_priority_conversations,
  
  -- Response metrics (last 7 days)
  AVG(
    EXTRACT(EPOCH FROM (c.first_response_at - c.created_at))
  ) FILTER (
    WHERE c.first_response_at IS NOT NULL 
    AND c.created_at >= NOW() - INTERVAL '7 days'
  ) AS avg_first_response_seconds,
  
  -- Resolution metrics (last 7 days)
  COUNT(DISTINCT c.id) FILTER (
    WHERE c.resolved_at >= NOW() - INTERVAL '7 days'
  ) AS conversations_resolved_week,
  
  AVG(
    EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))
  ) FILTER (
    WHERE c.resolved_at IS NOT NULL 
    AND c.resolved_at >= NOW() - INTERVAL '7 days'
  ) AS avg_resolution_seconds,
  
  -- Activity metrics
  COUNT(DISTINCT m.id) FILTER (
    WHERE m.created_at >= NOW() - INTERVAL '24 hours'
  ) AS messages_sent_today,
  
  MAX(m.created_at) AS last_message_sent_at,
  
  -- Satisfaction metrics (if available)
  AVG(cs.rating) AS avg_satisfaction_rating,
  COUNT(DISTINCT cs.id) AS total_ratings

FROM profiles p
LEFT JOIN conversations c ON c.assigned_to = p.id
LEFT JOIN messages m ON m.sender_id = p.id AND m.sender_type = 'agent'
LEFT JOIN customer_satisfaction cs ON cs.conversation_id = c.id
WHERE p.role IN ('agent', 'admin')
  AND p.organization_id IS NOT NULL
GROUP BY p.id;

-- ============================================
-- 6. CONVERSATION SEARCH VIEW
-- ============================================

CREATE OR REPLACE VIEW conversation_search AS
SELECT 
  c.id,
  c.organization_id,
  c.status,
  c.priority,
  c.assigned_to,
  
  -- Searchable text fields
  c.customer_name,
  c.customer_email,
  c.tags,
  
  -- Full text search document
  to_tsvector('english',
    COALESCE(c.customer_name, '') || ' ' ||
    COALESCE(c.customer_email, '') || ' ' ||
    COALESCE(array_to_string(c.tags, ' '), '') || ' ' ||
    COALESCE(c.metadata->>'notes', '')
  ) AS search_document,
  
  -- Message content for search
  (
    SELECT string_agg(content, ' ')
    FROM (
      SELECT content
      FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 10
    ) recent_messages
  ) AS recent_messages_text,
  
  -- Metadata for filtering
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.channel

FROM conversations c;

-- Create GIN index for full text search
CREATE INDEX IF NOT EXISTS idx_conversation_search_document 
  ON conversations 
  USING gin(
    to_tsvector('english',
      COALESCE(customer_name, '') || ' ' ||
      COALESCE(customer_email, '') || ' ' ||
      COALESCE(array_to_string(tags, ' '), '') || ' ' ||
      COALESCE(metadata->>'notes', '')
    )
  );

-- ============================================
-- 7. GRANTS
-- ============================================

-- Grant read access to views for authenticated users
GRANT SELECT ON conversation_summary TO authenticated;
GRANT SELECT ON agent_inbox TO authenticated;
GRANT SELECT ON conversation_activity TO authenticated;
GRANT SELECT ON unassigned_conversations TO authenticated;
GRANT SELECT ON agent_performance TO authenticated;
GRANT SELECT ON conversation_search TO authenticated;