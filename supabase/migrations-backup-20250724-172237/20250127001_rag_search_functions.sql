-- Function to search knowledge base using vector similarity
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_text TEXT,
  organization_id UUID,
  limit_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> ai.create_embedding(query_text)) as similarity_score
  FROM knowledge_base kb
  WHERE kb.organization_id = organization_id
  ORDER BY kb.embedding <=> ai.create_embedding(query_text)
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar past conversations
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_text TEXT,
  organization_id UUID,
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  summary TEXT,
  resolution TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.metadata->>'summary' as summary,
    c.metadata->>'resolution' as resolution,
    1 - (c.embedding <=> ai.create_embedding(query_text)) as similarity_score
  FROM conversations c
  WHERE c.organization_id = organization_id
    AND c.status = 'closed'
    AND c.metadata->>'resolution' IS NOT NULL
  ORDER BY c.embedding <=> ai.create_embedding(query_text)
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;