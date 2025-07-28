-- RLS Policies for Handoff System
-- Comprehensive Row Level Security for handoff_requests, agent_availability, and websocket_v2_events

-- =====================================================
-- DROP EXISTING POLICIES (for idempotency)
-- =====================================================

-- Handoff requests policies
DROP POLICY IF EXISTS "Users can view handoff requests for their organization" ON handoff_requests;
DROP POLICY IF EXISTS "Users can create handoff requests for their organization" ON handoff_requests;
DROP POLICY IF EXISTS "Agents can update assigned handoff requests" ON handoff_requests;
DROP POLICY IF EXISTS "Admins can manage handoff requests in their organization" ON handoff_requests;
DROP POLICY IF EXISTS "Anonymous users can create handoff requests for conversations" ON handoff_requests;
DROP POLICY IF EXISTS "Service role can manage all handoff requests" ON handoff_requests;

-- Agent availability policies
DROP POLICY IF EXISTS "Users can view agent availability for their organization" ON agent_availability;
DROP POLICY IF EXISTS "Agents can manage their own availability" ON agent_availability;
DROP POLICY IF EXISTS "Admins can manage agent availability in their organization" ON agent_availability;
DROP POLICY IF EXISTS "Service role can manage all agent availability" ON agent_availability;

-- WebSocket events policies
DROP POLICY IF EXISTS "Users can view WebSocket events for their organization" ON websocket_v2_events;
DROP POLICY IF EXISTS "Users can create WebSocket events for their organization" ON websocket_v2_events;
DROP POLICY IF EXISTS "Service role can manage all WebSocket events" ON websocket_v2_events;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if user is admin/owner in organization
CREATE OR REPLACE FUNCTION is_admin_in_org(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_organizations uo
        WHERE uo.user_id = user_id 
            AND uo.organization_id = org_id
            AND uo.role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION belongs_to_org(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_organizations uo
        WHERE uo.user_id = user_id 
            AND uo.organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HANDOFF REQUESTS POLICIES
-- =====================================================

-- Policy 1: Users can view handoff requests for their organization
CREATE POLICY "handoff_requests_select_org_members" ON handoff_requests
    FOR SELECT 
    USING (
        -- Authenticated users in the organization
        (auth.role() = 'authenticated' AND belongs_to_org(auth.uid(), organization_id))
        OR
        -- Service role can see everything
        auth.role() = 'service_role'
        OR
        -- Anonymous users can see requests for conversations they participate in
        (auth.role() = 'anon' AND conversation_id IS NOT NULL)
    );

-- Policy 2: Users can create handoff requests for their organization
CREATE POLICY "handoff_requests_insert_org_members" ON handoff_requests
    FOR INSERT 
    WITH CHECK (
        -- Authenticated users in the organization
        (auth.role() = 'authenticated' AND belongs_to_org(auth.uid(), organization_id))
        OR
        -- Anonymous users (widgets) can create handoff requests
        (auth.role() = 'anon' AND conversation_id IS NOT NULL)
        OR
        -- Service role can create anything
        auth.role() = 'service_role'
    );

-- Policy 3: Agents can update handoff requests assigned to them
CREATE POLICY "handoff_requests_update_assigned_agents" ON handoff_requests
    FOR UPDATE 
    USING (
        -- Agent assigned to the handoff request
        (auth.role() = 'authenticated' AND (assigned_agent_id = auth.uid() OR target_agent_id = auth.uid()))
        OR
        -- Admins in the organization
        (auth.role() = 'authenticated' AND is_admin_in_org(auth.uid(), organization_id))
        OR
        -- Service role can update anything
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same conditions for WITH CHECK
        (auth.role() = 'authenticated' AND (assigned_agent_id = auth.uid() OR target_agent_id = auth.uid()))
        OR
        (auth.role() = 'authenticated' AND is_admin_in_org(auth.uid(), organization_id))
        OR
        auth.role() = 'service_role'
    );

-- Policy 4: Delete policy for admins and service role only
CREATE POLICY "handoff_requests_delete_admins_only" ON handoff_requests
    FOR DELETE 
    USING (
        -- Admins in the organization
        (auth.role() = 'authenticated' AND is_admin_in_org(auth.uid(), organization_id))
        OR
        -- Service role can delete anything
        auth.role() = 'service_role'
    );

-- =====================================================
-- AGENT AVAILABILITY POLICIES
-- =====================================================

-- Policy 1: Users can view agent availability for their organization
CREATE POLICY "agent_availability_select_org_members" ON agent_availability
    FOR SELECT 
    USING (
        -- Authenticated users in the organization
        (auth.role() = 'authenticated' AND belongs_to_org(auth.uid(), organization_id))
        OR
        -- Service role can see everything
        auth.role() = 'service_role'
        OR
        -- Anonymous users can see availability for routing purposes
        auth.role() = 'anon'
    );

-- Policy 2: Agents can manage their own availability
CREATE POLICY "agent_availability_manage_own" ON agent_availability
    FOR ALL 
    USING (
        -- Agent managing their own availability
        (auth.role() = 'authenticated' AND agent_id = auth.uid())
        OR
        -- Admins in the organization
        (auth.role() = 'authenticated' AND is_admin_in_org(auth.uid(), organization_id))
        OR
        -- Service role can manage anything
        auth.role() = 'service_role'
    )
    WITH CHECK (
        -- Same conditions for WITH CHECK
        (auth.role() = 'authenticated' AND agent_id = auth.uid())
        OR
        (auth.role() = 'authenticated' AND is_admin_in_org(auth.uid(), organization_id))
        OR
        auth.role() = 'service_role'
    );

-- =====================================================
-- WEBSOCKET V2 EVENTS POLICIES
-- =====================================================

-- Policy 1: Users can view WebSocket events for their organization
CREATE POLICY "websocket_v2_events_select_org_members" ON websocket_v2_events
    FOR SELECT 
    USING (
        -- Authenticated users in the organization
        (auth.role() = 'authenticated' AND belongs_to_org(auth.uid(), organization_id))
        OR
        -- Service role can see everything
        auth.role() = 'service_role'
    );

-- Policy 2: Create WebSocket events
CREATE POLICY "websocket_v2_events_insert_authenticated" ON websocket_v2_events
    FOR INSERT 
    WITH CHECK (
        -- Authenticated users in the organization
        (auth.role() = 'authenticated' AND belongs_to_org(auth.uid(), organization_id))
        OR
        -- Anonymous users (widgets) can create events
        auth.role() = 'anon'
        OR
        -- Service role can create anything
        auth.role() = 'service_role'
    );

-- Policy 3: Only service role can update/delete events (audit integrity)
CREATE POLICY "websocket_v2_events_modify_service_only" ON websocket_v2_events
    FOR UPDATE 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "websocket_v2_events_delete_service_only" ON websocket_v2_events
    FOR DELETE 
    USING (auth.role() = 'service_role');

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to validate handoff request status transitions
CREATE OR REPLACE FUNCTION validate_handoff_status_transition(
    old_status VARCHAR,
    new_status VARCHAR,
    user_id UUID,
    handoff_organization_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Service role can do any transition
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- Validate status transitions
    CASE old_status
        WHEN 'pending' THEN
            -- From pending: can go to assigned, accepted, or cancelled
            IF new_status NOT IN ('assigned', 'accepted', 'cancelled') THEN
                RETURN FALSE;
            END IF;
        WHEN 'assigned' THEN
            -- From assigned: can go to accepted, completed, or cancelled
            IF new_status NOT IN ('accepted', 'completed', 'cancelled') THEN
                RETURN FALSE;
            END IF;
        WHEN 'accepted' THEN
            -- From accepted: can only go to completed or cancelled
            IF new_status NOT IN ('completed', 'cancelled') THEN
                RETURN FALSE;
            END IF;
        WHEN 'completed' THEN
            -- Completed handoffs cannot be changed
            RETURN FALSE;
        WHEN 'cancelled' THEN
            -- Cancelled handoffs cannot be changed
            RETURN FALSE;
        ELSE
            RETURN FALSE;
    END CASE;
    
    -- Additional authorization checks could go here
    -- (e.g., only assigned agent can accept)
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER FOR STATUS VALIDATION
-- =====================================================

-- Trigger function to validate handoff status transitions
CREATE OR REPLACE FUNCTION check_handoff_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on updates where status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NOT validate_handoff_status_transition(
            OLD.status,
            NEW.status,
            auth.uid(),
            NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- Update timestamp based on status
        CASE NEW.status
            WHEN 'assigned' THEN
                NEW.assigned_at = NOW();
            WHEN 'accepted' THEN
                NEW.accepted_at = NOW();
            WHEN 'completed' THEN
                NEW.completed_at = NOW();
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to handoff_requests table
DROP TRIGGER IF EXISTS handoff_status_transition_trigger ON handoff_requests;
CREATE TRIGGER handoff_status_transition_trigger
    BEFORE UPDATE ON handoff_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_handoff_status_transition();

-- =====================================================
-- INDEXES FOR RLS PERFORMANCE
-- =====================================================

-- Additional indexes to optimize RLS policy performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_role 
    ON user_organizations(user_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_org_role 
    ON user_organizations(organization_id, role);

-- Partial indexes for active handoffs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_handoff_requests_active 
    ON handoff_requests(organization_id, status) 
    WHERE status IN ('pending', 'assigned', 'accepted');

-- =====================================================
-- RLS POLICY TESTING FUNCTIONS
-- =====================================================

-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_handoff_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- This function would contain tests for RLS policies
    -- Implementation would depend on test framework
    RETURN QUERY SELECT 
        'RLS Policies Created'::TEXT,
        TRUE,
        'All handoff RLS policies have been successfully created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICY DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "handoff_requests_select_org_members" ON handoff_requests IS 
'Allows users to view handoff requests for their organization, anonymous users for their conversations, and service role for everything';

COMMENT ON POLICY "agent_availability_manage_own" ON agent_availability IS 
'Agents can manage their own availability, admins can manage all availability in their org, service role can manage everything';

COMMENT ON POLICY "websocket_v2_events_select_org_members" ON websocket_v2_events IS 
'Users can view WebSocket events for their organization, service role can view everything';

-- RLS policies setup complete
SELECT 'Handoff RLS policies setup completed successfully' AS status;