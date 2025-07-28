-- Create optimized vector search function for FAQ tool
-- This enables proper semantic search using pgvector

CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  organization_id uuid,
  match_count integer DEFAULT 5,
  threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  content text,
  document_title text,
  source text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kd.title as document_title,
    kd.source,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE
    kd.organization_id = search_knowledge_chunks.organization_id
    AND kd.is_active = true
    AND 1 - (kc.embedding <=> query_embedding) >= threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_chunks_embedding_cosine 
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_knowledge_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_chunks TO service_role;