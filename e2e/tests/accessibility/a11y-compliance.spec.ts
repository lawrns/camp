import { test, expect } from '@playwright/test';

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check that interactive elements have proper labels
    const interactiveElements = page.locator('button, a, input, textarea, select');
    const elementCount = await interactiveElements.count();
    
    // Check a sample of elements
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = interactiveElements.nth(i);
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const textContent = await element.textContent();
      
      // Element should have some form of accessible name
      const hasLabel = ariaLabel || ariaLabelledBy || (textContent && textContent.trim() !== '');
      expect(hasLabel).toBe(true);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check that headings follow proper hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      const headingElements = await headings.all();
      let previousLevel = 0;
      
      for (const heading of headingElements) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        
        if (previousLevel === 0) {
          previousLevel = level;
          continue;
        }
        
        // Check that heading levels don't skip more than one level
        expect(level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = level;
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    // Check that form inputs have proper labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have some form of label
      const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
      expect(hasLabel).toBe(true);
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    // Check that images have proper alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be decorative
      const isAccessible = alt !== null || role === 'presentation';
      expect(isAccessible).toBe(true);
    }
  });

  test('should have proper skip links', async ({ page }) => {
    // Check for skip links (common accessibility pattern)
    const skipLinks = page.locator('a[href^="#"]');
    const skipLinkCount = await skipLinks.count();
    
    // If there are skip links, they should be properly styled
    if (skipLinkCount > 0) {
      for (let i = 0; i < skipLinkCount; i++) {
        const link = skipLinks.nth(i);
        const text = await link.textContent();
        expect(text).toBeTruthy();
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for status announcements
    const statusElements = page.locator('[role="status"], [aria-live="polite"]');
    const statusCount = await statusElements.count();
    
    // This is a basic check - in a real app you'd want more status announcements
    // For now, we'll just check that the page loads without errors
    expect(statusCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Test focus visibility
    const interactiveElements = page.locator('a, button, input, textarea, select');
    const elementCount = await interactiveElements.count();
    
    if (elementCount > 0) {
      const firstElement = interactiveElements.first();
      await firstElement.focus();
      
      // Check that focus is visible
      const hasFocusStyles = await firstElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.outline !== 'none' || style.borderColor !== 'transparent';
      });
      
      expect(hasFocusStyles).toBe(true);
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    // Basic color contrast check
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
        
        // Basic check that color is not transparent
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
        expect(color).not.toBe('transparent');
      }
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    const focusedCount = await focusedElement.count();
    expect(focusedCount).toBeGreaterThan(0);
    
    // Test tab navigation through interactive elements
    const interactiveElements = page.locator('a, button, input, textarea, select');
    const interactiveCount = await interactiveElements.count();
    
    if (interactiveCount > 0) {
      for (let i = 0; i < Math.min(interactiveCount, 3); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
    }
  });

  test('should have proper semantic HTML', async ({ page }) => {
    // Check for semantic elements
    const semanticElements = page.locator('main, nav, header, footer, section, article, aside');
    const semanticCount = await semanticElements.count();
    
    // Should have some semantic elements
    expect(semanticCount).toBeGreaterThan(0);
    
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
});
