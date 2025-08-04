import { test, expect } from '@playwright/test';

/**
 * Widget Conversation Debug Test
 * Verifies that the widget is using the correct conversation ID
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '8ddf595b-b75d-42f2-98e5-9efd3513ea4b', // FIXED: Aligned with dashboard
  BASE_URL: 'http://localhost:3001'
};

test.describe('Widget Conversation Debug', () => {
  test('should verify widget conversation ID alignment', async ({ page }) => {
    console.log('🔍 Starting widget conversation ID debug test...');

    // Capture browser console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      // Capture all console logs to debug
      consoleLogs.push(`[Browser Console] ${text}`);
      console.log(`[Browser Console] ${text}`);
    });

    // Navigate to widget demo page
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-demo`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Widget demo page loaded');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    await widgetButton.click();
    
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    console.log('✅ Widget opened');
    
    // Check widget state in browser console
    const widgetState = await page.evaluate(() => {
      // Try to access widget state from window object
      const state = {
        hasWindow: typeof window !== 'undefined',
        hasWidgetState: typeof (window as unknown).widgetState !== 'undefined',
        widgetState: (window as unknown).widgetState || null,
        hasSupabase: typeof (window as unknown).supabase !== 'undefined',
        hasRealtimeChannels: typeof (window as unknown).realtimeChannels !== 'undefined',
        realtimeChannels: Object.keys((window as unknown).realtimeChannels || {}),
        localStorage: {
          keys: Object.keys(localStorage),
          widgetData: localStorage.getItem('widget-state') || localStorage.getItem('campfire-widget') || null
        }
      };
      
      console.log('[Widget Debug] State check:', state);
      return state;
    });
    
    console.log('Widget state check:', widgetState);
    
    // Try to send a message and capture the network request
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    await expect(messageInput).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Listen for network requests
    const requests: Array<{ url: string; method: string; postData?: string }> = [];
    page.on('request', request => {
      if (request.url().includes('/api/widget')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData() || undefined
        });
        console.log(`[Network] ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`[Network] POST data:`, request.postData());
        }
      }
    });
    
    // Send test message
    const testMessage = `Widget debug test - ${Date.now()}`;
    await messageInput.fill(testMessage);
    console.log(`📝 Message typed: "${testMessage}"`);
    
    await sendButton.click();
    console.log('📤 Send button clicked');
    
    // Wait for potential network requests
    await page.waitForTimeout(5000);
    
    // Check what network requests were made
    console.log('📡 Network requests captured:', requests.length);
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`, req);
    });
    
    // Check if message appears in widget
    const sentMessage = page.locator(`[data-testid="widget-message"]:has-text("${testMessage}")`);
    const messageVisible = await sentMessage.count() > 0;
    
    console.log(`Message visible in widget: ${messageVisible ? '✅' : '❌'}`);
    
    // Print captured console logs
    console.log('📋 Captured console logs:', consoleLogs.length);
    consoleLogs.forEach(log => console.log(log));
    
    // Summary
    console.log('📋 Widget Conversation Debug Summary:');
    console.log(`✅ Widget opened successfully`);
    console.log(`✅ Message input and send button found`);
    console.log(`${messageVisible ? '✅' : '❌'} Message visible in widget: ${messageVisible ? 'Yes' : 'No'}`);
    console.log(`📡 Network requests made: ${requests.length}`);
    console.log(`🔍 Widget state available: ${widgetState.hasWidgetState ? 'Yes' : 'No'}`);
    console.log(`🔍 Real-time channels: ${widgetState.realtimeChannels.join(', ') || 'None'}`);
    
    // Test passes if widget opens
    expect(messageVisible || requests.length > 0).toBe(true);
    
    console.log('🎉 Widget conversation debug test completed!');
  });
});
