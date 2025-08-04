import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Debug conversation IDs and channel alignment', async ({ page, context }) => {
  console.log('🔍 DEBUGGING CONVERSATION IDS AND CHANNEL ALIGNMENT');
  console.log('==================================================');

  // Step 1: Setup widget page and capture conversation ID
  console.log('🔧 Step 1: Setting up homepage widget...');
  const widgetPage = await context.newPage();
  await widgetPage.goto(`${TEST_CONFIG.BASE_URL}/`);
  await widgetPage.waitForLoadState('networkidle');
  await widgetPage.waitForTimeout(3000);

  // Capture widget conversation ID
  const widgetConversationId = await widgetPage.evaluate(() => {
    // Try to get conversation ID from widget context
    const widgetConfig = (window as any).CampfireWidgetConfig;
    const widgetState = (window as any).widgetState;
    
    return {
      config: widgetConfig,
      state: widgetState,
      conversationId: widgetState?.conversationId || 'NOT_FOUND'
    };
  });
  
  console.log('📋 Widget Configuration:', JSON.stringify(widgetConversationId, null, 2));

  // Step 2: Open widget and send message
  console.log('🔧 Step 2: Opening widget and sending message...');
  
  const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);
  if (await widgetButton.count() > 0) {
    await widgetButton.click();
    await widgetPage.waitForTimeout(2000);
    console.log('✅ Widget opened');
  }

  const testMessage = `DEBUG TEST: Widget message ${Date.now()}`;
  await widgetPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', testMessage);
  await widgetPage.click('button[aria-label*="Send"], button:has-text("Send")', { force: true });
  console.log('✅ Widget message sent:', testMessage);
  
  await widgetPage.waitForTimeout(3000);

  // Step 3: Login to dashboard and check conversation
  console.log('🔐 Step 3: Logging into dashboard...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_EMAIL, TEST_CONFIG.AGENT_EMAIL);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_PASSWORD, TEST_CONFIG.AGENT_PASSWORD);
  await page.click(TEST_CONFIG.SELECTORS.LOGIN_SUBMIT);
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in');

  // Step 4: Navigate to inbox and find conversation
  console.log('📥 Step 4: Navigating to inbox...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Find the conversation with our test message
  const conversations = await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).count();
  console.log(`📋 Found ${conversations} conversations in dashboard`);

  let dashboardConversationId = null;
  let foundTestMessage = false;

  for (let i = 0; i < conversations; i++) {
    try {
      await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).nth(i).click();
      await page.waitForTimeout(1000);
      
      // Check if this conversation contains our test message
      const messageExists = await page.locator(`text="${testMessage}"`).count() > 0;
      if (messageExists) {
        console.log(`✅ Found test message in conversation ${i}`);
        foundTestMessage = true;
        
        // Try to extract conversation ID from URL or page state
        const currentUrl = page.url();
        console.log('📋 Dashboard URL:', currentUrl);
        
        // Extract conversation ID from URL if possible
        const urlMatch = currentUrl.match(/conversations\/([a-f0-9-]+)/);
        if (urlMatch) {
          dashboardConversationId = urlMatch[1];
          console.log('📋 Dashboard conversation ID from URL:', dashboardConversationId);
        }
        
        break;
      }
    } catch (error) {
      console.log(`⚠️ Could not check conversation ${i}`);
    }
  }

  if (!foundTestMessage) {
    console.log('❌ Test message not found in any dashboard conversation');
    return;
  }

  // Step 5: Send reply from dashboard
  console.log('💬 Step 5: Sending reply from dashboard...');
  const dashboardReply = `DEBUG REPLY: Dashboard to Widget ${Date.now()}`;
  
  try {
    await page.fill(TEST_CONFIG.SELECTORS.MESSAGE_INPUT, dashboardReply);
    await page.click(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON, { force: true });
    console.log('✅ Dashboard reply sent:', dashboardReply);
    await page.waitForTimeout(3000);
  } catch (error) {
    console.log('❌ Failed to send dashboard reply:', error);
  }

  // Step 6: Check if reply appears in widget
  console.log('🔍 Step 6: Checking if reply appears in widget...');
  
  try {
    await widgetPage.waitForSelector(`text="${dashboardReply}"`, { timeout: 10000 });
    console.log('🎉 SUCCESS! Dashboard reply appeared in widget');
  } catch (error) {
    console.log('❌ Dashboard reply not found in widget');
    
    // Debug widget state
    const widgetMessages = await widgetPage.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('[data-testid="widget-message"], .message, .chat-message'));
      return messages.map(msg => msg.textContent?.trim()).filter(Boolean);
    });
    
    console.log('🔍 Current widget messages:', JSON.stringify(widgetMessages, null, 2));
  }

  // Step 7: Debug channel information
  console.log('📡 Step 7: Channel debugging...');
  
  const expectedChannel = `org:${TEST_CONFIG.TEST_ORG_ID}:conv:${TEST_CONFIG.TEST_CONVERSATION_ID}`;
  console.log('📡 Expected channel (from config):', expectedChannel);
  
  if (dashboardConversationId) {
    const actualChannel = `org:${TEST_CONFIG.TEST_ORG_ID}:conv:${dashboardConversationId}`;
    console.log('📡 Actual channel (from dashboard):', actualChannel);
    console.log('🔍 Channels match:', expectedChannel === actualChannel);
  }

  // Step 8: Summary
  console.log('');
  console.log('🎯 DEBUGGING SUMMARY');
  console.log('===================');
  console.log(`📋 Test Conversation ID: ${TEST_CONFIG.TEST_CONVERSATION_ID}`);
  console.log(`📋 Dashboard Conversation ID: ${dashboardConversationId || 'NOT_FOUND'}`);
  console.log(`📋 Widget Conversation ID: ${widgetConversationId.conversationId}`);
  console.log(`✅ Widget → Dashboard: ${foundTestMessage ? 'WORKING' : 'FAILED'}`);
  
  const replyInWidget = await widgetPage.locator(`text="${dashboardReply}"`).count() > 0;
  console.log(`❌ Dashboard → Widget: ${replyInWidget ? 'WORKING' : 'FAILED'}`);
  
  if (dashboardConversationId !== TEST_CONFIG.TEST_CONVERSATION_ID) {
    console.log('');
    console.log('🚨 ISSUE IDENTIFIED: Conversation ID mismatch!');
    console.log('💡 Solution: Ensure widget uses the same conversation ID as dashboard');
  }
});
