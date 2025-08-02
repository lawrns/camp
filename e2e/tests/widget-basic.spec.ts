import { test, expect } from '@playwright/test';

test.describe('Widget Basic Functionality', () => {
  test('should open widget and find input', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if widget button is visible
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    
    // Click widget button
    await widgetButton.click();
    
    // Check if widget panel opens
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Check if message input is visible
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    
    // Type a message
    await messageInput.fill('Test message');
    
    // Check if send button is visible
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible();
    
    // Click send button
    await sendButton.click();
    
    // Wait a moment for the message to appear
    await page.waitForTimeout(2000);
    
    // Check if message appears (look for visitor message specifically)
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
  });
}); 