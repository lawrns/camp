-- Widget Performance Database Indexes v2
-- Optimized for sub-200ms API performance
-- Created for widget consolidation project - Phase 0

-- Critical indexes for message queries
-- These support the most common widget API calls

-- 1. Messages by conversation (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created_at 
ON messages (conversation_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 2. Messages by organization (for admin queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_organization_created_at 
ON messages (organization_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 3. Conversations by organization (for listing conversations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_organization_updated_at 
ON conversations (organization_id, updated_at DESC)
WHERE deleted_at IS NULL;

-- 4. Real-time message queries (for widget live updates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_realtime 
ON messages (organization_id, conversation_id, created_at DESC) 
WHERE sender_type IN ('agent', 'ai') AND deleted_at IS NULL;

-- 5. Widget authentication queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_widget_auth
ON conversations (organization_id, id)
WHERE deleted_at IS NULL;

-- 6. Message search optimization (for AI context)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_content_search
ON messages USING gin(to_tsvector('english', content))
WHERE deleted_at IS NULL AND content IS NOT NULL;

-- FAQ and Knowledge Base indexes for edge caching

-- 7. FAQ entries by organization and locale
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faq_organization_locale 
ON faq_entries (organization_id, locale, updated_at DESC)
WHERE published = true AND deleted_at IS NULL;

-- 8. Knowledge base search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_organization_search 
ON knowledge_base (organization_id, search_vector) 
USING gin
WHERE published = true AND deleted_at IS NULL;

-- 9. Knowledge base by category (for structured queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_category_org
ON knowledge_base (organization_id, category, updated_at DESC)
WHERE published = true AND deleted_at IS NULL;

-- Performance monitoring indexes

-- 10. Widget sessions for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_widget_sessions_org_created
ON widget_sessions (organization_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 11. Performance metrics tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_timestamp
ON performance_metrics (organization_id, metric_type, timestamp DESC);

-- User and visitor indexes for widget authentication

-- 12. Visitor identification for widget auth
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_organization_identifier
ON visitors (organization_id, visitor_identifier)
WHERE deleted_at IS NULL;

-- 13. User organization membership (for agent queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_org
ON user_organizations (user_id, organization_id)
WHERE deleted_at IS NULL;

-- Composite indexes for complex widget queries

-- 14. Message thread queries (for conversation context)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread_context
ON messages (conversation_id, sender_type, created_at DESC)
WHERE deleted_at IS NULL;

-- 15. AI handover queries (for escalation tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_ai_handover
ON messages (organization_id, ai_confidence, created_at DESC)
WHERE sender_type = 'ai' AND ai_confidence IS NOT NULL AND deleted_at IS NULL;

-- 16. File attachments for widget uploads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_message_org
ON message_attachments (message_id, organization_id)
WHERE deleted_at IS NULL;

-- Partial indexes for specific widget scenarios

-- 17. Unread messages for notification counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread_visitor
ON messages (conversation_id, created_at DESC)
WHERE sender_type IN ('agent', 'ai') AND read_at IS NULL AND deleted_at IS NULL;

-- 18. Active conversations for real-time subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_active_realtime
ON conversations (organization_id, updated_at DESC)
WHERE status = 'active' AND deleted_at IS NULL;

-- 19. Widget configuration cache
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_widget_config
ON organizations (id, updated_at)
WHERE widget_enabled = true AND deleted_at IS NULL;

-- 20. Rate limiting for widget API
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_rate_limits_widget
ON api_rate_limits (ip_address, endpoint, window_start DESC)
WHERE endpoint LIKE '/api/widget%';

-- Statistics update for query planner optimization
ANALYZE messages;
ANALYZE conversations;
ANALYZE faq_entries;
ANALYZE knowledge_base;
ANALYZE organizations;
ANALYZE visitors;

-- Comments for documentation
COMMENT ON INDEX idx_messages_conversation_created_at IS 'Primary index for widget message queries by conversation';
COMMENT ON INDEX idx_messages_organization_created_at IS 'Organization-level message queries for admin dashboard';
COMMENT ON INDEX idx_conversations_organization_updated_at IS 'Conversation listing for organization';
COMMENT ON INDEX idx_messages_realtime IS 'Real-time message updates for widget';
COMMENT ON INDEX idx_faq_organization_locale IS 'FAQ queries with locale support for i18n';
COMMENT ON INDEX idx_knowledge_organization_search IS 'Full-text search for knowledge base';
COMMENT ON INDEX idx_messages_ai_handover IS 'AI confidence tracking for handover decisions';
COMMENT ON INDEX idx_conversations_active_realtime IS 'Active conversation tracking for real-time features';
