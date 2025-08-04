import { test, expect } from '@playwright/test';

test('Debug dashboard message sending', async ({ page }) => {
  console.log('🔍 Starting dashboard debug test...');

  // Navigate to dashboard
  await page.goto('http://localhost:3001/dashboard/inbox');
  console.log('✅ Navigated to dashboard');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Check if we can find any conversations
  const conversations = await page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]').count();
  console.log(`📋 Found ${conversations} conversations`);

  if (conversations > 0) {
    // Click on first conversation
    await page.locator('[data-testid="conversation"], .conversation-item, [data-testid="conversation-card"]').first().click();
    console.log('✅ Clicked on first conversation');

    // Wait for chat view to load
    await page.waitForTimeout(2000);

    // Look for message input
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
    const inputCount = await messageInput.count();
    console.log(`📝 Found ${inputCount} message inputs`);

    if (inputCount > 0) {
      // Type a test message
      await messageInput.first().fill('DEBUG TEST: Dashboard message');
      console.log('✅ Typed test message');

      // Look for send button
      const sendButton = page.locator('[data-testid="composer-send-button"], button[aria-label*="Send"]');
      const buttonCount = await sendButton.count();
      console.log(`🔘 Found ${buttonCount} send buttons`);

      if (buttonCount > 0) {
        // Click send button
        await sendButton.first().click({ force: true });
        console.log('✅ Clicked send button');

        // Wait for potential API call
        await page.waitForTimeout(3000);
        console.log('⏳ Waited for API call');
      } else {
        console.log('❌ No send button found');
      }
    } else {
      console.log('❌ No message input found');
    }
  } else {
    console.log('❌ No conversations found');
  }

  console.log('🔍 Dashboard debug test completed');
});
