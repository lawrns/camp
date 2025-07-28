-- Create conversation_files table for file attachments
CREATE TABLE IF NOT EXISTS public.conversation_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conversation_files_conversation_id ON public.conversation_files(conversation_id);
CREATE INDEX idx_conversation_files_organization_id ON public.conversation_files(organization_id);
CREATE INDEX idx_conversation_files_uploaded_by ON public.conversation_files(uploaded_by);
CREATE INDEX idx_conversation_files_created_at ON public.conversation_files(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.conversation_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_files
CREATE POLICY "Users can view files for their organization conversations"
  ON public.conversation_files
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their organization conversations"
  ON public.conversation_files
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their own uploaded files"
  ON public.conversation_files
  FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own uploaded files"
  ON public.conversation_files
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- Service role can manage all files
CREATE POLICY "Service role can manage all conversation files"
  ON public.conversation_files
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_conversation_files_updated_at
  BEFORE UPDATE ON public.conversation_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket policy (this would be run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('conversation-files', 'conversation-files', true);

-- Comment on table
COMMENT ON TABLE public.conversation_files IS 'File attachments for conversations with proper access control';