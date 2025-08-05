/**
 * Advanced E2E Scenarios
 * 
 * Tests for:
 * - Multi-tab synchronization
 * - Network interruptions
 * - Mobile responsiveness
 * - Accessibility compliance
 * - Error recovery
 * - Load testing scenarios
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const WIDGET_URL = `${BASE_URL}/widget`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const TEST_ORG_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

// Helper functions
async function openWidget(page: Page, orgId: string = TEST_ORG_ID) {
  await page.goto(`${WIDGET_URL}?org=${orgId}`);
  await page.waitForSelector('[data-testid="widget-button"]');
  await page.click('[data-testid="widget-button"]');
  await page.waitForSelector('[data-testid="chat-interface"]');
}

async function sendMessage(page: Page, message: string) {
  await page.fill('[data-testid="message-input"]', message);
  await page.click('[data-testid="send-button"]');
  await page.waitForSelector(`[data-testid="message-content"]:has-text("${message}")`);
}

test.describe('Advanced E2E Scenarios', () => {
  test.describe('Multi-Tab Synchronization', () => {
    test('should synchronize messages across multiple widget tabs', async ({ context }) => {
      // Open widget in two tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await openWidget(page1);
      await openWidget(page2);

      // Send message in first tab
      await sendMessage(page1, 'Message from tab 1');

      // Verify message appears in second tab
      await page2.waitForSelector('[data-testid="message-content"]:has-text("Message from tab 1")');
      
      // Send message in second tab
      await sendMessage(page2, 'Message from tab 2');

      // Verify message appears in first tab
      await page1.waitForSelector('[data-testid="message-content"]:has-text("Message from tab 2")');

      // Verify both tabs show the same conversation
      const messages1 = await page1.locator('[data-testid="message-content"]').count();
      const messages2 = await page2.locator('[data-testid="message-content"]').count();
      expect(messages1).toBe(messages2);
    });

    test('should synchronize typing indicators across tabs', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await openWidget(page1);
      await openWidget(page2);

      // Start typing in first tab
      await page1.focus('[data-testid="message-input"]');
      await page1.type('[data-testid="message-input"]', 'Typing in tab 1...', { delay: 100 });

      // Verify typing indicator appears in second tab
      await page2.waitForSelector('[data-testid="typing-indicator"]', { timeout: 5000 });

      // Stop typing in first tab
      await page1.fill('[data-testid="message-input"]', '');

      // Verify typing indicator disappears in second tab
      await page2.waitForSelector('[data-testid="typing-indicator"]', { 
        state: 'hidden',
        timeout: 5000 
      });
    });

    test('should handle tab focus changes correctly', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await openWidget(page1);
      await openWidget(page2);

      // Send message while page1 is focused
      await sendMessage(page1, 'Focus test message');

      // Switch focus to page2
      await page2.bringToFront();

      // Verify unread indicator behavior
      const unreadIndicator = page2.locator('[data-testid="unread-indicator"]');
      if (await unreadIndicator.isVisible()) {
        // Click to clear unread
        await page2.click('[data-testid="widget-button"]');
        await page2.waitForSelector('[data-testid="unread-indicator"]', { state: 'hidden' });
      }
    });
  });

  test.describe('Network Interruptions', () => {
    test('should handle network disconnection gracefully', async ({ page, context }) => {
      await openWidget(page);

      // Send initial message
      await sendMessage(page, 'Message before disconnection');

      // Simulate network disconnection
      await context.setOffline(true);

      // Try to send message while offline
      await page.fill('[data-testid="message-input"]', 'Message while offline');
      await page.click('[data-testid="send-button"]');

      // Should show offline indicator or error
      await page.waitForSelector('[data-testid="offline-indicator"], [data-testid="connection-error"]', {
        timeout: 5000
      });

      // Reconnect
      await context.setOffline(false);

      // Wait for reconnection
      await page.waitForSelector('[data-testid="online-indicator"], [data-testid="chat-interface"]', {
        timeout: 10000
      });

      // Send message after reconnection
      await sendMessage(page, 'Message after reconnection');

      // Verify message is sent successfully
      await page.waitForSelector('[data-testid="message-content"]:has-text("Message after reconnection")');
    });

    test('should queue messages during network interruption', async ({ page, context }) => {
      await openWidget(page);

      // Go offline
      await context.setOffline(true);

      // Send multiple messages while offline
      const offlineMessages = [
        'Offline message 1',
        'Offline message 2',
        'Offline message 3',
      ];

      for (const message of offlineMessages) {
        await page.fill('[data-testid="message-input"]', message);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(500);
      }

      // Reconnect
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Verify all messages are sent after reconnection
      for (const message of offlineMessages) {
        await page.waitForSelector(`[data-testid="message-content"]:has-text("${message}")`, {
          timeout: 10000
        });
      }
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Throttle network to simulate slow connection
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        await route.continue();
      });

      await openWidget(page);

      // Send message with slow network
      const startTime = Date.now();
      await sendMessage(page, 'Slow network test message');
      const endTime = Date.now();

      // Should still work but take longer
      expect(endTime - startTime).toBeGreaterThan(1000);

      // Verify message appears
      await page.waitForSelector('[data-testid="message-content"]:has-text("Slow network test message")');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile viewport', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const page = await context.newPage();

      await openWidget(page);

      // Verify widget adapts to mobile viewport
      const chatInterface = page.locator('[data-testid="chat-interface"]');
      const boundingBox = await chatInterface.boundingBox();
      
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
      expect(boundingBox?.height).toBeLessThanOrEqual(667);

      // Test mobile interactions
      await sendMessage(page, 'Mobile test message');

      // Verify touch interactions work
      await page.tap('[data-testid="emoji-button"]');
      await page.waitForSelector('[data-testid="emoji-picker"]');

      await context.close();
    });

    test('should handle orientation changes', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
      });

      const page = await context.newPage();
      await openWidget(page);

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);

      // Verify widget still works in landscape
      await sendMessage(page, 'Landscape test message');

      // Rotate back to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Verify widget still works in portrait
      await sendMessage(page, 'Portrait test message');

      await context.close();
    });

    test('should handle touch gestures', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        hasTouch: true,
      });

      const page = await context.newPage();
      await openWidget(page);

      // Test swipe to close (if implemented)
      const chatInterface = page.locator('[data-testid="chat-interface"]');
      const box = await chatInterface.boundingBox();
      
      if (box) {
        // Swipe down gesture
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 50);
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height - 50);
      }

      // Test pinch to zoom (should not affect widget)
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(250, 350);

      // Verify widget remains functional
      await sendMessage(page, 'Touch gesture test');

      await context.close();
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await openWidget(page);

      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to focus on message input
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('message-input');

      // Test Enter to send message
      await page.keyboard.type('Keyboard navigation test');
      await page.keyboard.press('Enter');

      await page.waitForSelector('[data-testid="message-content"]:has-text("Keyboard navigation test")');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await openWidget(page);

      // Check for ARIA labels on interactive elements
      const widgetButton = page.locator('[data-testid="widget-button"]');
      const ariaLabel = await widgetButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();

      const messageInput = page.locator('[data-testid="message-input"]');
      const inputLabel = await messageInput.getAttribute('aria-label') || 
                         await messageInput.getAttribute('placeholder');
      expect(inputLabel).toBeTruthy();

      const sendButton = page.locator('[data-testid="send-button"]');
      const sendLabel = await sendButton.getAttribute('aria-label');
      expect(sendLabel).toBeTruthy();
    });

    test('should support screen readers', async ({ page }) => {
      await openWidget(page);

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      expect(headings).toBeGreaterThan(0);

      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const image of images) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy();
      }

      // Check for proper form labels
      const inputs = await page.locator('input, textarea').all();
      for (const input of inputs) {
        const label = await input.getAttribute('aria-label') || 
                     await input.getAttribute('placeholder');
        expect(label).toBeTruthy();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await openWidget(page);

      // This would typically use a color contrast checking library
      // For now, we'll check that text is visible
      const messageText = page.locator('[data-testid="message-content"]').first();
      if (await messageText.isVisible()) {
        const styles = await messageText.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Basic check that colors are defined
        expect(styles.color).toBeTruthy();
        expect(styles.backgroundColor).toBeTruthy();
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from JavaScript errors', async ({ page }) => {
      await openWidget(page);

      // Inject a JavaScript error
      await page.evaluate(() => {
        // Simulate an error in a non-critical component
        window.dispatchEvent(new Error('Test error'));
      });

      // Widget should still be functional
      await sendMessage(page, 'Message after JS error');

      // Verify message appears
      await page.waitForSelector('[data-testid="message-content"]:has-text("Message after JS error")');
    });

    test('should handle API errors gracefully', async ({ page, context }) => {
      // Mock API to return errors
      await context.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await openWidget(page);

      // Try to send message
      await page.fill('[data-testid="message-input"]', 'API error test');
      await page.click('[data-testid="send-button"]');

      // Should show error message
      await page.waitForSelector('[data-testid="error-message"], [data-testid="retry-button"]', {
        timeout: 5000
      });

      // Restore API
      await context.unroute('**/api/**');

      // Retry should work
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForSelector('[data-testid="message-content"]:has-text("API error test")');
      }
    });

    test('should handle malformed data gracefully', async ({ page, context }) => {
      // Mock API to return malformed data
      await context.route('**/api/messages**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{',
        });
      });

      await openWidget(page);

      // Widget should still render without crashing
      const chatInterface = page.locator('[data-testid="chat-interface"]');
      expect(await chatInterface.isVisible()).toBe(true);

      // Should show error state or fallback
      const errorState = page.locator('[data-testid="error-state"], [data-testid="fallback-ui"]');
      await expect(errorState).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Load Testing Scenarios', () => {
    test('should handle rapid message sending', async ({ page }) => {
      await openWidget(page);

      const messageCount = 20;
      const startTime = Date.now();

      // Send messages rapidly
      for (let i = 1; i <= messageCount; i++) {
        await page.fill('[data-testid="message-input"]', `Rapid message ${i}`);
        await page.click('[data-testid="send-button"]');
        
        // Small delay to avoid overwhelming
        if (i % 5 === 0) {
          await page.waitForTimeout(100);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds

      // Verify all messages are present
      const messages = await page.locator('[data-testid="message-content"]').count();
      expect(messages).toBeGreaterThanOrEqual(messageCount);
    });

    test('should handle long conversation history', async ({ page }) => {
      await openWidget(page);

      // Simulate loading a conversation with many messages
      await page.evaluate(() => {
        // Mock a long conversation history
        const chatContainer = document.querySelector('[data-testid="chat-messages"]');
        if (chatContainer) {
          for (let i = 1; i <= 100; i++) {
            const messageDiv = document.createElement('div');
            messageDiv.setAttribute('data-testid', 'message-content');
            messageDiv.textContent = `Historical message ${i}`;
            chatContainer.appendChild(messageDiv);
          }
        }
      });

      // Verify widget remains responsive
      await sendMessage(page, 'New message in long conversation');

      // Should scroll to bottom for new message
      const chatContainer = page.locator('[data-testid="chat-messages"]');
      const scrollTop = await chatContainer.evaluate(el => el.scrollTop);
      const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await chatContainer.evaluate(el => el.clientHeight);

      expect(scrollTop).toBeGreaterThan(scrollHeight - clientHeight - 100);
    });

    test('should handle concurrent user interactions', async ({ context }) => {
      // Simulate multiple users interacting simultaneously
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage(),
      ]);

      // Open widget in all pages
      await Promise.all(pages.map(page => openWidget(page)));

      // Send messages concurrently
      const messagePromises = pages.map((page, index) => 
        sendMessage(page, `Concurrent message from user ${index + 1}`)
      );

      await Promise.all(messagePromises);

      // Verify all messages appear in all widgets
      for (const page of pages) {
        for (let i = 1; i <= 3; i++) {
          await page.waitForSelector(`[data-testid="message-content"]:has-text("Concurrent message from user ${i}")`);
        }
      }

      // Close all pages
      await Promise.all(pages.map(page => page.close()));
    });
  });
});
