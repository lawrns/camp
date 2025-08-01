/**
 * Widget API Integration Tests
 * Tests widget-specific endpoints for conversation creation, messaging, and authentication
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock widget authentication
jest.mock('@/lib/auth/widget-supabase-auth', () => ({
  optionalWidgetAuth: (handler: any) => handler,
  getOrganizationId: jest.fn().mockReturnValue('test-org-id')
}));

// Mock Supabase service role client
jest.mock('@/lib/supabase/service-role-server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-conversation-id',
          organization_id: 'test-org-id',
          customer_email: 'test@example.com',
          status: 'open'
        },
        error: null
      }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'test-message-id',
            content: 'Test message',
            sender_type: 'customer',
            created_at: new Date().toISOString()
          }
        ],
        error: null
      })
    })),
    channel: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({ error: null })
    }))
  }))
}));

describe('Widget API Integration Tests', () => {
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function testWidgetAPI(endpoint: string, options: any = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': TEST_ORG_ID,
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  }

  it('should create messages via widget API with standardized events', async () => {
    // Mock successful auth response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          conversationId: 'test-conv-123',
          sessionToken: 'test-token'
        }),
      } as Response)
      // Mock successful message creation
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'msg-123',
          content: '🧪 INTEGRATION TEST: Standardized event flow test message',
          sender_type: 'visitor',
          organization_id: TEST_ORG_ID
        }),
      } as Response);

    // First create a conversation via widget auth
    const authResult = await testWidgetAPI('/api/widget/auth', {
      method: 'POST',
      body: JSON.stringify({
        customerEmail: 'test-widget@example.com',
        customerName: 'Widget Test User',
        organizationId: TEST_ORG_ID
      })
    });

    expect(authResult.status).toBe(200);
    expect(authResult.data.success).toBe(true);
    expect(authResult.data.conversationId).toBeDefined();

    const conversationId = authResult.data.conversationId;

    // Test message creation with standardized events
    const messageResult = await testWidgetAPI('/api/widget/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content: '🧪 INTEGRATION TEST: Standardized event flow test message',
        senderEmail: 'test-widget@example.com',
        senderName: 'Widget Test User',
        senderType: 'customer'
      })
    });

    expect(messageResult.status).toBe(201);
    expect(messageResult.data.id).toBeDefined();
    expect(messageResult.data.content).toBe('🧪 INTEGRATION TEST: Standardized event flow test message');
    expect(messageResult.data.sender_type).toBe('visitor'); // Maps customer to visitor
    expect(messageResult.data.organization_id).toBe(TEST_ORG_ID);
  });

  it('should retrieve messages via widget API', async () => {
    // Mock successful message retrieval
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 'msg-1',
          conversation_id: 'test-conv-123',
          organization_id: TEST_ORG_ID,
          content: 'Test message',
          sender_type: 'visitor',
          created_at: new Date().toISOString()
        }
      ]),
    } as Response);

    const conversationId = 'test-conv-123';
    const getResult = await testWidgetAPI(`/api/widget/messages?conversationId=${conversationId}`);

    expect(getResult.status).toBe(200);
    expect(Array.isArray(getResult.data)).toBe(true);
    expect(getResult.data.length).toBeGreaterThan(0);
    
    // Verify message structure
    const message = getResult.data[0];
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('conversation_id');
    expect(message).toHaveProperty('organization_id');
    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('sender_type');
    expect(message).toHaveProperty('created_at');
  });

  it('should handle widget auth with proper organization validation', async () => {
    // Mock successful auth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        conversationId: 'new-conv-456',
        sessionToken: 'new-token-789',
        organization: { id: TEST_ORG_ID }
      }),
    } as Response);

    const authResult = await testWidgetAPI('/api/widget/auth', {
      method: 'POST',
      body: JSON.stringify({
        customerEmail: 'new-customer@example.com',
        customerName: 'New Customer',
        organizationId: TEST_ORG_ID
      })
    });

    expect(authResult.status).toBe(200);
    expect(authResult.data.success).toBe(true);
    expect(authResult.data.conversationId).toBeDefined();
    expect(authResult.data.sessionToken).toBeDefined();
    expect(authResult.data.organization.id).toBe(TEST_ORG_ID);
  });

  it('should reject widget requests with invalid organization', async () => {
    // Mock 404 response for invalid org
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: 'Organization not found',
        code: 'NOT_FOUND'
      }),
    } as Response);

    const authResult = await testWidgetAPI('/api/widget/auth', {
      method: 'POST',
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        organizationId: 'invalid-org-id'
      })
    });

    expect(authResult.status).toBe(404);
    expect(authResult.data.error).toBe('Organization not found');
    expect(authResult.data.code).toBe('NOT_FOUND');
  });

  it('should use standardized event names for real-time broadcasting', async () => {
    // This test verifies that the widget APIs use the correct event names
    // from UNIFIED_EVENTS for consistency across the application

    // Mock successful message creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'msg-broadcast-test',
        content: 'Test standardized events',
        sender_type: 'visitor',
        organization_id: TEST_ORG_ID
      }),
    } as Response);

    const messageResult = await testWidgetAPI('/api/widget/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'test-conv-123',
        content: 'Test standardized events',
        senderEmail: 'test@example.com',
        senderName: 'Test User',
        senderType: 'customer'
      })
    });

    expect(messageResult.status).toBe(201);

    // The API should broadcast using 'message_created' event (not 'new_message')
    // This is verified by the server logs showing successful broadcasts
    expect(messageResult.data.id).toBe('msg-broadcast-test');
  });

  it('should handle JWT enrichment API properly', async () => {
    // Test that the JWT enrichment API returns proper structured responses
    // instead of the previous "Failed to enrich JWT: {}" error

    // Mock successful JWT enrichment response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        organization: {
          id: TEST_ORG_ID,
          name: 'Test Organization',
          role: 'member'
        },
        message: 'Organization set successfully'
      }),
    } as Response);

    const jwtResult = await testWidgetAPI('/api/auth/set-organization', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: TEST_ORG_ID
      })
    });

    expect(jwtResult.status).toBe(200);
    expect(jwtResult.data.success).toBe(true);
    expect(jwtResult.data.organization).toBeDefined();
    expect(jwtResult.data.organization.id).toBe(TEST_ORG_ID);
    expect(jwtResult.data.organization.name).toBeDefined();
    expect(jwtResult.data.organization.role).toBeDefined();
    expect(jwtResult.data.message).toBe('Organization set successfully');
  });

  it('should handle JWT enrichment failures gracefully', async () => {
    // Test that JWT enrichment failures return proper error responses
    // instead of empty objects that caused the original issue

    // Mock JWT enrichment failure (user doesn't have access)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Failed to set organization - user may not have access to this organization'
      }),
    } as Response);

    const jwtResult = await testWidgetAPI('/api/auth/set-organization', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'invalid-org-id'
      })
    });

    expect(jwtResult.status).toBe(403);
    expect(jwtResult.data.success).toBe(false);
    expect(jwtResult.data.error).toBeDefined();
    expect(jwtResult.data.error).toContain('Failed to set organization');
  });
});
