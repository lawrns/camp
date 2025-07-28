# Campfire v2 Development Guide

This document serves as the definitive reference for maintaining code quality and consistency standards in the Campfire v2 customer communication platform. It establishes the "laws and regulations" of our codebase to ensure we maintain industry-leading standards comparable to Intercom and LiveChat.

## Table of Contents
1. [Architecture & Standards](#architecture--standards)
2. [Supabase Integration Standards](#supabase-integration-standards)
3. [Component Communication](#component-communication)
4. [Feature Documentation](#feature-documentation)
5. [UI/UX Standards](#uiux-standards)
6. [Quality Assurance](#quality-assurance)

---

## Architecture & Standards

### Naming Conventions

#### Files and Directories
```
- Components: PascalCase.tsx (e.g., WidgetPanel.tsx)
- Hooks: camelCase with 'use' prefix (e.g., useRealtime.ts)
- Utilities: camelCase.ts (e.g., formatDate.ts)
- Pages: kebab-case for routes (e.g., user-profile/page.tsx)
- Types: camelCase with descriptive suffix (e.g., messageTypes.ts)
- Constants: UPPER_SNAKE_CASE in constants files
```

#### Code Elements
```typescript
// Components and Types: PascalCase
interface MessageProps { }
function WidgetPanel() { }

// Functions and Variables: camelCase
const handleSendMessage = () => { }
let messageCount = 0;

// Constants: UPPER_SNAKE_CASE
const MAX_MESSAGE_LENGTH = 1000;
const API_TIMEOUT = 30000;

// Enums: PascalCase with UPPER_SNAKE_CASE values
enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered'
}
```

### Code Organization Patterns

#### Directory Structure Principles
```
app/                    # Next.js App Router pages and API routes
├── api/               # REST and tRPC endpoints
├── dashboard/         # Protected routes (agent dashboard)
├── widget/           # Widget-specific pages
└── (auth)/          # Authentication pages (grouped route)

components/           # Feature-based organization
├── ui/              # Base UI primitives (buttons, inputs)
├── unified-ui/      # Consolidated design system
├── widget/          # Widget V3 components
├── inbox/           # Agent dashboard components
└── shared/          # Cross-feature components

lib/                 # Core utilities and business logic
├── auth/           # Authentication utilities
├── supabase/       # Database client and utilities
├── realtime/       # WebSocket management
├── ai/             # AI/RAG integration
└── utils/          # General helpers
```

#### Import Order (enforced by ESLint)
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';

// 3. Third-party modules
import { createClient } from '@supabase/supabase-js';

// 4. Internal packages
import { Button } from '@/components/ui/button';

// 5. Relative imports
import { formatMessage } from './utils';
```

### Database Schema Conventions

#### Table Naming
- Use snake_case for table names (e.g., `conversations`, `knowledge_documents`)
- Use plural forms for tables
- Junction tables: `organization_members`, `conversation_participants`

#### Column Naming
- Use camelCase for columns (e.g., `createdAt`, `organizationId`)
- Timestamps: `createdAt`, `updatedAt`, `deletedAt`
- Foreign keys: `{table}Id` (e.g., `organizationId`, `userId`)
- Boolean fields: Use `is` or `has` prefix (e.g., `isActive`, `hasAccess`)

#### Relationships
```sql
-- Every table must have organizationId for multi-tenancy
organizationId UUID NOT NULL REFERENCES organizations(id),

-- Standard timestamps on all tables
createdAt TIMESTAMPTZ DEFAULT NOW(),
updatedAt TIMESTAMPTZ DEFAULT NOW(),

-- Soft deletes where applicable
deletedAt TIMESTAMPTZ
```

---

## Supabase Integration Standards

### Realtime Communication Patterns

#### Channel Naming Convention
```typescript
// Organization-wide channels
`org:${organizationId}:presence`
`org:${organizationId}:notifications`

// Conversation-specific channels
`org:${organizationId}:conv:${conversationId}`
`org:${organizationId}:conv:${conversationId}:typing`

// Agent-specific channels
`org:${organizationId}:agent:${agentId}`
```

#### Event Types
```typescript
const EVENT_TYPES = {
  // Message events
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  
  // Conversation events
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_ASSIGNED: 'conversation.assigned',
  
  // Typing indicators
  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',
  
  // Presence
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
  USER_AWAY: 'user.away'
} as const;
```

#### Connection Management
```typescript
// Always implement exponential backoff for reconnection
const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 16000, 30000];

// Channel pooling to prevent proliferation
const MAX_CHANNELS_PER_SESSION = 5;

// Clean up channels on component unmount
useEffect(() => {
  const unsubscribe = subscribeToChannel(channel, event, handler);
  return () => unsubscribe();
}, [channel, event]);
```

### Database Query Conventions

#### Always Include Organization Context
```typescript
// ❌ Bad: Missing organization context
const messages = await supabase
  .from('messages')
  .select('*')
  .eq('conversationId', conversationId);

// ✅ Good: Includes organization context
const messages = await supabase
  .from('messages')
  .select('*')
  .eq('organizationId', organizationId)
  .eq('conversationId', conversationId)
  .order('createdAt', { ascending: true });
```

#### RLS (Row Level Security) Patterns
```sql
-- Every table must have RLS enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Standard RLS policy pattern
CREATE POLICY "Users can view their organization's conversations"
  ON conversations
  FOR SELECT
  USING (organizationId = auth.jwt() ->> 'organizationId');
```

#### Error Handling
```typescript
// Standard error handling pattern
try {
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...messageData });
    
  if (error) throw error;
  return { success: true, data };
} catch (error) {
  console.error('[Database] Insert failed:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Database error' 
  };
}
```

---

## Component Communication

### Agent-to-Widget Communication Protocol

#### Message Flow
```typescript
// 1. Widget sends message
const sendMessage = async (content: string) => {
  // Create message in database
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversationId: conversationId,
      organizationId: organizationId,
      content,
      senderType: 'customer',
      metadata: { widgetVersion: '3.0' }
    })
    .select()
    .single();
  
  // Broadcast via realtime
  await broadcastToChannel(
    `org:${organizationId}:conv:${conversationId}`,
    EVENT_TYPES.MESSAGE_CREATED,
    message
  );
};

// 2. Agent receives in real-time
useEffect(() => {
  const subscription = subscribeToChannel(
    `org:${organizationId}:conv:${conversationId}`,
    EVENT_TYPES.MESSAGE_CREATED,
    (payload) => {
      // Update local state
      addMessageToConversation(payload);
      // Show notification if not focused
      if (!document.hasFocus()) {
        showNotification(payload);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, [conversationId]);
```

#### State Management Patterns

##### Widget State
```typescript
interface WidgetState {
  isOpen: boolean;
  conversationId: string | null;
  messages: Message[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  typingUsers: TypingUser[];
  aiHandover: {
    status: 'ai' | 'handover_requested' | 'agent_assigned';
    confidence: number;
    assignedAgent?: Agent;
  };
}
```

##### Inbox State
```typescript
interface InboxState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  filters: ConversationFilters;
  sortBy: 'newest' | 'oldest' | 'priority';
  assignmentQueue: string[]; // Conversation IDs awaiting assignment
}
```

#### Event Handling Standards
```typescript
// Debounce typing indicators
const TYPING_DEBOUNCE_MS = 300;
const TYPING_TIMEOUT_MS = 3000;

// Batch read receipts
const READ_RECEIPT_BATCH_MS = 1000;

// Rate limit message sending
const MESSAGE_RATE_LIMIT = {
  maxMessages: 10,
  windowMs: 60000 // 1 minute
};
```

---

## Feature Documentation

### Widget Functionality

#### Core Features
1. **Real-time Messaging**
   - WebSocket connection via Supabase Realtime
   - Message persistence in PostgreSQL
   - Optimistic updates for better UX
   - Retry logic for failed messages

2. **AI Integration**
   - Confidence scoring (0.0 - 1.0)
   - Automatic handover when confidence < 0.7
   - Human-like response timing (1-2 second delay)
   - Context from knowledge base

3. **File Uploads**
   - Max size: 10MB per file
   - Supported types: images, documents, text
   - Stored in Supabase Storage with organization isolation
   - Virus scanning (planned)

4. **Performance Requirements**
   - Widget load time: <100ms
   - Bundle size: <30KB
   - Message latency: <100ms
   - Lighthouse score: >95

#### Configuration Schema
```typescript
interface WidgetSettings {
  // Appearance
  theme: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
  
  // Behavior
  welcomeMessage: string;
  businessHours: BusinessHours;
  autoResponse: {
    enabled: boolean;
    message: string;
    delay: number;
  };
  
  // AI Settings
  ai: {
    enabled: boolean;
    confidenceThreshold: number;
    handoverMessage: string;
    providers: ('openai' | 'anthropic' | 'deepseek')[];
  };
}
```

### Inbox Management

#### Assignment Logic
```typescript
// Auto-assignment based on:
// 1. Agent availability (online + not at capacity)
// 2. Agent skills matching conversation tags
// 3. Previous conversation history
// 4. Current workload distribution

interface AssignmentCriteria {
  requiresSkills?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preferredAgent?: string;
  aiHandoverRequested: boolean;
}
```

#### Conversation States
```typescript
enum ConversationStatus {
  OPEN = 'open',           // New, unassigned
  IN_PROGRESS = 'in_progress', // Assigned to agent
  WAITING = 'waiting',     // Awaiting customer response
  RESOLVED = 'resolved',   // Marked as resolved
  CLOSED = 'closed'        // Archived
}
```

### Knowledge Base Integration

#### RAG (Retrieval-Augmented Generation) Flow
```typescript
// 1. Document Processing
interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding?: number[]; // Vector embedding
  chunkCount: number;
  lastUpdated: Date;
}

// 2. Context Retrieval
const getRelevantContext = async (query: string, limit = 5) => {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Semantic search using pgvector
  const { data: chunks } = await supabase
    .rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.8,
      match_count: limit,
      organization_id: organizationId
    });
    
  return chunks;
};

// 3. Response Generation
const generateAIResponse = async (
  userMessage: string,
  context: KnowledgeChunk[]
) => {
  const prompt = constructPrompt(userMessage, context);
  const response = await aiProvider.complete(prompt);
  
  return {
    content: response.content,
    confidence: calculateConfidence(response, context),
    sources: context.map(c => c.documentId)
  };
};
```

---

## UI/UX Standards

### Design System Components

#### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-500: #6366F1;  /* Primary actions */
  --primary-600: #5558E3;  /* Hover states */
  
  /* Semantic Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-900: #111827;
  
  /* Widget Specific */
  --widget-bg: #FFFFFF;
  --widget-border: rgba(0, 0, 0, 0.1);
}
```

#### Typography Scale
```css
/* Consistent type scale */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }

/* Line heights */
.leading-tight { line-height: 1.25; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.625; }
```

#### Component Patterns

##### Buttons
```typescript
// Standard button variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

// Consistent button props
interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

##### Loading States
```typescript
// Skeleton loaders for all async content
<MessageSkeleton /> // For loading messages
<ConversationSkeleton /> // For loading conversations
<InboxSkeleton /> // For loading inbox

// Consistent loading indicators
<Spinner size="sm" /> // Inline loading
<LoadingOverlay /> // Full-screen loading
```

### Responsive Design Patterns

#### Breakpoints
```typescript
const BREAKPOINTS = {
  sm: 640,   // Mobile
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
} as const;

// Usage with custom hook
const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.sm}px)`);
```

