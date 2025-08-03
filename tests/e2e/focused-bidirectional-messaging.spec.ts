/**
 * FOCUSED BIDIRECTIONAL MESSAGING TEST
 * 
 * Tests core messaging functionality:
 * 1. Widget → Agent (visitor sends message, agent sees it)
 * 2. Agent → Widget (agent responds, visitor sees response)
 * 
 * IMMEDIATE FIX PROTOCOL: Stop testing if ANY communication fails
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  organizationId: 'b5e80170-004c-4e82-a88c-3e2166b169dd'
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
  console.log('🔧 Opening widget on homepage...');
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
  
  // Wait for message to appear in widget
  await page.waitForSelector(`[data-testid="message"]:has-text("${message}")`, { timeout: 15000 });
  console.log('✅ Message sent from widget and visible in widget');
}

async function sendMessageFromDashboard(page: Page, message: string) {
  console.log(`💬 Agent sending: "${message}"`);
  
  // Find message input field
  const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
  await messageInput.fill(message);
  
  // Try different send button approaches
  const sendButtons = [
    'button[aria-label*="Send"]',
    'button[type="submit"]',
    'button:has-text("Send")',
    '[data-testid*="send"]'
  ];
  
  let sent = false;
  for (const selector of sendButtons) {
    const button = page.locator(selector);
    const count = await button.count();
    if (count > 0) {
      try {
        await button.first().click({ force: true });
        sent = true;
        console.log(`✅ Message sent from dashboard using selector: ${selector}`);
        break;
      } catch (error) {
        continue;
      }
    }
  }
  
  if (!sent) {
    // Fallback to Enter key
    await messageInput.press('Enter');
    console.log('✅ Message sent from dashboard using Enter key');
  }
}

async function openConversationInDashboard(page: Page) {
  console.log('📂 Opening conversation in dashboard...');
  
  // Wait for conversations to load
  await page.waitForTimeout(5000);
  
  const conversations = page.locator('[data-testid="conversation"]');
  const count = await conversations.count();
  
  console.log(`Found ${count} conversations in dashboard`);
  
  if (count > 0) {
    await conversations.first().click();
    await page.waitForTimeout(3000);
    console.log('✅ Conversation opened in dashboard');
    return true;
  } else {
    console.log('❌ No conversations found in dashboard');
    return false;
  }
}

test.describe('Focused Bidirectional Messaging', () => {
  let agentContext: BrowserContext;
  let visitorContext: BrowserContext;
  let agentPage: Page;
  let visitorPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create completely isolated contexts
    agentContext = await browser.newContext({
      storageState: undefined, // No shared storage
    });
    visitorContext = await browser.newContext({
      storageState: undefined, // No shared storage
    });

    agentPage = await agentContext.newPage();
    visitorPage = await visitorContext.newPage();

    // Clear any existing authentication for visitor (safely)
    await visitorContext.clearCookies();
    try {
      await visitorPage.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.log('Storage clear failed (expected in some contexts):', e);
        }
      });
    } catch (e) {
      console.log('Storage access denied (expected), continuing...');
    }
  });

  test.afterAll(async () => {
    await agentContext.close();
    await visitorContext.close();
  });

  test('should verify complete bidirectional messaging flow', async () => {
    console.log('\n🎯 FOCUSED BIDIRECTIONAL MESSAGING TEST');
    console.log('======================================');

    // Step 1: Setup - Agent logs into dashboard
    console.log('\n--- Step 1: Agent Setup ---');
    await loginAsAgent(agentPage);
    await agentPage.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await agentPage.waitForLoadState('networkidle');

    // Step 2: Visitor opens widget
    console.log('\n--- Step 2: Visitor Opens Widget ---');
    await openWidget(visitorPage);

    // Step 3: Widget → Agent (Visitor sends message)
    console.log('\n--- Step 3: Widget → Agent Communication ---');
    const visitorMessage = `Test message from visitor - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, visitorMessage);

    // Wait for real-time sync
    console.log('⏳ Waiting for real-time sync (15 seconds)...');
    await agentPage.waitForTimeout(15000);

    // Check if message appears in dashboard
    const conversationOpened = await openConversationInDashboard(agentPage);
    
    if (!conversationOpened) {
      console.log('❌ CRITICAL FAILURE: No conversations found in dashboard');
      console.log('🛑 STOPPING TEST - Widget → Agent communication failed');
      expect(conversationOpened).toBe(true);
      return;
    }

    // Verify visitor message appears in dashboard
    const messageInDashboard = agentPage.locator(`text="${visitorMessage}"`);
    const dashboardMsgCount = await messageInDashboard.count();
    
    if (dashboardMsgCount === 0) {
      console.log('❌ CRITICAL FAILURE: Visitor message not found in dashboard');
      console.log('🛑 STOPPING TEST - Widget → Agent communication failed');
      
      // Debug: Take screenshot
      await agentPage.screenshot({ path: 'widget-to-agent-failed.png', fullPage: true });
      
      expect(dashboardMsgCount).toBeGreaterThan(0);
      return;
    }

    console.log('✅ SUCCESS: Widget → Agent communication working');

    // Step 4: Agent → Widget (Agent responds)
    console.log('\n--- Step 4: Agent → Widget Communication ---');
    const agentMessage = `Response from agent - ${Date.now()}`;
    await sendMessageFromDashboard(agentPage, agentMessage);

    // Wait for real-time sync
    console.log('⏳ Waiting for real-time sync (15 seconds)...');
    await visitorPage.waitForTimeout(15000);

    // Verify agent message appears in widget
    const messageInWidget = visitorPage.locator(`text="${agentMessage}"`);
    const widgetMsgCount = await messageInWidget.count();

    if (widgetMsgCount === 0) {
      console.log('❌ CRITICAL FAILURE: Agent message not found in widget');
      console.log('🛑 STOPPING TEST - Agent → Widget communication failed');
      
      // Debug: Check all messages in widget
      const allMessages = visitorPage.locator('[data-testid="message"]');
      const totalMessages = await allMessages.count();
      console.log(`📊 Total messages in widget: ${totalMessages}`);
      
      for (let i = 0; i < Math.min(totalMessages, 5); i++) {
        const msgText = await allMessages.nth(i).textContent();
        console.log(`  Message ${i + 1}: "${msgText}"`);
      }
      
      // Take screenshot
      await visitorPage.screenshot({ path: 'agent-to-widget-failed.png', fullPage: true });
      
      expect(widgetMsgCount).toBeGreaterThan(0);
      return;
    }

    console.log('✅ SUCCESS: Agent → Widget communication working');

    // Step 5: Verify both messages are visible
    console.log('\n--- Step 5: Final Verification ---');
    
    // Verify both messages are still visible in widget
    const visitorMsgStillVisible = await visitorPage.locator(`text="${visitorMessage}"`).count();
    const agentMsgStillVisible = await visitorPage.locator(`text="${agentMessage}"`).count();
    
    console.log(`Visitor message still visible in widget: ${visitorMsgStillVisible > 0}`);
    console.log(`Agent message visible in widget: ${agentMsgStillVisible > 0}`);
    
    expect(visitorMsgStillVisible).toBeGreaterThan(0);
    expect(agentMsgStillVisible).toBeGreaterThan(0);

    // Verify both messages are visible in dashboard
    const visitorMsgInDashboard = await agentPage.locator(`text="${visitorMessage}"`).count();
    const agentMsgInDashboard = await agentPage.locator(`text="${agentMessage}"`).count();
    
    console.log(`Visitor message visible in dashboard: ${visitorMsgInDashboard > 0}`);
    console.log(`Agent message visible in dashboard: ${agentMsgInDashboard > 0}`);
    
    expect(visitorMsgInDashboard).toBeGreaterThan(0);
    expect(agentMsgInDashboard).toBeGreaterThan(0);

    console.log('\n🎉 SUCCESS: Complete bidirectional messaging working!');
    console.log('✅ Widget → Agent: Working');
    console.log('✅ Agent → Widget: Working');
    console.log('✅ Message persistence: Working');
    console.log('✅ Real-time sync: Working');
  });

  test('should verify conversation continuity with simplified implementation', async () => {
    console.log('\n🔄 CONVERSATION CONTINUITY TEST');
    console.log('===============================');

    // Open widget and send first message
    await openWidget(visitorPage);
    const message1 = `Continuity test 1 - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, message1);

    // Get visitor ID from localStorage
    const visitorId = await visitorPage.evaluate((orgId) => {
      return localStorage.getItem(`campfire_visitor_${orgId}`);
    }, TEST_CONFIG.organizationId);

    console.log(`Visitor ID: ${visitorId}`);
    expect(visitorId).toBeTruthy();
    expect(visitorId).toMatch(/^visitor_\d+_[a-z0-9]+$/);

    // Reload page (simulate returning visitor)
    await visitorPage.reload();
    await openWidget(visitorPage);

    // Send second message
    const message2 = `Continuity test 2 - ${Date.now()}`;
    await sendMessageFromWidget(visitorPage, message2);

    // Verify both messages are visible (conversation continuity)
    await visitorPage.waitForTimeout(3000);
    
    const msg1Visible = await visitorPage.locator(`text="${message1}"`).count();
    const msg2Visible = await visitorPage.locator(`text="${message2}"`).count();

    console.log(`Message 1 visible after reload: ${msg1Visible > 0}`);
    console.log(`Message 2 visible: ${msg2Visible > 0}`);

    expect(msg1Visible).toBeGreaterThan(0);
    expect(msg2Visible).toBeGreaterThan(0);

    console.log('✅ SUCCESS: Conversation continuity working with simplified implementation');
  });
});
