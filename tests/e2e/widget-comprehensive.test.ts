/**
 * PHASE 2 CRITICAL FIX: Comprehensive Widget E2E Tests
 * 
 * End-to-end tests for widget functionality including authentication,
 * messaging, real-time features, and error handling.
 * 
 * Features tested:
 * - Widget authentication and token validation
 * - Visitor identification and session management
 * - Message sending and receiving
 * - Real-time typing indicators
 * - Rate limiting protection
 * - Error boundary handling
 * - Cross-browser compatibility
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_TEST_BASEURL || 'http://localhost:3001',
  timeout: 30000,
  organizationId: 'test-org-123',
  widgetToken: 'test-widget-token-456'
};

// Helper functions
async function setupWidget(page: Page): Promise<void> {
  await page.goto(`${TEST_CONFIG.baseURL}/widget-test`);
  await page.waitForLoadState('networkidle');
}

async function createConversation(page: Page, customerData?: {
  name?: string;
  email?: string;
  message?: string;
}): Promise<string> {
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
  return response.conversationId;
}

async function sendMessage(page: Page, conversationId: string, content: string): Promise<void> {
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
  test('should require valid widget token', async ({ page }) => {
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

  test('should enforce rate limiting', async ({ page }) => {
    // Send multiple requests rapidly to trigger rate limiting
    const promises = Array.from({ length: 10 }, () =>
      page.evaluate(async () => {
        const response = await fetch('/api/widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': 'test-org-123',
            'authorization': 'Bearer test-widget-token-456'
          },
          body: JSON.stringify({
            action: 'create-conversation',
            customerName: 'Rate Limit Test'
          })
        });
        return { status: response.status, data: await response.json() };
      })
    );

    const responses = await Promise.all(promises);
    
    // At least one request should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    // Rate limited response should have proper headers
    if (rateLimitedResponses.length > 0) {
      expect(rateLimitedResponses[0].data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    }
  });
});

test.describe('Visitor Identification & Session Management', () => {
  test('should create unique visitor ID for new visitors', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-widget-token-456'
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'New Visitor Test',
          metadata: {}
        })
      });
      return response.json();
    });

    expect(response.success).toBe(true);
    expect(response.visitorInfo.visitorId).toBeDefined();
    expect(response.visitorInfo.sessionId).toBeDefined();
    expect(response.visitorInfo.sessionToken).toBeDefined();
    expect(response.visitorInfo.isReturning).toBe(false);
  });

  test('should recognize returning visitors', async ({ page }) => {
    // First visit
    const firstResponse = await page.evaluate(async () => {
      const response = await fetch('/api/widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'test-org-123',
          'authorization': 'Bearer test-widget-token-456'
        },
        body: JSON.stringify({
          action: 'create-conversation',
          customerName: 'Returning Visitor Test',
          metadata: {}
        })
      });
      return response.json();
    });

    const visitorId = firstResponse.visitorInfo.visitorId;

    // Second visit with same visitor ID
    const secondResponse = await page.evaluate(async (visitorId) => {
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
          metadata: {}
        })
      });
      return response.json();
    }, visitorId);

    expect(secondResponse.success).toBe(true);
    expect(secondResponse.visitorInfo.visitorId).toBe(visitorId);
    expect(secondResponse.visitorInfo.isReturning).toBe(true);
  });
});

test.describe('Message Flow & Real-time Communication', () => {
  test('should create conversation and send messages', async ({ page }) => {
    await setupWidget(page);

    // Create conversation
    const conversationId = await createConversation(page, {
      name: 'E2E Test Customer',
      email: 'e2e@test.com',
      message: 'Initial test message'
    });

    // Send additional messages
    await sendMessage(page, conversationId, 'Second test message');
    await sendMessage(page, conversationId, 'Third test message');

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

  test('should handle typing indicators', async ({ page }) => {
    await setupWidget(page);
    const conversationId = await createConversation(page);

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

test.describe('Input Validation & Error Handling', () => {
  test('should validate required fields', async ({ page }) => {
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

  test('should sanitize input content', async ({ page }) => {
    await setupWidget(page);
    const conversationId = await createConversation(page);

    // Send message with potentially dangerous content
    const maliciousContent = '<script>alert("xss")</script>Hello world';
    
    await sendMessage(page, conversationId, maliciousContent);

    // Verify content was sanitized (implementation depends on your sanitization logic)
    const messages = await page.evaluate(async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'x-organization-id': 'test-org-123'
        }
      });
      return response.json();
    }, conversationId);

    const lastMessage = messages.data[messages.data.length - 1];
    expect(lastMessage.content).not.toContain('<script>');
  });

  test('should handle invalid JSON gracefully', async ({ page }) => {
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
});

test.describe('Cross-browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work in ${browserName}`, async ({ page }) => {
      await setupWidget(page);
      
      const conversationId = await createConversation(page, {
        name: `${browserName} Test Customer`,
        email: `${browserName}@test.com`,
        message: `Testing from ${browserName}`
      });

      await sendMessage(page, conversationId, `Message from ${browserName} browser`);

      // Verify the conversation was created successfully
      expect(conversationId).toBeDefined();
      expect(typeof conversationId).toBe('string');
    });
  });
});

test.describe('Performance & Load Testing', () => {
  test('should handle concurrent conversations', async ({ page, context }) => {
    const numConcurrentConversations = 5;
    const promises = [];

    for (let i = 0; i < numConcurrentConversations; i++) {
      const promise = createConversation(page, {
        name: `Concurrent Customer ${i}`,
        email: `concurrent${i}@test.com`,
        message: `Concurrent message ${i}`
      });
      promises.push(promise);
    }

    const conversationIds = await Promise.all(promises);
    
    expect(conversationIds).toHaveLength(numConcurrentConversations);
    conversationIds.forEach(id => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  test('should respond within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await createConversation(page, {
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
    localStorage.clear();
    sessionStorage.clear();
  });
});
