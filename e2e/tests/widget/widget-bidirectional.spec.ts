import { test, expect } from '@playwright/test';
import { testMessages } from '../../fixtures/test-data';

test.describe('Widget Bidirectional Communication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widget');
    await page.waitForLoadState('networkidle');
  });

  test('should establish real-time connection in widget', async ({ page }) => {
    // Wait for widget to load
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Wait for real-time connection
    await page.waitForFunction(() => {
      return window.localStorage.getItem('campfire-realtime-status') === 'connected' ||
             document.querySelector('[data-testid="connection-status"]')?.textContent?.includes('connected');
    }, { timeout: 10000 });
    
    const connectionStatus = await page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toContainText('connected');
  });

  test('should send and receive messages in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Open chat widget
    await page.click('[data-testid="widget-button"]');
    
    // Wait for chat interface
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello from customer!');
    await messageInput.press('Enter');
    
    // Verify message appears
    await expect(page.locator('[data-testid="message-list"]')).toContainText('Hello from customer!');
    
    // Verify message timestamp
    await expect(page.locator('[data-testid="message-timestamp"]')).toBeVisible();
  });

  test('should show typing indicators in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Start typing
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Typing a message...');
    
    // Should show typing indicator
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Clear input to stop typing
    await messageInput.clear();
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('should handle message delivery status in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message with delivery status');
    await messageInput.press('Enter');
    
    // Verify delivery status indicators
    await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    
    // Wait for delivered status
    await page.waitForSelector('[data-testid="message-delivered"]', { timeout: 5000 });
  });

  test('should handle message read receipts in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Message to check read receipt');
    await messageInput.press('Enter');
    
    // Simulate agent reading the message
    await page.evaluate(() => {
      const event = new CustomEvent('campfire-message-read', {
        detail: {
          messageId: 'msg-123',
          agentId: 'agent-123',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });
    
    // Verify read receipt appears
    await expect(page.locator('[data-testid="message-read"]')).toBeVisible();
  });

  test('should handle file attachments in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Click attachment button
    await page.click('[data-testid="attachment-button"]');
    
    // Upload a file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('e2e/fixtures/test-file.txt');
    
    // Verify file is attached
    await expect(page.locator('[data-testid="attachment-preview"]')).toBeVisible();
    
    // Send the message with attachment
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Message with attachment');
    await messageInput.press('Enter');
    
    // Verify attachment is sent
    await expect(page.locator('[data-testid="message-list"]')).toContainText('test-file.txt');
  });

  test('should handle emoji reactions in widget', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Hover over a message to show reaction button
    const messageBubble = page.locator('[data-testid="message-bubble"]').first();
    await messageBubble.hover();
    
    // Click reaction button
    await page.click('[data-testid="reaction-button"]');
    
    // Select an emoji
    await page.click('[data-testid="emoji-picker"]');
    await page.click('[data-testid="emoji-👍"]');
    
    // Verify reaction is added
    await expect(page.locator('[data-testid="message-reaction"]')).toContainText('👍');
  });

  test('should handle widget state persistence', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Open chat widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message for persistence');
    await messageInput.press('Enter');
    
    // Close widget
    await page.click('[data-testid="widget-button"]');
    
    // Reopen widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Verify message is still there
    await expect(page.locator('[data-testid="message-list"]')).toContainText('Test message for persistence');
  });

  test('should handle widget responsive design', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="widget-container"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="widget-container"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="widget-container"]')).toBeVisible();
  });

  test('should handle widget accessibility', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Verify ARIA labels
    await expect(page.locator('[data-testid="widget-button"]')).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="widget-button"]')).toBeFocused();
    
    // Open widget with Enter key
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Test focus management
    await expect(page.locator('[data-testid="message-input"]')).toBeFocused();
  });

  test('should handle widget error states', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Simulate connection error
    await page.evaluate(() => {
      const event = new CustomEvent('campfire-connection-error', {
        detail: {
          error: 'Network error',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });
    
    // Verify error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Test retry functionality
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('connecting');
  });

  test('should handle widget notifications', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Simulate new message notification
    await page.evaluate(() => {
      const event = new CustomEvent('campfire-new-message', {
        detail: {
          message: 'New message from agent',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });
    
    // Verify notification appears
    await expect(page.locator('[data-testid="notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification"]')).toContainText('New message from agent');
  });

  test('should handle widget customization', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Verify custom branding
    await expect(page.locator('[data-testid="widget-branding"]')).toBeVisible();
    
    // Verify custom colors
    await expect(page.locator('[data-testid="widget-container"]')).toHaveCSS('background-color', expect.any(String));
    
    // Verify custom text
    await expect(page.locator('[data-testid="widget-greeting"]')).toBeVisible();
  });

  test('should handle widget analytics and tracking', async ({ page }) => {
    await page.waitForSelector('[data-testid="widget-container"]');
    
    // Open widget
    await page.click('[data-testid="widget-button"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Analytics test message');
    await messageInput.press('Enter');
    
    // Verify analytics events are tracked
    await expect(page.locator('[data-testid="analytics-tracker"]')).toBeVisible();
  });
}); 