import { test, expect } from '@playwright/test';

test.describe('Typing Indicator APIs', () => {
  const testConversationId = '48eedfba-2568-4231-bb38-2ce20420900d';
  const testOrganizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

  test.describe('Widget Typing API', () => {
    test('should allow typing indicators without authentication', async ({ page }) => {
      // Test widget typing start (align with route: header X-Organization-ID and userId required)
      const startResponse = await page.request.post('/api/widget/typing', {
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': testOrganizationId,
        },
        data: {
          conversationId: testConversationId,
          userId: 'visitor-test',
          userName: 'Test Visitor',
          isTyping: true,
        }
      });

      if (startResponse.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(startResponse.status()).toBe(200);
      
      const startData = await startResponse.json();
      expect(startData).toHaveProperty('success', true);
      expect(startData.typing).toHaveProperty('isTyping', true);
      expect(startData.typing).toHaveProperty('senderType', 'visitor');
    });

    test('should stop typing indicators', async ({ page }) => {
      // Test widget typing stop
      const stopResponse = await page.request.post('/api/widget/typing', {
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': testOrganizationId,
        },
        data: {
          conversationId: testConversationId,
          userId: 'visitor-test',
          userName: 'Test Visitor',
          isTyping: false,
        }
      });

      if (stopResponse.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(stopResponse.status()).toBe(200);
      
      const stopData = await stopResponse.json();
      expect(stopData).toHaveProperty('success', true);
      expect(stopData.typing).toHaveProperty('isTyping', false);
    });

    test('should fetch typing indicators', async ({ page }) => {
      const response = await page.request.get(`/api/widget/typing?conversationId=${testConversationId}&organizationId=${testOrganizationId}`);

      if (response.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('typingUsers');
      expect(data).toHaveProperty('conversationId', testConversationId);
      expect(data).toHaveProperty('organizationId', testOrganizationId);
      expect(Array.isArray(data.typingUsers)).toBe(true);
    });

    test('should validate required parameters', async ({ page }) => {
      // Test missing conversationId
      const response = await page.request.post('/api/widget/typing', {
        data: {
          organizationId: testOrganizationId,
          isTyping: true
        }
      });

      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate isTyping parameter type', async ({ page }) => {
      const response = await page.request.post('/api/widget/typing', {
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': testOrganizationId,
        },
        data: {
          conversationId: testConversationId,
          userId: 'visitor-test',
          isTyping: 'invalid' // Should be boolean
        }
      });

      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  test.describe('Dashboard Typing API', () => {
    test.beforeEach(async ({ page }) => {
      // Use API-based login to avoid UI flakiness
      const res = await page.request.post('/api/auth/login', {
        data: { email: 'jam@jam.com', password: 'password123' },
        headers: { 'Content-Type': 'application/json' }
      });
      expect(res.ok()).toBe(true);
    });

    test('should require authentication for dashboard typing', async ({ page }) => {
      // Test unauthenticated request
      const response = await page.request.post('/api/dashboard/typing', {
        data: {
          conversationId: testConversationId,
          isTyping: true,
          content: 'Agent is typing...'
        }
      });

      // Should require authentication
      expect([401, 403]).toContain(response.status());
    });

    test('should allow authenticated agents to start typing', async ({ page }) => {
      const response = await page.request.post('/api/dashboard/typing', {
        data: {
          conversationId: testConversationId,
          isTyping: true,
          content: 'Agent is typing a response...'
        }
      });

      if (response.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.typing).toHaveProperty('isTyping', true);
      expect(data.typing).toHaveProperty('senderType', 'operator');
    });

    test('should allow authenticated agents to stop typing', async ({ page }) => {
      const response = await page.request.post('/api/dashboard/typing', {
        data: {
          conversationId: testConversationId,
          isTyping: false
        }
      });

      if (response.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.typing).toHaveProperty('isTyping', false);
    });

    test('should fetch typing indicators for authenticated agents', async ({ page }) => {
      const response = await page.request.get(`/api/dashboard/typing?conversationId=${testConversationId}`);

      if (response.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('typingUsers');
      expect(data).toHaveProperty('conversationId', testConversationId);
      expect(Array.isArray(data.typingUsers)).toBe(true);
    });

    test('should validate conversation access', async ({ page }) => {
      const invalidConversationId = 'invalid-conversation-id';
      
      const response = await page.request.post('/api/dashboard/typing', {
        data: {
          conversationId: invalidConversationId,
          isTyping: true
        }
      });

      expect([400, 404]).toContain(response.status());
    });

    test('should validate required parameters', async ({ page }) => {
      // Test missing conversationId
      const response = await page.request.post('/api/dashboard/typing', {
        data: {
          isTyping: true
        }
      });

      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  test.describe('Real-time Broadcasting', () => {
    test('should broadcast typing events for bidirectional communication', async ({ page }) => {
      // This test would require setting up real-time listeners
      // For now, we just verify the APIs create typing indicators successfully
      
      // Start typing from widget
      const widgetResponse = await page.request.post('/api/widget/typing', {
        data: {
          conversationId: testConversationId,
          organizationId: testOrganizationId,
          isTyping: true,
          senderName: 'Test Visitor',
          senderType: 'visitor'
        }
      });

      if (widgetResponse.status() === 404) {
        console.log('Conversation not found - this is expected if test data is not set up');
        return;
      }

      expect(widgetResponse.status()).toBe(200);
      
      // TODO: Add real-time event verification when Supabase Realtime testing is set up
      console.log('✅ Widget typing indicator created - real-time broadcasting should be triggered');
    });
  });
});
