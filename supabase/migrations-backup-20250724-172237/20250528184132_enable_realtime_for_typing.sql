-- Enable realtime for typing_indicators table
-- This is critical for typing indicators to work

-- First, drop the table from publication if it exists
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS typing_indicators;

-- Then add it back to ensure it's properly configured
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Verify realtime is enabled
DO $$
DECLARE
    realtime_enabled boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'typing_indicators'
    ) INTO realtime_enabled;
    
    IF NOT realtime_enabled THEN
        RAISE EXCEPTION 'Failed to enable realtime for typing_indicators table';
    END IF;
    
    RAISE NOTICE 'Realtime successfully enabled for typing_indicators table';
END $$;

-- Ensure RLS is enabled
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "typing_indicators_authenticated_all" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_all_authenticated" ON typing_indicators;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_select" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_insert" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_update" ON typing_indicators;
DROP POLICY IF EXISTS "typing_indicators_delete" ON typing_indicators;

-- Create simple, permissive policies for authenticated users
CREATE POLICY "typing_indicators_select" ON typing_indicators
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "typing_indicators_insert" ON typing_indicators
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "typing_indicators_update" ON typing_indicators
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "typing_indicators_delete" ON typing_indicators
    FOR DELETE TO authenticated
    USING (true);

-- Grant all permissions
GRANT ALL ON typing_indicators TO authenticated;
GRANT USAGE ON SEQUENCE typing_indicators_id_seq TO authenticated;

-- Create or update the function to auto-expire old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE updated_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up old indicators (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-typing-indicators', '*/1 * * * *', 'SELECT cleanup_old_typing_indicators();');