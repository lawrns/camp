-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Key details
  key_hash VARCHAR(255) NOT NULL, -- Store hashed version of the key
  key_prefix VARCHAR(10) NOT NULL, -- First few chars for identification (e.g., "cf_live_")
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Permissions and scopes
  scopes TEXT[] DEFAULT '{}', -- Array of allowed scopes
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  
  -- Status and validity
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);
CREATE INDEX idx_api_keys_expires_at ON public.api_keys(expires_at);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view API keys for their organization"
  ON public.api_keys
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create API keys for their organization"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's API keys"
  ON public.api_keys
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's API keys"
  ON public.api_keys
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_organization_id UUID,
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_scopes TEXT[] DEFAULT '{}',
  p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key VARCHAR(64);
  v_key_prefix VARCHAR(10);
  v_key_hash VARCHAR(255);
  v_expires_at TIMESTAMPTZ;
  v_api_key_id UUID;
BEGIN
  -- Generate a random key
  v_key := 'cf_live_' || encode(gen_random_bytes(32), 'hex');
  v_key_prefix := SUBSTRING(v_key, 1, 10);
  
  -- Hash the key for storage
  v_key_hash := encode(digest(v_key, 'sha256'), 'hex');
  
  -- Calculate expiration
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;
  
  -- Insert the API key
  INSERT INTO public.api_keys (
    organization_id,
    key_hash,
    key_prefix,
    name,
    description,
    scopes,
    expires_at,
    created_by
  ) VALUES (
    p_organization_id,
    v_key_hash,
    v_key_prefix,
    p_name,
    p_description,
    p_scopes,
    v_expires_at,
    auth.uid()
  )
  RETURNING id INTO v_api_key_id;
  
  -- Return the key (only time it's visible in plain text)
  RETURN json_build_object(
    'id', v_api_key_id,
    'key', v_key,
    'prefix', v_key_prefix,
    'expires_at', v_expires_at
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_api_key TO authenticated;

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_key VARCHAR(255))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_hash VARCHAR(255);
  v_key_prefix VARCHAR(10);
  v_api_key RECORD;
BEGIN
  -- Extract prefix and hash the key
  v_key_prefix := SUBSTRING(p_key, 1, 10);
  v_key_hash := encode(digest(p_key, 'sha256'), 'hex');
  
  -- Find the API key
  SELECT * INTO v_api_key
  FROM public.api_keys
  WHERE key_prefix = v_key_prefix
    AND key_hash = v_key_hash
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Update last used timestamp and usage count
  UPDATE public.api_keys
  SET last_used_at = NOW(),
      usage_count = usage_count + 1
  WHERE id = v_api_key.id;
  
  -- Return validation result
  RETURN json_build_object(
    'valid', true,
    'organization_id', v_api_key.organization_id,
    'scopes', v_api_key.scopes,
    'rate_limit', v_api_key.rate_limit
  );
END;
$$;

-- Grant execute permission to anon for API validation
GRANT EXECUTE ON FUNCTION validate_api_key TO anon, authenticated;

-- Trigger to update updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();