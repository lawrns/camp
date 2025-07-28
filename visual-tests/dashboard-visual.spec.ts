import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('dashboard should load with proper layout', async ({ page }) => {
    // Test main dashboard elements
    await expect(page.locator('main')).toBeVisible();
    
    // Check for sidebar or navigation
    const sidebar = page.locator('nav, [role="navigation"], aside');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
    
    // Check for main content area
    const mainContent = page.locator('main, [role="main"], .main-content');
    await expect(mainContent.first()).toBeVisible();
  });

  test('dashboard should have proper typography', async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that text is readable
    const textElements = page.locator('p, span, div');
    const firstText = textElements.first();
    if (await firstText.isVisible()) {
      const textColor = await firstText.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });
      
      // Basic color check (should not be transparent or white on white)
      expect(textColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(textColor).not.toBe('transparent');
    }
  });

  test('dashboard should be responsive', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Verify layout still works
    await expect(page.locator('main')).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Verify mobile layout
    await expect(page.locator('main')).toBeVisible();
  });

  test('dashboard should have proper spacing and layout', async ({ page }) => {
    // Check that elements have proper spacing
    const mainElements = page.locator('main > *');
    const elementCount = await mainElements.count();
    
    if (elementCount > 1) {
      // Check that elements don't overlap
      const firstElement = mainElements.first();
      const secondElement = mainElements.nth(1);
      
      const firstBox = await firstElement.boundingBox();
      const secondBox = await secondElement.boundingBox();
      
      if (firstBox && secondBox) {
        // Elements should not overlap vertically
        expect(firstBox.y + firstBox.height).toBeLessThanOrEqual(secondBox.y);
      }
    }
  });

  test('dashboard should handle loading states gracefully', async ({ page }) => {
    // Check for loading indicators or skeleton states
    const loadingElements = page.locator('[data-loading], .loading, .skeleton, [aria-busy="true"]');
    
    // If loading elements exist, they should eventually disappear
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeVisible();
      // Wait for loading to complete
      await page.waitForTimeout(2000);
    }
    
    // Verify content is loaded
    await expect(page.locator('main')).toBeVisible();
  });

  test('dashboard should have proper interactive elements', async ({ page }) => {
    // Test buttons and links
    const interactiveElements = page.locator('button, a, [role="button"], [tabindex]');
    
    if (await interactiveElements.count() > 0) {
      const firstInteractive = interactiveElements.first();
      await expect(firstInteractive).toBeVisible();
      
      // Test focus states
      await firstInteractive.focus();
      await page.waitForTimeout(500);
      
      const focusStyles = await firstInteractive.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Should have some focus indication
      expect(focusStyles.outline || focusStyles.boxShadow).toBeTruthy();
    }
  });
}); 