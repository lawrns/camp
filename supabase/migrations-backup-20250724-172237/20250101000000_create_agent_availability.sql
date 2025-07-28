-- Create agent_availability table for agent dashboard functionality
-- This table tracks agent status, workload, and availability for conversation assignment

CREATE TABLE IF NOT EXISTS agent_availability (
    agent_id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    
    -- Status Management
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
    status_message TEXT,
    
    -- Workload Management
    max_concurrent_chats INTEGER DEFAULT 5 CHECK (max_concurrent_chats > 0),
    current_chat_count INTEGER DEFAULT 0 CHECK (current_chat_count >= 0),
    
    -- Assignment Rules
    auto_assign BOOLEAN DEFAULT true,
    skills JSONB DEFAULT '[]', -- Array of skill tags
    priority_score INTEGER DEFAULT 100, -- Higher = more preferred
    
    -- Performance Metrics
    avg_response_time INTEGER DEFAULT 0, -- seconds
    satisfaction_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 5.0
    total_conversations INTEGER DEFAULT 0,
    
    -- Availability Schedule
    working_hours JSONB DEFAULT '{}', -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Timestamps
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT agent_availability_workload_check CHECK (current_chat_count <= max_concurrent_chats)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_availability_organization ON agent_availability(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_availability_status ON agent_availability(status);
CREATE INDEX IF NOT EXISTS idx_agent_availability_auto_assign ON agent_availability(auto_assign);
CREATE INDEX IF NOT EXISTS idx_agent_availability_last_active ON agent_availability(last_active);

-- Enable Row Level Security
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;

-- Policy for agents to manage their own availability
CREATE POLICY "Agents can manage their own availability" ON agent_availability
    FOR ALL USING (agent_id = auth.uid());

-- Policy for organization members to view agent availability
CREATE POLICY "Organization members can view agent availability" ON agent_availability
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Insert initial data for marko@marko.com
INSERT INTO agent_availability (
    agent_id,
    organization_id,
    status,
    auto_assign,
    max_concurrent_chats,
    current_chat_count,
    priority_score,
    working_hours,
    timezone,
    last_active,
    updated_at
) VALUES (
    '968ec5a9-d8cd-44d7-9fde-1ba06bef5844', -- marko's user_id
    '0690e12c-9aaf-4c12-9c2a-8bfa8f14db16', -- correct organization_id
    'online',
    true,
    10,
    0,
    100,
    '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}'::jsonb,
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (agent_id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    status = 'online',
    auto_assign = true,
    updated_at = NOW();

-- Create function to auto-assign conversations to available agents
CREATE OR REPLACE FUNCTION assign_conversation_to_available_agent(
    p_conversation_id UUID,
    p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    -- Try to find an available agent
    SELECT agent_id INTO v_agent_id
    FROM agent_availability
    WHERE organization_id = p_organization_id
      AND status = 'online'
      AND auto_assign = true
      AND current_chat_count < max_concurrent_chats
    ORDER BY priority_score DESC, current_chat_count ASC
    LIMIT 1;

    -- If no agent found, assign to marko@marko.com as fallback
    IF v_agent_id IS NULL THEN
        v_agent_id := '968ec5a9-d8cd-44d7-9fde-1ba06bef5844';
    END IF;

    -- Update conversation with assigned agent (handle both possible column names)
    IF v_agent_id IS NOT NULL THEN
        -- Try assignee_id first (new schema)
        UPDATE conversations
        SET assignee_id = v_agent_id,
            assignee_type = 'human',
            status = 'open',
            updated_at = NOW()
        WHERE id = p_conversation_id;

        -- If no rows affected, try assigned_agent_id (legacy schema)
        IF NOT FOUND THEN
            UPDATE conversations
            SET assigned_agent_id = v_agent_id,
                status = 'open',
                updated_at = NOW()
            WHERE id = p_conversation_id;
        END IF;

        -- Update agent workload
        UPDATE agent_availability
        SET current_chat_count = current_chat_count + 1,
            updated_at = NOW()
        WHERE agent_id = v_agent_id;
    END IF;

    RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql;
