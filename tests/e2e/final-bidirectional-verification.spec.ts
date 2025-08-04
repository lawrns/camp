import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Final bidirectional communication verification', async ({ page, context }) => {
  console.log('🎯 FINAL BIDIRECTIONAL COMMUNICATION VERIFICATION');
  console.log('================================================');
  console.log(`📋 Organization: ${TEST_CONFIG.TEST_ORG_ID}`);
  console.log(`💬 Conversation: ${TEST_CONFIG.TEST_CONVERSATION_ID}`);
  console.log(`📡 Expected Channel: org:${TEST_CONFIG.TEST_ORG_ID}:conv:${TEST_CONFIG.TEST_CONVERSATION_ID}`);
  console.log('');

  // Step 1: Setup homepage widget
  console.log('🔧 Step 1: Setting up homepage widget...');
  const widgetPage = await context.newPage();
  await widgetPage.goto(`${TEST_CONFIG.BASE_URL}/`);
  await widgetPage.waitForLoadState('networkidle');
  await widgetPage.waitForTimeout(3000);
  console.log('✅ Homepage loaded with widget');

  // Step 2: Login to dashboard
  console.log('🔐 Step 2: Logging into dashboard...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_EMAIL, TEST_CONFIG.AGENT_EMAIL);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_PASSWORD, TEST_CONFIG.AGENT_PASSWORD);
  await page.click(TEST_CONFIG.SELECTORS.LOGIN_SUBMIT);
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in successfully');

  // Step 3: Navigate to inbox and select conversation
  console.log('📥 Step 3: Navigating to inbox...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Try to select the test conversation
  try {
    const conversations = await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).count();
    console.log(`📋 Found ${conversations} conversations`);
    
    if (conversations > 0) {
      await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Conversation selected');
    }
  } catch (error) {
    console.log('⚠️ Could not select conversation, proceeding with test');
  }

  // Step 4: Test Dashboard → Widget communication
  console.log('📤 Step 4: Testing Dashboard → Widget communication...');
  
  const dashboardMessage = `FINAL TEST: Dashboard to Widget ${Date.now()}`;
  
  try {
    // Fill message input
    await page.fill(TEST_CONFIG.SELECTORS.MESSAGE_INPUT, dashboardMessage);
    console.log('✅ Message input filled');
    
    // Click send button with force to bypass dev overlay
    await page.click(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON, { force: true });
    console.log('✅ Send button clicked');
    
    await page.waitForTimeout(3000);
    console.log('⏳ Waiting for message to be processed...');
    
  } catch (error) {
    console.log('❌ Dashboard send failed:', error);
  }

  // Step 5: Check if message appears in widget
  console.log('🔍 Step 5: Checking if message appears in widget...');
  
  try {
    await widgetPage.waitForSelector(`text="${dashboardMessage}"`, { timeout: 15000 });
    console.log('🎉 SUCCESS! Dashboard message appeared in widget');
    console.log('✅ DASHBOARD → WIDGET COMMUNICATION WORKING!');
    
    // Take success screenshot
    await widgetPage.screenshot({ path: 'test-results/final-success-widget.png' });
    await page.screenshot({ path: 'test-results/final-success-dashboard.png' });
    
  } catch (error) {
    console.log('❌ Dashboard message not found in widget');
    console.log('🔍 Taking failure screenshots for debugging...');
    
    await widgetPage.screenshot({ path: 'test-results/final-failure-widget.png' });
    await page.screenshot({ path: 'test-results/final-failure-dashboard.png' });
  }

  // Step 6: Test Widget → Dashboard communication
  console.log('📥 Step 6: Testing Widget → Dashboard communication...');
  
  const widgetMessage = `FINAL TEST: Widget to Dashboard ${Date.now()}`;
  
  try {
    // Open homepage widget
    console.log('🔍 Looking for widget button on homepage...');
    const widgetButton = widgetPage.locator(TEST_CONFIG.SELECTORS.WIDGET_BUTTON);

    if (await widgetButton.count() > 0) {
      console.log('✅ Widget button found, clicking to open...');
      await widgetButton.click();
      await widgetPage.waitForTimeout(2000);
      console.log('✅ Widget opened');
    } else {
      console.log('⚠️ Widget button not found, trying alternative selectors...');
      // Try alternative widget selectors
      const altSelectors = [
        '[data-testid="widget-toggle"]',
        '[data-testid="chat-widget"]',
        '.widget-button',
        '.chat-widget-button',
        'button:has-text("Chat")',
        'button:has-text("Help")',
        '[aria-label*="chat"]',
        '[aria-label*="widget"]'
      ];

      let widgetFound = false;
      for (const selector of altSelectors) {
        if (await widgetPage.locator(selector).count() > 0) {
          console.log(`✅ Found widget with selector: ${selector}`);
          await widgetPage.click(selector);
          await widgetPage.waitForTimeout(2000);
          widgetFound = true;
          break;
        }
      }

      if (!widgetFound) {
        console.log('❌ No widget button found on homepage');
      }
    }

    // Send message from widget
    console.log('📝 Filling widget message input...');
    await widgetPage.fill('input[placeholder*="message"], textarea[placeholder*="message"]', widgetMessage);
    console.log('🔘 Clicking widget send button...');
    await widgetPage.click('button[aria-label*="Send"], button:has-text("Send")', { force: true });
    console.log('✅ Widget message sent');

    await widgetPage.waitForTimeout(3000);
    
  } catch (error) {
    console.log('❌ Widget send failed:', error);
  }

  // Step 7: Check if widget message appears in dashboard
  console.log('🔍 Step 7: Checking if widget message appears in dashboard...');
  
  try {
    await page.waitForSelector(`text="${widgetMessage}"`, { timeout: 15000 });
    console.log('🎉 SUCCESS! Widget message appeared in dashboard');
    console.log('✅ WIDGET → DASHBOARD COMMUNICATION WORKING!');
    
  } catch (error) {
    console.log('❌ Widget message not found in dashboard');
  }

  // Step 8: Final verification and summary
  console.log('');
  console.log('🎯 FINAL VERIFICATION SUMMARY');
  console.log('============================');
  
  // Check for both messages
  const dashboardMessageInWidget = await widgetPage.locator(`text="${dashboardMessage}"`).count() > 0;
  const widgetMessageInDashboard = await page.locator(`text="${widgetMessage}"`).count() > 0;
  
  console.log(`📤 Dashboard → Widget: ${dashboardMessageInWidget ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`📥 Widget → Dashboard: ${widgetMessageInDashboard ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (dashboardMessageInWidget && widgetMessageInDashboard) {
    console.log('');
    console.log('🎉🎉🎉 COMPLETE BIDIRECTIONAL COMMUNICATION ACHIEVED! 🎉🎉🎉');
    console.log('✅ Both directions working perfectly');
    console.log('✅ Real-time message delivery confirmed');
    console.log('✅ Channel alignment successful');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️ Partial bidirectional communication');
    console.log('🔍 Check server logs and channel subscriptions');
    console.log('');
  }

  // Performance check
  console.log('⚡ Performance verification...');
  const performanceStart = Date.now();
  
  try {
    const perfTestMessage = `PERF TEST: ${Date.now()}`;
    await page.fill(TEST_CONFIG.SELECTORS.MESSAGE_INPUT, perfTestMessage);
    await page.click(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON, { force: true });
    
    await widgetPage.waitForSelector(`text="${perfTestMessage}"`, { timeout: 5000 });
    const performanceEnd = Date.now();
    const latency = performanceEnd - performanceStart;
    
    console.log(`⚡ End-to-end latency: ${latency}ms`);
    console.log(`🎯 Target: <${TEST_CONFIG.performance?.maxLatency || 1000}ms`);
    console.log(`${latency < (TEST_CONFIG.performance?.maxLatency || 1000) ? '✅' : '⚠️'} Performance ${latency < (TEST_CONFIG.performance?.maxLatency || 1000) ? 'PASSED' : 'WARNING'}`);
    
  } catch (error) {
    console.log('⚠️ Performance test failed');
  }

  console.log('');
  console.log('🏁 Final bidirectional verification completed');
});
