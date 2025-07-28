-- Fix Real-time Communication Issues
-- This migration addresses the missing database functions and tables causing 403 errors

-- Add missing columns to realtime_channels if table exists
DO $$
BEGIN
    -- Check if realtime_channels table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        -- Add last_activity column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'realtime_channels'
                       AND column_name = 'last_activity') THEN
            ALTER TABLE realtime_channels ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Add subscriber_count column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'realtime_channels'
                       AND column_name = 'subscriber_count') THEN
            ALTER TABLE realtime_channels ADD COLUMN subscriber_count INTEGER DEFAULT 0;
        END IF;
        
        -- Add metadata column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'realtime_channels'
                       AND column_name = 'metadata') THEN
            ALTER TABLE realtime_channels ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
    END IF;
END $$;

-- Add RLS policies for realtime_channels (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        ALTER TABLE realtime_channels ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policy if it exists and recreate (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        DROP POLICY IF EXISTS "Users can access organization channels" ON realtime_channels;
        CREATE POLICY "Users can access organization channels" 
        ON realtime_channels FOR ALL 
        USING (
          organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Create or replace the update_channel_activity function (only if table exists)
CREATE OR REPLACE FUNCTION update_channel_activity(
  p_organization_id UUID,
  p_channel_name TEXT,
  p_channel_type TEXT DEFAULT 'conversation',
  p_resource_id TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if realtime_channels table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
    -- Insert or update channel activity
    INSERT INTO realtime_channels (
      organization_id,
      channel_name,
      channel_type,
      resource_id,
      last_activity,
      subscriber_count,
      metadata
    )
    VALUES (
      p_organization_id,
      p_channel_name,
      p_channel_type,
      p_resource_id,
      NOW(),
      1,
      p_metadata
    )
    ON CONFLICT (organization_id, channel_name)
    DO UPDATE SET
      last_activity = NOW(),
      subscriber_count = realtime_channels.subscriber_count + 1,
      metadata = p_metadata;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_channel_activity TO authenticated;

-- Create function to cleanup stale channels (only if table exists)
CREATE OR REPLACE FUNCTION cleanup_stale_channels()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if realtime_channels table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
    -- Remove channels with no activity for more than 1 hour
    DELETE FROM realtime_channels 
    WHERE last_activity < NOW() - INTERVAL '1 hour';
  END IF;
END;
$$;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_stale_channels TO authenticated;

-- Create function to get channel stats (only if table exists)
CREATE OR REPLACE FUNCTION get_channel_stats(p_organization_id UUID)
RETURNS TABLE (
  channel_name TEXT,
  channel_type TEXT,
  subscriber_count INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if realtime_channels table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
    RETURN QUERY
    SELECT 
      rc.channel_name,
      rc.channel_type,
      rc.subscriber_count,
      rc.last_activity
    FROM realtime_channels rc
    WHERE rc.organization_id = p_organization_id
    ORDER BY rc.last_activity DESC;
  END IF;
END;
$$;

-- Grant execute permission for stats function
GRANT EXECUTE ON FUNCTION get_channel_stats TO authenticated;

-- Add indexes for performance (IF NOT EXISTS)
-- Create indexes for performance (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        CREATE INDEX IF NOT EXISTS idx_realtime_channels_org_id ON realtime_channels(organization_id);
        CREATE INDEX IF NOT EXISTS idx_realtime_channels_activity ON realtime_channels(last_activity);
        CREATE INDEX IF NOT EXISTS idx_realtime_channels_type ON realtime_channels(channel_type);
    END IF;
END $$;

-- Create a trigger to automatically update last_activity
CREATE OR REPLACE FUNCTION update_channel_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        DROP TRIGGER IF EXISTS trigger_update_channel_activity ON realtime_channels;
        CREATE TRIGGER trigger_update_channel_activity
          BEFORE UPDATE ON realtime_channels
          FOR EACH ROW
          EXECUTE FUNCTION update_channel_last_activity();
    END IF;
END $$;

-- Add comment for documentation (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_channels') THEN
        COMMENT ON TABLE realtime_channels IS 'Tracks active real-time channels for monitoring and cleanup';
    END IF;
END $$;
COMMENT ON FUNCTION update_channel_activity IS 'Updates channel activity tracking for real-time monitoring';
COMMENT ON FUNCTION cleanup_stale_channels IS 'Removes inactive channels older than 1 hour';
COMMENT ON FUNCTION get_channel_stats IS 'Returns channel statistics for an organization';