# DATABASE & API ARCHITECTURE

## 🗄️ DATABASE SCHEMA OVERVIEW

### Core Tables Structure
```sql
-- Organizations (Multi-tenant foundation)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT true
);

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}'
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  assigned_agent_id UUID REFERENCES users(id),
  title TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  source TEXT DEFAULT 'widget',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  ai_engagement JSONB DEFAULT '{}'
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'ai', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status JSONB DEFAULT '{"status": "sent"}'
);

-- AI Agents
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model_config JSONB NOT NULL,
  training_data JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'slack', 'gmail', 'webhook', etc.
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics & Metrics
CREATE TABLE conversation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  response_time_seconds INTEGER,
  resolution_time_seconds INTEGER,
  customer_satisfaction_score INTEGER,
  ai_confidence_score DECIMAL(3,2),
  handoff_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Advanced Indexes & Performance
```sql
-- Performance indexes
CREATE INDEX idx_conversations_org_status ON conversations(organization_id, status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_users_org_role ON users(organization_id, role);
CREATE INDEX idx_knowledge_articles_org_category ON knowledge_articles(organization_id, category);

-- Full-text search indexes
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_knowledge_articles_fts ON knowledge_articles USING gin(to_tsvector('english', title || ' ' || content));

-- Real-time subscriptions optimization
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- JSONB performance indexes
CREATE INDEX idx_conversations_metadata ON conversations USING gin(metadata);
CREATE INDEX idx_messages_metadata ON messages USING gin(metadata);
```

## 🔌 TYPESCRIPT TYPE DEFINITIONS

### Core Types
```typescript
// Database types (generated from Supabase)
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          settings: Json;
          subscription_tier: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string | null;
          assigned_agent_id: string | null;
          title: string | null;
          status: 'open' | 'closed' | 'pending' | 'snoozed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          source: 'widget' | 'email' | 'slack' | 'api';
          tags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          ai_engagement: Json;
        };
      };
    };
  };
};

// Application types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  subscriptionTier: 'free' | 'starter' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string | null;
  assignedAgentId: string | null;
  title: string;
  status: ConversationStatus;
  priority: PriorityLevel;
  source: MessageSource;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  aiEngagement: AIEngagementData;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: 'user' | 'agent' | 'ai' | 'system';
  content: string;
  contentType: 'text' | 'image' | 'file' | 'voice';
  attachments: Attachment[];
  reactions: Reaction[];
  metadata: Record<string, any>;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  deliveryStatus: DeliveryStatus;
}
```

## 🚀 TYPESCRIPT TYPE GENERATION

### TypeScript Types Generator
```typescript
// supabase-mcp-server generated types
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// Type-safe database client
export const createDatabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Type utilities
export type ConversationWithRelations = Tables<'conversations'> & {
  customer: Tables<'users'> | null;
  assignedAgent: Tables<'users'> | null;
  messages: Tables<'messages'>[];
  organization: Tables<'organizations'>;
};

export type MessageWithRelations = Tables<'messages'> & {
  sender: Tables<'users'> | null;
  conversation: Tables<'conversations'>;
};
```

## 🔄 TRPC API ARCHITECTURE

### Router Structure
```typescript
// trpc/router/index.ts - Main router configuration
import { createTRPCRouter } from '../trpc';
import { conversationRouter } from './conversations';
import { messageRouter } from './messages';
import { userRouter } from './user';
import { organizationRouter } from './organization';
import { analyticsRouter } from './analytics';
import { aiRouter } from './ai';

export const appRouter = createTRPCRouter({
  conversations: conversationRouter,
  messages: messageRouter,
  users: userRouter,
  organizations: organizationRouter,
  analytics: analyticsRouter,
  ai: aiRouter
});

