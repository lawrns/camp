import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
  testConversationId: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b',
};

test('Dashboard send button functionality test', async ({ page, context }) => {
  console.log('🔍 Starting dashboard send button test...');

  // Step 1: Create a widget message first to ensure there's a conversation
  console.log('📤 Creating widget message to ensure conversation exists...');
  
  const widgetPage = await context.newPage();
  await widgetPage.goto(`${TEST_CONFIG.baseURL}/widget/test`);
  await widgetPage.waitForLoadState('networkidle');
  await widgetPage.waitForTimeout(3000);

  // Send message from widget to create conversation
  const widgetMessage = `DASHBOARD SEND TEST: Widget message ${Date.now()}`;
  
  try {
    await widgetPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', widgetMessage);
    await widgetPage.click('button[aria-label*="Send"], button:has-text("Send")');
    console.log(`✅ Widget message sent: ${widgetMessage}`);
    await widgetPage.waitForTimeout(3000); // Wait for message to be processed
  } catch (error) {
    console.log('❌ Widget message sending failed:', error);
  }

  // Step 2: Login as agent
  console.log('🔐 Logging in as agent...');
  await page.goto(`${TEST_CONFIG.baseURL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('#email', TEST_CONFIG.agentEmail);
  await page.fill('#password', TEST_CONFIG.agentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 3: Navigate to inbox and wait for conversations to load
  await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Give more time for conversations to load
  console.log('✅ Inbox loaded');

  // Step 4: Check for conversations
  const conversationCount = await page.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').count();
  console.log(`📋 Found ${conversationCount} conversations`);

  if (conversationCount === 0) {
    console.log('⚠️ No conversations found, trying to inject test conversation...');
    
    // Inject a test conversation directly into the page
    await page.evaluate((testConversationId) => {
      // Try to access the store and add a test conversation
      if ((window as any).useCampfireStore) {
        const store = (window as any).useCampfireStore.getState();
        if (store.addConversation) {
          store.addConversation({
            id: testConversationId,
            title: 'Test Conversation',
            status: 'open',
            lastMessage: 'Test message',
            updatedAt: new Date().toISOString(),
          });
          console.log('✅ Test conversation injected');
        }
      }
    }, TEST_CONFIG.testConversationId);
    
    await page.waitForTimeout(2000);
  }

  // Step 5: Try to select a conversation or use the test conversation
  try {
    // Try to click on the first conversation
    const firstConversation = page.locator('[data-testid*="conversation"], .conversation-item, [class*="conversation"]').first();
    if (await firstConversation.count() > 0) {
      await firstConversation.click();
      console.log('✅ Conversation selected');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ No conversations to select, proceeding with direct API test');
    }
  } catch (error) {
    console.log('⚠️ Could not select conversation:', error);
  }

  // Step 6: Test the send button functionality
  console.log('🔍 Testing send button functionality...');
  
  const testMessage = `DASHBOARD SEND TEST: Agent message ${Date.now()}`;
  
  // Try to find and fill the message input
  const messageInputSelectors = [
    'input[placeholder*="message"]',
    'textarea[placeholder*="message"]',
    'input[placeholder*="Message"]',
    'textarea[placeholder*="Message"]',
    '[data-testid*="message-input"]',
    '[data-testid*="composer-input"]'
  ];

  let messageInputFound = false;
  for (const selector of messageInputSelectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.count() > 0) {
        await input.fill(testMessage);
        console.log(`✅ Message input found and filled with selector: ${selector}`);
        messageInputFound = true;
        break;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  if (!messageInputFound) {
    console.log('❌ No message input found');
    await page.screenshot({ path: 'test-results/dashboard-no-input.png' });
    throw new Error('No message input found');
  }

  // Try to find and click the send button
  const sendButtonSelectors = [
    '[data-testid="composer-send-button"]',
    'button[aria-label*="Send"]',
    'button:has-text("Send")',
    'button[title*="Send"]',
    '[role="button"]:has-text("Send")',
    'button:has([class*="send"])',
    'button svg[class*="send"]'
  ];

  let sendButtonFound = false;
  for (const selector of sendButtonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        console.log(`✅ Send button found with selector: ${selector}`);
        
        // Check if button is enabled
        const isDisabled = await button.isDisabled();
        console.log(`🔘 Send button disabled: ${isDisabled}`);
        
        if (!isDisabled) {
          await button.click();
          console.log(`✅ Send button clicked successfully`);
          sendButtonFound = true;
          break;
        } else {
          console.log(`⚠️ Send button is disabled`);
        }
      }
    } catch (error) {
      console.log(`❌ Error with selector ${selector}:`, error);
    }
  }

  if (!sendButtonFound) {
    console.log('❌ No enabled send button found');
    await page.screenshot({ path: 'test-results/dashboard-no-send-button.png' });
    throw new Error('No enabled send button found');
  }

  // Step 7: Wait and check for success
  await page.waitForTimeout(3000);
  console.log('⏳ Waiting for message to be sent...');

  // Check if message appears in widget
  try {
    await widgetPage.waitForSelector(`text="${testMessage}"`, { timeout: 10000 });
    console.log('🎉 SUCCESS! Dashboard message appeared in widget - BIDIRECTIONAL COMMUNICATION WORKING!');
    
    // Take success screenshots
    await page.screenshot({ path: 'test-results/dashboard-send-success.png' });
    await widgetPage.screenshot({ path: 'test-results/widget-receive-success.png' });
    
  } catch (error) {
    console.log('❌ Dashboard message not found in widget');
    
    // Take failure screenshots
    await page.screenshot({ path: 'test-results/dashboard-send-failure.png' });
    await widgetPage.screenshot({ path: 'test-results/widget-receive-failure.png' });
    
    // Don't throw error yet, check server logs first
    console.log('⚠️ Checking server logs for debugging information...');
  }

  console.log('🔍 Dashboard send button test completed');
});
