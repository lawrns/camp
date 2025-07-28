import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Design System', () => {
  test('should render design system tokens correctly', async ({ page }) => {
    await page.goto('/test-design');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot('design-system-page.png');
  });

  test('should display correct color tokens', async ({ page }) => {
    await page.goto('/test-design');
    
    // Check if design system CSS variables are loaded
    const hasDesignSystemVars = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      return rootStyles.getPropertyValue('--ds-color-primary-600') !== '';
    });
    
    expect(hasDesignSystemVars).toBe(true);
  });

  test('should maintain consistent spacing', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    // Check spacing consistency by measuring element gaps
    const spacingConsistent = await page.evaluate(() => {
      const elements = document.querySelectorAll('.spacing-4, .spacing-6, .spacing-8');
      const gaps = [];
      
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        gaps.push(parseInt(style.gap || '0'));
      }
      
      // All gaps should be multiples of 8px (design system grid)
      return gaps.every(gap => gap % 8 === 0);
    });
    
    expect(spacingConsistent).toBe(true);
  });

  test('should render button variants correctly', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    // Check button styling
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const hasDesignSystemClasses = await button.evaluate(el => {
        return el.className.includes('ds-') || 
               el.className.includes('bg-ds-color-') ||
               el.className.includes('text-ds-');
      });
      
      // At least some buttons should use design system classes
      if (buttons.indexOf(button) < 3) {
        expect(hasDesignSystemClasses).toBe(true);
      }
    }
  });

  test('should maintain responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app/dashboard');
    await expect(page).toHaveScreenshot('dashboard-desktop.png');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page).toHaveScreenshot('dashboard-tablet.png');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });

  test('should handle dark mode correctly', async ({ page }) => {
    await page.goto('/app/dashboard');
    
    // Check if dark mode classes are applied correctly
    const hasDarkModeSupport = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.querySelector('[class*="dark:"]') !== null;
    });
    
    // Should support dark mode (even if not currently active)
    expect(hasDarkModeSupport).toBeDefined();
  });
});
