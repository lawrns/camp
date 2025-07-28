-- Critical Performance Indexes Migration
-- Date: 2025-07-17
-- Purpose: Fix 100ms-3000ms variable API response times by adding missing indexes
-- Priority: IMMEDIATE - Production Blocker

-- =====================================================
-- WIDGET PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- 1. Widget message retrieval optimization
-- This index optimizes the most common widget query pattern:
-- SELECT * FROM messages WHERE organization_id = ? AND conversation_id = ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_widget_perf 
ON messages(organization_id, conversation_id, created_at DESC) 
WHERE sender_type IN ('visitor', 'customer', 'agent');

-- 2. Agent dashboard message loading optimization
-- Optimizes queries for agent dashboard showing recent messages by organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_agent_dashboard 
ON messages(organization_id, sender_type, created_at DESC) 
WHERE sender_type IN ('agent', 'system');

-- 3. Real-time message broadcasting optimization
-- Includes commonly accessed columns to avoid table lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_realtime_broadcast 
ON messages(conversation_id, created_at DESC) 
INCLUDE (id, content, sender_type, sender_name, organization_id);

-- 4. Conversation last message optimization
-- Speeds up conversation list queries with last message info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message 
ON conversations(organization_id, updated_at DESC) 
WHERE status IN ('open', 'pending', 'assigned');

-- =====================================================
-- API ENDPOINT SPECIFIC OPTIMIZATIONS
-- =====================================================

-- 5. Widget API get-messages optimization
-- Optimizes the widget API endpoint that fetches conversation messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_widget_api 
ON messages(conversation_id, organization_id, created_at DESC)
WHERE sender_type != 'system';

-- 6. Conversation creation optimization
-- Speeds up conversation creation and initial message insertion
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_creation 
ON conversations(organization_id, created_at DESC, status);

-- 7. Message count queries optimization
-- For unread message counts and conversation statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_count_stats 
ON messages(conversation_id, sender_type, created_at)
WHERE sender_type IN ('visitor', 'customer');

-- =====================================================
-- MULTI-TENANT SECURITY & PERFORMANCE
-- =====================================================

-- 8. Organization isolation optimization
-- Ensures fast organization-scoped queries for multi-tenant security
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_isolation 
ON messages(organization_id, id, created_at DESC);

-- 9. Conversation assignment optimization
-- For agent workload and assignment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_assignment 
ON conversations(organization_id, assigned_to, status, priority)
WHERE assigned_to IS NOT NULL;

-- =====================================================
-- CLEANUP AND MAINTENANCE INDEXES
-- =====================================================

-- 10. Soft delete optimization
-- For queries that need to exclude deleted records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_active 
ON messages(organization_id, conversation_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 11. Conversation status filtering
-- For dashboard views filtering by conversation status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status_filter 
ON conversations(organization_id, status, updated_at DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- ANALYTICS AND REPORTING INDEXES
-- =====================================================

-- 12. Message volume analytics
-- For reporting and analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_analytics 
ON messages(organization_id, sender_type, created_at)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 13. Response time analytics
-- For measuring agent response times
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_response_time 
ON messages(conversation_id, sender_type, created_at)
WHERE sender_type IN ('agent', 'customer');

-- =====================================================
-- FOREIGN KEY PERFORMANCE OPTIMIZATION
-- =====================================================

-- 14. Ensure foreign key indexes exist for joins
-- These should already exist but let's make sure
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_fk 
ON messages(conversation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_org_fk 
ON conversations(organization_id);

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =====================================================

-- 15. AI message optimization
-- For AI-related message queries and handover scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_ai_handover 
ON messages(organization_id, conversation_id, sender_type, created_at DESC)
WHERE sender_type IN ('ai', 'system') OR metadata ? 'ai_confidence';

-- 16. File attachment optimization
-- For messages with attachments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_attachments 
ON messages(organization_id, conversation_id, created_at DESC)
WHERE attachments IS NOT NULL AND jsonb_array_length(attachments) > 0;

-- =====================================================
-- VACUUM AND ANALYZE
-- =====================================================

-- Update table statistics after creating indexes
ANALYZE messages;
ANALYZE conversations;

-- =====================================================
-- PERFORMANCE MONITORING SETUP
-- =====================================================

-- Create a view to monitor slow queries
CREATE OR REPLACE VIEW performance_monitor AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations')
ORDER BY idx_scan DESC;

-- Grant access to the performance monitoring view
GRANT SELECT ON performance_monitor TO authenticated;
GRANT SELECT ON performance_monitor TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_messages_widget_perf IS 'Optimizes widget message loading - critical for <100ms response times';
COMMENT ON INDEX idx_messages_agent_dashboard IS 'Optimizes agent dashboard queries - reduces 3000ms response times';
COMMENT ON INDEX idx_messages_realtime_broadcast IS 'Optimizes real-time message broadcasting with included columns';
COMMENT ON INDEX idx_conversations_last_message IS 'Optimizes conversation list loading with last message data';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Critical performance indexes created successfully at %', NOW();
    RAISE NOTICE 'Expected improvement: 100ms-3000ms → <500ms for 95th percentile';
    RAISE NOTICE 'Monitor performance with: SELECT * FROM performance_monitor;';
END $$;
