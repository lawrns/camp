import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123',
};

test('Manual dashboard message sending test', async ({ page }) => {
  console.log('🔍 Starting manual dashboard message sending test...');

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
  await page.waitForTimeout(3000); // Wait for conversations to load
  console.log('✅ Inbox loaded');

  // Step 3: Check conversations
  const conversations = await page.locator('[data-testid="conversation-row"], [data-testid="conversation-card"]').count();
  console.log(`📋 Found ${conversations} conversations`);

  if (conversations > 0) {
    // Step 4: Click on first conversation
    await page.locator('[data-testid="conversation-row"], [data-testid="conversation-card"]').first().click();
    console.log('✅ Clicked on first conversation');
    
    // Wait for chat view to load
    await page.waitForTimeout(2000);

    // Step 5: Look for message input and send button
    const messageInputs = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').count();
    console.log(`📝 Found ${messageInputs} message inputs`);

    if (messageInputs > 0) {
      const testMessage = `MANUAL TEST: Dashboard message ${Date.now()}`;
      
      // Type message
      await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first().fill(testMessage);
      console.log(`✅ Typed message: ${testMessage}`);

      // Look for send button
      const sendButtons = await page.locator('[data-testid="composer-send-button"], button[aria-label*="Send"]').count();
      console.log(`🔘 Found ${sendButtons} send buttons`);

      if (sendButtons > 0) {
        // Click send button
        await page.locator('[data-testid="composer-send-button"], button[aria-label*="Send"]').first().click({ force: true });
        console.log('✅ Clicked send button');

        // Wait for API call
        await page.waitForTimeout(5000);
        console.log('⏳ Waited for API call - check server logs for Dashboard Messages API');
      } else {
        console.log('❌ No send button found');
        
        // Try Enter key
        await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first().press('Enter');
        console.log('✅ Pressed Enter key');
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('❌ No message input found');
    }
  } else {
    console.log('❌ No conversations found');
  }

  console.log('🔍 Manual dashboard test completed - check server logs for API calls');
});
