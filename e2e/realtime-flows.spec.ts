/**
 * E2E Tests for Realtime Flows
 * 
 * Tests complete realtime communication flows:
 * - Widget to Dashboard bidirectional communication
 * - AI handover scenarios with <100ms latency
 * - Typing indicators and presence updates
 * - Memory leak validation
 * - Performance under load
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
const WIDGET_URL = `http://localhost:3001/widget?org=${TEST_ORG_ID}`;
const DASHBOARD_URL = `http://localhost:3001/dashboard/inbox`;

// Helper function to wait for realtime connection
async function waitForRealtimeConnection(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      // Check if realtime store is connected
      return window.useRealtimeStore?.getState?.()?.isConnected === true;
    },
    { timeout }
  );
}

// Helper function to create a new conversation via widget
async function createConversation(widgetPage: Page): Promise<string> {
  // Start a new conversation
  await widgetPage.click('[data-testid="start-conversation"]');
  await widgetPage.fill('[data-testid="message-input"]', 'Hello, I need help');
  await widgetPage.click('[data-testid="send-message"]');
  
  // Wait for conversation to be created and get ID
  const conversationId = await widgetPage.evaluate(() => {
    return window.currentConversationId || 'test-conv-' + Date.now();
  });
  
  return conversationId;
}

test.describe('Realtime Communication Flows', () => {
  let context: BrowserContext;
  let widgetPage: Page;
  let dashboardPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Create browser context with permissions
    context = await browser.newContext({
      permissions: ['notifications'],
    });

    // Create pages for widget and dashboard
    widgetPage = await context.newPage();
    dashboardPage = await context.newPage();

    // Navigate to both pages
    await Promise.all([
      widgetPage.goto(WIDGET_URL),
      dashboardPage.goto(DASHBOARD_URL),
    ]);

    // Wait for pages to load and authenticate
    await Promise.all([
      widgetPage.waitForLoadState('networkidle'),
      dashboardPage.waitForLoadState('networkidle'),
    ]);

    // Authenticate dashboard if needed
    const loginButton = dashboardPage.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await dashboardPage.fill('[data-testid="email-input"]', 'jam@jam.com');
      await dashboardPage.fill('[data-testid="password-input"]', 'password123');
      await dashboardPage.click('[data-testid="login-button"]');
      await dashboardPage.waitForURL('**/dashboard/**');
    }
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should establish bidirectional widget-dashboard communication', async () => {
    // Wait for realtime connections
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    // Create conversation from widget
    const conversationId = await createConversation(widgetPage);

    // Verify conversation appears in dashboard
    await dashboardPage.waitForSelector(`[data-testid="conversation-${conversationId}"]`, {
      timeout: 10000,
    });

    // Send message from widget
    await widgetPage.fill('[data-testid="message-input"]', 'This is a test message from widget');
    await widgetPage.click('[data-testid="send-message"]');

    // Verify message appears in dashboard
    await dashboardPage.waitForSelector('[data-testid="message-content"]:has-text("This is a test message from widget")', {
      timeout: 5000,
    });

    // Reply from dashboard
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);
    await dashboardPage.fill('[data-testid="agent-message-input"]', 'Hello! How can I help you?');
    await dashboardPage.click('[data-testid="send-agent-message"]');

    // Verify reply appears in widget
    await widgetPage.waitForSelector('[data-testid="message-content"]:has-text("Hello! How can I help you?")', {
      timeout: 5000,
    });
  });

  test('should handle AI handover with <100ms latency', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationId = await createConversation(widgetPage);

    // Simulate AI response
    const startTime = Date.now();
    
    await widgetPage.evaluate((convId) => {
      // Simulate AI sending a message
      window.useRealtimeStore?.getState?.()?.sendMessage?.({
        conversationId: convId,
        organizationId: window.TEST_ORG_ID,
        content: 'I understand you need help. Let me connect you with a human agent.',
        senderType: 'ai',
        metadata: {
          handover: true,
          reason: 'complex_query',
          confidence: 0.3,
        },
      });
    }, conversationId);

    // Wait for AI message to appear in dashboard
    await dashboardPage.waitForSelector('[data-testid="message-content"]:has-text("Let me connect you with a human agent")', {
      timeout: 5000,
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Verify latency is under 100ms
    expect(latency).toBeLessThan(100);

    // Verify handover indicator appears
    await dashboardPage.waitForSelector('[data-testid="ai-handover-indicator"]', {
      timeout: 2000,
    });

    // Agent takes over
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);
    await dashboardPage.click('[data-testid="accept-handover"]');
    await dashboardPage.fill('[data-testid="agent-message-input"]', 'Hi! I\'m here to help you personally.');
    await dashboardPage.click('[data-testid="send-agent-message"]');

    // Verify agent message appears in widget
    await widgetPage.waitForSelector('[data-testid="message-content"]:has-text("I\'m here to help you personally")', {
      timeout: 5000,
    });
  });

  test('should show typing indicators in real-time', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationId = await createConversation(widgetPage);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Start typing in widget
    await widgetPage.focus('[data-testid="message-input"]');
    await widgetPage.type('[data-testid="message-input"]', 'I am typing...', { delay: 100 });

    // Verify typing indicator appears in dashboard
    await dashboardPage.waitForSelector('[data-testid="typing-indicator"]:has-text("Visitor is typing")', {
      timeout: 3000,
    });

    // Stop typing in widget
    await widgetPage.fill('[data-testid="message-input"]', '');

    // Verify typing indicator disappears in dashboard
    await dashboardPage.waitForSelector('[data-testid="typing-indicator"]', {
      state: 'hidden',
      timeout: 3000,
    });

    // Start typing in dashboard
    await dashboardPage.focus('[data-testid="agent-message-input"]');
    await dashboardPage.type('[data-testid="agent-message-input"]', 'Agent is typing...', { delay: 100 });

    // Verify typing indicator appears in widget
    await widgetPage.waitForSelector('[data-testid="typing-indicator"]:has-text("Agent is typing")', {
      timeout: 3000,
    });

    // Stop typing in dashboard
    await dashboardPage.fill('[data-testid="agent-message-input"]', '');

    // Verify typing indicator disappears in widget
    await widgetPage.waitForSelector('[data-testid="typing-indicator"]', {
      state: 'hidden',
      timeout: 3000,
    });
  });

  test('should handle presence updates correctly', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationId = await createConversation(widgetPage);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    // Verify agent presence is shown as online in widget
    await widgetPage.waitForSelector('[data-testid="agent-status"]:has-text("Online")', {
      timeout: 5000,
    });

    // Simulate agent going away
    await dashboardPage.evaluate(() => {
      window.useRealtimeStore?.getState?.()?.updatePresence?.({
        userId: 'agent-123',
        status: 'away',
      });
    });

    // Verify presence update in widget
    await widgetPage.waitForSelector('[data-testid="agent-status"]:has-text("Away")', {
      timeout: 5000,
    });
  });

  test('should handle high-volume message bursts without degradation', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationId = await createConversation(widgetPage);
    await dashboardPage.click(`[data-testid="conversation-${conversationId}"]`);

    const messageCount = 20;
    const startTime = Date.now();

    // Send burst of messages from widget
    for (let i = 0; i < messageCount; i++) {
      await widgetPage.fill('[data-testid="message-input"]', `Burst message ${i + 1}`);
      await widgetPage.click('[data-testid="send-message"]');
      
      // Small delay to avoid overwhelming
      await widgetPage.waitForTimeout(50);
    }

    // Wait for all messages to appear in dashboard
    await dashboardPage.waitForSelector(`[data-testid="message-content"]:has-text("Burst message ${messageCount}")`, {
      timeout: 10000,
    });

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgLatency = totalTime / messageCount;

    // Verify reasonable performance
    expect(avgLatency).toBeLessThan(500); // 500ms average per message
    expect(totalTime).toBeLessThan(15000); // Total under 15 seconds

    // Verify all messages are present
    const messageElements = await dashboardPage.locator('[data-testid="message-content"]').count();
    expect(messageElements).toBeGreaterThanOrEqual(messageCount);
  });

  test('should validate memory usage and prevent leaks', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    // Get initial memory usage
    const initialMemory = await widgetPage.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });

    // Create multiple conversations and send messages
    for (let i = 0; i < 5; i++) {
      const conversationId = await createConversation(widgetPage);
      
      // Send multiple messages
      for (let j = 0; j < 10; j++) {
        await widgetPage.fill('[data-testid="message-input"]', `Message ${j} in conversation ${i}`);
        await widgetPage.click('[data-testid="send-message"]');
        await widgetPage.waitForTimeout(100);
      }
    }

    // Wait for processing
    await widgetPage.waitForTimeout(2000);

    // Trigger cleanup
    await widgetPage.evaluate(() => {
      window.useRealtimeStore?.getState?.()?.cleanupIdleChannels?.();
      window.useRealtimeStore?.getState?.()?.clearOldData?.();
    });

    // Wait for cleanup
    await widgetPage.waitForTimeout(1000);

    // Get final memory usage
    const finalMemory = await widgetPage.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });

    // Memory growth should be reasonable (less than 10MB)
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB

    // Verify cleanup worked
    const activeChannels = await widgetPage.evaluate(() => {
      return window.useRealtimeStore?.getState?.()?.activeChannels?.size || 0;
    });

    expect(activeChannels).toBeLessThanOrEqual(1); // Should only have current conversation
  });

  test('should handle network interruptions gracefully', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationId = await createConversation(widgetPage);

    // Simulate network interruption
    await context.setOffline(true);
    await widgetPage.waitForTimeout(1000);

    // Try to send message while offline
    await widgetPage.fill('[data-testid="message-input"]', 'Message sent while offline');
    await widgetPage.click('[data-testid="send-message"]');

    // Restore network
    await context.setOffline(false);
    await widgetPage.waitForTimeout(2000);

    // Wait for reconnection
    await waitForRealtimeConnection(widgetPage);

    // Send message after reconnection
    await widgetPage.fill('[data-testid="message-input"]', 'Message after reconnection');
    await widgetPage.click('[data-testid="send-message"]');

    // Verify message appears in dashboard
    await dashboardPage.waitForSelector('[data-testid="message-content"]:has-text("Message after reconnection")', {
      timeout: 10000,
    });
  });

  test('should maintain performance with multiple concurrent conversations', async () => {
    await Promise.all([
      waitForRealtimeConnection(widgetPage),
      waitForRealtimeConnection(dashboardPage),
    ]);

    const conversationIds: string[] = [];
    const startTime = Date.now();

    // Create multiple conversations
    for (let i = 0; i < 3; i++) {
      const conversationId = await createConversation(widgetPage);
      conversationIds.push(conversationId);
      
      // Send messages in each conversation
      await widgetPage.fill('[data-testid="message-input"]', `Message in conversation ${i + 1}`);
      await widgetPage.click('[data-testid="send-message"]');
    }

    // Verify all conversations appear in dashboard
    for (const conversationId of conversationIds) {
      await dashboardPage.waitForSelector(`[data-testid="conversation-${conversationId}"]`, {
        timeout: 5000,
      });
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should handle multiple conversations efficiently
    expect(totalTime).toBeLessThan(10000); // Under 10 seconds

    // Verify realtime metrics
    const metrics = await widgetPage.evaluate(() => {
      return window.realtimeManager?.getPerformanceReport?.() || {};
    });

    expect(metrics.activeChannels).toBeGreaterThanOrEqual(3);
    expect(metrics.averageLatency).toBeLessThan(100);
  });
});
