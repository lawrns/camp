-- Create message_feedback table for AI response feedback
CREATE TABLE IF NOT EXISTS public.message_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Feedback details
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'escalate', 'improve')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- User who provided feedback
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'agent', 'system')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_message_feedback_message_id ON public.message_feedback(message_id);
CREATE INDEX idx_message_feedback_conversation_id ON public.message_feedback(conversation_id);
CREATE INDEX idx_message_feedback_organization_id ON public.message_feedback(organization_id);
CREATE INDEX idx_message_feedback_feedback_type ON public.message_feedback(feedback_type);
CREATE INDEX idx_message_feedback_created_at ON public.message_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view message feedback in their organization" ON public.message_feedback
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create message feedback" ON public.message_feedback
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update their own message feedback" ON public.message_feedback
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_message_feedback_updated_at BEFORE UPDATE ON public.message_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.message_feedback TO authenticated;
GRANT SELECT ON public.message_feedback TO anon;