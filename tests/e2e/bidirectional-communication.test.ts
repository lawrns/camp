/**
 * COMPREHENSIVE BIDIRECTIONAL COMMUNICATION TESTS
 * 
 * Tests real-time bidirectional communication between:
 * - Widget ↔ Dashboard
 * - Customer ↔ Agent
 * - Multiple concurrent conversations
 * - Typing indicators, presence, and message delivery
 * 
 * Uses actual Supabase Realtime channels with proper authentication
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  organizationId: 'test-org-bidirectional',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  customerEmail: 'customer@test.com'
};

// Helper to wait for element with retry
async function waitForElementWithRetry(page: Page, selector: string, timeout = 10000) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / maxAttempts });
      return;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

// Helper to create conversation via API
async function createConversation(page: Page, customerData: {
  name: string;
  email: string;
  message: string;
}): Promise<string> {
  const response = await page.evaluate(async (data) => {
    const response = await fetch('/api/widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': 'test-org-bidirectional',
        'authorization': 'Bearer test-widget-token'
      },
      body: JSON.stringify({
        action: 'create-conversation',
        customerName: data.name,
        customerEmail: data.email,
        initialMessage: data.message,
        metadata: { source: 'bidirectional-test' }
      })
    });
    return response.json();
  }, customerData);

  expect(response.success).toBe(true);
  return response.conversationId;
}

// Helper to send message via API
async function sendMessage(page: Page, conversationId: string, content: string, senderType = 'customer') {
  const response = await page.evaluate(async ({ conversationId, content, senderType }) => {
    const response = await fetch('/api/widget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': 'test-org-bidirectional',
        'authorization': 'Bearer test-widget-token'
      },
      body: JSON.stringify({
        action: 'send-message',
        conversationId,
        content,
        senderType,
        metadata: { timestamp: new Date().toISOString() }
      })
    });
    return response.json();
  }, { conversationId, content, senderType });

  expect(response.success).toBe(true);
}

test.describe('Bidirectional Communication Tests', () => {
  let dashboardPage: Page;
  let widgetPage: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    dashboardPage = await context.newPage();
    widgetPage = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should establish bidirectional communication between widget and dashboard', async () => {
    // Step 1: Set up dashboard (agent side)
    await dashboardPage.goto(`${TEST_CONFIG.baseURL}/dashboard`);
    
    // Login as agent
    await dashboardPage.fill('[data-testid="email-input"]', TEST_CONFIG.agentEmail);
    await dashboardPage.fill('[data-testid="password-input"]', TEST_CONFIG.agentPassword);
    await dashboardPage.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await waitForElementWithRetry(dashboardPage, '[data-testid="conversations-list"]');

    // Step 2: Set up widget (customer side)
    await widgetPage.goto(`${TEST_CONFIG.baseURL}`);
    
    // Wait for widget to load
    await waitForElementWithRetry(widgetPage, '[data-testid="widget-container"]');

    // Step 3: Create conversation from widget
    const conversationId = await createConversation(widgetPage, {
      name: 'Bidirectional Test Customer',
      email: 'bidirectional@test.com',
      message: 'Hello, testing bidirectional communication!'
    });

    // Step 4: Verify conversation appears in dashboard
    await dashboardPage.waitForTimeout(2000); // Allow real-time sync
    await waitForElementWithRetry(dashboardPage, `[data-testid="conversation-${conversationId}"]`);
    
    const conversationElement = await dashboardPage.locator(`[data-testid="conversation-${conversationId}"]`);
    await expect(conversationElement).toBeVisible();

    // Step 5: Agent opens conversation
    await conversationElement.click();
    await waitForElementWithRetry(dashboardPage, '[data-testid="message-input"]');

    // Step 6: Agent sends message
    const agentMessage = 'Hello! I received your message. How can I help you?';
    await dashboardPage.fill('[data-testid="message-input"]', agentMessage);
    await dashboardPage.click('[data-testid="send-button"]');

    // Step 7: Verify message appears in widget
    await widgetPage.waitForTimeout(2000); // Allow real-time sync
    await waitForElementWithRetry(widgetPage, `[data-testid="message"]:has-text("${agentMessage}")`);
    
    const widgetMessage = await widgetPage.locator(`[data-testid="message"]:has-text("${agentMessage}")`);
    await expect(widgetMessage).toBeVisible();

    // Step 8: Customer replies from widget
    const customerReply = 'Thank you! I need help with my account settings.';
    await widgetPage.fill('[data-testid="widget-message-input"]', customerReply);
    await widgetPage.click('[data-testid="widget-send-button"]');

    // Step 9: Verify reply appears in dashboard
    await dashboardPage.waitForTimeout(2000); // Allow real-time sync
    await waitForElementWithRetry(dashboardPage, `[data-testid="message"]:has-text("${customerReply}")`);
    
    const dashboardReply = await dashboardPage.locator(`[data-testid="message"]:has-text("${customerReply}")`);
    await expect(dashboardReply).toBeVisible();
  });

  test('should handle typing indicators bidirectionally', async () => {
    // Create a conversation for typing test
    const conversationId = await createConversation(widgetPage, {
      name: 'Typing Test Customer',
      email: 'typing@test.com',
      message: 'Testing typing indicators'
    });

    // Open conversation in dashboard
    await dashboardPage.waitForTimeout(2000);
    await waitForElementWithRetry(dashboardPage, `[data-testid="conversation-${conversationId}"]`);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Test 1: Agent typing indicator in widget
    await dashboardPage.focus('[data-testid="message-input"]');
    await dashboardPage.type('[data-testid="message-input"]', 'Agent is typing...');
    
    // Verify typing indicator appears in widget
    await widgetPage.waitForTimeout(1000);
    await waitForElementWithRetry(widgetPage, '[data-testid="typing-indicator"]');
    
    const widgetTypingIndicator = await widgetPage.locator('[data-testid="typing-indicator"]');
    await expect(widgetTypingIndicator).toBeVisible();

    // Clear input to stop typing
    await dashboardPage.fill('[data-testid="message-input"]', '');
    await widgetPage.waitForTimeout(1000);
    await expect(widgetTypingIndicator).not.toBeVisible();

    // Test 2: Customer typing indicator in dashboard
    await widgetPage.focus('[data-testid="widget-message-input"]');
    await widgetPage.type('[data-testid="widget-message-input"]', 'Customer is typing...');
    
    // Verify typing indicator appears in dashboard
    await dashboardPage.waitForTimeout(1000);
    await waitForElementWithRetry(dashboardPage, '[data-testid="typing-indicator"]');
    
    const dashboardTypingIndicator = await dashboardPage.locator('[data-testid="typing-indicator"]');
    await expect(dashboardTypingIndicator).toBeVisible();

    // Clear input to stop typing
    await widgetPage.fill('[data-testid="widget-message-input"]', '');
    await dashboardPage.waitForTimeout(1000);
    await expect(dashboardTypingIndicator).not.toBeVisible();
  });

  test('should handle multiple concurrent conversations', async () => {
    const conversations = [];
    
    // Create 3 concurrent conversations
    for (let i = 1; i <= 3; i++) {
      const conversationId = await createConversation(widgetPage, {
        name: `Concurrent Customer ${i}`,
        email: `concurrent${i}@test.com`,
        message: `Message from customer ${i}`
      });
      conversations.push(conversationId);
    }

    // Wait for all conversations to appear in dashboard
    await dashboardPage.waitForTimeout(3000);
    
    for (const conversationId of conversations) {
      await waitForElementWithRetry(dashboardPage, `[data-testid="conversation-${conversationId}"]`);
      const element = await dashboardPage.locator(`[data-testid="conversation-${conversationId}"]`);
      await expect(element).toBeVisible();
    }

    // Test switching between conversations
    for (let i = 0; i < conversations.length; i++) {
      const conversationId = conversations[i];
      
      // Open conversation
      await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);
      await waitForElementWithRetry(dashboardPage, '[data-testid="message-input"]');
      
      // Send message
      const message = `Response to customer ${i + 1}`;
      await dashboardPage.fill('[data-testid="message-input"]', message);
      await dashboardPage.click('[data-testid="send-button"]');
      
      // Verify message was sent
      await dashboardPage.waitForTimeout(1000);
      await waitForElementWithRetry(dashboardPage, `[data-testid="message"]:has-text("${message}")`);
    }
  });

  test('should maintain connection stability during network interruption', async () => {
    // Create conversation
    const conversationId = await createConversation(widgetPage, {
      name: 'Network Test Customer',
      email: 'network@test.com',
      message: 'Testing network stability'
    });

    // Open in dashboard
    await dashboardPage.waitForTimeout(2000);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Send initial message
    await dashboardPage.fill('[data-testid="message-input"]', 'Initial message before network test');
    await dashboardPage.click('[data-testid="send-button"]');
    
    // Verify message received
    await widgetPage.waitForTimeout(2000);
    await waitForElementWithRetry(widgetPage, '[data-testid="message"]:has-text("Initial message")');

    // Simulate network interruption by going offline
    await widgetPage.context().setOffline(true);
    await dashboardPage.context().setOffline(true);
    
    await widgetPage.waitForTimeout(2000);
    
    // Go back online
    await widgetPage.context().setOffline(false);
    await dashboardPage.context().setOffline(false);
    
    // Wait for reconnection
    await widgetPage.waitForTimeout(3000);
    await dashboardPage.waitForTimeout(3000);

    // Test communication after reconnection
    const postReconnectMessage = 'Message after reconnection';
    await dashboardPage.fill('[data-testid="message-input"]', postReconnectMessage);
    await dashboardPage.click('[data-testid="send-button"]');
    
    // Verify message received after reconnection
    await widgetPage.waitForTimeout(3000);
    await waitForElementWithRetry(widgetPage, `[data-testid="message"]:has-text("${postReconnectMessage}")`);
    
    const reconnectedMessage = await widgetPage.locator(`[data-testid="message"]:has-text("${postReconnectMessage}")`);
    await expect(reconnectedMessage).toBeVisible();
  });

  test('should handle message delivery confirmation', async () => {
    // Create conversation
    const conversationId = await createConversation(widgetPage, {
      name: 'Delivery Test Customer',
      email: 'delivery@test.com',
      message: 'Testing message delivery confirmation'
    });

    // Open in dashboard
    await dashboardPage.waitForTimeout(2000);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Send message with delivery tracking
    const messageWithDelivery = 'Message with delivery confirmation';
    await dashboardPage.fill('[data-testid="message-input"]', messageWithDelivery);
    await dashboardPage.click('[data-testid="send-button"]');

    // Verify message shows as sent in dashboard
    await waitForElementWithRetry(dashboardPage, '[data-testid="message-status-sent"]');
    const sentStatus = await dashboardPage.locator('[data-testid="message-status-sent"]');
    await expect(sentStatus).toBeVisible();

    // Verify message received in widget
    await widgetPage.waitForTimeout(2000);
    await waitForElementWithRetry(widgetPage, `[data-testid="message"]:has-text("${messageWithDelivery}")`);

    // Verify delivery confirmation in dashboard
    await dashboardPage.waitForTimeout(1000);
    await waitForElementWithRetry(dashboardPage, '[data-testid="message-status-delivered"]');
    const deliveredStatus = await dashboardPage.locator('[data-testid="message-status-delivered"]');
    await expect(deliveredStatus).toBeVisible();
  });

  test('should handle real-time presence indicators', async () => {
    // Create conversation
    const conversationId = await createConversation(widgetPage, {
      name: 'Presence Test Customer',
      email: 'presence@test.com',
      message: 'Testing presence indicators'
    });

    // Open in dashboard
    await dashboardPage.waitForTimeout(2000);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Verify agent presence in widget
    await widgetPage.waitForTimeout(2000);
    await waitForElementWithRetry(widgetPage, '[data-testid="agent-online-indicator"]');
    const agentOnline = await widgetPage.locator('[data-testid="agent-online-indicator"]');
    await expect(agentOnline).toBeVisible();

    // Verify customer presence in dashboard
    await waitForElementWithRetry(dashboardPage, '[data-testid="customer-online-indicator"]');
    const customerOnline = await dashboardPage.locator('[data-testid="customer-online-indicator"]');
    await expect(customerOnline).toBeVisible();

    // Test presence when customer goes away
    await widgetPage.close();
    
    // Verify customer offline in dashboard
    await dashboardPage.waitForTimeout(3000);
    await waitForElementWithRetry(dashboardPage, '[data-testid="customer-offline-indicator"]');
    const customerOffline = await dashboardPage.locator('[data-testid="customer-offline-indicator"]');
    await expect(customerOffline).toBeVisible();
  });
});

test.describe('Performance and Load Testing', () => {
  test('should handle high-frequency message exchange', async ({ page, context }) => {
    // Create conversation
    const conversationId = await createConversation(page, {
      name: 'Load Test Customer',
      email: 'load@test.com',
      message: 'Starting load test'
    });

    const startTime = Date.now();
    const messageCount = 20;
    
    // Send rapid messages
    for (let i = 1; i <= messageCount; i++) {
      await sendMessage(page, conversationId, `Load test message ${i}`);
      await page.waitForTimeout(100); // Small delay between messages
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should handle 20 messages in reasonable time (< 10 seconds)
    expect(totalTime).toBeLessThan(10000);
    
    // Verify all messages were processed
    const messages = await page.evaluate(async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { 'x-organization-id': 'test-org-bidirectional' }
      });
      return response.json();
    }, conversationId);
    
    expect(messages.data.length).toBeGreaterThanOrEqual(messageCount);
  });

  test('should maintain performance with multiple concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    try {
      // Create conversations from multiple users simultaneously
      const conversationPromises = pages.map((page, index) =>
        createConversation(page, {
          name: `Concurrent User ${index + 1}`,
          email: `concurrent${index + 1}@test.com`,
          message: `Message from user ${index + 1}`
        })
      );

      const conversationIds = await Promise.all(conversationPromises);
      
      // Verify all conversations were created
      expect(conversationIds).toHaveLength(5);
      conversationIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });

      // Send messages from all users simultaneously
      const messagePromises = pages.map((page, index) =>
        sendMessage(page, conversationIds[index], `Follow-up from user ${index + 1}`)
      );

      await Promise.all(messagePromises);
      
    } finally {
      // Cleanup
      await Promise.all(contexts.map(context => context.close()));
    }
  });
});

test.describe('WebSocket Real-time Connection Tests', () => {
  test('should establish WebSocket connection and receive real-time updates', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}`);

    // Test WebSocket connection establishment
    const wsConnectionPromise = page.waitForEvent('websocket');

    // Trigger widget initialization which should establish WebSocket
    await waitForElementWithRetry(page, '[data-testid="widget-container"]');

    const ws = await wsConnectionPromise;
    expect(ws.url()).toContain('supabase.co'); // Should connect to Supabase Realtime

    // Monitor WebSocket messages
    const messages: any[] = [];
    ws.on('framereceived', event => {
      try {
        const data = JSON.parse(event.payload.toString());
        messages.push(data);
      } catch (e) {
        // Ignore non-JSON frames
      }
    });

    // Create conversation to trigger real-time events
    const conversationId = await createConversation(page, {
      name: 'WebSocket Test Customer',
      email: 'websocket@test.com',
      message: 'Testing WebSocket connection'
    });

    // Wait for real-time messages
    await page.waitForTimeout(3000);

    // Verify we received real-time messages
    expect(messages.length).toBeGreaterThan(0);

    // Check for conversation creation event
    const conversationEvent = messages.find(msg =>
      msg.event === 'INSERT' && msg.table === 'conversations'
    );
    expect(conversationEvent).toBeDefined();
  });

  test('should handle WebSocket reconnection after connection loss', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}`);

    // Wait for initial connection
    await waitForElementWithRetry(page, '[data-testid="widget-container"]');

    // Create conversation
    const conversationId = await createConversation(page, {
      name: 'Reconnection Test Customer',
      email: 'reconnection@test.com',
      message: 'Testing reconnection'
    });

    // Simulate network disconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Reconnect
    await page.context().setOffline(false);
    await page.waitForTimeout(5000); // Allow time for reconnection

    // Test that real-time still works after reconnection
    await sendMessage(page, conversationId, 'Message after reconnection');

    // Verify message was sent successfully
    await page.waitForTimeout(2000);
    const messages = await page.evaluate(async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { 'x-organization-id': 'test-org-bidirectional' }
      });
      return response.json();
    }, conversationId);

    expect(messages.success).toBe(true);
    expect(messages.data.some((msg: any) => msg.content.includes('after reconnection'))).toBe(true);
  });
});
