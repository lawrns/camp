import { test, expect } from '@playwright/test';

test.describe('Widget Simple Test', () => {
  test('should open widget and send message', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load (shorter timeout)
    await page.waitForLoadState('domcontentloaded');
    
    // Check if widget button is visible
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: 10000 });
    
    // Click widget button
    await widgetButton.click();
    
    // Check if widget panel opens
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 10000 });
    
    // Check if message input is visible
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    
    // Type a message
    await messageInput.fill('Simple test message');
    
    // Click send button
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Check if message appears (look for visitor message)
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 15000 });
    await expect(visitorMessage).toContainText('Simple test message');
  });
}); 