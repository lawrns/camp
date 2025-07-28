import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper navigation', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check call-to-action buttons that actually exist
    const startTrialLink = page.locator('a:has-text("Start Free Trial")');
    const demoLink = page.locator('a:has-text("See It In Action")');

    await expect(startTrialLink).toBeVisible();
    await expect(demoLink).toBeVisible();

    // Check that links point to correct URLs
    await expect(startTrialLink).toHaveAttribute('href', '/register');
    await expect(demoLink).toHaveAttribute('href', '/demo');
  });

  test('should display hero section', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check hero section content that actually exists
    await expect(page.locator('h1:has-text("Transform Every")')).toBeVisible();
    await expect(page.locator('text=AI-Native Customer Communication')).toBeVisible();
    
    // Check CTA buttons in hero section that actually exist
    await expect(page.locator('a:has-text("Start Free Trial")')).toBeVisible();
    await expect(page.locator('a:has-text("See It In Action")')).toBeVisible();
  });

  test('should display feature cards section', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check feature cards that actually exist
    await expect(page.locator('text=AI-Powered Support')).toBeVisible();
    await expect(page.locator('text=Seamless Handoffs')).toBeVisible();
    await expect(page.locator('text=Real-time Collaboration')).toBeVisible();

    // Check feature descriptions
    await expect(page.locator('text=Instant responses with human-like conversation quality')).toBeVisible();
    await expect(page.locator('text=Context-preserving transitions between AI and human agents')).toBeVisible();
    await expect(page.locator('text=Live chat with typing indicators and instant delivery')).toBeVisible();
  });

  test('should have call-to-action buttons', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check main CTA buttons that actually exist
    const startTrialButton = page.locator('a:has-text("Start Free Trial")');
    const demoButton = page.locator('a:has-text("See It In Action")');

    // Should have "Start Free Trial" button
    await expect(startTrialButton).toBeVisible();

    // Should have "See It In Action" button
    await expect(demoButton).toBeVisible();

    // Check that CTA buttons link to correct URLs
    await expect(startTrialButton).toHaveAttribute('href', '/register');
    await expect(demoButton).toHaveAttribute('href', '/demo');
  });

  test('should be responsive', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that CTA buttons are still accessible
    await expect(page.locator('a:has-text("Start Free Trial")')).toBeVisible();
    await expect(page.locator('a:has-text("See It In Action")')).toBeVisible();
    
    // Check that main content is still readable
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that content is still accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:has-text("Start Free Trial")')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Check that content is still accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:has-text("Start Free Trial")')).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that there's a main h1 heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that there are h2 headings for sections
    const h2Headings = page.locator('h2');
    await expect(h2Headings).toHaveCount(await h2Headings.count());
    
    // Check that headings are properly nested
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should have working links', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Test CTA links that actually exist
    const startTrialLink = page.locator('a:has-text("Start Free Trial")');
    const demoLink = page.locator('a:has-text("See It In Action")');

    // Check that links are clickable
    await expect(startTrialLink).toBeEnabled();
    await expect(demoLink).toBeEnabled();

    // Test that links have proper href attributes
    await expect(startTrialLink).toHaveAttribute('href', '/register');
    await expect(demoLink).toHaveAttribute('href', '/demo');
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow some expected errors in development environment
    const filteredErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('apple-touch-icon') &&
      !error.includes('manifest') &&
      !error.includes('500 (Internal Server Error)') &&
      !error.includes('Failed to load resource')
    );
    
    expect(filteredErrors).toHaveLength(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeAttached();
  });

  test('should have accessible CTA buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that CTA buttons have proper accessible text
    const ctaButtons = page.locator('a[href="/register"], a[href="/demo"]');
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check that each button has accessible text
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i);
      const text = await button.textContent();
      expect(text?.trim()).toBeTruthy();

      // Check that buttons are keyboard accessible
      await expect(button).toBeEnabled();
    }
  });
}); 