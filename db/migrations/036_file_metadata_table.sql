-- Migration: Add file metadata table for advanced file sharing
-- Date: 2025-01-XX
-- Description: Creates table to store file metadata for the file sharing system

-- Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_organization_id ON file_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_conversation_id ON file_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_at ON file_metadata(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_mime_type ON file_metadata(mime_type);

-- Create RLS policies for file metadata
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access files from their organization
CREATE POLICY "Users can access files from their organization" ON file_metadata
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Policy: Users can insert files into their organization
CREATE POLICY "Users can upload files to their organization" ON file_metadata
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Users can update their own uploaded files
CREATE POLICY "Users can update their own files" ON file_metadata
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    AND organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own files or admins can delete any files in their org
CREATE POLICY "Users can delete files with proper permissions" ON file_metadata
  FOR DELETE USING (
    (uploaded_by = auth.uid() OR 
     EXISTS (
       SELECT 1 FROM organization_members om 
       WHERE om.user_id = auth.uid() 
       AND om.organization_id = file_metadata.organization_id 
       AND om.role IN ('admin', 'owner')
     ))
    AND organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_file_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_metadata_updated_at
  BEFORE UPDATE ON file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_file_metadata_updated_at();

-- Create storage bucket for files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the files bucket
CREATE POLICY "Users can upload files to their organization folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'files' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view files from their organization" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files'
    AND (
      -- Public files
      (storage.foldername(name))[1] IN (
        SELECT om.organization_id::text 
        FROM organization_members om 
        WHERE om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own uploaded files in storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files with proper permissions in storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
      AND (
        -- File owner or admin/owner
        EXISTS (
          SELECT 1 FROM file_metadata fm 
          WHERE fm.url LIKE '%' || name 
          AND (fm.uploaded_by = auth.uid() OR om.role IN ('admin', 'owner'))
        )
      )
    )
  );

-- Add comment for documentation
COMMENT ON TABLE file_metadata IS 'Stores metadata for uploaded files in the file sharing system';
COMMENT ON COLUMN file_metadata.filename IS 'Unique filename used in storage';
COMMENT ON COLUMN file_metadata.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN file_metadata.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN file_metadata.size IS 'File size in bytes';
COMMENT ON COLUMN file_metadata.url IS 'Public URL to access the file';
COMMENT ON COLUMN file_metadata.thumbnail_url IS 'URL to thumbnail image (for images/videos)';
COMMENT ON COLUMN file_metadata.is_public IS 'Whether the file is publicly accessible';
COMMENT ON COLUMN file_metadata.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN file_metadata.description IS 'Optional description of the file'; 