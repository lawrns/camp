-- TASK-201: File Management Database Schema
-- Create tables for file metadata, sharing, and collaboration

-- Files table for storing file metadata
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    organization_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
    checksum TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File shares table for tracking file sharing
CREATE TABLE IF NOT EXISTS file_shares (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    shared_by TEXT NOT NULL,
    shared_with TEXT, -- NULL for public shares
    conversation_id TEXT,
    organization_id TEXT NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read'], -- read, write, delete
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File versions table for version management
CREATE TABLE IF NOT EXISTS file_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    checksum TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    change_description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File comments table for collaboration
CREATE TABLE IF NOT EXISTS file_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    content TEXT NOT NULL,
    position JSONB, -- For annotations (x, y coordinates, page number, etc.)
    parent_comment_id TEXT REFERENCES file_comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File access logs for audit trail
CREATE TABLE IF NOT EXISTS file_access_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    action TEXT NOT NULL, -- upload, download, view, share, delete, etc.
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_organization_id ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_file_shares_conversation_id ON file_shares(conversation_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_organization_id ON file_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version_number ON file_versions(file_id, version_number);

CREATE INDEX IF NOT EXISTS idx_file_comments_file_id ON file_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_user_id ON file_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_parent_id ON file_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_organization_id ON file_comments(organization_id);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_organization_id ON file_access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_action ON file_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view files in their organization" ON files
    FOR SELECT USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can upload files to their organization" ON files
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can update their own files" ON files
    FOR UPDATE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        uploaded_by = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Users can delete their own files" ON files
    FOR DELETE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        uploaded_by = current_setting('app.current_user_id', true)
    );

-- File shares policies
CREATE POLICY "Users can view file shares in their organization" ON file_shares
    FOR SELECT USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can create file shares in their organization" ON file_shares
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can update their own file shares" ON file_shares
    FOR UPDATE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        shared_by = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Users can delete their own file shares" ON file_shares
    FOR DELETE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        shared_by = current_setting('app.current_user_id', true)
    );

-- File versions policies
CREATE POLICY "Users can view file versions in their organization" ON file_versions
    FOR SELECT USING (
        file_id IN (
            SELECT id FROM files 
            WHERE organization_id = current_setting('app.current_organization_id', true)
        )
    );

CREATE POLICY "Users can create file versions in their organization" ON file_versions
    FOR INSERT WITH CHECK (
        file_id IN (
            SELECT id FROM files 
            WHERE organization_id = current_setting('app.current_organization_id', true)
        )
    );

-- File comments policies
CREATE POLICY "Users can view file comments in their organization" ON file_comments
    FOR SELECT USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can create file comments in their organization" ON file_comments
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "Users can update their own file comments" ON file_comments
    FOR UPDATE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        user_id = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Users can delete their own file comments" ON file_comments
    FOR DELETE USING (
        organization_id = current_setting('app.current_organization_id', true) AND
        user_id = current_setting('app.current_user_id', true)
    );

-- File access logs policies
CREATE POLICY "Users can view access logs for files in their organization" ON file_access_logs
    FOR SELECT USING (organization_id = current_setting('app.current_organization_id', true));

CREATE POLICY "System can insert access logs" ON file_access_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log all access

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_shares_updated_at BEFORE UPDATE ON file_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_comments_updated_at BEFORE UPDATE ON file_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log file access
CREATE OR REPLACE FUNCTION log_file_access(
    p_file_id TEXT,
    p_user_id TEXT,
    p_organization_id TEXT,
    p_action TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO file_access_logs (
        file_id,
        user_id,
        organization_id,
        action,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_file_id,
        p_user_id,
        p_organization_id,
        p_action,
        p_ip_address,
        p_user_agent,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete expired files
    DELETE FROM files 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired file shares
    DELETE FROM file_shares 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file statistics for an organization
CREATE OR REPLACE FUNCTION get_organization_file_stats(p_organization_id TEXT)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    files_by_type JSONB,
    size_by_type JSONB,
    recent_uploads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(f.size), 0) as total_size,
        COALESCE(
            jsonb_object_agg(
                split_part(f.type, '/', 1),
                type_counts.count
            ) FILTER (WHERE split_part(f.type, '/', 1) IS NOT NULL),
            '{}'::jsonb
        ) as files_by_type,
        COALESCE(
            jsonb_object_agg(
                split_part(f.type, '/', 1),
                type_sizes.total_size
            ) FILTER (WHERE split_part(f.type, '/', 1) IS NOT NULL),
            '{}'::jsonb
        ) as size_by_type,
        COUNT(*) FILTER (WHERE f.created_at > NOW() - INTERVAL '7 days') as recent_uploads
    FROM files f
    LEFT JOIN (
        SELECT 
            split_part(type, '/', 1) as type_category,
            COUNT(*) as count
        FROM files 
        WHERE organization_id = p_organization_id
        GROUP BY split_part(type, '/', 1)
    ) type_counts ON split_part(f.type, '/', 1) = type_counts.type_category
    LEFT JOIN (
        SELECT 
            split_part(type, '/', 1) as type_category,
            SUM(size) as total_size
        FROM files 
        WHERE organization_id = p_organization_id
        GROUP BY split_part(type, '/', 1)
    ) type_sizes ON split_part(f.type, '/', 1) = type_sizes.type_category
    WHERE f.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
