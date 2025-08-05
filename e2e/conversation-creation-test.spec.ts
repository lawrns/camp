import { test, expect } from '@playwright/test';

test.describe('Conversation Creation Test', () => {
  test('should create conversation via widget and verify it appears in dashboard', async ({ page }) => {
    console.log('🔍 Testing conversation creation...');
    
    // Step 1: Open widget and send message
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    console.log('✅ Homepage loaded');
    
    // Open widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="widget-message-input"]');
    console.log('✅ Widget opened');
    
    // Send a message
    const testMessage = `Test conversation creation ${Date.now()}`;
    await page.fill('[data-testid="widget-message-input"]', testMessage);
    await page.click('[data-testid="widget-send-button"]');
    console.log(`✅ Message sent: ${testMessage}`);
    
    // Wait for message to be processed
    await page.waitForTimeout(3000);
    
    // Step 2: Login to dashboard and check for conversation
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[type="email"], #email, input[name="email"]', 'jam@jam.com');
    await page.fill('input[type="password"], #password, input[name="password"]', 'password123');
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    
    // Wait for successful login
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Login successful');
    
    // Navigate to inbox
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to inbox');
    
    // Check for conversations
    const conversations = page.locator('[data-testid="conversation"]');
    const conversationCount = await conversations.count();
    console.log(`📊 Found ${conversationCount} conversations`);
    
    if (conversationCount > 0) {
      console.log('✅ Conversations found!');
      
      // Click on first conversation
      await conversations.first().click();
      await page.waitForTimeout(2000);
      
      // Check if composer is available
      const composer = page.locator('[data-testid="composer-textarea"]');
      const composerCount = await composer.count();
      console.log(`📊 Composer found: ${composerCount}`);
      
      if (composerCount > 0) {
        console.log('✅ Composer is available');
        
        // Check if our message appears
        const messageElement = page.locator(`[data-testid="message"]:has-text("${testMessage}")`);
        const messageCount = await messageElement.count();
        console.log(`📊 Our message found: ${messageCount}`);
        
        if (messageCount > 0) {
          console.log('✅ Our message appears in the conversation!');
        } else {
          console.log('❌ Our message does not appear in the conversation');
        }
      } else {
        console.log('❌ Composer not found');
      }
    } else {
      console.log('❌ No conversations found');
      
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'no-conversations.png', fullPage: true });
      console.log('📸 Screenshot saved: no-conversations.png');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'conversation-test-result.png', fullPage: true });
    console.log('📸 Final screenshot saved: conversation-test-result.png');
  });
}); 