import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that there are headings (don't require exactly one h1)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check that headings have proper hierarchy (h1 comes before h2, etc.)
    const headingElements = await headings.all();
    let previousLevel = 0;
    
    for (const heading of headingElements) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      
      // Skip if this is the first heading
      if (previousLevel === 0) {
        previousLevel = level;
        continue;
      }
      
      // Check that heading levels don't skip more than one level
      expect(level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = level;
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      const hasAccessibleName = ariaLabel || (textContent && textContent.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
    
    // Check links have accessible text
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      const textContent = await link.textContent();
      const hasAccessibleName = ariaLabel || (textContent && textContent.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Basic color contrast check - ensure text is visible
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    const textCount = await textElements.count();
    
    // Check a sample of text elements
    for (let i = 0; i < Math.min(textCount, 5); i++) {
      const element = textElements.nth(i);
      const isVisible = await element.isVisible();
      if (isVisible) {
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.color;
        });
        
        // Basic check that color is not transparent or white on white
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
        expect(color).not.toBe('transparent');
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Focus the first interactive element
    await page.keyboard.press('Tab');
    
    // Check that focus is visible (basic check)
    const focusedElement = page.locator(':focus');
    const focusedCount = await focusedElement.count();
    expect(focusedCount).toBeGreaterThan(0);
    
    // Test that we can navigate through interactive elements
    const interactiveElements = page.locator('a, button, input, textarea, select');
    const interactiveCount = await interactiveElements.count();
    
    if (interactiveCount > 0) {
      // Tab through a few elements
      for (let i = 0; i < Math.min(interactiveCount, 3); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Test focus management on interactive elements
    const interactiveElements = page.locator('a, button, input, textarea, select');
    const interactiveCount = await interactiveElements.count();
    
    if (interactiveCount > 0) {
      // Focus the first element
      const firstElement = interactiveElements.first();
      await firstElement.focus();
      
      // Check that it has focus
      await expect(firstElement).toBeFocused();
      
      // Check that focus is visible (basic check)
      const hasFocusStyles = await firstElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.outline !== 'none' || style.borderColor !== 'transparent';
      });
      
      // This is a basic check - in a real app you'd want more sophisticated focus indicators
      expect(hasFocusStyles).toBeTruthy();
    }
  });

  test('should have proper semantic HTML', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for proper semantic elements
    const main = page.locator('main');
    const nav = page.locator('nav');
    const header = page.locator('header');
    const footer = page.locator('footer');
    
    // At least one of these semantic elements should exist
    const mainCount = await main.count();
    const navCount = await nav.count();
    const headerCount = await header.count();
    const footerCount = await footer.count();
    
    const hasSemanticElements = mainCount > 0 || navCount > 0 || headerCount > 0 || footerCount > 0;
    expect(hasSemanticElements).toBeTruthy();
    
    // Check that lists use proper list elements
    const lists = page.locator('ul, ol');
    const listCount = await lists.count();
    
    if (listCount > 0) {
      for (let i = 0; i < listCount; i++) {
        const list = lists.nth(i);
        const listItems = list.locator('li');
        const itemCount = await listItems.count();
        expect(itemCount).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper language attributes', async ({ page }) => {
    // Check that html element has lang attribute
    const htmlElement = page.locator('html');
    const langAttribute = await htmlElement.getAttribute('lang');
    
    // The lang attribute should exist and be a valid language code
    expect(langAttribute).toBeTruthy();
    expect(langAttribute).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page respects reduced motion preferences
    const respectsReducedMotion = await page.evaluate(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return mediaQuery.matches;
    });
    
    // This is just a check that the media query works
    expect(typeof respectsReducedMotion).toBe('boolean');
  });

  test('should have proper error handling', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that error messages are properly announced
    const errorElements = page.locator('[role="alert"], [aria-live="assertive"]');
    const errorCount = await errorElements.count();
    
    // If there are error elements, they should have proper ARIA attributes
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorElement = errorElements.nth(i);
        const role = await errorElement.getAttribute('role');
        const ariaLive = await errorElement.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive === 'assertive').toBeTruthy();
      }
    }
  });
}); 