#### Mobile-First Approach
```css
/* Base styles (mobile) */
.widget-panel {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

/* Tablet and up */
@media (min-width: 768px) {
  .widget-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 600px;
    border-radius: 16px;
  }
}
```

### Accessibility Standards

#### ARIA Requirements
```typescript
// All interactive elements must have proper ARIA
<button
  aria-label="Send message"
  aria-disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? 'Sending...' : 'Send'}
</button>

// Live regions for dynamic content
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {typingUsers.length > 0 && `${typingUsers[0].name} is typing...`}
</div>
```

#### Keyboard Navigation
```typescript
// Tab order management
const FOCUSABLE_ELEMENTS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])'
];

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'Escape': 'Close widget',
  'Cmd+Enter': 'Send message',
  'Cmd+K': 'Open search',
  '/': 'Focus search input'
};
```

### Animation Standards

#### Performance-First Animations
```css
/* Use CSS transforms and opacity for performance */
.message-enter {
  opacity: 0;
  transform: translateY(10px);
}

.message-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease, transform 200ms ease;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Quality Assurance

### Testing Patterns

#### Unit Testing Requirements
```typescript
// Test file naming: ComponentName.test.tsx
// Coverage requirement: 80% minimum

describe('WidgetPanel', () => {
  it('should render without errors', () => {
    render(<WidgetPanel />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
  
  it('should handle message sending', async () => {
    const onSend = jest.fn();
    render(<WidgetPanel onSendMessage={onSend} />);
    
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(input, 'Test message');
    await userEvent.click(button);
    
    expect(onSend).toHaveBeenCalledWith('Test message');
  });
});
```

#### E2E Testing Standards
```typescript
// Critical user paths that must be tested:
// 1. Widget initialization and first message
// 2. Real-time message delivery
// 3. AI handover flow
// 4. File upload functionality
// 5. Agent assignment and conversation management

test('customer can send message and receive response', async ({ page }) => {
  // Navigate to page with widget
  await page.goto('/');
  
  // Open widget
  await page.click('[data-testid="widget-launcher"]');
  
  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello, I need help');
  await page.click('[data-testid="send-button"]');
  
  // Verify message appears
  await expect(page.locator('[data-testid="message"]')).toContainText('Hello, I need help');
  
  // Verify response (AI or agent)
  await expect(page.locator('[data-testid="message"][data-sender="agent"]')).toBeVisible();
});
```

### Error Handling Conventions

#### Structured Error Responses
```typescript
// API error format
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

// Error codes
const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  AUTH_INVALID: 'Invalid credentials',
  AUTH_EXPIRED: 'Session expired',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  INVALID_FORMAT: 'Invalid data format',
  
  // Business logic
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RESOURCE_NOT_FOUND: 'Resource not found',
  
  // System
  DATABASE_ERROR: 'Database operation failed',
  AI_SERVICE_ERROR: 'AI service unavailable',
  REALTIME_CONNECTION_ERROR: 'Real-time connection failed'
};
```

#### User-Friendly Error Messages
```typescript
// Map technical errors to user-friendly messages
const getUserMessage = (error: APIError): string => {
  switch (error.error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'You\'re sending messages too quickly. Please wait a moment.';
    case 'AI_SERVICE_ERROR':
      return 'Our AI assistant is temporarily unavailable. A human agent will help you shortly.';
    case 'DATABASE_ERROR':
      return 'Something went wrong. Please try again.';
    default:
      return 'An unexpected error occurred. Please refresh and try again.';
  }
};
```

### Performance Optimization Guidelines

#### Bundle Size Management
```typescript
// Lazy load heavy components
const EmojiPicker = lazy(() => import('./features/EmojiPicker'));
const FileUpload = lazy(() => import('./features/FileUpload'));

// Tree-shake unused imports
import { Button } from '@/components/ui/button'; // ✅ Named import
// import * as UI from '@/components/ui'; // ❌ Avoid namespace imports
```

#### Memory Management
```typescript
// Clean up subscriptions and timers
useEffect(() => {
  const timer = setTimeout(callback, 1000);
  const subscription = subscribe(event, handler);
  
  return () => {
    clearTimeout(timer);
    subscription.unsubscribe();
  };
}, []);

// Limit message history in memory
const MAX_MESSAGES_IN_MEMORY = 100;
const messages = allMessages.slice(-MAX_MESSAGES_IN_MEMORY);
```

#### Rendering Optimization
```typescript
// Memoize expensive computations
const processedMessages = useMemo(
  () => messages.map(formatMessage),
  [messages]
);

// Virtualize long lists
<VirtualList
  items={conversations}
  height={600}
  itemHeight={80}
  renderItem={renderConversation}
/>

// Debounce search and filter operations
const debouncedSearch = useDebouncedCallback(
  (query: string) => searchConversations(query),
  300
);
```

### Security Best Practices

#### Input Sanitization
```typescript
// Always sanitize user input before rendering or storing
import DOMPurify from 'isomorphic-dompurify';

const sanitizeMessage = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};
```

#### Authentication Checks
```typescript
// Verify authentication on every protected operation
const protectedOperation = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  // Verify organization membership
  const hasAccess = await verifyOrganizationAccess(
    session.user.id,
    organizationId
  );
  
  if (!hasAccess) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with operation
};
```

#### Data Validation
```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const MessageSchema = z.object({
  content: z.string().min(1).max(1000),
  conversationId: z.string().uuid(),
  organizationId: z.string().uuid(),
  metadata: z.object({}).optional()
});

