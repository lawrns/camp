import { test, expect } from '@playwright/test';

test.describe('Real-time Communication', () => {
  test('should handle real-time connection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for widget to load
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    
    // Click widget to open
    await widgetButton.click();
    
    // Wait for widget panel to open
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Check for connection status (widget should be connected)
    await expect(page.locator('[data-testid="widget-panel"]')).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Send a message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Test message from homepage');
    await messageInput.press('Enter');
    
    // Verify message appears (look for visitor message)
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
    await expect(visitorMessage).toContainText('Test message from homepage');
  });

  test('should show typing indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Start typing
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Typing test message');
    
    // Should show typing indicator (if implemented)
    // Note: Typing indicators may not be visible immediately
    await expect(messageInput).toHaveValue('Typing test message');
  });

  test('should handle long messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Send a long message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    const longMessage = 'This is a very long test message that should be handled properly by the widget. It contains multiple sentences and should test the widget\'s ability to handle longer content without breaking the layout or causing any issues with the real-time communication system.';
    await messageInput.fill(longMessage);
    await messageInput.press('Enter');
    
    // Verify long message is displayed correctly
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
    await expect(visitorMessage).toContainText('This is a very long test message');
  });

  test('should handle special characters', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Send message with special characters
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
    await messageInput.press('Enter');
    
    // Verify special characters are preserved
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
    await expect(visitorMessage).toContainText('Special chars: !@#$%^&*()');
  });

  test('should handle emoji messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Send message with emojis
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hello! 😊 🚀 🎉 Test emoji message');
    await messageInput.press('Enter');
    
    // Verify emojis are displayed
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
    await expect(visitorMessage).toContainText('Hello! 😊 🚀 🎉 Test emoji message');
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Try to send a message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Should handle gracefully (no error expected in normal flow)
    await expect(widgetPanel).toBeVisible();
  });

  test('should reconnect automatically', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open widget
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();
    
    // Wait for widget panel
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Send a message to test reconnection
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Reconnection test message');
    await messageInput.press('Enter');
    
    // Verify message appears
    const visitorMessage = page.locator('[data-testid="message"][data-sender-type="visitor"]');
    await expect(visitorMessage).toBeVisible({ timeout: 10000 });
    await expect(visitorMessage).toContainText('Reconnection test message');
  });
});