export type AppRouter = typeof appRouter;
```

### Conversation Router
```typescript
// trpc/router/conversations.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const conversationRouter = createTRPCRouter({
  // List conversations with filters
  list: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      status: z.enum(['open', 'closed', 'pending', 'snoozed']).optional(),
      assignedTo: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('conversations')
        .select(`
          *,
          customer:user_id(*),
          assignedAgent:assigned_agent_id(*),
          messages(count)
        `)
        .eq('organization_id', input.organizationId)
        .order('updated_at', { ascending: false })
        .limit(input.limit + 1);

      if (error) throw error;

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextItem = data.pop();
        nextCursor = nextItem!.id;
      }

      return {
        conversations: data,
        nextCursor
      };
    }),

  // Get single conversation with details
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('conversations')
        .select(`
          *,
          customer:user_id(*),
          assignedAgent:assigned_agent_id(*),
          messages(*, sender:sender_id(*)),
          organization:organization_id(*)
        `)
        .eq('id', input.id)
        .single();

      if (error) throw error;
      return data;
    }),

  // Create new conversation
  create: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      customerId: z.string().uuid().optional(),
      title: z.string().min(1).max(255),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      source: z.enum(['widget', 'email', 'slack', 'api']).default('widget'),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('conversations')
        .insert({
          organization_id: input.organizationId,
          customer_id: input.customerId,
          title: input.title,
          priority: input.priority,
          source: input.source,
          tags: input.tags || [],
          metadata: input.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // Update conversation
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      status: z.enum(['open', 'closed', 'pending', 'snoozed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      assignedAgentId: z.string().uuid().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      
      const { data, error } = await ctx.supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    })
});
```

### Message Router
```typescript
// trpc/router/messages.ts
export const messageRouter = createTRPCRouter({
  // Send message
  send: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      content: z.string().min(1).max(5000),
      contentType: z.enum(['text', 'image', 'file', 'voice']).default('text'),
      attachments: z.array(z.any()).optional(),
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('messages')
        .insert({
          conversation_id: input.conversationId,
          sender_id: ctx.session.user.id,
          sender_type: 'agent',
          content: input.content,
          content_type: input.contentType,
          attachments: input.attachments || [],
          metadata: input.metadata || {}
        })
        .select(`
          *,
          sender:sender_id(*),
          conversation:conversation_id(*)
        `)
        .single();

      if (error) throw error;

      // Trigger real-time notification
      await ctx.realtime.publish('new_message', data);
      
      return data;
    }),

  // Get messages for conversation
  list: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: false })
        .limit(input.limit + 1);

      if (error) throw error;

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (data.length > input.limit) {
        const nextItem = data.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages: data.reverse(),
        nextCursor
      };
    })
});
```

## 🔍 REAL-TIME SUBSCRIPTIONS

### Supabase Realtime Configuration
```typescript
// Real-time subscription manager
export class RealtimeSubscriptionManager {
  private supabase: SupabaseClient;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  subscribeToConversations(
    organizationId: string,
    callbacks: {
      onNewConversation: (conversation: Conversation) => void;
      onConversationUpdate: (conversation: Conversation) => void;
      onConversationDelete: (conversationId: string) => void;
    }
  ) {
    const channel = this.supabase
      .channel(`conversations:${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations', filter: `organization_id=eq.${organizationId}` },
        (payload) => callbacks.onNewConversation(payload.new as Conversation)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `organization_id=eq.${organizationId}` },
        (payload) => callbacks.onConversationUpdate(payload.new as Conversation)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'conversations', filter: `organization_id=eq.${organizationId}` },
        (payload) => callbacks.onConversationDelete(payload.old.id)
      )
      .subscribe();

    this.subscriptions.set(`conversations:${organizationId}`, channel);
    return () => this.unsubscribe(`conversations:${organizationId}`);
  }

  private unsubscribe(key: string) {
    const channel = this.subscriptions.get(key);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(key);
    }
  }
}
```

## 🛡️ SECURITY & ACCESS CONTROL

### Row Level Security (RLS)
```sql
-- Organization isolation policies
CREATE POLICY "Users can only see their organization data" ON conversations
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can only update their assigned conversations" ON conversations
  FOR UPDATE USING (
    assigned_agent_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Message visibility policies
CREATE POLICY "Users can see messages from their organization" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );
```

### API Rate Limiting
```typescript
// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to specific endpoints
export const protectedProcedure = t.procedure.use(rateLimiter);
```
