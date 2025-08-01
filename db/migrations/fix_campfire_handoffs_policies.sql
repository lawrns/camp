-- Fix campfire_handoffs table policies
-- This resolves the policy conflict error and completes the migration
-- Run this after the main table creation to fix policy conflicts

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "handoffs_organization_access" ON campfire_handoffs;
DROP POLICY IF EXISTS "handoffs_service_role_access" ON campfire_handoffs;

-- Recreate policies with proper permissions
CREATE POLICY "handoffs_organization_access" ON campfire_handoffs
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Policy for service role (for API operations)
CREATE POLICY "handoffs_service_role_access" ON campfire_handoffs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE campfire_handoffs ENABLE ROW LEVEL SECURITY;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_campfire_handoffs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_campfire_handoffs_updated_at ON campfire_handoffs;
CREATE TRIGGER update_campfire_handoffs_updated_at
    BEFORE UPDATE ON campfire_handoffs
    FOR EACH ROW
    EXECUTE FUNCTION update_campfire_handoffs_updated_at();
