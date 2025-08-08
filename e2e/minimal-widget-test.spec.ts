import { test, expect } from '@playwright/test';

test.describe('Minimal Widget Test', () => {
  test('should open widget and send message', async ({ page }) => {
    console.log('🚀 Starting minimal widget test...');
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for widget to load
    await page.waitForTimeout(3000);
    
    console.log('🔍 Looking for widget button...');
    
    // Find widget button
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Widget button found');
    
    // Click widget button
    await widgetButton.click();
    
    console.log('🔍 Waiting for widget panel...');
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Widget panel opened');
    
    // Wait for message input
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Message input found');
    
    // Type message
    const testMessage = 'Hello from minimal test!';
    await messageInput.fill(testMessage);
    
    console.log('✅ Message typed');
    
    // Find and click send button
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible({ timeout: 5000 });
    await sendButton.click();
    
    console.log('✅ Send button clicked');
    
    // Wait a moment for message to be sent
    await page.waitForTimeout(2000);
    
    console.log('✅ Minimal widget test completed successfully!');
  });
});
