-- Migration: Create attachments table for widget file uploads
-- Date: 2025-01-10
-- Purpose: Support secure file uploads in widget conversations

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploader_id TEXT NOT NULL, -- Can be visitor ID or user ID
    uploader_type TEXT NOT NULL CHECK (uploader_type IN ('visitor', 'agent', 'system')),
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'failed', 'deleted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_organization_id ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploader ON attachments(uploader_id, uploader_type);
CREATE INDEX IF NOT EXISTS idx_attachments_status ON attachments(status);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON attachments(file_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_attachments_org_conv_status ON attachments(organization_id, conversation_id, status);

-- Add RLS (Row Level Security) policies
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access attachments from their organization
CREATE POLICY "Users can access attachments from their organization" ON attachments
    FOR ALL 
    TO authenticated 
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Widget access (service role) - can access all attachments for API operations
CREATE POLICY "Widget service can access all attachments" ON attachments
    FOR ALL 
    TO service_role 
    USING (true);

-- Policy: Anonymous widget users can only access their own uploaded files
CREATE POLICY "Anonymous users can access their own uploads" ON attachments
    FOR SELECT 
    TO anon 
    USING (
        uploader_type = 'visitor' AND 
        uploader_id = current_setting('app.visitor_id', true)
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_attachments_updated_at();

-- Add constraint to ensure file_path is unique
ALTER TABLE attachments ADD CONSTRAINT unique_file_path UNIQUE (file_path);

-- Add check constraint for file size (max 50MB)
ALTER TABLE attachments ADD CONSTRAINT check_file_size CHECK (file_size <= 52428800);

-- Add check constraint for valid file types
ALTER TABLE attachments ADD CONSTRAINT check_file_type CHECK (
    file_type IN (
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip', 'application/x-zip-compressed',
        'text/csv', 'application/json', 'application/xml', 'text/xml'
    )
);

-- Create storage bucket for attachments (if not exists)
-- This would typically be done via Supabase dashboard or CLI, but documenting here
-- INSERT INTO storage.buckets (id, name, public) VALUES ('campfire-uploads', 'campfire-uploads', false);

-- Create storage RLS policies
-- CREATE POLICY "Authenticated users can upload files" ON storage.objects
--     FOR INSERT 
--     TO authenticated 
--     WITH CHECK (bucket_id = 'campfire-uploads');

-- CREATE POLICY "Users can view files from their organization" ON storage.objects
--     FOR SELECT 
--     TO authenticated 
--     USING (bucket_id = 'campfire-uploads');

-- CREATE POLICY "Service role can manage all files" ON storage.objects
--     FOR ALL 
--     TO service_role 
--     USING (bucket_id = 'campfire-uploads');

-- Add comment to table
COMMENT ON TABLE attachments IS 'Stores file attachments uploaded through widget conversations';
COMMENT ON COLUMN attachments.uploader_id IS 'ID of the user who uploaded the file (visitor ID or user ID)';
COMMENT ON COLUMN attachments.uploader_type IS 'Type of uploader: visitor, agent, or system';
COMMENT ON COLUMN attachments.file_path IS 'Path to file in storage bucket';
COMMENT ON COLUMN attachments.file_url IS 'Public URL to access the file';
COMMENT ON COLUMN attachments.metadata IS 'Additional metadata about the upload (IP, user agent, etc.)';
COMMENT ON COLUMN attachments.status IS 'Current status of the attachment';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON attachments TO authenticated;
GRANT ALL ON attachments TO service_role;