import { test, expect } from '@playwright/test';

/**
 * Minimal Widget Test
 * Test the minimal widget implementation
 */

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001'
};

test.describe('Minimal Widget Test', () => {
  test('should test minimal widget functionality', async ({ page }) => {
    console.log('🔧 Testing minimal widget...');
    
    // Navigate to widget test page
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-test`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Widget test page loaded');
    
    // Check if widget button exists and is visible
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Widget button is visible');
    
    // Click widget button to open panel
    await widgetButton.click();
    
    // Check if widget panel opens
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Widget panel opened');
    
    // Check if message input exists
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Message input is visible');
    
    // Type a test message
    const testMessage = `Test message - ${Date.now()}`;
    await messageInput.fill(testMessage);
    
    console.log(`✅ Message typed: ${testMessage}`);
    
    // Click send button
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    console.log('✅ Send button clicked');
    
    // Wait for message to appear
    const sentMessage = page.locator(`[data-testid="widget-message"]:has-text("${testMessage}")`);
    await expect(sentMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Message appeared in widget');
    
    // Test API button
    const apiTestButton = page.locator('[data-testid="api-test-button"]');
    await expect(apiTestButton).toBeVisible();
    
    // Listen for dialog (alert)
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await apiTestButton.click();
    
    console.log('✅ API test button clicked');
    
    // Wait a bit for API call
    await page.waitForTimeout(3000);
    
    console.log('✅ Minimal widget test completed successfully');
  });

  test('should test widget state management', async ({ page }) => {
    console.log('🔄 Testing widget state management...');
    
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-test`);
    await page.waitForLoadState('networkidle');
    
    // Check initial state - widget should be closed
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).not.toBeVisible();
    
    console.log('✅ Widget initially closed');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    await expect(widgetPanel).toBeVisible();
    
    console.log('✅ Widget opened');
    
    // Close widget
    await widgetButton.click();
    await expect(widgetPanel).not.toBeVisible();
    
    console.log('✅ Widget closed');
    
    // Open again and send multiple messages
    await widgetButton.click();
    await expect(widgetPanel).toBeVisible();
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send first message
    await messageInput.fill('First message');
    await sendButton.click();
    
    // Send second message
    await messageInput.fill('Second message');
    await sendButton.click();
    
    // Check both messages exist
    const firstMessage = page.locator('[data-testid="widget-message"]:has-text("First message")');
    const secondMessage = page.locator('[data-testid="widget-message"]:has-text("Second message")');
    
    await expect(firstMessage).toBeVisible();
    await expect(secondMessage).toBeVisible();
    
    console.log('✅ Multiple messages working');
    
    // Check message count
    const allMessages = page.locator('[data-testid="widget-message"]');
    const messageCount = await allMessages.count();
    
    console.log(`✅ Total messages: ${messageCount}`);
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });
});
