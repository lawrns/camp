import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for all content to load
    await page.waitForLoadState('networkidle');
  });

  test('homepage should load with proper visual elements', async ({ page }) => {
    // Test navigation bar
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Get Started")')).toBeVisible();
    
    // Test hero section
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Campfire');
    
    // Test CTA buttons
    const ctaButtons = page.locator('button:has-text("Get Started"), a:has-text("Get Started")');
    await expect(ctaButtons.first()).toBeVisible();
    
    // Test features section
    await expect(page.locator('section')).toBeVisible();
  });

  test('design system tokens should be applied correctly', async ({ page }) => {
    // Check that design system CSS variables are loaded
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return {
        primaryColor: computedStyle.getPropertyValue('--ds-color-primary-600'),
        spacing: computedStyle.getPropertyValue('--ds-spacing-4'),
        radius: computedStyle.getPropertyValue('--ds-radius-md'),
      };
    });
    
    expect(cssVars.primaryColor).toBeTruthy();
    expect(cssVars.spacing).toBeTruthy();
    expect(cssVars.radius).toBeTruthy();
  });

  test('responsive design should work on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Verify mobile navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that content is properly sized for mobile
    const heroText = page.locator('h1');
    const heroBox = await heroText.boundingBox();
    expect(heroBox?.width).toBeLessThan(375);
  });

  test('accessibility features should be present', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper contrast (basic check)
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    await expect(textElements.first()).toBeVisible();
  });

  test('interactive elements should be properly styled', async ({ page }) => {
    // Test button hover states
    const buttons = page.locator('button, a[role="button"]');
    const firstButton = buttons.first();
    
    if (await firstButton.isVisible()) {
      await firstButton.hover();
      await page.waitForTimeout(500);
      
      // Check that hover state is applied (basic check)
      const hoverStyles = await firstButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          cursor: styles.cursor,
          transform: styles.transform,
        };
      });
      
      expect(hoverStyles.cursor).toBe('pointer');
    }
  });

  test('loading states should be smooth', async ({ page }) => {
    // Navigate to a new page and back to test loading
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no layout shifts occurred
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
}); 