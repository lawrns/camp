-- Create tickets table for converting conversations to tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Ticket details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  
  -- People
  customer_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  assigned_agent_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  INDEX idx_tickets_organization_id (organization_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_assigned_agent_id (assigned_agent_id),
  INDEX idx_tickets_created_at (created_at DESC)
);

-- Create ticket comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_ticket_comments_ticket_id (ticket_id),
  INDEX idx_ticket_comments_created_at (created_at)
);

-- Create ticket history/activity table
CREATE TABLE IF NOT EXISTS public.ticket_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  activity_type TEXT NOT NULL, -- created, status_changed, priority_changed, assigned, commented, etc.
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_ticket_activities_ticket_id (ticket_id),
  INDEX idx_ticket_activities_created_at (created_at DESC)
);

-- Create ticket attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.ticket_comments(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  
  uploaded_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_ticket_attachments_ticket_id (ticket_id)
);

-- Create agent notifications table
CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- ticket_assigned, ticket_updated, mention, etc.
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_agent_notifications_agent_id (agent_id),
  INDEX idx_agent_notifications_read (read),
  INDEX idx_agent_notifications_created_at (created_at DESC)
);

-- Add RLS policies
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for tickets
CREATE POLICY "Users can view tickets in their organization" ON public.tickets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Agents can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND status = 'active' 
      AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Agents can update tickets" ON public.tickets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND status = 'active' 
      AND role IN ('admin', 'agent')
    )
  );

-- Policies for ticket comments
CREATE POLICY "Users can view ticket comments" ON public.ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM public.tickets 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Agents can create ticket comments" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND status = 'active' 
        AND role IN ('admin', 'agent')
      )
    )
  );

-- Similar policies for other tables...

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add ticket_id column to conversations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'conversations' 
                 AND column_name = 'ticket_id') THEN
    ALTER TABLE public.conversations 
    ADD COLUMN ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_ticket_id ON public.conversations(ticket_id);
