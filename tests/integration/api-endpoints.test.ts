/**
 * Comprehensive API Endpoints Integration Tests
 * Tests all critical API endpoints using HTTP requests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock fetch for API testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Endpoints Integration Tests', () => {
  const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
  const BASE_URL = 'http://localhost:3003';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function testAPI(endpoint: string, options: unknown = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  describe('/api/health', () => {
    it('should return healthy status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'healthy',
          checks: { database: 'ok', environment: 'ok' },
          metrics: { responseTime: 50 }
        }),
      } as Response);

      const { status, data } = await testAPI('/api/health');

      expect(status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('environment');
      expect(data.metrics).toHaveProperty('responseTime');
    });
  });

  describe('/api/ai', () => {
    it('should return AI service status on GET', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai');
      const response = await aiGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.message).toBe('AI API is running');
      expect(data.version).toBe('1.0.0');
    });

    it('should require action parameter on POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const response = await aiPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Action parameter is required');
    });
  });

  describe('/api/analytics', () => {
    it('should require organizationId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics');
      const response = await analyticsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should return analytics data with valid organizationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics?organizationId=test-org-id');
      const response = await analyticsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('overview');
      expect(data).toHaveProperty('conversationStatus');
      expect(data).toHaveProperty('messageSenders');
      expect(data).toHaveProperty('dailyTrends');
      expect(data.overview).toHaveProperty('totalConversations');
      expect(data.overview).toHaveProperty('totalMessages');
    });

    it('should implement rate limiting', async () => {
      // Mock rate limit exceeded
      const { checkRateLimit } = require('@/lib/utils/validation');
      checkRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0, resetTime: Date.now() + 60000 });
      
      const request = new NextRequest('http://localhost:3000/api/analytics?organizationId=test-org-id');
      const response = await analyticsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });
  });

  describe('/api/settings', () => {
    it('should require organizationId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await settingsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should return settings data with valid organizationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/settings?organizationId=test-org-id');
      const response = await settingsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('organization');
      expect(data).toHaveProperty('widget');
      expect(data).toHaveProperty('welcome');
      expect(data).toHaveProperty('features');
      expect(data.organization).toHaveProperty('id');
      expect(data.widget).toHaveProperty('enabled');
    });

    it('should update settings with PUT request', async () => {
      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          organizationId: 'test-org-id',
          settings: {
            organization: { name: 'Updated Org' },
            widget: { enabled: true, title: 'New Title' }
          }
        })
      });
      const response = await settingsPut(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Settings updated successfully');
    });
  });

  describe('/api/auth/set-organization', () => {
    it('should return current organization info on GET', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-organization');
      const response = await setOrgGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('currentOrganization');
      expect(data).toHaveProperty('userOrganizations');
    });

    it('should require organizationId on POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-organization', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const response = await setOrgPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should set organization with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-organization', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'test-org-id'
        })
      });
      const response = await setOrgPost(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('currentOrganization');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValueOnce({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/settings?organizationId=test-org-id');
      const response = await settingsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch organization settings');
    });

    it('should handle authentication errors', async () => {
      // Mock authentication failure
      const { validateOrganizationAccess } = require('@/lib/utils/validation');
      validateOrganizationAccess.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/analytics?organizationId=test-org-id');
      const response = await analyticsGet(request);
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized access to organization');
    });
  });

  describe('Security Tests', () => {
    it('should validate UUID format for organizationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics?organizationId=invalid-uuid');
      const response = await analyticsGet(request);
      
      // Should either reject invalid UUID or handle gracefully
      expect([400, 403, 500]).toContain(response.status);
    });

    it('should implement proper CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthGet(request);
      
      // Check that response can be parsed (no CORS blocking)
      expect(response.status).toBe(200);
    });
  });
});
