import { test, expect } from '@playwright/test';
import { testMessages } from '../../fixtures/test-data';

test.describe('Real-time Communication', () => {
  test('should handle real-time connection', async ({ page }) => {
    await page.goto('/app/widget-test');
    
    // Wait for real-time connection
    await page.waitForFunction(() => {
      return window.localStorage.getItem('campfire-realtime-status') === 'connected' ||
             document.querySelector('[data-testid="connection-status"]')?.textContent?.includes('connected');
    }, { timeout: 10000 });
    
    const connectionStatus = await page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toContainText('connected');
  });

  test('should send and receive messages', async ({ page }) => {
    await page.goto('/app/widget-test');
    await page.click('[data-testid="widget-button"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(testMessages.short);
    await messageInput.press('Enter');
    
    // Verify message appears
    await expect(page.locator('[data-testid="message-list"]')).toContainText(testMessages.short);
  });

  test('should show typing indicators', async ({ page }) => {
    await page.goto('/app/widget-test');
    await page.click('[data-testid="widget-button"]');
    
    // Start typing
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Typing test message');
    
    // Should show typing indicator
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Clear input to stop typing
    await messageInput.clear();
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('should handle long messages', async ({ page }) => {
    await page.goto('/app/widget-test');
    await page.click('[data-testid="widget-button"]');
    
    // Send a long message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(testMessages.long);
    await messageInput.press('Enter');
    
    // Verify long message is displayed correctly
    await expect(page.locator('[data-testid="message-list"]')).toContainText(testMessages.long.substring(0, 50));
  });

  test('should handle special characters', async ({ page }) => {
    await page.goto('/app/widget-test');
    await page.click('[data-testid="widget-button"]');
    
    // Send message with special characters
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(testMessages.specialChars);
    await messageInput.press('Enter');
    
    // Verify special characters are preserved
    await expect(page.locator('[data-testid="message-list"]')).toContainText('!@#$%^&*()');
  });

  test('should handle emoji messages', async ({ page }) => {
    await page.goto('/app/widget-test');
    await page.click('[data-testid="widget-button"]');
    
    // Send message with emojis
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(testMessages.emoji);
    await messageInput.press('Enter');
    
    // Verify emojis are displayed
    await expect(page.locator('[data-testid="message-list"]')).toContainText('��');
    await expect(page.locator('[data-testid="message-list"]')).toContainText('😊');
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.goto('/app/widget-test');
    
    // Simulate connection error by blocking network
    await page.route('**/*', route => route.abort());
    
    // Try to send a message
    await page.click('[data-testid="widget-button"]');
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should reconnect automatically', async ({ page }) => {
    await page.goto('/app/widget-test');
    
    // Wait for initial connection
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid="connection-status"]')?.textContent?.includes('connected');
    }, { timeout: 10000 });
    
    // Simulate disconnection
    await page.evaluate(() => {
      window.localStorage.setItem('campfire-realtime-status', 'disconnected');
    });
    
    // Should attempt to reconnect
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid="connection-status"]')?.textContent?.includes('connecting');
    }, { timeout: 5000 });
  });
});
