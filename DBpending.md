# Database Pending Changes

## Overview
This file contains all pending database changes that need to be implemented by the DB AI to ensure full functionality of the Campfire platform.

## Priority 1: Core Database Setup

### 1.1 Environment Configuration
```bash
# Required environment variables for database connection
DATABASE_URL="postgresql://localhost:5432/campfire_dev"
POSTGRES_URL="postgresql://localhost:5432/campfire_dev"
```

### 1.2 Database Installation
```bash
# Install PostgreSQL if not already installed
brew install postgresql
brew services start postgresql

# Create database
createdb campfire_dev

# Enable required extensions
psql campfire_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql campfire_dev -c "CREATE EXTENSION IF NOT EXISTS \"vector\";"
psql campfire_dev -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
```

### 1.3 Schema Migration
```bash
# Apply consolidated schema
psql campfire_dev -f db/consolidated-schema.sql

# Run Drizzle migrations
npm run db:migrate
npm run db:generate
npm run db:push
```

## Priority 2: Missing Tables and Relationships

### 2.1 Thread Management Tables
```sql
-- Add missing thread management tables
CREATE TABLE IF NOT EXISTS message_threads (
    thread_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

-- Add indexes for thread performance
CREATE INDEX idx_message_threads_conversation ON message_threads(conversation_id);
CREATE INDEX idx_message_threads_active ON message_threads(is_active);
```

### 2.2 AI Analytics Tables
```sql
-- Add AI analytics tracking tables
CREATE TABLE IF NOT EXISTS ai_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, model_name, date)
);

-- Add indexes for analytics queries
CREATE INDEX idx_ai_analytics_org_date ON ai_analytics(organization_id, date DESC);
CREATE INDEX idx_ai_analytics_model ON ai_analytics(model_name);
```

### 2.3 Team Performance Tables
```sql
-- Add team performance tracking
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    conversations_handled INTEGER DEFAULT 0,
    avg_response_time_minutes DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    resolution_rate DECIMAL(5,4) DEFAULT 0,
    efficiency_score DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, date)
);

-- Add indexes for performance queries
CREATE INDEX idx_agent_performance_agent ON agent_performance(agent_id, date DESC);
CREATE INDEX idx_agent_performance_org ON agent_performance(organization_id, date DESC);
```

## Priority 3: Data Seeding

### 3.1 Sample Organizations
```sql
-- Insert sample organization
INSERT INTO organizations (id, name, slug, settings) VALUES 
('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Campfire Demo', 'campfire-demo', '{"theme": "light", "primary_color": "#3b82f6"}')
ON CONFLICT (slug) DO NOTHING;
```

### 3.2 Sample Conversations and Messages
```sql
-- Insert sample conversations
INSERT INTO conversations (id, organization_id, status, subject, priority) VALUES 
('8ddf595b-b75d-42f2-98e5-9efd3513ea4b', 'b5e80170-004c-4e82-a88c-3e2166b169dd', 'open', 'How do I integrate the widget?', 'normal'),
('9eef696c-c86e-53g3-09f6-0fge4624fb5c', 'b5e80170-004c-4e82-a88c-3e2166b169dd', 'in_progress', 'Billing question', 'high')
ON CONFLICT DO NOTHING;

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_type, content) VALUES 
('8ddf595b-b75d-42f2-98e5-9efd3513ea4b', 'customer', 'Hi, I need help integrating the widget into my website'),
('8ddf595b-b75d-42f2-98e5-9efd3513ea4b', 'ai', 'I can help you integrate the widget! Here are the steps...'),
('9eef696c-c86e-53g3-09f6-0fge4624fb5c', 'customer', 'I have a question about my billing'),
('9eef696c-c86e-53g3-09f6-0fge4624fb5c', 'user', 'I can help with your billing question. What specific issue are you experiencing?')
ON CONFLICT DO NOTHING;
```

### 3.3 Sample Threads
```sql
-- Insert sample message threads
INSERT INTO message_threads (thread_id, conversation_id, title) VALUES 
('thread-1', '8ddf595b-b75d-42f2-98e5-9efd3513ea4b', 'Widget Integration Help'),
('thread-2', '9eef696c-c86e-53g3-09f6-0fge4624fb5c', 'Billing Support')
ON CONFLICT DO NOTHING;
```

## Priority 4: API Integration Fixes

### 4.1 Widget Threads API
- **Issue**: `/api/widget/threads` returns 500 due to missing database connection
- **Fix**: Ensure database connection is properly configured
- **Test**: Verify endpoint returns real thread data instead of mock data

### 4.2 AI Analytics API
- **Issue**: `/api/trpc/ai.analytics.getCostBreakdown` returns 500 due to missing OpenAI API key
- **Fix**: Add proper error handling for missing API keys
- **Test**: Verify analytics endpoints work with fallback data

### 4.3 Tickets API
- **Issue**: `/api/tickets` endpoint needs to be created
- **Fix**: Create tickets API with proper database integration
- **Test**: Verify ticket CRUD operations work correctly

## Priority 5: Performance Optimizations

### 5.1 Database Indexes
```sql
-- Add performance indexes for common queries
CREATE INDEX CONCURRENTLY idx_conversations_org_status ON conversations(organization_id, status);
CREATE INDEX CONCURRENTLY idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_tickets_org_priority ON tickets(organization_id, priority);
```

### 5.2 Query Optimization
- Optimize conversation queries with proper joins
- Add pagination to message history queries
- Implement efficient search across conversations and messages

## Priority 6: Security and Compliance

### 6.1 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization data" ON conversations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );
```

### 6.2 Data Validation
- Add proper constraints for data integrity
- Implement soft deletes for important data
- Add audit logging for sensitive operations

## Testing Requirements

### 6.1 Unit Tests
- Test all database operations with proper mocking
- Verify RLS policies work correctly
- Test data validation and constraints

### 6.2 Integration Tests
- Test API endpoints with real database
- Verify widget functionality with real data
- Test analytics queries with sample data

### 6.3 Performance Tests
- Test query performance with large datasets
- Verify index effectiveness
- Test concurrent user scenarios

## Implementation Notes

1. **Backup Strategy**: Always backup existing data before applying changes
2. **Migration Order**: Apply schema changes before data seeding
3. **Rollback Plan**: Have rollback scripts ready for each change
4. **Monitoring**: Add database monitoring and alerting
5. **Documentation**: Update API documentation after changes

## Success Criteria

- [ ] All API endpoints return 200 status codes
- [ ] Widget shows real conversation data
- [ ] Analytics dashboard displays real metrics
- [ ] Team management shows real agent data
- [ ] Tickets system works end-to-end
- [ ] All unit tests pass
- [ ] Performance meets <100ms latency targets
- [ ] Security policies are properly enforced 