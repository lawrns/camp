import { test, expect } from '@playwright/test';

/**
 * Simple Widget Test
 * Basic test to check if widget renders
 */

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3003'
};

test.describe('Simple Widget Test', () => {
  test('should render widget demo page', async ({ page }) => {
    console.log('🔧 Testing widget demo page rendering...');
    
    // Navigate to widget demo
    await page.goto(`${TEST_CONFIG.BASE_URL}/widget-demo`);
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Widget demo page loaded');
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'widget-demo-page.png', fullPage: true });
    console.log('📸 Screenshot saved as widget-demo-page.png');
    
    // Check if the page title is correct
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check if there's any content on the page
    const bodyText = await page.locator('body').textContent();
    console.log(`Body text length: ${bodyText?.length || 0}`);
    
    if (bodyText && bodyText.length > 100) {
      console.log('Body text preview:', bodyText.substring(0, 200) + '...');
    }
    
    // Look for any elements with data-testid
    const testElements = await page.locator('[data-testid]').count();
    console.log(`Found ${testElements} elements with data-testid`);
    
    if (testElements > 0) {
      for (let i = 0; i < Math.min(testElements, 10); i++) {
        const element = page.locator('[data-testid]').nth(i);
        const testId = await element.getAttribute('data-testid');
        const isVisible = await element.isVisible();
        console.log(`Element ${i + 1}: data-testid="${testId}" visible=${isVisible}`);
      }
    }
    
    // Look for widget-related elements
    const widgetElements = await page.locator('[class*="widget"], [id*="widget"], [data-testid*="widget"]').count();
    console.log(`Found ${widgetElements} widget-related elements`);
    
    // Check for any error messages
    const errorElements = await page.locator('.error, [data-testid="error"], .alert-error, .text-red').count();
    console.log(`Found ${errorElements} error elements`);
    
    if (errorElements > 0) {
      for (let i = 0; i < errorElements; i++) {
        const errorText = await page.locator('.error, [data-testid="error"], .alert-error, .text-red').nth(i).textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Check for buttons
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons`);
    
    if (buttons > 0) {
      for (let i = 0; i < Math.min(buttons, 5); i++) {
        const button = page.locator('button').nth(i);
        const buttonText = await button.textContent();
        const buttonTestId = await button.getAttribute('data-testid');
        const isVisible = await button.isVisible();
        console.log(`Button ${i + 1}: "${buttonText}" testid="${buttonTestId}" visible=${isVisible}`);
      }
    }
    
    // Check console for errors
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Wait a bit for any async rendering
    await page.waitForTimeout(5000);
    
    console.log('Console logs:');
    logs.forEach((log, index) => {
      if (index < 20) { // Limit to first 20 logs
        console.log(`  ${log}`);
      }
    });
    
    // Final check for widget button
    const widgetButton = page.locator('[data-testid="widget-button"]');
    const widgetButtonExists = await widgetButton.count() > 0;
    const widgetButtonVisible = widgetButtonExists ? await widgetButton.isVisible() : false;
    
    console.log(`Widget button exists: ${widgetButtonExists}`);
    console.log(`Widget button visible: ${widgetButtonVisible}`);
    
    if (widgetButtonExists && !widgetButtonVisible) {
      const buttonStyles = await widgetButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex
        };
      });
      console.log('Widget button styles:', buttonStyles);
    }
  });
});
