-- ==============================================================================
-- API INTEGRATION EXAMPLES
-- Version: 1.0.0
-- Date: 2025-01-23
-- Purpose: Example queries for replacing mock data with real database calls
-- ==============================================================================

-- ==============================================================================
-- ACTIVITY FEED API EXAMPLES
-- Replace mock data in ActivityFeed.tsx
-- ==============================================================================

-- Get recent activities for organization
SELECT * FROM get_activity_feed(
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID, -- organization_id
    20, -- limit
    0, -- offset
    NULL, -- all activity types
    NOW() - INTERVAL '24 hours', -- start_date
    NOW() -- end_date
);

-- Get specific activity types
SELECT * FROM get_activity_feed(
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID,
    50,
    0,
    ARRAY['message', 'ticket']::TEXT[], -- only message and ticket activities
    NULL,
    NULL
);

-- Real-time activity subscription (for Supabase Realtime)
-- Subscribe to: activity_logs:organization_id=eq.b5e80170-004c-4e82-a88c-3e2166b169dd

-- ==============================================================================
-- DASHBOARD METRICS API EXAMPLES
-- Replace mock metrics in dashboard components
-- ==============================================================================

-- Get current dashboard metrics
SELECT * FROM dashboard_metrics 
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID;

-- Get real-time stats with trends
SELECT * FROM get_realtime_stats('b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID);

-- Get metrics for specific time period
SELECT 
    time_bucket,
    total_conversations,
    new_conversations,
    resolved_conversations,
    avg_satisfaction_score,
    ai_handled_conversations,
    active_agents
FROM conversation_metrics
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND bucket_type = 'hour'
    AND time_bucket >= NOW() - INTERVAL '24 hours'
ORDER BY time_bucket DESC;

-- Get satisfaction distribution
SELECT 
    rating,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM customer_satisfaction
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY rating
ORDER BY rating DESC;

-- ==============================================================================
-- CONVERSATION ANALYTICS API EXAMPLES
-- ==============================================================================

-- Get conversation volume by channel
SELECT 
    channel,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'open') as open,
    COUNT(*) FILTER (WHERE status = 'closed') as closed,
    AVG(first_response_time_seconds) as avg_response_time
FROM conversations
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY channel
ORDER BY total DESC;

-- Get agent performance metrics
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(DISTINCT c.id) as conversations_handled,
    AVG(c.first_response_time_seconds) as avg_response_time,
    AVG(c.resolution_time_minutes) as avg_resolution_time,
    AVG(cs.rating) as avg_satisfaction_score,
    COUNT(cs.id) FILTER (WHERE cs.rating >= 4) * 100.0 / NULLIF(COUNT(cs.id), 0) as satisfaction_rate
FROM profiles p
JOIN conversations c ON c.assigned_agent_id = p.id
LEFT JOIN customer_satisfaction cs ON cs.conversation_id = c.id
WHERE c.organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.email
ORDER BY conversations_handled DESC;

-- Get AI performance metrics
SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE assignedtoai = true) as ai_conversations,
    COUNT(*) as total_conversations,
    ROUND(COUNT(*) FILTER (WHERE assignedtoai = true) * 100.0 / COUNT(*), 2) as ai_handling_rate,
    COUNT(*) FILTER (WHERE assignedtoai = true AND status = 'closed') as ai_resolved,
    ROUND(
        COUNT(*) FILTER (WHERE assignedtoai = true AND status = 'closed') * 100.0 / 
        NULLIF(COUNT(*) FILTER (WHERE assignedtoai = true), 0), 
        2
    ) as ai_resolution_rate
FROM conversations
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ==============================================================================
-- ACTIVITY LOGGING API EXAMPLES
-- How to log different types of activities
-- ==============================================================================

-- Log a message activity
SELECT log_activity(
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID, -- organization_id
    'message', -- activity_type
    'replied', -- action
    'to customer inquiry about refund policy', -- description
    '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::UUID, -- actor_id (agent)
    'conv-123'::UUID, -- conversation_id
    '{"priority": "high", "response_time": 45}'::JSONB -- metadata
);

-- Log an AI handover
SELECT log_activity(
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID,
    'handover',
    'transferred',
    'conversation escalated to human agent due to complex query',
    NULL, -- system action
    'conv-456'::UUID,
    '{"reason": "low_confidence", "ai_confidence": 0.65, "previous_assignee": "ai"}'::JSONB
);

-- Log a ticket resolution
SELECT log_activity(
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID,
    'ticket',
    'resolved',
    'billing issue resolved with account credit',
    '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::UUID,
    'conv-789'::UUID,
    '{"ticket_id": "TICK-001", "resolution_time": 120, "customer_satisfied": true}'::JSONB
);

-- ==============================================================================
-- CUSTOMER SATISFACTION API EXAMPLES
-- ==============================================================================

-- Record customer satisfaction
INSERT INTO customer_satisfaction (
    organization_id,
    conversation_id,
    rating,
    feedback_text,
    customer_email,
    customer_name,
    agent_id,
    agent_name,
    categories,
    sentiment,
    source
) VALUES (
    'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID,
    'conv-123'::UUID,
    5,
    'Excellent service! The agent was very helpful and resolved my issue quickly.',
    'customer@example.com',
    'John Doe',
    '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::UUID,
    'Jane Agent',
    ARRAY['support', 'billing']::TEXT[],
    'positive',
    'widget'
);

