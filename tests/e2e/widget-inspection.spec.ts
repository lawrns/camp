/**
 * WIDGET INSPECTION TEST
 * 
 * This test opens the homepage and inspects what widget elements are actually available
 * to understand why the bidirectional communication tests are failing.
 */

import { test, expect } from '@playwright/test';

test.describe('Widget Inspection', () => {
  test('should inspect homepage for widget elements', async ({ page }) => {
    console.log('🔍 Inspecting homepage for widget elements...');

    // Navigate to homepage
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Homepage loaded');

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'homepage-inspection.png', fullPage: true });
    console.log('📸 Screenshot saved: homepage-inspection.png');

    // Look for any widget-related elements
    const widgetSelectors = [
      '[data-testid="widget-button"]',
      '[data-testid="widget-panel"]',
      '[data-testid="widget-message-input"]',
      '[data-testid="widget-send-button"]',
      '.widget',
      '.chat-widget',
      '.support-widget',
      '[class*="widget"]',
      '[class*="chat"]',
      '[class*="support"]',
      'button:has-text("Chat")',
      'button:has-text("Support")',
      'button:has-text("Help")',
      'button:has-text("Message")'
    ];

    console.log('🔍 Looking for widget elements...');
    
    for (const selector of widgetSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} element(s) with selector: ${selector}`);
        
        // Get more details about the first element
        const firstElement = elements.first();
        const tagName = await firstElement.evaluate(el => el.tagName);
        const className = await firstElement.evaluate(el => el.className);
        const textContent = await firstElement.textContent();
        console.log(`   Tag: ${tagName}, Class: ${className}, Text: "${textContent?.trim()}"`);
      } else {
        console.log(`❌ No elements found with selector: ${selector}`);
      }
    }

    // Look for any input elements that might be message inputs
    console.log('🔍 Looking for message input elements...');
    const inputSelectors = [
      'input[type="text"]',
      'textarea',
      'input[placeholder*="message"]',
      'input[placeholder*="Message"]',
      'input[placeholder*="type"]',
      'input[placeholder*="Type"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="type"]',
      'textarea[placeholder*="Type"]'
    ];

    for (const selector of inputSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} input element(s) with selector: ${selector}`);
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          const placeholder = await element.getAttribute('placeholder');
          const id = await element.getAttribute('id');
          const className = await element.getAttribute('class');
          console.log(`   Input ${i + 1}: placeholder="${placeholder}", id="${id}", class="${className}"`);
        }
      }
    }

    // Look for any button elements that might be send buttons
    console.log('🔍 Looking for send button elements...');
    const buttonSelectors = [
      'button:has-text("Send")',
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[title*="Send"]',
      '[data-testid*="send"]',
      '[data-testid*="submit"]'
    ];

    for (const selector of buttonSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} button element(s) with selector: ${selector}`);
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          const textContent = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          console.log(`   Button ${i + 1}: text="${textContent?.trim()}", aria-label="${ariaLabel}", title="${title}"`);
        }
      }
    }

    // Check if there are any React components or iframes
    console.log('🔍 Looking for React components or iframes...');
    const iframes = page.locator('iframe');
    const iframeCount = await iframes.count();
    console.log(`Found ${iframeCount} iframe(s)`);

    // Check for any script tags that might indicate widget loading
    const scripts = page.locator('script');
    const scriptCount = await scripts.count();
    console.log(`Found ${scriptCount} script tag(s)`);

    // Look for any elements with data-testid attributes
    const testIdElements = page.locator('[data-testid]');
    const testIdCount = await testIdElements.count();
    console.log(`Found ${testIdCount} element(s) with data-testid attributes`);

    if (testIdCount > 0) {
      for (let i = 0; i < Math.min(testIdCount, 10); i++) {
        const element = testIdElements.nth(i);
        const testId = await element.getAttribute('data-testid');
        const tagName = await element.evaluate(el => el.tagName);
        console.log(`   data-testid="${testId}" (${tagName})`);
      }
    }

    console.log('🔍 Inspection complete!');
  });

  test('should inspect opened widget panel', async ({ page }) => {
    console.log('🔍 Inspecting opened widget panel...');

    // Navigate to homepage
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Homepage loaded');

    // Wait for widget button to appear and click it
    await page.waitForSelector('[data-testid="widget-button"]', { timeout: 15000 });
    console.log('✅ Widget button found, clicking...');
    await page.click('[data-testid="widget-button"]');

    // Wait for widget panel to open
    await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
    console.log('✅ Widget panel opened');

    // Wait a bit more for any animations or content to load
    await page.waitForTimeout(3000);

    // Take a screenshot of the opened widget
    await page.screenshot({ path: 'widget-panel-inspection.png', fullPage: true });
    console.log('📸 Screenshot saved: widget-panel-inspection.png');

    // Inspect the widget panel specifically
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    console.log('🔍 Inspecting widget panel contents...');

    // Get all elements inside the widget panel
    const panelElements = widgetPanel.locator('*');
    const elementCount = await panelElements.count();
    console.log(`Found ${elementCount} elements inside widget panel`);

    // Look for specific elements inside the widget panel
    const panelInputSelectors = [
      'input',
      'textarea',
      'input[type="text"]',
      'input[placeholder*="message"]',
      'input[placeholder*="Message"]',
      'input[placeholder*="type"]',
      'input[placeholder*="Type"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="type"]',
      'textarea[placeholder*="Type"]'
    ];

    console.log('🔍 Looking for input elements inside widget panel...');
    for (const selector of panelInputSelectors) {
      const elements = widgetPanel.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} input element(s) with selector: ${selector}`);
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          const placeholder = await element.getAttribute('placeholder');
          const id = await element.getAttribute('id');
          const className = await element.getAttribute('class');
          const type = await element.getAttribute('type');
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`   Input ${i + 1}: tag="${tagName}", type="${type}", placeholder="${placeholder}", id="${id}", class="${className}"`);
        }
      }
    }

    // Look for button elements inside the widget panel
    const panelButtonSelectors = [
      'button',
      'button:has-text("Send")',
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[title*="Send"]',
      '[data-testid*="send"]',
      '[data-testid*="submit"]'
    ];

    console.log('🔍 Looking for button elements inside widget panel...');
    for (const selector of panelButtonSelectors) {
      const elements = widgetPanel.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} button element(s) with selector: ${selector}`);
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          const textContent = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          const type = await element.getAttribute('type');
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`   Button ${i + 1}: tag="${tagName}", type="${type}", text="${textContent?.trim()}", aria-label="${ariaLabel}", title="${title}"`);
        }
      }
    }

    // Look for any elements with data-testid attributes inside the widget panel
    const panelTestIdElements = widgetPanel.locator('[data-testid]');
    const panelTestIdCount = await panelTestIdElements.count();
    console.log(`Found ${panelTestIdCount} element(s) with data-testid attributes inside widget panel`);

    if (panelTestIdCount > 0) {
      for (let i = 0; i < Math.min(panelTestIdCount, 10); i++) {
        const element = panelTestIdElements.nth(i);
        const testId = await element.getAttribute('data-testid');
        const tagName = await element.evaluate(el => el.tagName);
        const textContent = await element.textContent();
        console.log(`   data-testid="${testId}" (${tagName}) - text: "${textContent?.trim()}"`);
      }
    }

    // Look for any form elements inside the widget panel
    const formElements = widgetPanel.locator('form');
    const formCount = await formElements.count();
    console.log(`Found ${formCount} form element(s) inside widget panel`);

    if (formCount > 0) {
      for (let i = 0; i < formCount; i++) {
        const form = formElements.nth(i);
        const action = await form.getAttribute('action');
        const method = await form.getAttribute('method');
        const className = await form.getAttribute('class');
        console.log(`   Form ${i + 1}: action="${action}", method="${method}", class="${className}"`);
        
        // Look for inputs inside this form
        const formInputs = form.locator('input, textarea');
        const inputCount = await formInputs.count();
        console.log(`     Form ${i + 1} has ${inputCount} input/textarea elements`);
      }
    }

    console.log('🔍 Widget panel inspection complete!');
  });
}); 