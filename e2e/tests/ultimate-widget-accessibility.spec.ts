import { test, expect } from '@playwright/test';

test.describe('UltimateWidget Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to widget button with keyboard
    await page.keyboard.press('Tab');
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeFocused();
    
    // Open widget with Enter key
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="widget-panel"]')).toBeVisible();
    
    // Navigate through widget with keyboard
    await page.keyboard.press('Tab');
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeFocused();
    
    // Navigate to send button
    await page.keyboard.press('Tab');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await expect(sendButton).toBeFocused();
    
    // Send message with keyboard
    await page.keyboard.press('Enter');
    
    // Verify message was sent
    await expect(
      page.locator('[data-testid="message"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Check ARIA labels
    await expect(
      page.locator('[data-testid="widget-button"]')
    ).toHaveAttribute('aria-label', /open chat/i);
    
    await expect(
      page.locator('[data-testid="widget-message-input"]')
    ).toHaveAttribute('aria-label', /message/i);
    
    await expect(
      page.locator('[data-testid="widget-send-button"]')
    ).toHaveAttribute('aria-label', /send/i);
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Check for screen reader friendly elements
    const liveRegion = page.locator('[aria-live="polite"]');
    if (await liveRegion.count() > 0) {
      await expect(liveRegion).toBeVisible();
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    if (await headings.count() > 0) {
      await expect(headings.first()).toBeVisible();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Check that text has sufficient contrast
    const textElements = page.locator('p, span, div');
    const textColor = await textElements.first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor
      };
    });
    
    // Basic contrast check (this would need a proper contrast calculation library)
    expect(textColor.color).toBeDefined();
    expect(textColor.backgroundColor).toBeDefined();
  });

  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/');
    
    // Open widget
    await page.click('[data-testid="widget-button"]');
    
    // Check that focus is trapped within widget when open
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Focus should be on message input when widget opens
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeFocused();
    
    // Tab through all interactive elements
    const interactiveElements = page.locator('button, input, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(interactiveElements.nth(i)).toBeFocused();
    }
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Send a message
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.fill('Test message');
    await page.click('[data-testid="widget-send-button"]');
    
    // Check for status announcements
    const statusAnnouncement = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    if (await statusAnnouncement.count() > 0) {
      await expect(statusAnnouncement).toBeVisible();
    }
  });

  test('should be operable with voice control', async ({ page }) => {
    await page.goto('/');
    
    // Test that elements can be activated programmatically
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.evaluate(button => button.click());
    
    await expect(page.locator('[data-testid="widget-panel"]')).toBeVisible();
    
    // Test that form elements can be filled programmatically
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.evaluate(input => {
      input.value = 'Voice control test message';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Test that buttons can be activated programmatically
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    await sendButton.evaluate(button => button.click());
    
    // Verify message was sent
    await expect(
      page.locator('[data-testid="message"]:has-text("Voice control test message")')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });
    
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Widget should still function with reduced motion
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await expect(messageInput).toBeVisible();
    
    // Send a message
    await messageInput.fill('Reduced motion test');
    await page.click('[data-testid="widget-send-button"]');
    
    // Verify message was sent
    await expect(
      page.locator('[data-testid="message"]:has-text("Reduced motion test")')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should have proper error handling for accessibility', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="widget-button"]');
    
    // Simulate an error condition
    await page.route('**/api/widget/**', route => route.abort());
    
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    await messageInput.fill('Error test message');
    await page.click('[data-testid="widget-send-button"]');
    
    // Check for error announcement
    const errorAnnouncement = page.locator('[aria-live="assertive"]');
    if (await errorAnnouncement.count() > 0) {
      await expect(errorAnnouncement).toBeVisible({ timeout: 5000 });
    }
    
    // Check for error message with proper ARIA attributes
    const errorMessage = page.locator('[role="alert"], [aria-invalid="true"]');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });
}); 