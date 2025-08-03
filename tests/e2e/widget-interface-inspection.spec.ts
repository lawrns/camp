/**
 * WIDGET INTERFACE INSPECTION TEST
 * 
 * This test opens the widget and inspects the chat interface
 * to find the correct message input and send button selectors.
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001'
};

test.describe('Widget Interface Inspection', () => {
  test('should inspect widget chat interface', async ({ page }) => {
    console.log('🔍 Inspecting widget chat interface...');

    // Navigate to homepage
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');

    // Click widget button to open
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
    await page.click('[data-testid="widget-button"]');
    await page.waitForTimeout(3000); // Allow widget to fully open

    // Take a screenshot of the opened widget
    await page.screenshot({ path: 'widget-interface-inspection.png', fullPage: true });

    // Look for message input elements
    console.log('🔍 Looking for message input elements...');

    const inputSelectors = [
      '[data-testid="widget-message-input"]',
      '[data-testid="message-input"]',
      '[data-testid="chat-input"]',
      'input[placeholder*="message"]',
      'input[placeholder*="Message"]',
      'input[placeholder*="type"]',
      'input[placeholder*="Type"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="type"]',
      'textarea[placeholder*="Type"]',
      'input[type="text"]',
      'textarea',
      '.message-input',
      '.chat-input',
      '[role="textbox"]'
    ];

    for (const selector of inputSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found input element: ${selector} (count: ${count})`);
        
        const isVisible = await element.first().isVisible();
        const placeholder = await element.first().getAttribute('placeholder');
        const type = await element.first().getAttribute('type');
        console.log(`   - Visible: ${isVisible}, Placeholder: "${placeholder}", Type: ${type}`);
      }
    }

    // Look for send button elements
    console.log('🔍 Looking for send button elements...');

    const buttonSelectors = [
      '[data-testid="widget-send-button"]',
      '[data-testid="send-button"]',
      '[data-testid="chat-send"]',
      'button[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("send")',
      'button[aria-label*="send"]',
      'button[aria-label*="Send"]',
      '.send-button',
      '.chat-send',
      'button[class*="send"]'
    ];

    for (const selector of buttonSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found button element: ${selector} (count: ${count})`);
        
        const isVisible = await element.first().isVisible();
        const text = await element.first().textContent();
        const ariaLabel = await element.first().getAttribute('aria-label');
        console.log(`   - Visible: ${isVisible}, Text: "${text}", Aria-label: "${ariaLabel}"`);
      }
    }

    // Get all form elements in the widget
    const allInputs = page.locator('input, textarea, button');
    const inputCount = await allInputs.count();
    console.log(`🔍 Found ${inputCount} form elements in widget`);

    for (let i = 0; i < Math.min(inputCount, 15); i++) {
      const element = allInputs.nth(i);
      const tagName = await element.evaluate(el => el.tagName);
      const type = await element.getAttribute('type');
      const placeholder = await element.getAttribute('placeholder');
      const testId = await element.getAttribute('data-testid');
      const text = await element.textContent();
      const classes = await element.getAttribute('class');
      
      console.log(`   Element ${i}: ${tagName} (type: ${type}, placeholder: "${placeholder}", testid: ${testId}, text: "${text}")`);
      if (classes) {
        console.log(`     Classes: ${classes.substring(0, 100)}...`);
      }
    }

    // Get all elements with data-testid in the widget area
    const allTestIds = page.locator('[data-testid]');
    const testIdCount = await allTestIds.count();
    console.log(`🔍 Found ${testIdCount} elements with data-testid`);

    for (let i = 0; i < Math.min(testIdCount, 20); i++) {
      const element = allTestIds.nth(i);
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      const isVisible = await element.isVisible();
      console.log(`   TestID ${i}: ${testId} (${tagName}, visible: ${isVisible})`);
    }

    console.log('✅ Widget interface inspection completed!');
  });
});
