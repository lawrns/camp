import { test, expect } from '@playwright/test';

/**
 * Debug Widget Test
 * Simple test to debug widget message sending
 */

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001'
};

test.describe('Debug Widget', () => {
  test('should debug widget message sending', async ({ page }) => {
    console.log('🔧 Debugging widget message sending...');
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to widget demo
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-demo`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Widget demo page loaded');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    await widgetButton.click();
    
    console.log('✅ Widget button clicked');
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Widget panel opened');
    
    // Check what's in the widget
    const widgetContent = await page.locator('[data-testid="widget-panel"]').innerHTML();
    console.log('Widget panel content preview:', widgetContent.substring(0, 200) + '...');
    
    // Find message input
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    
    if (await messageInput.isVisible()) {
      console.log('✅ Message input found');
      
      // Type a test message
      const testMessage = `Debug test message - ${Date.now()}`;
      await messageInput.fill(testMessage);
      
      console.log(`✅ Message typed: ${testMessage}`);
      
      // Find send button
      const sendButton = page.locator('[data-testid="widget-send-button"]');
      
      if (await sendButton.isVisible()) {
        console.log('✅ Send button found');
        
        // Click send button
        await sendButton.click();
        
        console.log('✅ Send button clicked');
        
        // Wait a bit for processing
        await page.waitForTimeout(3000);
        
        // Check for any messages in the widget
        const allMessages = page.locator('[data-testid="widget-message"]');
        const messageCount = await allMessages.count();
        
        console.log(`📊 Found ${messageCount} messages in widget`);
        
        if (messageCount > 0) {
          for (let i = 0; i < messageCount; i++) {
            const messageText = await allMessages.nth(i).textContent();
            console.log(`Message ${i + 1}: ${messageText}`);
          }
        }
        
        // Check for the specific message
        const sentMessage = page.locator(`[data-testid="widget-message"]:has-text("${testMessage}")`);
        const isVisible = await sentMessage.isVisible();
        
        if (isVisible) {
          console.log('✅ Test message found in widget');
        } else {
          console.log('❌ Test message not found in widget');
          
          // Check if there are any error messages
          const errorMessages = page.locator('.error, [data-testid="error"], .alert-error');
          const errorCount = await errorMessages.count();
          
          if (errorCount > 0) {
            console.log(`Found ${errorCount} error message(s):`);
            for (let i = 0; i < errorCount; i++) {
              const errorText = await errorMessages.nth(i).textContent();
              console.log(`Error ${i + 1}: ${errorText}`);
            }
          }
          
          // Check widget messages container
          const messagesContainer = page.locator('[data-testid="widget-messages"]');
          if (await messagesContainer.isVisible()) {
            const containerContent = await messagesContainer.textContent();
            console.log('Messages container content:', containerContent);
          }
        }
        
      } else {
        console.log('❌ Send button not found');
        
        // List all buttons in the widget
        const allButtons = page.locator('[data-testid="widget-panel"] button');
        const buttonCount = await allButtons.count();
        console.log(`Found ${buttonCount} buttons in widget:`);
        
        for (let i = 0; i < buttonCount; i++) {
          const buttonText = await allButtons.nth(i).textContent();
          const buttonTestId = await allButtons.nth(i).getAttribute('data-testid');
          console.log(`Button ${i + 1}: "${buttonText}" (testid: ${buttonTestId})`);
        }
      }
      
    } else {
      console.log('❌ Message input not found');
      
      // List all inputs in the widget
      const allInputs = page.locator('[data-testid="widget-panel"] input, [data-testid="widget-panel"] textarea');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} inputs in widget:`);
      
      for (let i = 0; i < inputCount; i++) {
        const inputType = await allInputs.nth(i).getAttribute('type');
        const inputTestId = await allInputs.nth(i).getAttribute('data-testid');
        const inputPlaceholder = await allInputs.nth(i).getAttribute('placeholder');
        console.log(`Input ${i + 1}: type="${inputType}" testid="${inputTestId}" placeholder="${inputPlaceholder}"`);
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-widget-state.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-widget-state.png');
  });

  test('should check widget API endpoints', async ({ page, request }) => {
    console.log('🔌 Testing widget API endpoints...');
    
    const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';
    const testConversationId = '48eedfba-2568-4231-bb38-2ce20420900d';
    
    // Test widget messages endpoint
    try {
      const messagesResponse = await request.get(`${TEST_CONFIG.BASE_URL}/api/widget/messages?conversationId=${testConversationId}`, {
        headers: {
          'X-Organization-ID': testOrgId
        }
      });
      
      console.log(`Widget messages API: ${messagesResponse.status()}`);
      
      if (messagesResponse.ok()) {
        const data = await messagesResponse.json();
        console.log('Messages response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await messagesResponse.text();
        console.log('Messages error:', errorText);
      }
    } catch (error) {
      console.log('Messages API error:', error);
    }
    
    // Test widget message sending
    try {
      const sendResponse = await request.post(`${TEST_CONFIG.BASE_URL}/api/widget/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': testOrgId
        },
        data: {
          conversationId: testConversationId,
          content: `API test message - ${Date.now()}`,
          senderType: 'visitor'
        }
      });
      
      console.log(`Widget send message API: ${sendResponse.status()}`);
      
      if (sendResponse.ok()) {
        const data = await sendResponse.json();
        console.log('Send response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await sendResponse.text();
        console.log('Send error:', errorText);
      }
    } catch (error) {
      console.log('Send API error:', error);
    }
  });
});
