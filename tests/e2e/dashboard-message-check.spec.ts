import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('Dashboard message visibility check', async ({ page }) => {
  console.log('🔍 DASHBOARD MESSAGE VISIBILITY CHECK');
  console.log('====================================');

  // Step 1: Login to dashboard
  console.log('🔐 Step 1: Logging into dashboard...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_EMAIL, TEST_CONFIG.AGENT_EMAIL);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN_PASSWORD, TEST_CONFIG.AGENT_PASSWORD);
  await page.click(TEST_CONFIG.SELECTORS.LOGIN_SUBMIT);
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('✅ Agent logged in');

  // Step 2: Navigate to inbox
  console.log('📥 Step 2: Navigating to inbox...');
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard/inbox`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Step 3: Check conversations
  console.log('📋 Step 3: Checking conversations...');
  const conversations = await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).count();
  console.log(`📋 Found ${conversations} conversations in dashboard`);

  if (conversations === 0) {
    console.log('❌ No conversations found in dashboard');
    console.log('🔍 This suggests the widget messages are not reaching the dashboard');
    return;
  }

  // Step 4: Check each conversation for our test message
  console.log('🔍 Step 4: Searching for API test message...');
  
  let foundApiMessage = false;
  const searchText = 'API TEST: Direct widget API call';

  for (let i = 0; i < Math.min(conversations, 5); i++) {
    try {
      console.log(`🔍 Checking conversation ${i + 1}...`);
      await page.locator(TEST_CONFIG.SELECTORS.CONVERSATION_ITEM).nth(i).click();
      await page.waitForTimeout(2000);
      
      // Check if this conversation contains our API test message
      const messageExists = await page.locator(`text*="${searchText}"`).count() > 0;
      if (messageExists) {
        console.log(`✅ Found API test message in conversation ${i + 1}`);
        foundApiMessage = true;
        
        // Get all messages in this conversation
        const messages = await page.evaluate(() => {
          const messageElements = Array.from(document.querySelectorAll('[data-testid="message"], .message, .chat-message'));
          return messageElements.map(el => el.textContent?.trim()).filter(Boolean);
        });
        
        console.log('📋 Messages in this conversation:');
        messages.forEach((msg, idx) => {
          console.log(`   ${idx + 1}: ${msg.substring(0, 100)}...`);
        });
        
        break;
      }
    } catch (error) {
      console.log(`⚠️ Could not check conversation ${i + 1}:`, error);
    }
  }

  // Step 5: Test sending a message from dashboard
  if (foundApiMessage) {
    console.log('💬 Step 5: Testing dashboard message send...');
    
    const dashboardMessage = `DASHBOARD TEST: Reply from dashboard ${Date.now()}`;
    
    try {
      await page.fill(TEST_CONFIG.SELECTORS.MESSAGE_INPUT, dashboardMessage);
      await page.click(TEST_CONFIG.SELECTORS.MESSAGE_SEND_BUTTON, { force: true });
      console.log('✅ Dashboard message sent:', dashboardMessage);
      
      await page.waitForTimeout(3000);
      
      // Check if message appears in dashboard
      const messageAppeared = await page.locator(`text="${dashboardMessage}"`).count() > 0;
      console.log(`📋 Dashboard message appeared: ${messageAppeared ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.log('❌ Failed to send dashboard message:', error);
    }
  }

  // Step 6: Summary
  console.log('');
  console.log('🎯 DASHBOARD MESSAGE CHECK SUMMARY');
  console.log('==================================');
  console.log(`📋 Total conversations: ${conversations}`);
  console.log(`✅ API test message found: ${foundApiMessage ? 'YES' : 'NO'}`);
  
  if (foundApiMessage) {
    console.log('🎉 SUCCESS: Widget API messages are reaching the dashboard!');
    console.log('💡 The issue is likely with the widget UI not calling the API properly');
  } else {
    console.log('❌ ISSUE: Widget API messages are not visible in dashboard');
    console.log('💡 This could be a real-time subscription or database query issue');
  }
});
