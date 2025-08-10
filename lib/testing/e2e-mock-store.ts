/*
 * E2E In-Memory Mock Store
 * Provides minimal data persistence for conversations, messages, typing, and presence
 * when running E2E tests without a real database.
 */

import { randomUUID } from 'crypto';

export type MockConversation = {
  id: string;
  organization_id: string;
  customer_email: string;
  customer_name: string | null;
  subject: string | null;
  status: 'open' | 'resolved' | 'pending' | string;
  priority: 'low' | 'medium' | 'high' | string;
  channel?: string | null;
  assigned_to_user_id?: string | null;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
  unread_count?: number | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

export type MockMessage = {
  id: string;
  conversation_id: string;
  organization_id: string;
  content: string;
  sender_type: 'visitor' | 'agent' | 'ai' | string;
  sender_id?: string | null;
  sender_email?: string | null;
  sender_name?: string | null;
  message_type?: string | null;
  content_type?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

export type MockTypingState = {
  conversation_id: string;
  organization_id: string;
  agentTyping: boolean;
  visitorTyping: boolean;
  updated_at: string;
};

// In-memory stores keyed by organization
const orgIdToConversations = new Map<string, MockConversation[]>();
const orgIdToMessages = new Map<string, MockMessage[]>();
const convIdToTyping = new Map<string, MockTypingState>();

export function isE2EMock(): boolean {
  return process.env.E2E_MOCK === 'true' || process.env.NODE_ENV === 'test';
}

export function getTestOrgId(): string {
  return process.env.E2E_ORG_ID || 'b5e80170-004c-4e82-a88c-3e2166b169dd';
}

export function ensureOrg(organizationId: string): void {
  if (!orgIdToConversations.has(organizationId)) {
    orgIdToConversations.set(organizationId, []);
    // Add multiple test conversations for E2E tests to ensure list rendering
    if (isE2EMock()) {
      const now = new Date().toISOString();
      const baseConversation = createInitialTestConversation(organizationId);

      // Create additional test conversations for comprehensive testing
      const conversation2 = {
        ...baseConversation,
        id: 'conv-2-' + Date.now(),
        customer_email: 'customer2@example.com',
        customer_name: 'Customer Two',
        subject: 'Second Test Conversation',
        priority: 'high' as const,
        unread_count: 0,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        last_message_at: new Date(Date.now() - 1800000).toISOString(),
        tags: ['e2e-test', 'priority']
      };

      const conversation3 = {
        ...baseConversation,
        id: 'conv-3-' + Date.now(),
        customer_email: 'customer3@example.com',
        customer_name: 'Customer Three',
        subject: 'Third Test Conversation',
        status: 'resolved' as const,
        priority: 'low' as const,
        channel: 'email',
        unread_count: 0,
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        last_message_at: new Date(Date.now() - 3600000).toISOString(),
        tags: ['e2e-test', 'resolved']
      };

      orgIdToConversations.get(organizationId)!.push(baseConversation, conversation2, conversation3);
    }
  }
  if (!orgIdToMessages.has(organizationId)) orgIdToMessages.set(organizationId, []);
}

function createInitialTestConversation(organizationId: string): MockConversation {
  const now = new Date().toISOString();
  return {
    id: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b', // Fixed ID for E2E tests
    organization_id: organizationId,
    customer_email: 'test-customer@example.com',
    customer_name: 'Test Customer',
    subject: 'E2E Test Conversation',
    status: 'open',
    priority: 'medium',
    channel: 'widget',
    created_at: now,
    updated_at: now,
    last_message_at: now,
    unread_count: 0,
    tags: ['e2e-test'],
    metadata: { source: 'e2e-test' },
  };
}

export function listConversations(organizationId: string): MockConversation[] {
  ensureOrg(organizationId);
  return [...(orgIdToConversations.get(organizationId) || [])]
    .sort((a, b) => (b.last_message_at ? Date.parse(b.last_message_at) : 0) - (a.last_message_at ? Date.parse(a.last_message_at) : 0));
}

export function createConversation(params: {
  organizationId: string;
  customerEmail: string;
  customerName?: string | null;
  subject?: string | null;
  status?: MockConversation['status'];
  priority?: MockConversation['priority'];
  metadata?: Record<string, unknown> | null;
}): MockConversation {
  const now = new Date().toISOString();
  const conversation: MockConversation = {
    id: randomUUID(),
    organization_id: params.organizationId,
    customer_email: params.customerEmail,
    customer_name: params.customerName || null,
    subject: params.subject || null,
    status: params.status || 'open',
    priority: params.priority || 'medium',
    created_at: now,
    updated_at: now,
    last_message_at: null,
    unread_count: 0,
    tags: [],
    metadata: params.metadata || null,
  };
  ensureOrg(params.organizationId);
  orgIdToConversations.get(params.organizationId)!.unshift(conversation);
  return conversation;
}

export function addMessage(params: {
  conversationId: string;
  organizationId: string;
  content: string;
  senderType: MockMessage['sender_type'];
  senderId?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  messageType?: string | null;
  contentType?: string | null;
  metadata?: Record<string, unknown> | null;
}): MockMessage {
  const now = new Date().toISOString();
  const message: MockMessage = {
    id: randomUUID(),
    conversation_id: params.conversationId,
    organization_id: params.organizationId,
    content: params.content,
    sender_type: params.senderType,
    sender_id: params.senderId || null,
    sender_email: params.senderEmail || null,
    sender_name: params.senderName || null,
    message_type: params.messageType || 'text',
    content_type: params.contentType || 'text',
    metadata: params.metadata || null,
    created_at: now,
    updated_at: now,
  };
  ensureOrg(params.organizationId);
  orgIdToMessages.get(params.organizationId)!.push(message);

  // Update the conversation's last message timestamp
  const conversations = orgIdToConversations.get(params.organizationId)!;
  const conv = conversations.find(c => c.id === params.conversationId);
  if (conv) {
    conv.last_message_at = now;
    conv.updated_at = now;
  }

  return message;
}

export function listMessages(organizationId: string, conversationId: string, options?: { ascending?: boolean; limit?: number; offset?: number }): MockMessage[] {
  ensureOrg(organizationId);
  let messages = (orgIdToMessages.get(organizationId) || []).filter(m => m.conversation_id === conversationId);
  messages = messages.sort((a, b) => (options?.ascending ? Date.parse(a.created_at) - Date.parse(b.created_at) : Date.parse(b.created_at) - Date.parse(a.created_at)));
  const start = options?.offset || 0;
  const end = options?.limit ? start + options.limit : undefined;
  return messages.slice(start, end);
}

export function setTypingState(conversationId: string, organizationId: string, role: 'agent' | 'visitor', typing: boolean): MockTypingState {
  const now = new Date().toISOString();
  const existing = convIdToTyping.get(conversationId) || {
    conversation_id: conversationId,
    organization_id: organizationId,
    agentTyping: false,
    visitorTyping: false,
    updated_at: now,
  };
  if (role === 'agent') existing.agentTyping = typing; else existing.visitorTyping = typing;
  existing.updated_at = now;
  convIdToTyping.set(conversationId, existing);
  return existing;
}

export function getTypingState(conversationId: string): MockTypingState | null {
  return convIdToTyping.get(conversationId) || null;
}

export function resetMockStore(): void {
  orgIdToConversations.clear();
  orgIdToMessages.clear();
  convIdToTyping.clear();
}

export function createMockSession(email: string) {
  const userId = process.env.E2E_USER_ID || '6f9916c7-3575-4a81-b58e-624ab066bebc';
  const organizationId = getTestOrgId();
  const accessToken = `mock-access-token-${userId}`;
  const refreshToken = `mock-refresh-token-${userId}`;
  return {
    user: {
      id: userId,
      email,
      app_metadata: { organization_id: organizationId, organization_name: 'Test Organization', organization_role: 'admin' },
      user_metadata: { organization_id: organizationId, name: 'Test User' },
    },
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: userId,
        email,
      },
    },
  } as const;
}



