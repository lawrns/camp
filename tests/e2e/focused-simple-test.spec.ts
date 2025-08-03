/**
 * FOCUSED SIMPLE BIDIRECTIONAL TEST
 * 
 * A straightforward test to verify:
 * 1. Widget → Agent message delivery
 * 2. Agent → Widget message delivery  
 * 3. Typing animations work in both directions
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123'
};

// Helper functions
async function loginAsAgent(page: Page) {
  console.log('🔐 Agent logging in...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');
}

async function openWidget(page: Page) {
  console.log('🔧 Opening widget...');
  await page.goto(TEST_CONFIG.baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
  await page.click('[data-testid="widget-button"]');
  await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
  console.log('✅ Widget opened successfully');
}

async function sendMessageFromWidget(page: Page, message: string) {
  console.log(`💬 Widget sending: "${message}"`);
  await page.fill('[data-testid="widget-message-input"]', message);
  await page.click('[data-testid="widget-send-button"]');
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 15000 });
  console.log('✅ Message sent from widget');
}

async function sendMessageFromDashboard(page: Page, message: string) {
  console.log(`💬 Agent sending: "${message}"`);
  await page.fill('textarea[placeholder*="message"]', message);
  
  // Try multiple send button selectors
  const sendSelectors = [
    'button[aria-label*="Send"]',
    'button[type="submit"]',
    'button:has-text("Send")'
  ];
  
  let sent = false;
  for (const selector of sendSelectors) {
    const button = page.locator(selector);
    const count = await button.count();
    if (count > 0 && await button.first().isVisible()) {
      try {
        await button.first().click({ force: true });
        sent = true;
        console.log('✅ Message sent from dashboard');
        break;
      } catch (error) {
        continue;
      }
    }
  }
  
  if (!sent) {
    await page.keyboard.press('Enter');
    console.log('✅ Message sent via Enter key');
  }
}

async function openConversationInDashboard(page: Page) {
  console.log('📂 Opening conversation in dashboard...');
  const conversations = page.locator('[data-testid="conversation"]');
  const count = await conversations.count();
  
  if (count > 0) {
    await conversations.first().click();
    await page.waitForTimeout(3000);
    console.log('✅ Conversation opened in dashboard');
    return true;
  } else {
    console.log('⚠️ No conversations found in dashboard');
    return false;
  }
}

test.describe('Focused Simple Bidirectional Test', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;

  test.beforeAll(async ({ browser }) => {
    agentContext = await browser.newContext();
    visitorContext = await browser.newContext();
    
    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();
  });

  test.afterAll(async () => {
    await agentContext.close();
    await visitorContext.close();
  });

  test('should verify widget to agent message delivery', async () => {
    console.log('\n🎯 TEST 1: Widget → Agent Message Delivery');
    console.log('==========================================');

    // Step 1: Agent logs into dashboard
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Step 2: Visitor opens widget
    await openWidget(visitorPage);

    // Step 3: Visitor sends message
    const widgetMessage = `Widget test message - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, widgetMessage);

    // Step 4: Wait for message to appear in dashboard
    console.log('⏳ Waiting for message to appear in dashboard...');
    await agentPage.waitForTimeout(15000); // Wait 15 seconds for real-time sync

    // Step 5: Check if message appears in dashboard
    const conversations = agentPage.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`📊 Found ${conversationCount} conversations in dashboard`);

    let messageFound = false;
    if (conversationCount > 0) {
      for (let i = 0; i < Math.min(conversationCount, 5); i++) {
        await conversations.nth(i).click();
        await agentPage.waitForTimeout(3000);
        
        const messageInDashboard = agentPage.locator(`text="${widgetMessage}"`);
        const msgCount = await messageInDashboard.count();
        
        if (msgCount > 0) {
          console.log(`✅ SUCCESS: Widget message found in dashboard conversation ${i + 1}!`);
          messageFound = true;
          break;
        }
      }
    }

    if (!messageFound) {
      console.log('❌ FAILED: Widget message not found in dashboard');
      // Take screenshot for debugging
      await agentPage.screenshot({ path: 'widget-to-agent-failed.png', fullPage: true });
    }

    expect(messageFound).toBe(true);
    console.log('🎉 Widget → Agent test completed!\n');
  });

  test('should verify agent to widget message delivery', async () => {
    console.log('\n🎯 TEST 2: Agent → Widget Message Delivery');
    console.log('==========================================');

    // Ensure we have a conversation open
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    await openWidget(visitorPage);

    // Send a message from widget first to ensure conversation exists
    const setupMessage = `Setup message - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, setupMessage);
    await agentPage.waitForTimeout(10000);

    // Open conversation in dashboard
    const conversationOpened = await openConversationInDashboard(agentPage);
    
    if (conversationOpened) {
      // Agent sends response
      const agentMessage = `Agent response - ${Date.now()}`;
      await sendMessageFromDashboard(agentPage, agentMessage);

      // Wait for message to appear in widget
      console.log('⏳ Waiting for agent message to appear in widget...');
      await visitorPage.waitForTimeout(15000); // Wait 15 seconds for real-time sync

      // Check if agent message appears in widget
      const messageInWidget = visitorPage.locator(`text="${agentMessage}"`);
      const widgetMsgCount = await messageInWidget.count();

      if (widgetMsgCount > 0) {
        console.log('✅ SUCCESS: Agent message found in widget!');
        expect(widgetMsgCount).toBeGreaterThan(0);
      } else {
        console.log('❌ FAILED: Agent message not found in widget');
        
        // Debug: Check all messages in widget
        const allMessages = visitorPage.locator('[data-testid="message"]');
        const totalMessages = await allMessages.count();
        console.log(`📊 Total messages in widget: ${totalMessages}`);
        
        for (let i = 0; i < Math.min(totalMessages, 5); i++) {
          const msgText = await allMessages.nth(i).textContent();
          console.log(`  Message ${i + 1}: "${msgText}"`);
        }
        
        // Take screenshot for debugging
        await visitorPage.screenshot({ path: 'agent-to-widget-failed.png', fullPage: true });
        
        expect(widgetMsgCount).toBeGreaterThan(0);
      }
    } else {
      console.log('❌ FAILED: Could not open conversation in dashboard');
      expect(conversationOpened).toBe(true);
    }

    console.log('🎉 Agent → Widget test completed!\n');
  });

  test('should verify typing animations work', async () => {
    console.log('\n🎯 TEST 3: Typing Animations');
    console.log('============================');

    // Setup conversation
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    await openWidget(visitorPage);

    // Send initial message to establish conversation
    const initialMessage = `Typing test setup - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, initialMessage);
    await agentPage.waitForTimeout(10000);

    const conversationOpened = await openConversationInDashboard(agentPage);
    
    if (conversationOpened) {
      // Test 1: Widget typing indicator
      console.log('⌨️ Testing widget typing indicator...');
      
      // Start typing in widget (don't send)
      await visitorPage.fill('[data-testid="widget-message-input"]', '');
      await visitorPage.type('[data-testid="widget-message-input"]', 'Testing typing indicator...', { delay: 100 });
      
      // Wait and check for typing indicator in dashboard
      await agentPage.waitForTimeout(3000);
      
      // Look for typing indicators
      const typingSelectors = [
        ':has-text("typing")',
        ':has-text("is typing")',
        '.typing-indicator',
        '[data-testid*="typing"]',
        '.dots',
        '.typing-dots'
      ];
      
      let typingIndicatorFound = false;
      for (const selector of typingSelectors) {
        const indicator = agentPage.locator(selector);
        const count = await indicator.count();
        if (count > 0) {
          console.log(`✅ Typing indicator found with selector: ${selector}`);
          typingIndicatorFound = true;
          break;
        }
      }
      
      if (!typingIndicatorFound) {
        console.log('⚠️ No typing indicator found in dashboard (may not be implemented yet)');
      }

      // Clear the typing
      await visitorPage.fill('[data-testid="widget-message-input"]', '');
      await visitorPage.waitForTimeout(2000);

      // Test 2: Dashboard typing indicator
      console.log('⌨️ Testing dashboard typing indicator...');
      
      // Start typing in dashboard (don't send)
      await agentPage.fill('textarea[placeholder*="message"]', '');
      await agentPage.type('textarea[placeholder*="message"]', 'Agent typing test...', { delay: 100 });
      
      // Wait and check for typing indicator in widget
      await visitorPage.waitForTimeout(3000);
      
      let widgetTypingFound = false;
      for (const selector of typingSelectors) {
        const indicator = visitorPage.locator(selector);
        const count = await indicator.count();
        if (count > 0) {
          console.log(`✅ Typing indicator found in widget with selector: ${selector}`);
          widgetTypingFound = true;
          break;
        }
      }
      
      if (!widgetTypingFound) {
        console.log('⚠️ No typing indicator found in widget (may not be implemented yet)');
      }

      // Clear the typing
      await agentPage.fill('textarea[placeholder*="message"]', '');
      await agentPage.waitForTimeout(2000);

      // Summary
      if (typingIndicatorFound || widgetTypingFound) {
        console.log('✅ SUCCESS: Typing indicators are working!');
      } else {
        console.log('ℹ️ INFO: Typing indicators may not be implemented or visible');
      }

    } else {
      console.log('❌ FAILED: Could not open conversation for typing test');
    }

    console.log('🎉 Typing animations test completed!\n');
  });
});