-- Get satisfaction trends
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_ratings,
    AVG(rating) as avg_rating,
    COUNT(*) FILTER (WHERE rating >= 4) as positive_ratings,
    COUNT(*) FILTER (WHERE rating <= 2) as negative_ratings,
    MODE() WITHIN GROUP (ORDER BY sentiment) as dominant_sentiment
FROM customer_satisfaction
WHERE organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ==============================================================================
-- SYSTEM SETTINGS & FEATURE FLAGS API EXAMPLES
-- ==============================================================================

-- Get organization settings
SELECT 
    setting_key,
    setting_value,
    description
FROM system_settings
WHERE (organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID OR organization_id IS NULL)
    AND setting_type IN ('global', 'organization')
ORDER BY category, setting_key;

-- Check if feature is enabled for user
SELECT 
    flag_key,
    flag_name,
    is_enabled,
    rollout_percentage,
    CASE 
        WHEN 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID = ANY(enabled_organizations) THEN true
        WHEN '60e6d6ec-4fcf-4d7d-8d74-ccfd97abe30c'::UUID = ANY(enabled_users) THEN true
        WHEN is_enabled AND random() * 100 <= rollout_percentage THEN true
        ELSE false
    END as is_enabled_for_user
FROM feature_flags
WHERE flag_key IN ('ai_suggestions', 'bulk_actions', 'advanced_analytics');

-- ==============================================================================
-- SEARCH QUERIES
-- ==============================================================================

-- Full-text search on conversations
SELECT 
    c.id,
    c.subject,
    c.customer_name,
    c.customer_email,
    c.status,
    c.priority,
    c.created_at,
    ts_rank(
        to_tsvector('english', COALESCE(c.subject, '') || ' ' || COALESCE(c.customer_name, '') || ' ' || COALESCE(c.customer_email, '')),
        plainto_tsquery('english', 'billing issue')
    ) as relevance
FROM conversations c
WHERE c.organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND to_tsvector('english', COALESCE(c.subject, '') || ' ' || COALESCE(c.customer_name, '') || ' ' || COALESCE(c.customer_email, ''))
        @@ plainto_tsquery('english', 'billing issue')
ORDER BY relevance DESC, c.created_at DESC
LIMIT 20;

-- Search messages
SELECT 
    m.id,
    m.conversation_id,
    m.content,
    m.sender_name,
    m.sender_type,
    m.created_at,
    c.subject,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', 'refund')) as relevance
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', 'refund')
    AND m.is_deleted = false
ORDER BY relevance DESC, m.created_at DESC
LIMIT 50;

-- ==============================================================================
-- REAL-TIME SUBSCRIPTION EXAMPLES
-- For use with Supabase Realtime
-- ==============================================================================

/*
// JavaScript/TypeScript examples for real-time subscriptions

// Subscribe to new activities
const activitySubscription = supabase
  .channel('activity-feed')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_logs',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('New activity:', payload.new);
      // Update UI with new activity
    }
  )
  .subscribe();

// Subscribe to conversation metrics updates
const metricsSubscription = supabase
  .channel('dashboard-metrics')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'conversation_metrics',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('Metrics updated:', payload);
      // Refresh dashboard
    }
  )
  .subscribe();

// Subscribe to satisfaction ratings
const satisfactionSubscription = supabase
  .channel('satisfaction-ratings')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'customer_satisfaction',
      filter: `organization_id=eq.${organizationId}`
    },
    (payload) => {
      console.log('New rating:', payload.new);
      // Show notification or update metrics
    }
  )
  .subscribe();
*/

-- ==============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ==============================================================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('activity_logs', 'customer_satisfaction', 'conversation_metrics')
ORDER BY idx_scan DESC;

-- Monitor table sizes
SELECT 
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN ('activity_logs', 'customer_satisfaction', 'conversation_metrics', 'conversations', 'messages')
ORDER BY pg_total_relation_size(relid) DESC;

-- ==============================================================================
-- DATA PRIVACY QUERIES
-- For GDPR compliance and data management
-- ==============================================================================

-- Export customer data
SELECT 
    c.id as conversation_id,
    c.created_at as conversation_date,
    c.subject,
    c.status,
    m.content as message_content,
    m.sender_type,
    m.created_at as message_date,
    cs.rating as satisfaction_rating,
    cs.feedback_text as satisfaction_feedback
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN customer_satisfaction cs ON cs.conversation_id = c.id
WHERE c.customer_email = 'customer@example.com'
    AND c.organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID
ORDER BY c.created_at DESC, m.created_at ASC;

-- Anonymize customer data (for right to be forgotten)
UPDATE conversations
SET 
    customer_name = 'Anonymized User',
    customer_email = CONCAT('anonymized-', id, '@example.com'),
    customer = jsonb_build_object('anonymized', true, 'anonymized_at', NOW())
WHERE customer_email = 'customer@example.com'
    AND organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'::UUID;

-- ==============================================================================
-- END OF API INTEGRATION EXAMPLES
-- ==============================================================================