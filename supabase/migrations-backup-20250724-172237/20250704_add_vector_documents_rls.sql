-- Add missing RLS policies for vector_documents table
-- Purpose: Implement proper Row Level Security for vector_documents table
-- Priority: CRITICAL - Security requirement

-- First, check if the table exists and enable RLS if not already enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vector_documents') THEN
        -- Enable RLS if not already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'vector_documents' 
            AND rowsecurity = true
        ) THEN
            ALTER TABLE vector_documents ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Drop existing policies to ensure clean state
        DROP POLICY IF EXISTS "Users can read their organization vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Service role can manage all vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Organization members can view vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Organization members can insert vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Organization members can update vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Organization members can delete vectors" ON vector_documents;
        DROP POLICY IF EXISTS "Service role full access vectors" ON vector_documents;
    END IF;
END $$;

-- Create comprehensive RLS policies for vector_documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vector_documents') THEN
        
        -- Policy 1: Organization members can view their organization's vectors
        CREATE POLICY "Organization members can view vectors" ON vector_documents
            FOR SELECT USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            );
        
        -- Policy 2: Organization members with appropriate roles can insert vectors
        CREATE POLICY "Organization members can insert vectors" ON vector_documents
            FOR INSERT WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() 
                    AND status = 'active'
                    AND role IN ('admin', 'owner', 'agent')
                )
            );
        
        -- Policy 3: Organization members with appropriate roles can update vectors
        CREATE POLICY "Organization members can update vectors" ON vector_documents
            FOR UPDATE USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() 
                    AND status = 'active'
                    AND role IN ('admin', 'owner')
                )
            )
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() 
                    AND status = 'active'
                    AND role IN ('admin', 'owner')
                )
            );
        
        -- Policy 4: Organization admins/owners can delete vectors
        CREATE POLICY "Organization admins can delete vectors" ON vector_documents
            FOR DELETE USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() 
                    AND status = 'active'
                    AND role IN ('admin', 'owner')
                )
            );
        
        -- Policy 5: Service role bypass for system operations
        CREATE POLICY "Service role full access vectors" ON vector_documents
            FOR ALL USING (auth.role() = 'service_role');
        
        -- Grant necessary permissions to authenticated users
        GRANT SELECT ON vector_documents TO authenticated;
        GRANT INSERT ON vector_documents TO authenticated;
        GRANT UPDATE ON vector_documents TO authenticated;
        GRANT DELETE ON vector_documents TO authenticated;
        
        -- Grant all permissions to service role
        GRANT ALL ON vector_documents TO service_role;
        
        -- Add index on organization_id if it doesn't exist
        CREATE INDEX IF NOT EXISTS idx_vector_documents_org_id 
        ON vector_documents(organization_id);
        
    END IF;
END $$;

-- Update the match_vectors function to respect organization boundaries
CREATE OR REPLACE FUNCTION match_vectors(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter jsonb DEFAULT '{}',
    p_organization_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    embedding vector(1536),
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        vd.id,
        vd.content,
        vd.metadata,
        vd.embedding,
        1 - (vd.embedding <=> query_embedding) as similarity
    FROM vector_documents vd
    WHERE 
        1 - (vd.embedding <=> query_embedding) > match_threshold
        AND (filter = '{}' OR vd.metadata @> filter)
        AND (
            p_organization_id IS NULL 
            OR vd.organization_id = p_organization_id
            OR vd.organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    ORDER BY vd.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Add comment for documentation
COMMENT ON TABLE vector_documents IS 'Stores vector embeddings for RAG system with organization-based access control';
COMMENT ON POLICY "Organization members can view vectors" ON vector_documents IS 'Allows organization members to view vectors within their organization';
COMMENT ON POLICY "Organization members can insert vectors" ON vector_documents IS 'Allows agents, admins, and owners to create new vector documents';
COMMENT ON POLICY "Organization members can update vectors" ON vector_documents IS 'Allows admins and owners to update existing vector documents';
COMMENT ON POLICY "Organization admins can delete vectors" ON vector_documents IS 'Allows admins and owners to delete vector documents';
COMMENT ON POLICY "Service role full access vectors" ON vector_documents IS 'Allows service role to bypass RLS for system operations';

-- Migration completed successfully