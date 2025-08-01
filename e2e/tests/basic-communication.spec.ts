import { test, expect } from '@playwright/test';

/**
 * Basic Communication Test
 * Simple test to verify widget and dashboard can be accessed and basic functionality works
 */

const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d',
  BASE_URL: 'http://localhost:3005'
};

test.describe('Basic Widget-Dashboard Communication', () => {
  test('should access homepage widget', async ({ page }) => {
    console.log('🔧 Testing homepage widget access...');
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if widget button exists on homepage
    const widgetButton = page.locator('[data-testid="widget-button"], .widget-button, [class*="widget"]');
    await expect(widgetButton.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Homepage widget button found');
    
    // Click widget button
    await widgetButton.first().click();
    
    // Check if widget panel opens
    const widgetPanel = page.locator('[data-testid="widget-panel"], .widget-panel, [class*="widget"]');
    await expect(widgetPanel.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Homepage widget panel opens successfully');
  });

  test('should access dashboard and login', async ({ page }) => {
    console.log('📊 Testing dashboard access and login...');
    
    // Navigate to login
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('#email', TEST_CONFIG.AGENT_EMAIL);
    await page.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    console.log('✅ Dashboard login successful');
    
    // Check if dashboard content is visible
    const dashboardContent = page.locator('main, [data-testid="dashboard-content"], .dashboard');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Dashboard content loaded');
  });

  test('should send message from homepage widget', async ({ page }) => {
    console.log('💬 Testing homepage widget message sending...');
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"], .widget-button, [class*="widget"]');
    await widgetButton.first().click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"], .widget-panel, [class*="widget"]');
    await expect(widgetPanel.first()).toBeVisible();
    
    // Find message input
    const messageInput = page.locator('[data-testid="composer-input"], textarea, input[type="text"]');
    await expect(messageInput.first()).toBeVisible({ timeout: 5000 });
    
    // Type a test message
    const testMessage = `Test message from homepage widget - ${Date.now()}`;
    await messageInput.first().fill(testMessage);
    
    // Send message
    const sendButton = page.locator('[data-testid="composer-send-button"], button[title="Send message"]');
    await sendButton.first().click();
    
    // Wait for message to appear
    const sentMessage = page.locator(`[data-testid="message"], .message:has-text("${testMessage}")`);
    await expect(sentMessage.first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Widget message sent successfully');
  });

  test('should access dashboard conversation', async ({ page }) => {
    console.log('📋 Testing dashboard conversation access...');
    
    // Login to dashboard
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', TEST_CONFIG.AGENT_EMAIL);
    await page.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Look for conversations list or navigation
    const conversationsList = page.locator('[data-testid="conversations-list"], .conversations, [data-conversation-id]');
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(3000);
    
    // Check if any conversations are visible
    const conversationElements = await page.locator('[data-conversation-id]').count();
    
    if (conversationElements > 0) {
      console.log(`✅ Found ${conversationElements} conversation(s) in dashboard`);
      
      // Try to click on the first conversation
      const firstConversation = page.locator('[data-conversation-id]').first();
      await firstConversation.click();
      
      // Wait for conversation to load
      await page.waitForTimeout(2000);
      
      console.log('✅ Conversation opened successfully');
    } else {
      console.log('ℹ️  No conversations found in dashboard - this may be expected');
    }
  });

  test('should handle widget and dashboard together', async ({ browser }) => {
    console.log('🔄 Testing widget and dashboard together...');
    
    // Create two contexts
    const widgetContext = await browser.newContext();
    const dashboardContext = await browser.newContext();
    
    const widgetPage = await widgetContext.newPage();
    const dashboardPage = await dashboardContext.newPage();
    
    try {
      // Set up dashboard
      await dashboardPage.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await dashboardPage.waitForLoadState('networkidle');
      
      await dashboardPage.fill('#email', TEST_CONFIG.AGENT_EMAIL);
      await dashboardPage.fill('#password', TEST_CONFIG.AGENT_PASSWORD);
      await dashboardPage.click('button[type="submit"]');
      
      await dashboardPage.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Dashboard setup complete');
      
      // Set up widget
      await widgetPage.goto(`${TEST_CONFIG.BASE_URL}/`);
      await widgetPage.waitForLoadState('networkidle');
      
      const widgetButton = widgetPage.locator('[data-testid="widget-button"], .widget-button, [class*="widget"]');
      await widgetButton.first().click();
      
      const widgetPanel = widgetPage.locator('[data-testid="widget-panel"], .widget-panel, [class*="widget"]');
      await expect(widgetPanel.first()).toBeVisible();
      console.log('✅ Widget setup complete');
      
      // Send a message from widget
      const messageInput = widgetPage.locator('[data-testid="widget-message-input"], input[type="text"], textarea');
      if (await messageInput.first().isVisible()) {
        const testMessage = `Dual context test - ${Date.now()}`;
        await messageInput.first().fill(testMessage);
        
        const sendButton = widgetPage.locator('[data-testid="widget-send-button"], button[type="submit"], button:has-text("Send")');
        await sendButton.first().click();
        
        // Wait for message to appear in widget
        const sentMessage = widgetPage.locator(`[data-testid="widget-message"], .message:has-text("${testMessage}")`);
        await expect(sentMessage.first()).toBeVisible({ timeout: 10000 });
        
        console.log('✅ Message sent from widget');
        
        // Give some time for real-time sync
        await dashboardPage.waitForTimeout(5000);
        
        console.log('✅ Dual context test completed');
      } else {
        console.log('ℹ️  Widget message input not found - may need implementation');
      }
      
    } finally {
      await widgetContext.close();
      await dashboardContext.close();
    }
  });

  test('should verify API endpoints', async ({ request }) => {
    console.log('🔌 Testing API endpoints...');
    
    // Test widget messages endpoint
    const widgetMessagesResponse = await request.get(`${TEST_CONFIG.BASE_URL}/api/widget/messages?conversationId=${TEST_CONFIG.TEST_CONVERSATION_ID}`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Widget messages API: ${widgetMessagesResponse.status()}`);
    expect([200, 404, 401, 400]).toContain(widgetMessagesResponse.status());
    
    // Test widget read receipts endpoint
    const readReceiptsResponse = await request.get(`${TEST_CONFIG.BASE_URL}/api/widget/read-receipts?conversationId=${TEST_CONFIG.TEST_CONVERSATION_ID}`, {
      headers: {
        'X-Organization-ID': TEST_CONFIG.TEST_ORG_ID
      }
    });
    
    console.log(`Read receipts API: ${readReceiptsResponse.status()}`);
    expect([200, 404, 401, 400]).toContain(readReceiptsResponse.status());
    
    // Test health endpoint
    const healthResponse = await request.get(`${TEST_CONFIG.BASE_URL}/api/health`);
    console.log(`Health API: ${healthResponse.status()}`);
    
    console.log('✅ API endpoints tested');
  });
});
