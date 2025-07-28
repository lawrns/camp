-- Create escalations table for tracking AI-to-human escalations
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    
    -- Escalation details
    escalation_type TEXT NOT NULL CHECK (escalation_type IN ('low_confidence', 'user_request', 'complex_query', 'error', 'manual', 'timeout')),
    escalation_reason TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- AI context
    ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0.0 AND ai_confidence_score <= 1.0),
    ai_model TEXT,
    attempted_responses INTEGER DEFAULT 0,
    context_summary TEXT,
    
    -- Escalation status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'cancelled')),
    resolution_type TEXT CHECK (resolution_type IN ('handed_over', 'ai_resumed', 'conversation_ended', 'escalation_cancelled')),
    
    -- Assignment
    escalated_to_agent_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    escalated_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    escalated_by_ai BOOLEAN DEFAULT true,
    
    -- Timing
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER,
    
    -- Customer impact
    customer_waiting BOOLEAN DEFAULT true,
    customer_notified BOOLEAN DEFAULT false,
    customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
    
    -- Resolution details
    resolution_notes TEXT,
    handover_context JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_escalations_conversation_id ON public.escalations(conversation_id);
CREATE INDEX idx_escalations_organization_id ON public.escalations(organization_id);
CREATE INDEX idx_escalations_message_id ON public.escalations(message_id);
CREATE INDEX idx_escalations_status ON public.escalations(status);
CREATE INDEX idx_escalations_escalation_type ON public.escalations(escalation_type);
CREATE INDEX idx_escalations_priority ON public.escalations(priority);
CREATE INDEX idx_escalations_escalated_to_agent_id ON public.escalations(escalated_to_agent_id);
CREATE INDEX idx_escalations_escalated_at ON public.escalations(escalated_at DESC);
CREATE INDEX idx_escalations_customer_waiting ON public.escalations(customer_waiting) WHERE customer_waiting = true;
CREATE INDEX idx_escalations_pending ON public.escalations(status, priority, escalated_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view escalations in their organization" ON public.escalations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Agents can create escalations" ON public.escalations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Agents can update escalations" ON public.escalations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND role IN ('admin', 'agent')
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON public.escalations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update response time when status changes
CREATE OR REPLACE FUNCTION update_escalation_response_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Update acknowledged_at when status changes to acknowledged or in_progress
        IF NEW.status IN ('acknowledged', 'in_progress') AND OLD.status = 'pending' THEN
            NEW.acknowledged_at = NOW();
            NEW.response_time_seconds = EXTRACT(EPOCH FROM (NOW() - NEW.escalated_at));
        END IF;
        
        -- Update resolved_at when status changes to resolved or cancelled
        IF NEW.status IN ('resolved', 'cancelled') AND OLD.status != NEW.status THEN
            NEW.resolved_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for response time calculation
CREATE TRIGGER update_escalation_response_time_trigger
    BEFORE UPDATE ON public.escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_escalation_response_time();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.escalations TO authenticated;
GRANT SELECT ON public.escalations TO anon;