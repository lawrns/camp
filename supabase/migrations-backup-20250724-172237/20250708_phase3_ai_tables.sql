-- Phase 3: Create Missing AI Tables
-- These tables are needed for AI tool functionality

-- 1. AI Tool Calls Table
CREATE TABLE IF NOT EXISTS ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- 2. AI Tool Results Cache
CREATE TABLE IF NOT EXISTS ai_tool_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_call_id UUID NOT NULL REFERENCES ai_tool_calls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL,
  result_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FAQ Entries for Vector Search
CREATE TABLE IF NOT EXISTS faq_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_faq_question UNIQUE (organization_id, question)
);

-- 4. Vector Embeddings Table (requires pgvector extension)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vector_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  embedding vector(1536), -- OpenAI embeddings dimension
  model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_embedding UNIQUE (organization_id, source_table, source_id)
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_conversation ON ai_tool_calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_status ON ai_tool_calls(status);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_created ON ai_tool_calls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_faq_entries_org ON faq_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_entries_published ON faq_entries(is_published);
CREATE INDEX IF NOT EXISTS idx_faq_entries_keywords ON faq_entries USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_source ON vector_embeddings(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_vector ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);

-- 6. RLS Policies
ALTER TABLE ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Organization members can view AI tool calls
CREATE POLICY "ai_tool_calls_org_access" ON ai_tool_calls
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- FAQ entries - public read for published, org write
CREATE POLICY "faq_public_read" ON faq_entries
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "faq_org_manage" ON faq_entries
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Vector embeddings - org access only
CREATE POLICY "vector_embeddings_org_access" ON vector_embeddings
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_faq_entries(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  org_id uuid
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    fe.id,
    fe.question,
    fe.answer,
    1 - (ve.embedding <=> query_embedding) as similarity
  FROM faq_entries fe
  JOIN vector_embeddings ve ON ve.source_id = fe.id AND ve.source_table = 'faq_entries'
  WHERE ve.organization_id = org_id
    AND fe.is_published = true
    AND 1 - (ve.embedding <=> query_embedding) > match_threshold
  ORDER BY ve.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant permissions
GRANT ALL ON ai_tool_calls TO authenticated;
GRANT ALL ON ai_tool_results TO authenticated;
GRANT SELECT ON faq_entries TO anon;
GRANT ALL ON faq_entries TO authenticated;
GRANT ALL ON vector_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_faq_entries TO authenticated;
GRANT EXECUTE ON FUNCTION match_faq_entries TO anon;
