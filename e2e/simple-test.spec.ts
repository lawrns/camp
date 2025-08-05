import { test, expect } from '@playwright/test';

test.describe('Simple E2E Test', () => {
  test('should load homepage and find widget', async ({ page }) => {
    console.log('🔍 Testing basic homepage load...');
    
    // Navigate to homepage
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Homepage loaded');
    
    // Check if widget button exists
    const widgetButton = page.locator('[data-testid="widget-button"]');
    const buttonCount = await widgetButton.count();
    console.log(`📊 Widget button count: ${buttonCount}`);
    
    if (buttonCount > 0) {
      console.log('✅ Widget button found');
      
      // Click widget button
      await widgetButton.click();
      await page.waitForTimeout(2000);
      
      // Check if widget panel opens
      const widgetPanel = page.locator('[data-testid="widget-panel"]');
      const panelCount = await widgetPanel.count();
      console.log(`📊 Widget panel count: ${panelCount}`);
      
      if (panelCount > 0) {
        console.log('✅ Widget panel opened');
        
        // Check if message input exists
        const messageInput = page.locator('[data-testid="widget-message-input"]');
        const inputCount = await messageInput.count();
        console.log(`📊 Message input count: ${inputCount}`);
        
        if (inputCount > 0) {
          console.log('✅ Message input found');
          
          // Type a test message
          await messageInput.fill('Test message from simple test');
          console.log('✅ Message typed');
          
          // Check if send button exists
          const sendButton = page.locator('[data-testid="widget-send-button"]');
          const sendButtonCount = await sendButton.count();
          console.log(`📊 Send button count: ${sendButtonCount}`);
          
          if (sendButtonCount > 0) {
            console.log('✅ Send button found');
            await sendButton.click();
            console.log('✅ Send button clicked');
          } else {
            console.log('❌ Send button not found');
          }
        } else {
          console.log('❌ Message input not found');
        }
      } else {
        console.log('❌ Widget panel did not open');
      }
    } else {
      console.log('❌ Widget button not found');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'simple-test-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved: simple-test-homepage.png');
  });

  test('should load dashboard and check authentication', async ({ page }) => {
    console.log('🔍 Testing dashboard authentication...');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Dashboard page loaded');
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log(`📊 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Redirected to login page');
      
      // Try to login
      const emailInput = page.locator('input[type="email"], #email, input[name="email"]');
      const passwordInput = page.locator('input[type="password"], #password, input[name="password"]');
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
      
      const emailCount = await emailInput.count();
      const passwordCount = await passwordInput.count();
      const buttonCount = await loginButton.count();
      
      console.log(`📊 Login form elements: email=${emailCount}, password=${passwordCount}, button=${buttonCount}`);
      
      if (emailCount > 0 && passwordCount > 0 && buttonCount > 0) {
        console.log('✅ Login form found, attempting login...');
        
        await emailInput.fill('jam@jam.com');
        await passwordInput.fill('password123');
        await loginButton.click();
        
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`📊 URL after login: ${newUrl}`);
        
        if (newUrl.includes('/dashboard')) {
          console.log('✅ Login successful');
        } else {
          console.log('❌ Login failed');
        }
      } else {
        console.log('❌ Login form not found');
      }
    } else {
      console.log('✅ Already on dashboard (authenticated)');
      
      // Check for conversation elements
      const conversationElements = page.locator('[data-testid="conversation"], .conversation-item, [class*="conversation"]');
      const conversationCount = await conversationElements.count();
      console.log(`📊 Conversation elements found: ${conversationCount}`);
      
      if (conversationCount > 0) {
        console.log('✅ Conversations found');
        
        // Click on first conversation
        await conversationElements.first().click();
        await page.waitForTimeout(2000);
        
        // Check for composer
        const composer = page.locator('[data-testid="composer-textarea"]');
        const composerCount = await composer.count();
        console.log(`📊 Composer found: ${composerCount}`);
        
        if (composerCount > 0) {
          console.log('✅ Composer found');
        } else {
          console.log('❌ Composer not found');
        }
      } else {
        console.log('❌ No conversations found');
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'simple-test-dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved: simple-test-dashboard.png');
  });
}); 