// Validate before processing
const validateMessage = (data: unknown) => {
  return MessageSchema.parse(data);
};
```

---

## Monitoring and Observability

### Logging Standards
```typescript
// Structured logging with context
const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  },
  error: (message: string, error: Error, context?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
};

// Usage
logger.info('Message sent', {
  conversationId,
  organizationId,
  messageLength: content.length
});
```

### Performance Monitoring
```typescript
// Track key metrics
const metrics = {
  widgetLoadTime: performance.now(),
  messagesSent: 0,
  messagesReceived: 0,
  aiHandovers: 0,
  connectionErrors: 0
};

// Report to monitoring service
const reportMetrics = () => {
  if (window.analytics) {
    window.analytics.track('widget_metrics', metrics);
  }
};
```

---

## Conclusion

This guide establishes the foundation for building and maintaining a world-class customer communication platform. By following these standards, we ensure:

1. **Consistency**: Every developer writes code that looks and behaves the same way
2. **Scalability**: The architecture supports growth from 1 to 1000+ organizations
3. **Performance**: The platform remains fast and responsive at scale
4. **Security**: Customer data is protected with enterprise-grade security
5. **Maintainability**: New developers can quickly understand and contribute

Remember: These are living standards. As we learn and grow, we should update this guide to reflect our best practices. Every team member is responsible for maintaining these standards and suggesting improvements.

**Last Updated**: January 2025
**Version**: 2.0
