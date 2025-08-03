/**
 * COMPREHENSIVE BIDIRECTIONAL COMMUNICATION E2E TESTS
 * 
 * Tests all aspects of real-time bidirectional communication between
 * agents and visitors using the correct test credentials.
 * 
 * Test Credentials: jam@jam.com / password123
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  timeout: 30000
};

// Helper functions
async function loginAsAgent(page: Page) {
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
}

async function openWidget(page: Page) {
  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  // Wait for widget button to load (verified selector)
  await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
  // Click widget button to open panel
  await page.click('[data-testid="widget-button"]');
  // Wait for widget panel or chat interface to appear
  await page.waitForTimeout(2000); // Allow widget to open
}

async function createConversationFromWidget(page: Page, message: string) {
  // Wait for widget panel to be ready
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
  // Fill message input (verified as TEXTAREA)
  await page.fill('[data-testid="widget-message-input"]', message);
  // Click send button
  await page.click('[data-testid="widget-send-button"]');
  // Wait for message to appear
  await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
}

async function sendMessageFromDashboard(page: Page, message: string) {
  // Use verified dashboard message input selector
  await page.fill('textarea[placeholder*="message"]', message);

  // Try multiple send button selectors with force click to bypass dev overlay
  const sendSelectors = [
    'button[aria-label*="Send"]',
    'button[type="submit"]',
    'button:has-text("Send")'
  ];

  let buttonFound = false;
  for (const selector of sendSelectors) {
    const button = page.locator(selector);
    const count = await button.count();
    if (count > 0 && await button.first().isVisible()) {
      try {
        await button.first().click({ force: true });
        buttonFound = true;
        break;
      } catch (error) {
        continue;
      }
    }
  }

  if (!buttonFound) {
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(3000); // Allow message to be sent
}

async function sendMessageFromWidget(page: Page, message: string) {
  // Ensure widget panel is visible
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 5000 });
  // Fill and send message
  await page.fill('[data-testid="widget-message-input"]', message);
  await page.click('[data-testid="widget-send-button"]');
  // Wait for message to appear with increased timeout
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 10000 });
}

test.describe('Comprehensive Bidirectional Communication Tests', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create separate contexts for agent and visitor
    agentContext = await browser.newContext();
    visitorContext = await browser.newContext();
    
    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();
  });

  test.afterAll(async () => {
    await agentContext.close();
    await visitorContext.close();
  });

  test('1. Real-time Communication Flow - Complete Bidirectional Exchange', async () => {
    console.log('🚀 Starting comprehensive bidirectional communication test...');

    // Step 1: Agent logs into dashboard
    console.log('📱 Agent logging into dashboard...');
    await loginAsAgent(agentPage);
    await expect(agentPage.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // Step 2: Visitor opens widget
    console.log('👤 Visitor opening widget...');
    await openWidget(visitorPage);

    // Step 3: Visitor creates conversation
    console.log('💬 Visitor creating conversation...');
    const initialMessage = 'Hello! I need help with my account settings.';
    await createConversationFromWidget(visitorPage, initialMessage);

    // Step 4: Verify conversation appears in dashboard
    console.log('🔍 Verifying conversation appears in dashboard...');
    await agentPage.waitForTimeout(5000); // Allow real-time sync (increased timeout)
    await expect(agentPage.locator('[data-testid="conversation"]').first()).toBeVisible();

    // Step 5: Agent opens conversation
    console.log('📂 Agent opening conversation...');
    await agentPage.click('[data-testid="conversation"]');
    await agentPage.waitForTimeout(2000); // Allow conversation to open
    
    // Verify initial message is visible
    await expect(agentPage.locator(`[data-testid="message"]:has-text("${initialMessage}")`)).toBeVisible();

    // Step 6: Agent responds
    console.log('💬 Agent responding to customer...');
    const agentResponse = 'Hello! I\'d be happy to help you with your account settings. What specifically would you like to change?';
    await sendMessageFromDashboard(agentPage, agentResponse);

    // Step 7: Verify agent response appears in widget
    console.log('🔍 Verifying agent response appears in widget...');
    await visitorPage.waitForTimeout(10000); // Increased timeout for real-time sync
    await expect(visitorPage.locator(`[data-testid="message"]:has-text("${agentResponse}")`)).toBeVisible({ timeout: 15000 });

    // Step 8: Visitor replies
    console.log('💬 Visitor replying...');
    const visitorReply = 'I want to update my email address and change my password.';
    await sendMessageFromWidget(visitorPage, visitorReply);

    // Step 9: Verify visitor reply appears in dashboard
    console.log('🔍 Verifying visitor reply appears in dashboard...');
    await agentPage.waitForTimeout(10000); // Increased timeout for real-time sync
    await expect(agentPage.locator(`[data-testid="message"]:has-text("${visitorReply}")`)).toBeVisible({ timeout: 15000 });

    console.log('✅ Bidirectional communication flow test completed successfully!');
  });

  test('2. Typing Indicators - Bidirectional Typing Detection', async () => {
    console.log('⌨️ Testing bidirectional typing indicators...');

    // Ensure we have an active conversation
    await loginAsAgent(agentPage);
    await openWidget(visitorPage);
    await createConversationFromWidget(visitorPage, 'Testing typing indicators');
    
    await agentPage.waitForTimeout(2000);
    await agentPage.click('[data-testid="conversation-item"]');

    // Test 1: Agent typing indicator in widget
    console.log('⌨️ Testing agent typing indicator...');
    await agentPage.focus('[data-testid="message-input"]');
    await agentPage.type('[data-testid="message-input"]', 'Agent is typing...');
    
    // Verify typing indicator appears in widget
    await visitorPage.waitForTimeout(1000);
    await expect(visitorPage.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Clear input to stop typing
    await agentPage.fill('[data-testid="message-input"]', '');
    await visitorPage.waitForTimeout(1000);
    await expect(visitorPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible();

    // Test 2: Visitor typing indicator in dashboard
    console.log('⌨️ Testing visitor typing indicator...');
    await visitorPage.focus('[data-testid="widget-message-input"]');
    await visitorPage.type('[data-testid="widget-message-input"]', 'Customer is typing...');
    
    // Verify typing indicator appears in dashboard
    await agentPage.waitForTimeout(1000);
    await expect(agentPage.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Clear input to stop typing
    await visitorPage.fill('[data-testid="widget-message-input"]', '');
    await agentPage.waitForTimeout(1000);
    await expect(agentPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible();

    console.log('✅ Typing indicators test completed successfully!');
  });

  test('3. WebSocket Connection Reliability - Network Interruption Recovery', async () => {
    console.log('🌐 Testing WebSocket connection reliability...');

    // Establish connection and conversation
    await loginAsAgent(agentPage);
    await openWidget(visitorPage);
    await createConversationFromWidget(visitorPage, 'Testing connection reliability');
    
    await agentPage.waitForTimeout(2000);
    await agentPage.click('[data-testid="conversation-item"]');

    // Send initial message to establish communication
    await sendMessageFromDashboard(agentPage, 'Initial message before network test');
    await visitorPage.waitForTimeout(2000);
    await expect(visitorPage.locator('[data-testid="message"]:has-text("Initial message")')).toBeVisible();

    // Simulate network interruption
    console.log('📡 Simulating network interruption...');
    await visitorPage.context().setOffline(true);
    await agentPage.context().setOffline(true);
    
    await visitorPage.waitForTimeout(2000);
    
    // Restore connection
    console.log('🔄 Restoring network connection...');
    await visitorPage.context().setOffline(false);
    await agentPage.context().setOffline(false);
    
    // Wait for reconnection
    await visitorPage.waitForTimeout(5000);
    await agentPage.waitForTimeout(5000);

    // Test communication after reconnection
    console.log('💬 Testing communication after reconnection...');
    const postReconnectMessage = 'Message after network recovery';
    await sendMessageFromDashboard(agentPage, postReconnectMessage);
    
    // Verify message received after reconnection
    await visitorPage.waitForTimeout(3000);
    await expect(visitorPage.locator(`[data-testid="message"]:has-text("${postReconnectMessage}")`)).toBeVisible();

    console.log('✅ Network reliability test completed successfully!');
  });

  test('4. Performance Under Load - Multiple Rapid Messages', async () => {
    console.log('⚡ Testing performance under load...');

    // Setup conversation
    await loginAsAgent(agentPage);
    await openWidget(visitorPage);
    await createConversationFromWidget(visitorPage, 'Performance testing conversation');
    
    await agentPage.waitForTimeout(2000);
    await agentPage.click('[data-testid="conversation-item"]');

    // Send rapid sequence of messages
    console.log('🚀 Sending rapid message sequence...');
    const messageCount = 10;
    const startTime = Date.now();

    for (let i = 1; i <= messageCount; i++) {
      const message = `Rapid message ${i}`;
      await sendMessageFromDashboard(agentPage, message);
      await agentPage.waitForTimeout(200); // Small delay between messages
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all messages were sent in reasonable time
    expect(duration).toBeLessThan(15000); // Should complete within 15 seconds

    // Verify messages appear in widget
    console.log('🔍 Verifying all messages received...');
    await visitorPage.waitForTimeout(3000);
    
    for (let i = 1; i <= messageCount; i++) {
      await expect(visitorPage.locator(`[data-testid="message"]:has-text("Rapid message ${i}")`)).toBeVisible();
    }

    console.log('✅ Performance test completed successfully!');
  });

  test('5. Error Handling - Graceful Degradation', async () => {
    console.log('🛡️ Testing error handling and graceful degradation...');

    // Setup conversation
    await loginAsAgent(agentPage);
    await openWidget(visitorPage);
    await createConversationFromWidget(visitorPage, 'Error handling test');
    
    await agentPage.waitForTimeout(2000);
    await agentPage.click('[data-testid="conversation-item"]');

    // Test 1: Widget behavior when dashboard goes offline
    console.log('📱 Testing widget behavior when dashboard offline...');
    await agentPage.context().setOffline(true);
    
    // Widget should still allow message input
    await expect(visitorPage.locator('[data-testid="widget-message-input"]')).toBeEnabled();
    
    // Send message from widget (should queue or show pending state)
    await sendMessageFromWidget(visitorPage, 'Message while dashboard offline');
    
    // Restore dashboard connection
    await agentPage.context().setOffline(false);
    await agentPage.waitForTimeout(3000);

    // Test 2: Dashboard behavior when widget disconnects
    console.log('💻 Testing dashboard behavior when widget disconnects...');
    await visitorPage.context().setOffline(true);
    
    // Dashboard should still allow message input
    await expect(agentPage.locator('[data-testid="message-input"]')).toBeEnabled();
    
    // Send message from dashboard
    await sendMessageFromDashboard(agentPage, 'Message while widget offline');
    
    // Restore widget connection
    await visitorPage.context().setOffline(false);
    await visitorPage.waitForTimeout(3000);

    // Verify messages sync after reconnection
    await expect(visitorPage.locator('[data-testid="message"]:has-text("Message while widget offline")')).toBeVisible();

    console.log('✅ Error handling test completed successfully!');
  });

  test('6. Message Delivery and Read Receipts', async () => {
    console.log('📨 Testing message delivery and read receipts...');

    // Setup conversation
    await loginAsAgent(agentPage);
    await openWidget(visitorPage);
    await createConversationFromWidget(visitorPage, 'Testing delivery receipts');
    
    await agentPage.waitForTimeout(2000);
    await agentPage.click('[data-testid="conversation-item"]');

    // Send message with delivery tracking
    const messageWithDelivery = 'Message with delivery confirmation';
    await sendMessageFromDashboard(agentPage, messageWithDelivery);

    // Verify message shows as sent in dashboard
    await expect(agentPage.locator('[data-testid="message-status-sent"]')).toBeVisible();

    // Verify message received in widget
    await visitorPage.waitForTimeout(2000);
    await expect(visitorPage.locator(`[data-testid="message"]:has-text("${messageWithDelivery}")`)).toBeVisible();

    // Verify delivery confirmation in dashboard
    await agentPage.waitForTimeout(1000);
    await expect(agentPage.locator('[data-testid="message-status-delivered"]')).toBeVisible();

    console.log('✅ Message delivery test completed successfully!');
  });

  test('7. Multiple Concurrent Conversations', async () => {
    console.log('👥 Testing multiple concurrent conversations...');

    // Create additional visitor contexts
    const visitor2Context = await visitorPage.context().browser()!.newContext();
    const visitor2Page = await visitor2Context.newPage();
    
    const visitor3Context = await visitorPage.context().browser()!.newContext();
    const visitor3Page = await visitor3Context.newPage();

    try {
      // Setup agent
      await loginAsAgent(agentPage);

      // Create conversations from multiple visitors
      await openWidget(visitorPage);
      await createConversationFromWidget(visitorPage, 'Conversation from visitor 1');

      await openWidget(visitor2Page);
      await createConversationFromWidget(visitor2Page, 'Conversation from visitor 2');

      await openWidget(visitor3Page);
      await createConversationFromWidget(visitor3Page, 'Conversation from visitor 3');

      // Verify all conversations appear in dashboard
      await agentPage.waitForTimeout(3000);
      const conversationItems = agentPage.locator('[data-testid="conversation-item"]');
      await expect(conversationItems).toHaveCount(3);

      // Test switching between conversations
      await agentPage.click('[data-testid="conversation-item"]').first();
      await sendMessageFromDashboard(agentPage, 'Response to visitor 1');

      await agentPage.click('[data-testid="conversation-item"]').nth(1);
      await sendMessageFromDashboard(agentPage, 'Response to visitor 2');

      await agentPage.click('[data-testid="conversation-item"]').nth(2);
      await sendMessageFromDashboard(agentPage, 'Response to visitor 3');

      // Verify responses reach correct visitors
      await visitorPage.waitForTimeout(2000);
      await expect(visitorPage.locator('[data-testid="message"]:has-text("Response to visitor 1")')).toBeVisible();

      await visitor2Page.waitForTimeout(2000);
      await expect(visitor2Page.locator('[data-testid="message"]:has-text("Response to visitor 2")')).toBeVisible();

      await visitor3Page.waitForTimeout(2000);
      await expect(visitor3Page.locator('[data-testid="message"]:has-text("Response to visitor 3")')).toBeVisible();

      console.log('✅ Multiple conversations test completed successfully!');

    } finally {
      await visitor2Context.close();
      await visitor3Context.close();
    }
  });
});
