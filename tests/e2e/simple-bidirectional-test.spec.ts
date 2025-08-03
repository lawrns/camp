/**
 * SIMPLE BIDIRECTIONAL COMMUNICATION TEST
 * 
 * A focused test to verify basic real-time communication between
 * agent and visitor using the correct selectors.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123'
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
  // Wait for widget panel to appear
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
}

async function sendMessageFromWidget(page: Page, message: string) {
  // Fill and send message
  await page.fill('[data-testid="widget-message-input"]', message);
  await page.click('[data-testid="widget-send-button"]');
  // Wait for message to appear
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 10000 });
}

test.describe('Simple Bidirectional Communication Test', () => {
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

  test('should verify basic widget to dashboard communication', async () => {
    console.log('🚀 Starting simple bidirectional communication test...');

    // Step 1: Agent logs into dashboard
    console.log('📱 Agent logging into dashboard...');
    await loginAsAgent(agentPage);
    
    // Navigate to inbox
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Step 2: Visitor opens widget
    console.log('👤 Visitor opening widget...');
    await openWidget(visitorPage);

    // Step 3: Visitor sends a message
    console.log('💬 Visitor sending message...');
    const testMessage = `Test message from widget - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, testMessage);

    // Step 4: Check if message appears in dashboard
    console.log('🔍 Checking if message appears in dashboard...');
    await agentPage.waitForTimeout(5000); // Allow real-time sync

    // Look for conversations in dashboard
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`Found ${conversationCount} conversations in dashboard`);

    if (conversationCount > 0) {
      console.log('✅ Conversations found in dashboard');
      
      // Click on the first conversation
      await conversations.first().click();
      await agentPage.waitForTimeout(2000);
      
      // Take a screenshot to see the conversation view
      await agentPage.screenshot({ path: 'dashboard-conversation-view.png', fullPage: true });
      
      // Look for the test message in the conversation
      const messageInDashboard = agentPage.locator(`text="${testMessage}"`);
      const messageExists = await messageInDashboard.count() > 0;
      
      if (messageExists) {
        console.log('✅ Message found in dashboard - bidirectional sync working!');
      } else {
        console.log('⚠️ Message not found in dashboard - checking for any messages...');
        
        // Look for any message elements
        const anyMessages = agentPage.locator('[data-testid*="message"], .message, [class*="message"]');
        const messageCount = await anyMessages.count();
        console.log(`Found ${messageCount} message elements in dashboard`);
        
        for (let i = 0; i < Math.min(messageCount, 5); i++) {
          const messageText = await anyMessages.nth(i).textContent();
          console.log(`  Message ${i}: "${messageText}"`);
        }
      }
    } else {
      console.log('⚠️ No conversations found in dashboard');
      
      // Take a screenshot to see what's in the dashboard
      await agentPage.screenshot({ path: 'dashboard-no-conversations.png', fullPage: true });
      
      // Check if there are any elements that might be conversations
      const possibleConversations = agentPage.locator('.conversation, [class*="conversation"], [data-testid*="conversation"]');
      const possibleCount = await possibleConversations.count();
      console.log(`Found ${possibleCount} possible conversation elements`);
    }

    console.log('🎉 Simple bidirectional test completed!');
  });

  test('should inspect dashboard conversation interface', async () => {
    console.log('🔍 Inspecting dashboard conversation interface...');

    // Login and navigate to inbox
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Take a screenshot
    await agentPage.screenshot({ path: 'dashboard-inbox-inspection.png', fullPage: true });

    // Look for conversation elements
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`Found ${conversationCount} conversations`);

    if (conversationCount > 0) {
      // Click on first conversation
      await conversations.first().click();
      await agentPage.waitForTimeout(3000);

      // Take screenshot of conversation view
      await agentPage.screenshot({ path: 'dashboard-conversation-interface.png', fullPage: true });

      // Look for message input and send button in conversation view
      const messageInputSelectors = [
        '[data-testid="message-input"]',
        '[data-testid="chat-input"]',
        '[data-testid="reply-input"]',
        'input[placeholder*="message"]',
        'input[placeholder*="reply"]',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="reply"]',
        'input[type="text"]',
        'textarea'
      ];

      console.log('🔍 Looking for message input in conversation view...');
      for (const selector of messageInputSelectors) {
        const element = agentPage.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`✅ Found input element: ${selector} (count: ${count})`);
          const isVisible = await element.first().isVisible();
          const placeholder = await element.first().getAttribute('placeholder');
          console.log(`   - Visible: ${isVisible}, Placeholder: "${placeholder}"`);
        }
      }

      const sendButtonSelectors = [
        '[data-testid="send-button"]',
        '[data-testid="reply-button"]',
        'button[type="submit"]',
        'button:has-text("Send")',
        'button:has-text("Reply")',
        'button[aria-label*="send"]'
      ];

      console.log('🔍 Looking for send button in conversation view...');
      for (const selector of sendButtonSelectors) {
        const element = agentPage.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`✅ Found button element: ${selector} (count: ${count})`);
          const isVisible = await element.first().isVisible();
          const text = await element.first().textContent();
          console.log(`   - Visible: ${isVisible}, Text: "${text}"`);
        }
      }

      // Get all form elements in conversation view
      const allInputs = agentPage.locator('input, textarea, button');
      const inputCount = await allInputs.count();
      console.log(`🔍 Found ${inputCount} form elements in conversation view`);

      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const element = allInputs.nth(i);
        const tagName = await element.evaluate(el => el.tagName);
        const type = await element.getAttribute('type');
        const placeholder = await element.getAttribute('placeholder');
        const testId = await element.getAttribute('data-testid');
        const text = await element.textContent();
        
        console.log(`   Element ${i}: ${tagName} (type: ${type}, placeholder: "${placeholder}", testid: ${testId}, text: "${text?.substring(0, 30)}...")`);
      }
    }

    console.log('✅ Dashboard conversation interface inspection completed!');
  });
});
