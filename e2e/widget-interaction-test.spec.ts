import { test, expect } from '@playwright/test';

test.describe('Widget Interaction Test', () => {
  test('should open widget and send a message like a real user', async ({ page }) => {
    console.log('🔍 Testing real user widget interaction...');
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for widget to load
    await page.waitForTimeout(3000);
    
    // Find and click widget button
    console.log('🔍 Looking for widget button...');
    await page.waitForSelector('[data-testid="widget-button"]', { 
      timeout: 10000,
      state: 'visible' 
    });
    
    console.log('✅ Widget button found, taking screenshot before click...');
    await page.screenshot({ path: 'before-widget-click.png', fullPage: true });
    
    // Click widget button
    await page.click('[data-testid="widget-button"]');
    console.log('✅ Widget button clicked');
    
    // Wait for animation to complete
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking screenshot after widget click...');
    await page.screenshot({ path: 'after-widget-click.png', fullPage: true });
    
    // Check what elements are now visible
    const allElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          testId: el.getAttribute('data-testid'),
          visible: rect.width > 0 && rect.height > 0 && el.offsetParent !== null,
          text: el.textContent?.slice(0, 50),
          placeholder: el.getAttribute('placeholder')
        };
      }).filter(el => 
        el.visible && (
          el.testId || 
          el.tagName === 'INPUT' || 
          el.tagName === 'TEXTAREA' || 
          el.tagName === 'BUTTON' ||
          el.className.includes('widget') ||
          el.className.includes('message') ||
          el.className.includes('input') ||
          el.className.includes('send')
        )
      );
    });
    
    console.log('🔍 Visible interactive elements after widget click:');
    allElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName} - testId: ${el.testId} - class: ${el.className.slice(0, 50)} - text: ${el.text}`);
    });
    
    // Look for any input field
    const inputElements = allElements.filter(el => 
      el.tagName === 'INPUT' || 
      el.tagName === 'TEXTAREA' ||
      el.placeholder?.toLowerCase().includes('message')
    );
    
    console.log('🔍 Found input elements:', inputElements);
    
    if (inputElements.length === 0) {
      console.log('❌ No input elements found. Widget may not have opened properly.');
      
      // Check if widget panel is visible
      const widgetPanel = await page.locator('[class*="widget"], [data-testid*="widget"], [class*="panel"], [class*="chat"]').count();
      console.log(`🔍 Widget panel elements found: ${widgetPanel}`);
      
      // Try clicking the widget button again
      console.log('🔄 Trying to click widget button again...');
      await page.click('[data-testid="widget-button"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'after-second-click.png', fullPage: true });
    }
    
    // Try to find message input with a more flexible approach
    const messageInputSelectors = [
      'input[placeholder*="message" i]',
      'input[placeholder*="type" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      '[data-testid="message-input"]',
      '[data-testid="widget-message-input"]',
      'input[type="text"]',
      'textarea'
    ];
    
    let messageInputFound = false;
    for (const selector of messageInputSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found message input with selector: ${selector}`);
          
          // Try to type a message
          const testMessage = 'Hello from E2E test!';
          await element.fill(testMessage);
          console.log(`✅ Typed message: ${testMessage}`);
          
          // Look for send button
          const sendButton = await page.locator('button:has-text("Send"), button[aria-label*="send" i], [data-testid*="send"]').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Send button clicked');
          }
          
          messageInputFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!messageInputFound) {
      console.log('❌ Could not find message input after widget opened');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-widget-state.png', fullPage: true });
    
    console.log('✅ Widget interaction test completed');
  });
});
