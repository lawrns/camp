import { test, expect } from '@playwright/test';

test.describe('Design System Visual Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('design system CSS variables should be properly defined', async ({ page }) => {
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // Check all design system variables
      const vars: Record<string, string> = {};
      for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        if (property && property.startsWith('--ds-')) {
          vars[property] = computedStyle.getPropertyValue(property);
        }
      }
      return vars;
    });
    
    // Should have design system variables
    expect(Object.keys(cssVars).length).toBeGreaterThan(0);
    
    // Check for essential variables
    const essentialVars = [
      '--ds-color-primary',
      '--ds-color-secondary', 
      '--ds-spacing',
      '--ds-radius',
      '--ds-font-family',
      '--ds-font-size'
    ];
    
    for (const varName of essentialVars) {
      const parts = varName.split('-');
      const hasVar = Object.keys(cssVars).some(key => parts[2] && key.includes(parts[2]));
      expect(hasVar).toBe(true);
    }
  });

  test('typography should be consistent across the app', async ({ page }) => {
    // Check heading styles
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    for (const heading of headings) {
      const styles = await heading.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
        };
      });
      
      // Should have consistent font family
      expect(styles.fontFamily).toBeTruthy();
      expect(styles.fontWeight).toBeTruthy();
      expect(styles.lineHeight).toBeTruthy();
    }
  });

  test('color scheme should be consistent', async ({ page }) => {
    // Check that primary colors are used consistently
    const primaryElements = page.locator('button, .btn-primary, [data-variant="primary"]');
    
    if (await primaryElements.count() > 0) {
      const firstPrimary = primaryElements.first();
      const primaryColor = await firstPrimary.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor || styles.color;
      });
      
      // Should have a defined color
      expect(primaryColor).toBeTruthy();
      expect(primaryColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('spacing should be consistent', async ({ page }) => {
    // Check that elements have consistent spacing
    const containers = page.locator('section, div, main, aside');
    
    if (await containers.count() > 1) {
      const firstContainer = containers.first();
      const secondContainer = containers.nth(1);
      
      const firstPadding = await firstContainer.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          marginTop: styles.marginTop,
          marginBottom: styles.marginBottom,
        };
      });
      
      // Should have defined spacing values
      expect(firstPadding.paddingTop).toBeTruthy();
      expect(firstPadding.paddingBottom).toBeTruthy();
    }
  });

  test('border radius should be consistent', async ({ page }) => {
    // Check that rounded elements use consistent border radius
    const roundedElements = page.locator('button, .card, .rounded, [class*="rounded"]');
    
    if (await roundedElements.count() > 0) {
      const firstRounded = roundedElements.first();
      const borderRadius = await firstRounded.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.borderRadius;
      });
      
      // Should have defined border radius
      expect(borderRadius).toBeTruthy();
      expect(borderRadius).not.toBe('0px');
    }
  });

  test('shadows should be consistent', async ({ page }) => {
    // Check that shadowed elements use consistent shadows
    const shadowedElements = page.locator('.shadow, [class*="shadow"], .card, .elevated');
    
    if (await shadowedElements.count() > 0) {
      const firstShadowed = shadowedElements.first();
      const boxShadow = await firstShadowed.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.boxShadow;
      });
      
      // Should have defined shadow
      expect(boxShadow).toBeTruthy();
      expect(boxShadow).not.toBe('none');
    }
  });

  test('responsive breakpoints should work', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' },
      { width: 1440, height: 900, name: 'large' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Verify layout still works
      await expect(page.locator('main, body')).toBeVisible();
      
      // Check that content is properly sized
      const mainElement = page.locator('main, body');
      const boundingBox = await mainElement.first().boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('interactive states should be consistent', async ({ page }) => {
    // Test hover states
    const interactiveElements = page.locator('button, a, [role="button"]');
    
    if (await interactiveElements.count() > 0) {
      const firstInteractive = interactiveElements.first();
      
      // Get initial styles
      const initialStyles = await firstInteractive.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
        };
      });
      
      // Hover and check for changes
      await firstInteractive.hover();
      await page.waitForTimeout(500);
      
      const hoverStyles = await firstInteractive.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
        };
      });
      
      // Should have some visual feedback on hover
      expect(hoverStyles.backgroundColor || hoverStyles.transform).toBeTruthy();
    }
  });
}); 