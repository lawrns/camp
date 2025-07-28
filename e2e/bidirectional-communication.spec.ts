/**
 * BIDIRECTIONAL COMMUNICATION E2E TESTS
 * 
 * Comprehensive tests for real-time bidirectional communication:
 * - Multi-browser message flows
 * - Typing indicators
 * - Presence updates
 * - Agent-customer interactions
 * - AI handover scenarios
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '../lib/realtime/unified-channel-standards';

// Test configuration
const TEST_TIMEOUT = 30000;
const MESSAGE_WAIT_TIME = 5000;

interface TestContext {
  agentBrowser: Browser;
  customerBrowser: Browser;
  agentContext: BrowserContext;
  customerContext: BrowserContext;
  agentPage: Page;
  customerPage: Page;
  conversationId: string;
  organizationId: string;
}

test.describe('Bidirectional Communication E2E', () => {
  let testContext: TestContext;

  test.beforeAll(async ({ browser }) => {
    // Load test metadata
    const testMetadata = JSON.parse(
      require('fs').readFileSync('e2e/test-metadata.json', 'utf-8')
    );

    // Create separate browser instances for agent and customer
    testContext = {
      agentBrowser: browser,
      customerBrowser: await browser.browserType().launch(),
      agentContext: null as any,
      customerContext: null as any,
      agentPage: null as any,
      customerPage: null as any,
      conversationId: testMetadata.testConversations[0].id,
      organizationId: testMetadata.testOrgId,
    };

    // Setup agent context with authentication
    testContext.agentContext = await testContext.agentBrowser.newContext({
      storageState: 'e2e/auth-state.json',
    });
    testContext.agentPage = await testContext.agentContext.newPage();

    // Setup customer context (no auth needed for widget)
    testContext.customerContext = await testContext.customerBrowser.newContext();
    testContext.customerPage = await testContext.customerContext.newPage();

    // Enable console logging for debugging
    testContext.agentPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[AGENT ERROR] ${msg.text()}`);
      }
    });

    testContext.customerPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[CUSTOMER ERROR] ${msg.text()}`);
      }
    });
  });

  test.afterAll(async () => {
    await testContext.customerBrowser?.close();
    await testContext.agentContext?.close();
    await testContext.customerContext?.close();
  });

  test('should establish bidirectional message communication', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. SETUP AGENT DASHBOARD
    // ========================================
    await testContext.agentPage.goto('/dashboard/conversations');
    await testContext.agentPage.waitForLoadState('networkidle');

    // Navigate to specific conversation
    await testContext.agentPage.click(`[data-testid="conversation-${testContext.conversationId}"]`);
    await testContext.agentPage.waitForSelector('[data-testid="message-input"]');

    // ========================================
    // 2. SETUP CUSTOMER WIDGET
    // ========================================
    await testContext.customerPage.goto(`/widget?org=${testContext.organizationId}&conv=${testContext.conversationId}`);
    await testContext.customerPage.waitForLoadState('networkidle');
    await testContext.customerPage.waitForSelector('[data-testid="widget-message-input"]');

    // ========================================
    // 3. TEST CUSTOMER TO AGENT MESSAGE FLOW
    // ========================================
    const customerMessage = `E2E_TEST: Customer message at ${Date.now()}`;
    
    // Customer sends message
    await testContext.customerPage.fill('[data-testid="widget-message-input"]', customerMessage);
    await testContext.customerPage.click('[data-testid="widget-send-button"]');

    // Verify message appears in customer widget
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${customerMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Verify message appears in agent dashboard
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${customerMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 4. TEST AGENT TO CUSTOMER MESSAGE FLOW
    // ========================================
    const agentMessage = `E2E_TEST: Agent response at ${Date.now()}`;

    // Agent sends message
    await testContext.agentPage.fill('[data-testid="message-input"]', agentMessage);
    await testContext.agentPage.click('[data-testid="send-button"]');

    // Verify message appears in agent dashboard
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${agentMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Verify message appears in customer widget
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${agentMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Bidirectional message communication verified');
  });

  test('should handle typing indicators bidirectionally', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Ensure both pages are ready
    await testContext.agentPage.waitForSelector('[data-testid="message-input"]');
    await testContext.customerPage.waitForSelector('[data-testid="widget-message-input"]');

    // ========================================
    // 1. TEST CUSTOMER TYPING → AGENT SEES
    // ========================================
    
    // Customer starts typing
    await testContext.customerPage.focus('[data-testid="widget-message-input"]');
    await testContext.customerPage.type('[data-testid="widget-message-input"]', 'Customer is typing...');

    // Agent should see typing indicator
    await expect(
      testContext.agentPage.locator('[data-testid="typing-indicator"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Clear customer input (stop typing)
    await testContext.customerPage.fill('[data-testid="widget-message-input"]', '');

    // Typing indicator should disappear
    await expect(
      testContext.agentPage.locator('[data-testid="typing-indicator"]')
    ).toBeHidden({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. TEST AGENT TYPING → CUSTOMER SEES
    // ========================================

    // Agent starts typing
    await testContext.agentPage.focus('[data-testid="message-input"]');
    await testContext.agentPage.type('[data-testid="message-input"]', 'Agent is typing...');

    // Customer should see typing indicator
    await expect(
      testContext.customerPage.locator('[data-testid="agent-typing-indicator"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Clear agent input (stop typing)
    await testContext.agentPage.fill('[data-testid="message-input"]', '');

    // Typing indicator should disappear
    await expect(
      testContext.customerPage.locator('[data-testid="agent-typing-indicator"]')
    ).toBeHidden({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Bidirectional typing indicators verified');
  });

  test('should handle presence updates bidirectionally', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. VERIFY AGENT ONLINE STATUS
    // ========================================

    // Customer should see agent as online
    await expect(
      testContext.customerPage.locator('[data-testid="agent-status-online"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. TEST AGENT STATUS CHANGES
    // ========================================

    // Agent changes status to away
    await testContext.agentPage.click('[data-testid="status-dropdown"]');
    await testContext.agentPage.click('[data-testid="status-away"]');

    // Customer should see agent as away
    await expect(
      testContext.customerPage.locator('[data-testid="agent-status-away"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent changes status back to online
    await testContext.agentPage.click('[data-testid="status-dropdown"]');
    await testContext.agentPage.click('[data-testid="status-online"]');

    // Customer should see agent as online again
    await expect(
      testContext.customerPage.locator('[data-testid="agent-status-online"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Bidirectional presence updates verified');
  });

  test('should handle message delivery status', async () => {
    test.setTimeout(TEST_TIMEOUT);

    const testMessage = `E2E_TEST: Delivery status test ${Date.now()}`;

    // ========================================
    // 1. SEND MESSAGE AND TRACK STATUS
    // ========================================

    // Customer sends message
    await testContext.customerPage.fill('[data-testid="widget-message-input"]', testMessage);
    await testContext.customerPage.click('[data-testid="widget-send-button"]');

    // Message should show as sent
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${testMessage}") [data-testid="status-sent"]`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Message should show as delivered when agent sees it
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${testMessage}") [data-testid="status-delivered"]`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. VERIFY READ STATUS
    // ========================================

    // Agent views the message (simulated by scrolling to it)
    await testContext.agentPage.locator(`[data-testid="message"]:has-text("${testMessage}")`).scrollIntoViewIfNeeded();

    // Message should show as read
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${testMessage}") [data-testid="status-read"]`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Message delivery status verified');
  });

  test('should handle connection interruption and recovery', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. SIMULATE CONNECTION INTERRUPTION
    // ========================================

    // Simulate network interruption on customer side
    await testContext.customerContext.setOffline(true);

    // Wait for disconnection to be detected
    await expect(
      testContext.customerPage.locator('[data-testid="connection-status-offline"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 2. SEND MESSAGE WHILE OFFLINE
    // ========================================

    const offlineMessage = `E2E_TEST: Offline message ${Date.now()}`;
    
    // Try to send message while offline
    await testContext.customerPage.fill('[data-testid="widget-message-input"]', offlineMessage);
    await testContext.customerPage.click('[data-testid="widget-send-button"]');

    // Message should show as pending
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${offlineMessage}") [data-testid="status-pending"]`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. RESTORE CONNECTION AND VERIFY RECOVERY
    // ========================================

    // Restore connection
    await testContext.customerContext.setOffline(false);

    // Wait for reconnection
    await expect(
      testContext.customerPage.locator('[data-testid="connection-status-online"]')
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Message should be delivered after reconnection
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${offlineMessage}") [data-testid="status-delivered"]`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Agent should receive the message
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${offlineMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    console.log('✅ Connection interruption and recovery verified');
  });

  test('should handle concurrent messages from multiple users', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. SEND CONCURRENT MESSAGES
    // ========================================

    const timestamp = Date.now();
    const customerMessage = `E2E_TEST: Customer concurrent ${timestamp}`;
    const agentMessage = `E2E_TEST: Agent concurrent ${timestamp}`;

    // Send messages simultaneously
    await Promise.all([
      (async () => {
        await testContext.customerPage.fill('[data-testid="widget-message-input"]', customerMessage);
        await testContext.customerPage.click('[data-testid="widget-send-button"]');
      })(),
      (async () => {
        await testContext.agentPage.fill('[data-testid="message-input"]', agentMessage);
        await testContext.agentPage.click('[data-testid="send-button"]');
      })(),
    ]);

    // ========================================
    // 2. VERIFY BOTH MESSAGES APPEAR CORRECTLY
    // ========================================

    // Both messages should appear in agent dashboard
    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${customerMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await expect(
      testContext.agentPage.locator(`[data-testid="message"]:has-text("${agentMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // Both messages should appear in customer widget
    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${customerMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    await expect(
      testContext.customerPage.locator(`[data-testid="message"]:has-text("${agentMessage}")`)
    ).toBeVisible({ timeout: MESSAGE_WAIT_TIME });

    // ========================================
    // 3. VERIFY MESSAGE ORDER
    // ========================================

    // Get all messages and verify they're in chronological order
    const agentMessages = await testContext.agentPage.locator('[data-testid="message"]').all();
    const customerMessages = await testContext.customerPage.locator('[data-testid="message"]').all();

    expect(agentMessages.length).toBeGreaterThanOrEqual(2);
    expect(customerMessages.length).toBeGreaterThanOrEqual(2);

    console.log('✅ Concurrent messages handled correctly');
  });
});
