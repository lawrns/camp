import { test, expect } from '@playwright/test';

test.describe('Simple Widget Test', () => {
  test('should render widget button on homepage', async ({ page }) => {
    console.log('🔍 Testing basic widget rendering...');
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(3000);
    
    // Check for any JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ Page error:', error.message);
    });
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'simple-widget-test.png', fullPage: true });
    
    // Check what elements are actually on the page
    const allTestIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
        testId: el.getAttribute('data-testid'),
        tagName: el.tagName,
        visible: el.offsetParent !== null,
        text: el.textContent?.slice(0, 50)
      }));
    });
    
    console.log('🔍 All elements with data-testid on page:', allTestIds);
    
    // Check for widget-related elements
    const widgetElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="widget"], [id*="widget"], [data-testid*="widget"]')).map(el => ({
        className: el.className,
        id: el.id,
        tagName: el.tagName,
        testId: el.getAttribute('data-testid'),
        visible: el.offsetParent !== null
      }));
    });
    
    console.log('🔍 All widget-related elements on page:', widgetElements);
    
    // Check if there are any errors
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:', errors);
    }
    
    // Try to find the widget button with a longer timeout
    try {
      await page.waitForSelector('[data-testid="widget-button"]', { 
        timeout: 10000,
        state: 'visible' 
      });
      console.log('✅ Widget button found!');
    } catch (error) {
      console.log('❌ Widget button not found after 10 seconds');
      
      // Check if the widget components are loaded in the DOM at all
      const widgetScripts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script')).map(script => script.src).filter(src => src.includes('widget') || src.includes('Widget'));
      });
      
      console.log('🔍 Widget-related scripts loaded:', widgetScripts);
      
      throw error;
    }
  });
});
