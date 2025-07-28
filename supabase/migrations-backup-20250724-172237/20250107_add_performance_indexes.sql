-- Performance Indexes to Fix N+1 Queries and Improve Performance
-- This migration adds critical indexes for frequently accessed data

-- Conversations table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_organization_id_status 
  ON public.conversations(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_organization_id_updated_at 
  ON public.conversations(organization_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_assigned_to 
  ON public.conversations(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message_at 
  ON public.conversations(last_message_at DESC) WHERE last_message_at IS NOT NULL;

-- Messages table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id_created_at 
  ON public.messages(conversation_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_organization_id_sender_type 
  ON public.messages(organization_id, sender_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_organization_id_created_at 
  ON public.messages(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_type_created_at 
  ON public.messages(sender_type, created_at DESC) WHERE sender_type = 'ai';

-- Profiles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_organization_id_status 
  ON public.profiles(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_organization_id_role 
  ON public.profiles(organization_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_organization_id 
  ON public.profiles(email, organization_id);

-- Organization members table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_organization_id_status 
  ON public.organization_members(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user_id_status 
  ON public.organization_members(user_id, status);

-- Knowledge documents indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_documents_organization_id_status 
  ON public.knowledge_documents(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_documents_category 
  ON public.knowledge_documents(category) WHERE category IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_documents_updated_at 
  ON public.knowledge_documents(updated_at DESC);

-- Knowledge chunks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_chunks_document_id 
  ON public.knowledge_chunks(document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_chunks_organization_id 
  ON public.knowledge_chunks(organization_id);

-- Activity events indexes (already created in previous migration)
-- Included here for completeness
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_events_organization_id 
--   ON public.activity_events(organization_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_events_timestamp 
--   ON public.activity_events(timestamp DESC);

-- FAQs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faqs_organization_id_status 
  ON public.faqs(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faqs_organization_id_category 
  ON public.faqs(organization_id, category) WHERE category IS NOT NULL;

-- Widget settings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_widget_settings_organization_id 
  ON public.widget_settings(organization_id);

-- Escalations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escalations_conversation_id 
  ON public.escalations(conversation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escalations_organization_id_status 
  ON public.escalations(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escalations_assigned_to 
  ON public.escalations(assigned_to) WHERE assigned_to IS NOT NULL;

-- AI usage events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_usage_events_organization_id_created_at 
  ON public.ai_usage_events(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_usage_events_conversation_id 
  ON public.ai_usage_events(conversation_id);

-- Typing indicators indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_typing_indicators_conversation_id 
  ON public.typing_indicators(conversation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_typing_indicators_user_id 
  ON public.typing_indicators(user_id);

-- Message read status indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_read_status_message_id 
  ON public.message_read_status(message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_read_status_user_id 
  ON public.message_read_status(user_id);

-- Campfire handoffs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campfire_handoffs_conversation_id 
  ON public.campfire_handoffs(conversation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campfire_handoffs_organization_id_status 
  ON public.campfire_handoffs(organization_id, status);

-- Vector search optimization for knowledge chunks
-- This helps with semantic search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_chunks_embedding_cosine 
  ON public.knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL;

-- Partial indexes for better performance on common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_open_organization 
  ON public.conversations(organization_id, updated_at DESC) 
  WHERE status = 'open';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recent_by_org 
  ON public.messages(organization_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active_agents 
  ON public.profiles(organization_id, updated_at DESC) 
  WHERE status = 'online' AND role IN ('agent', 'admin');

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_dashboard_stats 
  ON public.conversations(organization_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_ai_stats 
  ON public.messages(organization_id, sender_type, created_at) 
  WHERE sender_type IN ('ai', 'visitor');

-- Index for API key validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_validation 
  ON public.api_keys(key_prefix, status) 
  WHERE status = 'active';

-- Webhook delivery indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_webhook_id_created_at 
  ON public.webhook_deliveries(webhook_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_success_stats 
  ON public.webhook_deliveries(webhook_id, success, attempted_at DESC);