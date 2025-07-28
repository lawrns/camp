-- Campfire 2.0 Infrastructure Migration
-- Phase 1: Database and Infrastructure Setup

-- 1. Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
ADD COLUMN IF NOT EXISTS escalation_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- 2. Add essential indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id) WHERE is_deleted = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_organization_id ON messages(organization_id) WHERE is_deleted = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_type ON messages(sender_type, sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_ai_handover ON conversations(ai_handover_active) WHERE ai_handover_active = true;

-- 3. Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 4. Create knowledge base tables with vector support
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    source VARCHAR(50) DEFAULT 'manual',
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_documents_org ON knowledge_documents(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_documents_embedding ON knowledge_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Create conversation memory table
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'user_query', 'ai_response', 'escalation', etc.
    content TEXT NOT NULL,
    embedding vector(1536),
    confidence_score FLOAT,
    sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_memory_conv ON conversation_memory(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_memory_created ON conversation_memory(created_at DESC);

-- 6. Create AI service accounts table
CREATE TABLE IF NOT EXISTS ai_service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    service_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, service_name)
);

-- 7. Create performance metrics table
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    conversation_id UUID REFERENCES conversations(id),
    metric_type VARCHAR(50) NOT NULL, -- 'response_time', 'confidence', 'escalation_rate'
    value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_metrics_org_type ON ai_performance_metrics(organization_id, metric_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_metrics_created ON ai_performance_metrics(created_at DESC);

-- 8. Update RLS policies for AI access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;

-- Create new comprehensive policies
CREATE POLICY "Organization members can view messages"
    ON messages
    FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid()
        )
        OR 
        conversation_id IN (
            SELECT c.id 
            FROM conversations c 
            WHERE c.workspace_id IN (
                SELECT om.organization_id 
                FROM organization_members om 
                WHERE om.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Organization members and AI can insert messages"
    ON messages
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid()
        )
        OR
        sender_id = 'ai-agent'
        OR
        auth.uid() IN (
            SELECT user_id FROM ai_service_accounts WHERE organization_id = messages.organization_id
        )
    );

CREATE POLICY "Organization members can update own messages"
    ON messages
    FOR UPDATE
    USING (sender_id = auth.uid()::text)
    WITH CHECK (sender_id = auth.uid()::text);

-- 9. Create vector search function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_organization_id uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    url text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.title,
        kd.content,
        kd.url,
        1 - (kd.embedding <=> query_embedding) AS similarity
    FROM
        knowledge_documents kd
    WHERE
        kd.organization_id = p_organization_id
        AND kd.is_active = true
        AND 1 - (kd.embedding <=> query_embedding) > match_threshold
    ORDER BY
        kd.embedding <=> query_embedding
    LIMIT
        match_count;
END;
$$;

-- 10. Create hybrid search function (semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search_documents(
    query_text text,
    query_embedding vector(1536),
    semantic_weight float DEFAULT 0.7,
    match_count int DEFAULT 10,
    p_organization_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    url text,
    semantic_score float,
    keyword_score float,
    combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_results AS (
        SELECT
            kd.id,
            kd.title,
            kd.content,
            kd.url,
            1 - (kd.embedding <=> query_embedding) AS semantic_score
        FROM
            knowledge_documents kd
        WHERE
            kd.organization_id = p_organization_id
            AND kd.is_active = true
        ORDER BY
            kd.embedding <=> query_embedding
        LIMIT
            match_count * 2
    ),
    keyword_results AS (
        SELECT
            kd.id,
            kd.title,
            kd.content,
            kd.url,
            ts_rank_cd(
                to_tsvector('english', kd.title || ' ' || kd.content),
                plainto_tsquery('english', query_text)
            ) AS keyword_score
        FROM
            knowledge_documents kd
        WHERE
            kd.organization_id = p_organization_id
            AND kd.is_active = true
            AND to_tsvector('english', kd.title || ' ' || kd.content) @@ plainto_tsquery('english', query_text)
        ORDER BY
            keyword_score DESC
        LIMIT
            match_count * 2
    )
    SELECT
        COALESCE(s.id, k.id) AS id,
        COALESCE(s.title, k.title) AS title,
        COALESCE(s.content, k.content) AS content,
        COALESCE(s.url, k.url) AS url,
        COALESCE(s.semantic_score, 0) AS semantic_score,
        COALESCE(k.keyword_score, 0) AS keyword_score,
        (COALESCE(s.semantic_score, 0) * semantic_weight + 
         COALESCE(k.keyword_score, 0) * (1 - semantic_weight)) AS combined_score
    FROM
        semantic_results s
    FULL OUTER JOIN
        keyword_results k ON s.id = k.id
    ORDER BY
        combined_score DESC
    LIMIT
        match_count;
END;
$$;

-- 11. Create function to track AI performance
CREATE OR REPLACE FUNCTION track_ai_performance(
    p_organization_id uuid,
    p_conversation_id uuid,
    p_metric_type varchar(50),
    p_value float,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    metric_id uuid;
BEGIN
    INSERT INTO ai_performance_metrics (
        organization_id,
        conversation_id,
        metric_type,
        value,
        metadata
    ) VALUES (
        p_organization_id,
        p_conversation_id,
        p_metric_type,
        p_value,
        p_metadata
    ) RETURNING id INTO metric_id;
    
    RETURN metric_id;
END;
$$;

-- 12. Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_documents_updated_at
BEFORE UPDATE ON knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant permissions
GRANT SELECT ON knowledge_documents TO authenticated;
GRANT SELECT ON conversation_memory TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_documents TO authenticated;
GRANT EXECUTE ON FUNCTION track_ai_performance TO authenticated;