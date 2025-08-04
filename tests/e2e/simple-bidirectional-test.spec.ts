/**
 * SIMPLE BIDIRECTIONAL COMMUNICATION TEST
 * 
 * This test runs sequentially to avoid conflicts between parallel test workers
 * trying to use the same widget instance.
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  timeout: 30000,
};

test.describe('Simple Bidirectional Communication Test', () => {
  test('should test basic widget to dashboard message flow', async ({ page }) => {
    console.log('🚀 Starting simple bidirectional communication test...');

    // Step 1: Login as agent
    console.log('🔐 Logging in as agent...');
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', TEST_CONFIG.agentEmail);
    await page.fill('#password', TEST_CONFIG.agentPassword);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Agent logged in successfully');

    // Step 2: Navigate to inbox
    console.log('📂 Navigating to inbox...');
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Inbox loaded');

    // Step 3: Open widget in a new tab
    console.log('🔧 Opening widget in new tab...');
    const widgetPage = await page.context().newPage();
    await widgetPage.goto(TEST_CONFIG.baseURL);
    await widgetPage.waitForLoadState('networkidle');

    // Wait for widget button and click it
    await widgetPage.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
    console.log('✅ Widget button found, clicking...');
    await widgetPage.click('[data-testid="widget-button"]');

    // Wait for widget panel and message input
    await widgetPage.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
    await widgetPage.waitForSelector('[data-testid="widget-message-input"]', { timeout: 10000 });
    await widgetPage.waitForSelector('[data-testid="widget-send-button"]', { timeout: 10000 });
    console.log('✅ Widget opened successfully');

    // Step 4: Send a message from widget
    console.log('💬 Sending message from widget...');
    const testMessage = `Test message - ${Date.now()}`;
    
    await widgetPage.fill('[data-testid="widget-message-input"]', testMessage);
    console.log('✅ Message filled in widget input');
    
    await widgetPage.click('[data-testid="widget-send-button"]');
    console.log('✅ Send button clicked');

    // Step 5: Verify message appears in widget
    await widgetPage.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
    console.log('✅ Message appeared in widget');

    // Step 6: Check if conversation appears in dashboard first
    console.log('📋 Checking for conversation in dashboard...');
    await page.waitForTimeout(5000); // Wait a bit for real-time updates
    
    const conversations = page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]');
    const conversationCount = await conversations.count();
    console.log(`📋 Found ${conversationCount} conversation(s) in dashboard`);
    
    if (conversationCount > 0) {
      console.log('✅ Conversation created in dashboard');
      
      // Click on the conversation to open it
      await conversations.first().click();
      console.log('✅ Conversation opened in dashboard');
      
      // Wait for conversation to load
      await page.waitForTimeout(3000);
      
      // Now look for the message in the opened conversation
      await page.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
      console.log('✅ Message appeared in dashboard conversation');
    } else {
      console.log('❌ No conversation found in dashboard');
      // Take a screenshot to see what's in the dashboard
      await page.screenshot({ path: 'dashboard-no-conversation.png', fullPage: true });
      throw new Error('No conversation was created in dashboard');
    }

    // Step 7: Send a reply from dashboard
    console.log('💬 Sending reply from dashboard...');
    const replyMessage = `Agent reply - ${Date.now()}`;
    
    // Look for message input in dashboard
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
    await messageInput.fill(replyMessage);
    console.log('✅ Reply message filled in dashboard input');
    
    // Look for send button in dashboard - use more specific selector
    const sendButton = page.locator('button[aria-label="Send message"]');
    await sendButton.click({ force: true });
    console.log('✅ Send button clicked in dashboard');

    // Step 8: Verify reply appears in dashboard
    await page.waitForSelector(`text="${replyMessage}"`, { timeout: 10000 });
    console.log('✅ Reply appeared in dashboard');

    // Step 9: Verify reply appears in widget
    console.log('🔍 Checking for reply in widget...');
    
    // Wait a bit longer for real-time updates
    await widgetPage.waitForTimeout(5000);
    
    // Check if there are any messages in the widget
    const widgetMessages = widgetPage.locator('[data-testid="message"]');
    const messageCount = await widgetMessages.count();
    console.log(`📨 Found ${messageCount} message(s) in widget`);
    
    if (messageCount > 0) {
      // Get the text of all messages to see what's there
      for (let i = 0; i < Math.min(messageCount, 5); i++) {
        const messageText = await widgetMessages.nth(i).textContent();
        console.log(`   Message ${i + 1}: "${messageText?.trim()}"`);
      }
    }
    
    // Take screenshot before waiting for reply
    await widgetPage.screenshot({ path: 'test-results/widget-before-reply-check.png' });

    // Check widget state before waiting
    const widgetState = await widgetPage.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500),
        messageElements: document.querySelectorAll('[data-testid="message"]').length
      };
    });
    console.log('🔍 Widget state before waiting for reply:', widgetState);

    // Try to find the reply message
    try {
      await widgetPage.waitForSelector(`text="${replyMessage}"`, { timeout: 45000 });
      console.log('✅ Reply appeared in widget');
    } catch (error) {
      console.log('❌ Reply not found in widget');

      // Check widget console logs for broadcast events
      const widgetLogs = await widgetPage.evaluate(() => {
        return (window as any).widgetBroadcastLogs || [];
      });
      console.log('🔍 Widget broadcast logs:', JSON.stringify(widgetLogs, null, 2));

      // Check for any console errors
      const consoleMessages = await widgetPage.evaluate(() => {
        return (window as any).console?.logs || 'No console logs captured';
      });
      console.log('🔍 Widget console messages:', consoleMessages);

      // Take a screenshot of the widget to see what's there
      await widgetPage.screenshot({ path: 'widget-no-reply.png', fullPage: true });

      throw new Error(`Reply message "${replyMessage}" not found in widget. Check broadcast logs above.`);
    }

    console.log('🎉 Simple bidirectional communication test completed successfully!');
    
    // Close widget page
    await widgetPage.close();
  });
}); 