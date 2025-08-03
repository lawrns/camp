/**
 * WIDGET SELECTOR INSPECTION TEST
 * 
 * This test inspects the homepage to find the correct widget selectors
 * and verify what elements are actually available.
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123'
};

test.describe('Widget Selector Inspection', () => {
  test('should inspect homepage for widget elements', async ({ page }) => {
    console.log('🔍 Inspecting homepage for widget elements...');

    // Navigate to homepage
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');

    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'homepage-inspection.png', fullPage: true });

    // Look for any widget-related elements
    console.log('🔍 Looking for widget elements...');

    // Check for various possible widget selectors
    const possibleSelectors = [
      '[data-testid="widget-button"]',
      '[data-testid="widget"]',
      '[data-testid="chat-widget"]',
      '[data-testid="support-widget"]',
      '.widget-button',
      '.chat-widget',
      '.support-widget',
      '#widget',
      '#chat-widget',
      'button[class*="widget"]',
      'div[class*="widget"]',
      '[aria-label*="chat"]',
      '[aria-label*="support"]',
      '[aria-label*="help"]'
    ];

    for (const selector of possibleSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found element with selector: ${selector} (count: ${count})`);
        
        // Get element details
        const isVisible = await element.first().isVisible();
        const text = await element.first().textContent();
        console.log(`   - Visible: ${isVisible}`);
        console.log(`   - Text: "${text}"`);
      }
    }

    // Get all buttons on the page
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`🔍 Found ${buttonCount} buttons on the page`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      const testId = await button.getAttribute('data-testid');
      console.log(`   Button ${i}: "${text}" (class: ${classes}, testid: ${testId})`);
    }

    // Get all divs with data-testid
    const allTestIds = page.locator('[data-testid]');
    const testIdCount = await allTestIds.count();
    console.log(`🔍 Found ${testIdCount} elements with data-testid`);

    for (let i = 0; i < Math.min(testIdCount, 20); i++) {
      const element = allTestIds.nth(i);
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      console.log(`   TestID ${i}: ${testId} (${tagName})`);
    }

    // Check page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Page title: "${title}"`);
    console.log(`🔗 Page URL: ${url}`);

    console.log('✅ Homepage inspection completed!');
  });

  test('should inspect dashboard for conversation elements', async ({ page }) => {
    console.log('🔍 Inspecting dashboard for conversation elements...');

    // Login first
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('#email', TEST_CONFIG.agentEmail);
    await page.fill('#password', TEST_CONFIG.agentPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');

    // Navigate to inbox
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/inbox`);
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-inspection.png', fullPage: true });

    // Look for conversation-related elements
    const conversationSelectors = [
      '[data-testid="conversation-item"]',
      '[data-testid="conversations-list"]',
      '[data-testid="conversation"]',
      '.conversation-item',
      '.conversation',
      '[class*="conversation"]'
    ];

    for (const selector of conversationSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found conversation element: ${selector} (count: ${count})`);
      }
    }

    // Get all elements with data-testid in dashboard
    const dashboardTestIds = page.locator('[data-testid]');
    const dashboardTestIdCount = await dashboardTestIds.count();
    console.log(`🔍 Found ${dashboardTestIdCount} elements with data-testid in dashboard`);

    for (let i = 0; i < Math.min(dashboardTestIdCount, 30); i++) {
      const element = dashboardTestIds.nth(i);
      const testId = await element.getAttribute('data-testid');
      const tagName = await element.evaluate(el => el.tagName);
      console.log(`   Dashboard TestID ${i}: ${testId} (${tagName})`);
    }

    console.log('✅ Dashboard inspection completed!');
  });
});
