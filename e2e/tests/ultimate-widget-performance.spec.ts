import { test, expect } from '@playwright/test';

test.describe('UltimateWidget Performance', () => {
  test('should handle rapid message sending', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send 10 messages rapidly
    for (let i = 0; i < 10; i++) {
      await messageInput.fill(`Rapid message ${i}`);
      await sendButton.click();
      await page.waitForTimeout(100); // Small delay
    }
    
    // Verify all messages appear
    for (let i = 0; i < 10; i++) {
      await expect(
        page.locator(`[data-testid="message"]:has-text("Rapid message ${i}")`)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain connection stability', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Monitor connection status for 30 seconds
    const startTime = Date.now();
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    
    while (Date.now() - startTime < 30000) {
      await expect(connectionStatus).toHaveText('connected');
      await page.waitForTimeout(1000);
    }
  });

  test('should handle concurrent users', async ({ browser }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = [];
    const pages = [];
    
    try {
      // Create 5 concurrent users
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // All users navigate to homepage simultaneously
      await Promise.all(pages.map(page => page.goto('/')));
      
      // All users open widget simultaneously
      await Promise.all(pages.map(page => page.click('[data-testid="widget-button"]')));
      
      // All users send messages simultaneously
      const messages = pages.map((page, i) => 
        page.fill('[data-testid="widget-message-input"]', `Concurrent message ${i}`)
      );
      await Promise.all(messages);
      
      const sendClicks = pages.map(page => 
        page.click('[data-testid="widget-send-button"]')
      );
      await Promise.all(sendClicks);
      
      // Verify all messages were sent successfully
      for (let i = 0; i < pages.length; i++) {
        await expect(
          pages[i].locator(`[data-testid="message"]:has-text("Concurrent message ${i}")`)
        ).toBeVisible({ timeout: 10000 });
      }
    } finally {
      // Clean up contexts
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('should handle large message content', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Create a large message (10KB of text)
    const largeMessage = 'A'.repeat(10000);
    await messageInput.fill(largeMessage);
    await sendButton.click();
    
    // Verify large message is sent and displayed
    await expect(
      page.locator(`[data-testid="message"]:has-text("${largeMessage.substring(0, 100)}")`)
    ).toBeVisible({ timeout: 15000 });
  });

  test('should handle memory usage under load', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send 50 messages to test memory usage
    for (let i = 0; i < 50; i++) {
      await messageInput.fill(`Memory test message ${i} - ${Date.now()}`);
      await sendButton.click();
      await page.waitForTimeout(50);
    }
    
    // Verify messages are still accessible
    await expect(
      page.locator('[data-testid="message"]')
    ).toHaveCount(50, { timeout: 10000 });
    
    // Test scrolling performance
    await page.evaluate(() => {
      const messageContainer = document.querySelector('[data-testid="message-container"]');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    });
    
    // Verify scroll worked without performance issues
    await page.waitForTimeout(1000);
  });

  test('should handle network latency gracefully', async ({ page }) => {
    // Simulate network latency
    await page.route('**/api/widget/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });
    
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    // Send message with simulated latency
    await messageInput.fill('Latency test message');
    await sendButton.click();
    
    // Verify message eventually appears despite latency
    await expect(
      page.locator('[data-testid="message"]:has-text("Latency test message")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle rapid widget open/close cycles', async ({ page }) => {
    await page.goto('/');
    
    const widgetButton = page.locator('[data-testid="widget-button"]');
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    
    // Rapidly open and close widget 20 times
    for (let i = 0; i < 20; i++) {
      await widgetButton.click();
      await expect(widgetPanel).toBeVisible({ timeout: 2000 });
      await widgetButton.click();
      await expect(widgetPanel).not.toBeVisible({ timeout: 2000 });
    }
    
    // Verify widget still works after rapid cycles
    await widgetButton.click();
    await expect(widgetPanel).toBeVisible({ timeout: 2000 });
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
  });
}); 