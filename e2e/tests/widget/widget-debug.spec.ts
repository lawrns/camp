import { test, expect } from '@playwright/test';

test.describe('Widget Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should check page loads and widget structure', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Log the page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if any widget-related elements exist
    const widgetElements = await page.locator('[data-testid*="widget"]').count();
    console.log('Widget elements found:', widgetElements);
    
    // List all data-testid attributes
    const allTestIds = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]');
      return Array.from(elements).map(el => el.getAttribute('data-testid'));
    });
    console.log('All data-testid attributes:', allTestIds);
    
    // Check if there are any React errors in console
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Wait a moment for any errors
    await page.waitForTimeout(2000);
    
    // Log any errors
    console.log('Console errors:', consoleMessages);
    
    // Take a screenshot
    await page.screenshot({ path: 'widget-debug-page.png' });
    
    // The page should load successfully
    expect(title).toContain('Campfire');
  });

  test('should check widget renders correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if widget button exists (should exist now that error is fixed)
    const widgetButton = page.locator('[data-testid="widget-button"]');
    const buttonExists = await widgetButton.count();
    console.log('Widget button exists:', buttonExists > 0);
    
    // Check if error boundary exists (should not exist now)
    const errorBoundary = page.locator('[data-testid="widget-error-boundary"]');
    const errorBoundaryExists = await errorBoundary.count();
    console.log('Error boundary exists:', errorBoundaryExists > 0);
    
    // Take a screenshot
    await page.screenshot({ path: 'widget-working.png' });
    
    // The widget button should exist and error boundary should not
    expect(buttonExists).toBeGreaterThan(0);
    expect(errorBoundaryExists).toBe(0);
  });
}); 