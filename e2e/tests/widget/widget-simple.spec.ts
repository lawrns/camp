import { test, expect } from '@playwright/test';

test.describe('Widget Simple', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should keep button visible after clicking', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if widget button exists initially
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible();
    
    // Get initial aria-label
    const initialAriaLabel = await widgetButton.getAttribute('aria-label');
    console.log('Initial aria-label:', initialAriaLabel);
    
    // Click the widget button using JavaScript
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="widget-button"]') as HTMLElement;
      if (button) {
        console.log('Found button, clicking...');
        button.click();
      } else {
        console.log('Button not found in DOM');
      }
    });
    
    // Wait a moment for state change
    await page.waitForTimeout(1000);
    
    // Check that the button is still visible
    await expect(widgetButton).toBeVisible();
    
    // Check that the aria-label changed
    const newAriaLabel = await widgetButton.getAttribute('aria-label');
    console.log('New aria-label:', newAriaLabel);
    
    // The aria-label should change from "Open chat" to "Close chat"
    expect(newAriaLabel).toBe('Close chat');
  });
}); 