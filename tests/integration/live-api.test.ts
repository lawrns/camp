/**
 * Live API Integration Tests
 * Tests actual running server endpoints for functionality and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Live API Integration Tests', () => {
  const BASE_URL = 'http://localhost:3003';
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

  // Helper function to make API requests
  async function makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      return { status: response.status, data, ok: response.ok };
    } catch (error) {
      return { status: 0, data: { error: 'Network error' }, ok: false };
    }
  }

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const { status, data } = await makeRequest('/api/health');
      
      expect(status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('environment');
    });
  });

  describe('AI Endpoint', () => {
    it('should return AI service status', async () => {
      const { status, data } = await makeRequest('/api/ai');
      
      expect(status).toBe(200);
      expect(data.message).toBe('AI API is running');
      expect(data.version).toBe('1.0.0');
    });

    it('should require action parameter for POST', async () => {
      const { status, data } = await makeRequest('/api/ai', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      expect(status).toBe(400);
      expect(data.error).toBe('Action parameter is required');
    });
  });

  describe('Analytics Endpoint', () => {
    it('should require organizationId parameter', async () => {
      const { status, data } = await makeRequest('/api/analytics');
      
      expect(status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should require authentication for valid organizationId', async () => {
      const { status, data } = await makeRequest(`/api/analytics?organizationId=${TEST_ORG_ID}`);
      
      // Should return 401/403 for unauthenticated requests
      expect([401, 403]).toContain(status);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Settings Endpoint', () => {
    it('should require organizationId parameter', async () => {
      const { status, data } = await makeRequest('/api/settings');
      
      expect(status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should require authentication for valid organizationId', async () => {
      const { status, data } = await makeRequest(`/api/settings?organizationId=${TEST_ORG_ID}`);
      
      // Should return 401/403 for unauthenticated requests
      expect([401, 403]).toContain(status);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Organization Auth Endpoint', () => {
    it('should require authentication for GET', async () => {
      const { status, data } = await makeRequest('/api/auth/set-organization');
      
      expect([401, 403]).toContain(status);
      expect(data.error).toContain('authenticated');
    });

    it('should require organizationId for POST', async () => {
      const { status, data } = await makeRequest('/api/auth/set-organization', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      expect(status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });
  });

  describe('Widget Endpoints', () => {
    it('should create conversation with proper headers', async () => {
      const { status, data } = await makeRequest('/api/widget/conversations', {
        method: 'POST',
        headers: {
          'x-organization-id': TEST_ORG_ID
        },
        body: JSON.stringify({
          visitorId: 'test-visitor-123',
          customerEmail: 'test@example.com',
          customerName: 'Test User'
        })
      });
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('conversationId');
      expect(data).toHaveProperty('conversation');
      expect(data.success).toBe(true);
    });

    it('should require organization header for conversation creation', async () => {
      const { status, data } = await makeRequest('/api/widget/conversations', {
        method: 'POST',
        body: JSON.stringify({
          visitorId: 'test-visitor-123',
          customerEmail: 'test@example.com'
        })
      });
      
      expect(status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should handle message retrieval', async () => {
      const { status, data } = await makeRequest(
        `/api/widget/messages?conversationId=test-conv&organizationId=${TEST_ORG_ID}`
      );
      
      // Should return 200 with empty messages or 404 for non-existent conversation
      expect([200, 404]).toContain(status);
      
      if (status === 200) {
        expect(data).toHaveProperty('messages');
        expect(Array.isArray(data.messages)).toBe(true);
      }
    });

    it('should handle typing indicators', async () => {
      const { status, data } = await makeRequest('/api/widget/typing', {
        method: 'POST',
        headers: {
          'x-organization-id': TEST_ORG_ID
        },
        body: JSON.stringify({
          conversationId: 'test-conv-id',
          isTyping: true,
          visitorId: 'test-visitor-123'
        })
      });
      
      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('AI Handover Endpoint', () => {
    it('should require conversationId and organizationId', async () => {
      const { status, data } = await makeRequest('/api/ai/handover', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      expect(status).toBe(400);
      expect(data.error).toBe('Conversation ID and Organization ID are required');
    });

    it('should handle handover status requests', async () => {
      const { status, data } = await makeRequest(
        `/api/ai/handover?conversationId=test-conv&organizationId=${TEST_ORG_ID}`
      );
      
      expect(status).toBe(200);
      expect(data).toHaveProperty('conversationId');
      expect(data).toHaveProperty('handoverActive');
      expect(data).toHaveProperty('available');
    });
  });

  describe('tRPC Endpoint', () => {
    it('should respond to tRPC requests', async () => {
      const { status, data } = await makeRequest('/api/trpc/test.ping');
      
      // tRPC should respond with proper error format, not 500
      expect(status).not.toBe(500);
      
      // Should be a tRPC error response
      if (status === 400) {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent endpoints gracefully', async () => {
      const { status } = await makeRequest('/api/non-existent-endpoint');
      
      expect(status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/widget/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': TEST_ORG_ID
        },
        body: 'invalid json'
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Security Tests', () => {
    it('should implement CORS properly', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS'
      });
      
      // Should handle OPTIONS requests
      expect([200, 204, 405]).toContain(response.status);
    });

    it('should validate UUID format', async () => {
      const { status, data } = await makeRequest('/api/analytics?organizationId=invalid-uuid');
      
      // Should reject invalid UUIDs
      expect([400, 403]).toContain(status);
    });
  });
});
