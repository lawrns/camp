# Campfire v2 Naming Conventions Documentation

## Overview
This document defines the standardized naming conventions for Campfire v2, including real-time channels, database objects, API endpoints, and component structures. These conventions ensure consistency, maintainability, and proper functionality across the entire system.

## Table of Contents
1. [Real-time Channel Naming](#real-time-channel-naming)
2. [Database Naming Conventions](#database-naming-conventions)
3. [API Endpoint Conventions](#api-endpoint-conventions)
4. [Component and File Naming](#component-and-file-naming)
5. [Event and Message Naming](#event-and-message-naming)

## Real-time Channel Naming

### Unified Channel Standard
**Base Pattern**: `org:{organizationId}:scope:{identifier}`

All real-time channels MUST follow this hierarchical naming convention to ensure proper routing and avoid conflicts.

### Channel Types and Examples

#### 1. Organization-wide Channels
**Pattern**: `org:{organizationId}`
**Purpose**: Organization-level updates, announcements, global state changes
**Example**: `org:b5e80170-004c-4e82-a88c-3e2166b169dd`

#### 2. Conversation-specific Channels  
**Pattern**: `org:{organizationId}:conv:{conversationId}`
**Purpose**: Message updates, typing indicators, read receipts for specific conversations
**Example**: `org:b5e80170-004c-4e82-a88c-3e2166b169dd:conv:786c060b-3157-4740-9b28-9e3af737c255`

#### 3. Conversations List Channels
**Pattern**: `org:{organizationId}:conversations`
**Purpose**: Conversation list updates, new conversation notifications
**Example**: `org:b5e80170-004c-4e82-a88c-3e2166b169dd:conversations`

#### 4. Widget-specific Channels
**Pattern**: `org:{organizationId}:widget:{conversationId}`
**Purpose**: Widget-specific real-time updates, visitor interactions
**Example**: `org:b5e80170-004c-4e82-a88c-3e2166b169dd:widget:786c060b-3157-4740-9b28-9e3af737c255`

#### 5. User-specific Channels
**Pattern**: `org:{organizationId}:user:{userId}`
**Purpose**: User-specific notifications, presence updates
**Example**: `org:b5e80170-004c-4e82-a88c-3e2166b169dd:user:user_123`

### Broadcast-only Channel Prefix
**All channels MUST use the `bcast:` prefix** to ensure broadcast-only operation and prevent postgres_changes conflicts:

```typescript
// Correct implementation
const channelName = `bcast:org:${orgId}:conv:${convId}`;

// Channel configuration
const channel = client.channel(channelName, {
  config: {
    broadcast: { ack: false },
    presence: { ack: false },
    postgres_changes: [] // <-- CRITICAL: disable automatic CDC
  }
});
```

### Channel Naming Implementation
```typescript
// lib/realtime/unified-channel-standards.ts
export const UNIFIED_CHANNELS = {
  organization: (orgId: string) => `org:${orgId}`,
  conversation: (orgId: string, convId: string) => `org:${orgId}:conv:${convId}`,
  conversations: (orgId: string) => `org:${orgId}:conversations`,
  widget: (orgId: string, convId: string) => `org:${orgId}:widget:${convId}`,
  user: (orgId: string, userId: string) => `org:${orgId}:user:${userId}`
} as const;
```

## Database Naming Conventions

### Table Naming
**Pattern**: `snake_case` with descriptive names
- Primary tables: `conversations`, `messages`, `organizations`
- Realtime mirrors: `realtime_conversations`, `realtime_messages`
- Junction tables: `organization_members`, `conversation_tags`
- Audit tables: `conversation_history`, `message_history`

### Column Naming
**Pattern**: `snake_case` with consistent suffixes
- Primary keys: `id` (UUID)
- Foreign keys: `{table}_id` (e.g., `organization_id`, `conversation_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Boolean flags: `is_{condition}` or `{action}_enabled`
- JSON columns: `{purpose}_metadata` (e.g., `assignment_metadata`)

### Index Naming
**Pattern**: `idx_{table}_{columns}_{type}`
```sql
-- Examples
CREATE INDEX idx_conversations_organization_id_btree ON conversations(organization_id);
CREATE INDEX idx_messages_conversation_id_created_at_btree ON messages(conversation_id, created_at);
```

### Constraint Naming
**Pattern**: `{type}_{table}_{columns}`
```sql
-- Examples
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_organization_id 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);
  
ALTER TABLE messages ADD CONSTRAINT chk_messages_sender_type 
  CHECK (sender_type IN ('visitor', 'agent', 'system'));
```

### Function and Trigger Naming
**Functions**: `{action}_{object}` (e.g., `sync_realtime_conversations`, `update_updated_at_column`)
**Triggers**: `{function_name}_trigger` (e.g., `sync_realtime_conversations_trigger`)

### RLS Policy Naming
**Pattern**: `{table}_{operation}_{context}`
```sql
-- Examples
CREATE POLICY "conversations_select_org_members" ON conversations FOR SELECT...
CREATE POLICY "realtime_conv_insert" ON realtime_conversations FOR INSERT...
CREATE POLICY "messages_update_sender" ON messages FOR UPDATE...
```

## API Endpoint Conventions

### RESTful Patterns
**Base Pattern**: `/api/{scope}/{resource}[/{id}][/{action}]`

#### Widget API Endpoints
```
POST /api/widget/auth          # Widget authentication
POST /api/widget/messages      # Send widget message
POST /api/widget/typing        # Widget typing indicators
GET  /api/widget/status        # Widget status check
```

#### Dashboard API Endpoints
```
GET    /api/dashboard/conversations                    # List conversations
POST   /api/dashboard/conversations                    # Create conversation
GET    /api/dashboard/conversations/{id}               # Get conversation
PUT    /api/dashboard/conversations/{id}               # Update conversation
DELETE /api/dashboard/conversations/{id}               # Delete conversation

GET    /api/dashboard/conversations/{id}/messages      # Get messages
POST   /api/dashboard/conversations/{id}/messages      # Send message
PUT    /api/dashboard/conversations/{id}/messages/{id} # Update message

POST   /api/dashboard/read-receipts                    # Mark messages as read
GET    /api/dashboard/metrics                          # Dashboard metrics
```

#### Organization API Endpoints
```
GET  /api/organizations/{id}          # Get organization
PUT  /api/organizations/{id}          # Update organization
GET  /api/organizations/{id}/members  # List members
POST /api/organizations/{id}/members  # Add member
```

### HTTP Status Codes
- `200`: Success with data
- `201`: Created successfully
- `204`: Success without data
- `400`: Bad request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `409`: Conflict (duplicate resource)
- `422`: Unprocessable entity (business logic errors)
- `500`: Internal server error

### Response Format
```typescript
// Success response
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}

// Error response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...} // Optional additional details
  }
}
```

## Component and File Naming

### React Components
**Pattern**: `PascalCase` with descriptive names
- Main components: `UltimateWidget`, `InboxDashboard`, `ConversationCard`
- UI components: `MessageBubble`, `TypingIndicator`, `FileUpload`
- Hook components: `useWidgetAuth`, `useRealtime`, `useTypingIndicator`

### File and Directory Structure
```
components/
├── widget/
│   ├── UltimateWidget.tsx           # Main widget component
│   ├── enhanced/
│   │   ├── useWidgetRealtime.ts     # Widget realtime hook
│   │   └── useTypingIndicator.ts    # Typing indicator hook
│   └── design-system/
│       ├── MessageBubble.tsx        # Message display component
│       └── WidgetButton.tsx         # Widget button component
├── inbox/
│   ├── InboxDashboard.tsx           # Main inbox component
│   ├── ConversationCard.tsx         # Conversation list item
│   └── hooks/
│       ├── useConversations.ts      # Conversations management
│       └── useMessages.ts           # Messages management
└── shared/
    ├── TypingIndicator.tsx          # Shared typing component
    └── FileUpload.tsx               # Shared file upload
```

### Hook Naming
**Pattern**: `use{Purpose}` with descriptive names
- `useWidgetAuth`: Widget authentication management
- `useWidgetRealtime`: Widget real-time communication
- `useConversations`: Conversation list management
- `useMessages`: Message management
- `useTypingIndicator`: Typing indicator functionality

## Event and Message Naming

### Unified Event Types
```typescript
export const UNIFIED_EVENTS = {
  // Message events
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  
  // Conversation events
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_CLOSED: 'conversation:closed',
  
  // Typing events
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  
  // Read receipt events
  READ_RECEIPT: 'read:receipt',
  
  // Agent presence events
  AGENT_STATUS_ONLINE: 'agent:status:online',
  AGENT_STATUS_OFFLINE: 'agent:status:offline',
  AGENT_STATUS_AWAY: 'agent:status:away',
  
  // System events
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  SYSTEM_MAINTENANCE: 'system:maintenance'
} as const;
```

### Event Payload Structure
```typescript
// Message event payload
{
  message: MessageObject,
  conversationId: string,
  organizationId: string,
  timestamp: string,
  source: 'widget' | 'dashboard' | 'api'
}

// Typing event payload
{
  userId: string,
  userName: string,
  conversationId: string,
  isTyping: boolean,
  timestamp: string
}

// Conversation event payload
{
  conversationId: string,
  organizationId: string,
  lastMessage?: MessageObject,
  status?: ConversationStatus,
  timestamp: string,
  source: 'widget' | 'dashboard' | 'system'
}
```

### Message Type Conventions
**Sender Types**: `'visitor' | 'agent' | 'system' | 'ai'`
**Message Status**: `'sent' | 'delivered' | 'read' | 'failed'`
**Conversation Status**: `'open' | 'closed' | 'pending' | 'assigned'`
**Priority Levels**: `'low' | 'medium' | 'high' | 'urgent'`

## Implementation Guidelines

### 1. Consistency Requirements
- ALL real-time channels MUST use the unified naming convention
- ALL database objects MUST follow snake_case naming
- ALL API endpoints MUST follow RESTful patterns
- ALL components MUST use PascalCase naming

### 2. Validation Rules
- Channel names MUST be validated before subscription
- Database names MUST be checked against reserved words
- API endpoints MUST include proper HTTP method validation
- Component names MUST be unique within their scope

### 3. Documentation Requirements
- ALL new channels MUST be documented in UNIFIED_CHANNELS
- ALL new events MUST be added to UNIFIED_EVENTS
- ALL API endpoints MUST include OpenAPI documentation
- ALL components MUST include TypeScript interfaces

### 4. Testing Requirements
- Channel naming MUST be tested in integration tests
- Database naming MUST be validated in migration tests
- API endpoints MUST include naming convention tests
- Component naming MUST be checked in linting rules

## Conclusion

These naming conventions ensure consistency, maintainability, and proper functionality across the Campfire v2 system. Adherence to these standards is critical for the real-time communication system, database integrity, API reliability, and component organization.
