-- Create AI metrics table for tracking performance and usage
create table if not exists ai_metrics (
  id serial primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  latency_ms int not null,
  tokens int not null,
  model varchar(50) not null default 'gpt-4-turbo',
  operation varchar(50) not null default 'rag_response',
  confidence numeric(3,2) default 0.8,
  hallucination_score numeric(3,2) default 0.0,
  was_filtered boolean default false,
  filter_reasons text[] default '{}',
  created_at timestamp with time zone default now(),
  metadata jsonb default '{}'
);

-- Create indexes for performance
create index idx_ai_metrics_conversation on ai_metrics(conversation_id);
create index idx_ai_metrics_organization on ai_metrics(organization_id);
create index idx_ai_metrics_created_at on ai_metrics(created_at desc);

-- Create RLS policies
alter table ai_metrics enable row level security;

-- Organization members can view their own metrics
create policy "Organization members can view metrics" on ai_metrics
  for select
  using (
    organization_id in (
      select organization_id from organization_members 
      where user_id = auth.uid()
    )
  );

-- System can insert metrics
create policy "System can insert metrics" on ai_metrics
  for insert
  with check (true);