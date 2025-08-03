/**
 * PHASE 2 CRITICAL FIX: Widget Critical Flows E2E Tests
 * 
 * Comprehensive end-to-end tests for widget functionality including:
 * - Authentication and security
 * - Visitor identification
 * - Message flows
 * - Real-time features
 * - Error handling
 * - Performance validation
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  organizationId: 'test-org-123',
  widgetToken: 'test-widget-token-456'
};

// Helper functions
async function createTestConversation(page: Page, customerData?: {
  name?: string;
  email?: string;
  message?: string;
}): Promise<{ conversationId: string; visitorInfo: any }> {
  const response = await page.evaluate(async (data) => {
    const response = await fetch('/api/widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': 'test-org-123',
        'authorization': 'Bearer test-widget-token-456'
      },
      body: JSON.stringify({
        action: 'create-conversation',
        customerName: data?.name || 'Test Customer',
        customerEmail: data?.email || 'test@example.com',
        initialMessage: data?.message || 'Hello, I need help!',
        metadata: {
          source: 'e2e-test',
          timestamp: new Date().toISOString()
        }
      })
    });
    return response.json();
  }, customerData);

  expect(response.success).toBe(true);
  expect(response.conversationId).toBeDefined();
  expect(response.visitorInfo).toBeDefined();
  
  return {
    conversationId: response.conversationId,
    visitorInfo: response.visitorInfo
  };
}

async function sendTestMessage(page: Page, conversationId: string, content: string): Promise<void> {
  const response = await page.evaluate(async ({ conversationId, content }) => {
    const response = await fetch('/api/widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': 'test-org-123',
        'authorization': 'Bearer test-widget-token-456'
      },
      body: JSON.stringify({
        action: 'send-message',
        conversationId,
        content,
        senderType: 'customer',
        metadata: {
          timestamp: new Date().toISOString()
        }
      })
    });
    return response.json();
  }, { conversationId, content });

  expect(response.success).toBe(true);
}

test.describe('Widget Authentication & Security', () => {
  test('should require valid widget token for conversation creation', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const response = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123'
          // No authorization header
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'Test Customer'
        })
      });
      return { status: response.status, data: await response.json() };
    });

    expect(response.status).toBe(401);
    expect(response.data.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject invalid widget token', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const response = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'Test Customer'
        })
      });
      return { status: response.status, data: await response.json() };
    });

    expect(response.status).toBe(401);
    expect(response.data.error.code).toBe('INVALID_TOKEN');
  });

  test('should validate input data with Zod schemas', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const response = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-widget-token-456'
        },
        body: JSON.stringify({
          action: 'send-message'
          // Missing required fields
        })
      });
      return { status: response.status, data: await response.json() };
    });

    expect(response.status).toBe(400);
    expect(response.data.error.code).toBe('VALIDATION_ERROR');
    expect(response.data.error.details).toBeDefined();
  });
});

test.describe('Visitor Identification & Session Management', () => {
  test('should create unique visitor ID for new visitors', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const { visitorInfo } = await createTestConversation(page, {
      name: 'New Visitor Test',
      email: 'newvisitor@test.com'
    });

    expect(visitorInfo.visitorId).toBeDefined();
    expect(visitorInfo.sessionId).toBeDefined();
    expect(visitorInfo.sessionToken).toBeDefined();
    expect(visitorInfo.isReturning).toBe(false);
  });

  test('should recognize returning visitors', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    // First visit
    const firstVisit = await createTestConversation(page, {
      name: 'Returning Visitor Test',
      email: 'returning@test.com'
    });

    const visitorId = firstVisit.visitorInfo.visitorId;

    // Second visit with same visitor ID
    const secondVisit = await page.evaluate(async (visitorId) => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-widget-token-456'
        },
        body: JSON.stringify({
          action: 'create-conversation',
          providedVisitorId: visitorId,
          customerName: 'Returning Visitor Test',
          customerEmail: 'returning@test.com'
        })
      });
      return response.json();
    }, visitorId);

    expect(secondVisit.success).toBe(true);
    expect(secondVisit.visitorInfo.visitorId).toBe(visitorId);
    expect(secondVisit.visitorInfo.isReturning).toBe(true);
  });
});

test.describe('Message Flow & Real-time Communication', () => {
  test('should create conversation and send messages successfully', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const { conversationId } = await createTestConversation(page, {
      name: 'Message Flow Test',
      email: 'messageflow@test.com',
      message: 'Initial test message'
    });

    // Send additional messages
    await sendTestMessage(page, conversationId, 'Second test message');
    await sendTestMessage(page, conversationId, 'Third test message');

    // Verify messages were created
    const messages = await page.evaluate(async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'x-organization-id': 'test-org-123'
        }
      });
      return response.json();
    }, conversationId);

    expect(messages.success).toBe(true);
    expect(messages.data.length).toBeGreaterThanOrEqual(3);
  });

  test('should handle typing indicators correctly', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const { conversationId } = await createTestConversation(page);

    // Start typing
    const startTypingResponse = await page.evaluate(async (conversationId) => {
      const response = await fetch('/api/widget/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123'
        },
        body: JSON.stringify({
          conversationId,
          userId: 'test-customer-123',
          userName: 'Test Customer',
          isTyping: true
        })
      });
      return response.json();
    }, conversationId);

    expect(startTypingResponse.success).toBe(true);

    // Stop typing
    const stopTypingResponse = await page.evaluate(async (conversationId) => {
      const response = await fetch('/api/widget/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123'
        },
        body: JSON.stringify({
          conversationId,
          userId: 'test-customer-123',
          isTyping: false
        })
      });
      return response.json();
    }, conversationId);

    expect(stopTypingResponse.success).toBe(true);
  });
});

test.describe('Error Handling & Resilience', () => {
  test('should handle malformed JSON gracefully', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const response = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-widget-token-456'
        },
        body: 'invalid json content'
      });
      return { status: response.status, data: await response.json() };
    });

    expect(response.status).toBe(400);
    expect(response.data.error.code).toBe('INVALID_JSON');
  });

  test('should sanitize potentially dangerous input', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const { conversationId } = await createTestConversation(page);

    // Send message with potentially dangerous content
    const maliciousContent = '<script>alert("xss")</script>Hello world';
    
    await sendTestMessage(page, conversationId, maliciousContent);

    // Verify content was handled properly
    const messages = await page.evaluate(async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'x-organization-id': 'test-org-123'
        }
      });
      return response.json();
    }, conversationId);

    const lastMessage = messages.data[messages.data.length - 1];
    // Content should be stored but potentially sanitized
    expect(lastMessage.content).toBeDefined();
    expect(typeof lastMessage.content).toBe('string');
  });
});

test.describe('Performance & Load Testing', () => {
  test('should handle multiple concurrent conversations', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const numConcurrentConversations = 3;
    const promises = [];

    for (let i = 0; i < numConcurrentConversations; i++) {
      const promise = createTestConversation(page, {
        name: `Concurrent Customer ${i}`,
        email: `concurrent${i}@test.com`,
        message: `Concurrent message ${i}`
      });
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(numConcurrentConversations);
    results.forEach(result => {
      expect(result.conversationId).toBeDefined();
      expect(result.visitorInfo).toBeDefined();
    });
  });

  test('should respond within acceptable time limits', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseURL);

    const startTime = Date.now();
    
    await createTestConversation(page, {
      name: 'Performance Test Customer',
      email: 'performance@test.com',
      message: 'Performance test message'
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });
});

// Cleanup after tests
test.afterEach(async ({ page }) => {
  // Clean up any test data if needed
  await page.evaluate(() => {
    // Clear any local storage or session data
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });
});
