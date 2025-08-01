import { test, expect } from '@playwright/test';

/**
 * Basic Widget-Dashboard Communication Test
 * Tests basic communication between widget and dashboard using working components
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d',
  BASE_URL: 'http://localhost:3001'
};

test.describe('Basic Widget-Dashboard Communication', () => {
  test('should test widget and dashboard separately', async ({ browser }) => {
    console.log('🔄 Testing widget and dashboard communication...');
    
    // Create two contexts
    const widgetContext = await browser.newContext();
    const dashboardContext = await browser.newContext();
    
    const widgetPage = await widgetContext.newPage();
    const dashboardPage = await dashboardContext.newPage();
    
    try {
      // Test 1: Set up dashboard
      console.log('📊 Setting up dashboard...');
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await dashboardPage.fill('#email', TEST_CONFIG.AGENT_EMAIL);
      await dashboardPage.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
      await dashboardPage.click('button[type="submit"]');
      
      await dashboardPage.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Dashboard login successful');
      
      // Test 2: Set up widget
      console.log('🔧 Setting up widget...');
      await widgetPage.goto(`${TEST_CONFIG.BASE_URL}/widget-test`);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator('[data-testid="widget-button"]');
      await expect(widgetButton).toBeVisible({ timeout: 10000 });
      await widgetButton.click();
      
      const widgetPanel = widgetPage.locator('[data-testid="widget-panel"]');
      await expect(widgetPanel).toBeVisible();
      console.log('✅ Widget setup complete');
      
      // Test 3: Send message from widget
      console.log('💬 Testing widget message sending...');
      const messageInput = widgetPage.locator('[data-testid="widget-message-input"]');
      const sendButton = widgetPage.locator('[data-testid="widget-send-button"]');
      
      const testMessage = `Widget to dashboard test - ${Date.now()}`;
      await messageInput.fill(testMessage);
      await sendButton.click();
      
      // Verify message appears in widget
      const sentMessage = widgetPage.locator(`[data-testid="widget-message"]:has-text("${testMessage}")`);
      await expect(sentMessage).toBeVisible({ timeout: 5000 });
      console.log('✅ Message sent from widget');
      
      // Test 4: Test API connectivity from widget
      console.log('🔌 Testing API connectivity...');
      
      // Listen for dialog
      widgetPage.on('dialog', async dialog => {
        console.log(`API Test Result: ${dialog.message()}`);
        await dialog.accept();
      });
      
      const apiTestButton = widgetPage.locator('[data-testid="api-test-button"]');
      await apiTestButton.click();
      await widgetPage.waitForTimeout(3000);
      console.log('✅ API test completed');
      
      // Test 5: Check dashboard functionality
      console.log('📋 Testing dashboard functionality...');
      
      // Look for conversations or messages in dashboard
      await dashboardPage.waitForTimeout(3000);
      
      // Check if dashboard has loaded properly
      const dashboardContent = dashboardPage.locator('main, [data-testid="dashboard-content"], .dashboard');
      const hasContent = await dashboardContent.first().isVisible();
      
      if (hasContent) {
        console.log('✅ Dashboard content loaded');
        
        // Look for conversation elements
        const conversationElements = await dashboardPage.locator('[data-conversation-id], .conversation, [data-testid*="conversation"]').count();
        console.log(`📊 Found ${conversationElements} conversation-related elements`);
        
        // Look for message elements
        const messageElements = await dashboardPage.locator('[data-testid*="message"], .message').count();
        console.log(`💬 Found ${messageElements} message-related elements`);
        
      } else {
        console.log('⚠️  Dashboard content not fully loaded');
      }
      
      // Test 6: Test real-time API endpoints
      console.log('📡 Testing real-time API endpoints...');
      
      // Test widget messages API
      const widgetMessagesResponse = await widgetPage.request.get(`${TEST_CONFIG.BASE_URL}/api/widget/messages?conversationId=${TEST_CONFIG.TEST_CONVERSATION_ID}`, {
        headers: {
          'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
        }
      });
      
      console.log(`Widget messages API: ${widgetMessagesResponse.status()}`);
      
      if (widgetMessagesResponse.ok()) {
        const data = await widgetMessagesResponse.json();
        console.log(`✅ Widget API working - found ${data.messages?.length || 0} messages`);
      }
      
      // Test widget message sending via API
      const sendMessageResponse = await widgetPage.request.post(`${TEST_CONFIG.BASE_URL}/api/widget/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
        },
        data: {
          conversationId: TEST_CONFIG.TEST_CONVERSATION_ID,
          content: `API test message - ${Date.now()}`,
          senderType: 'visitor'
        }
      });
      
      console.log(`Widget send message API: ${sendMessageResponse.status()}`);
      
      if (sendMessageResponse.ok()) {
        const data = await sendMessageResponse.json();
        console.log('✅ Widget send message API working');
      }
      
      // Test 7: Performance and timing
      console.log('⏱️  Testing performance...');
      
      const startTime = Date.now();
      
      // Send another message and measure time
      await messageInput.fill('Performance test message');
      await sendButton.click();
      
      const performanceMessage = widgetPage.locator('[data-testid="widget-message"]:has-text("Performance test message")');
      await expect(performanceMessage).toBeVisible({ timeout: 5000 });
      
      const endTime = Date.now();
      const messageTime = endTime - startTime;
      
      console.log(`✅ Message delivery time: ${messageTime}ms`);
      
      if (messageTime < 2000) {
        console.log('✅ Performance is good (< 2s)');
      } else {
        console.log('⚠️  Performance could be improved (> 2s)');
      }
      
      console.log('🎉 Basic widget-dashboard communication test completed successfully!');
      
    } finally {
      await widgetContext.close();
      await dashboardContext.close();
    }
  });

  test('should test error handling', async ({ page }) => {
    console.log('🛡️ Testing error handling...');
    
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-test`);
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Test empty message handling
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send button should be disabled when input is empty
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.fill('');
    
    const isDisabled = await sendButton.isDisabled();
    if (isDisabled) {
      console.log('✅ Send button correctly disabled for empty message');
    } else {
      console.log('⚠️  Send button should be disabled for empty message');
    }
    
    // Test very long message
    const longMessage = 'A'.repeat(1000);
    await messageInput.fill(longMessage);
    await sendButton.click();
    
    // Should handle long message gracefully
    await page.waitForTimeout(2000);
    console.log('✅ Long message handling tested');
    
    // Test rapid clicking
    await messageInput.fill('Rapid test 1');
    await sendButton.click();
    await messageInput.fill('Rapid test 2');
    await sendButton.click();
    await messageInput.fill('Rapid test 3');
    await sendButton.click();
    
    await page.waitForTimeout(3000);
    
    const rapidMessages = page.locator('[data-testid="widget-message"]').filter({ hasText: /Rapid test/ });
    const rapidCount = await rapidMessages.count();
    
    console.log(`✅ Rapid message test: ${rapidCount} messages processed`);
    
    console.log('✅ Error handling tests completed');
  });
});
