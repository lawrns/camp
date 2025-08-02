/**
 * Performance Regression Test Suite
 * 
 * Tests for the specific performance issues that were fixed:
 * 1. Render thrashing prevention
 * 2. Real-time connection stability
 * 3. Auth validation spam prevention
 * 4. Preload warning elimination
 * 5. 401 error handling
 */

import { test, expect } from '@playwright/test';

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TIMEOUTS: {
    WIDGET_LOAD: 10000,
    CONNECTION: 15000,
    MESSAGE_SEND: 10000,
  }
};

test.describe('Performance Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear console to start fresh
    await page.evaluate(() => console.clear());
  });

  test('should not have render thrashing in widget', async ({ page }) => {
    console.log('🔄 Testing render thrashing prevention...');
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Monitor console logs for excessive rendering
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[UltimateWidget] COMPONENT RENDERING')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Open and close widget multiple times to trigger potential thrashing
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.WIDGET_LOAD });
    
    for (let i = 0; i < 5; i++) {
      await widgetButton.click();
      await page.waitForTimeout(500);
      await widgetButton.click();
      await page.waitForTimeout(500);
    }
    
    // Wait a bit more to catch any delayed renders
    await page.waitForTimeout(2000);
    
    // Should not have excessive render logs (more than 10 in 2 seconds indicates thrashing)
    expect(consoleLogs.length).toBeLessThan(10);
    console.log(`✅ Render count: ${consoleLogs.length} (should be < 10)`);
  });

  test('should not have auth validation spam', async ({ page }) => {
    console.log('🔐 Testing auth validation spam prevention...');
    
    // Monitor console logs for auth validation spam
    const authLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Valid token found') || msg.text().includes('[Auth]')) {
        authLogs.push(msg.text());
      }
    });
    
    // Navigate to homepage and wait
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Wait for 10 seconds to see if auth validation is spamming
    await page.waitForTimeout(10000);
    
    // Should not have excessive auth validation logs (more than 5 in 10 seconds indicates spam)
    expect(authLogs.length).toBeLessThan(5);
    console.log(`✅ Auth validation count: ${authLogs.length} (should be < 5)`);
  });

  test('should not have realtime connection thrashing', async ({ page }) => {
    console.log('🌐 Testing realtime connection stability...');
    
    // Monitor console logs for connection thrashing
    const realtimeLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('disconnecting') || text.includes('errored') || text.includes('CHANNEL_ERROR')) {
        realtimeLogs.push(text);
      }
    });
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Open widget to trigger realtime connection
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    
    // Wait for connection to establish and stabilize
    await page.waitForTimeout(15000);
    
    // Should not have connection thrashing logs
    expect(realtimeLogs.length).toBeLessThan(3);
    console.log(`✅ Connection error count: ${realtimeLogs.length} (should be < 3)`);
  });

  test('should not have 401 errors from widget refresh', async ({ page }) => {
    console.log('🚫 Testing 401 error prevention...');
    
    // Monitor network requests for 401 errors
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (response.status() === 401 && response.url().includes('/api/widget/refresh')) {
        failedRequests.push(response.url());
      }
    });
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Open widget and wait for potential refresh attempts
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    
    // Wait for 30 seconds to see if any 401 errors occur
    await page.waitForTimeout(30000);
    
    // Should not have any 401 errors from widget refresh
    expect(failedRequests.length).toBe(0);
    console.log(`✅ 401 error count: ${failedRequests.length} (should be 0)`);
  });

  test('should not have preload warnings', async ({ page }) => {
    console.log('⚠️ Testing preload warning elimination...');
    
    // Monitor console logs for preload warnings
    const preloadWarnings: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('preload') && text.includes('not used') && text.includes('Sundry')) {
        preloadWarnings.push(text);
      }
    });
    
    // Navigate to homepage
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Wait for page to fully load and check for preload warnings
    await page.waitForTimeout(5000);
    
    // Should not have any Sundry font preload warnings
    expect(preloadWarnings.length).toBe(0);
    console.log(`✅ Preload warning count: ${preloadWarnings.length} (should be 0)`);
  });

  test('should have stable widget performance', async ({ page }) => {
    console.log('⚡ Testing overall widget performance...');
    
    // Navigate to homepage
    const startTime = Date.now();
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    // Widget should load quickly
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await expect(widgetButton).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.WIDGET_LOAD });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
    console.log(`✅ Widget load time: ${loadTime}ms (should be < 5000ms)`);
    
    // Widget should open quickly
    const openStartTime = Date.now();
    await widgetButton.click();
    
    // Wait for widget panel to appear
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible({ timeout: 3000 });
    
    const openTime = Date.now() - openStartTime;
    expect(openTime).toBeLessThan(1000);
    console.log(`✅ Widget open time: ${openTime}ms (should be < 1000ms)`);
  });

  test('should handle message sending without performance issues', async ({ page }) => {
    console.log('💬 Testing message sending performance...');
    
    // Navigate to homepage and open widget
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    
    // Wait for widget to open
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Find message input and send button
    const messageInput = page.locator('[data-testid="widget-message-input"]');
    const sendButton = page.locator('[data-testid="widget-send-button"]');
    
    if (await messageInput.count() > 0 && await sendButton.count() > 0) {
      // Test message sending performance
      const testMessage = `Performance test message - ${Date.now()}`;
      
      const sendStartTime = Date.now();
      await messageInput.fill(testMessage);
      await sendButton.click();
      
      // Wait for message to appear in chat
      const messageElement = page.locator(`text="${testMessage}"`);
      await expect(messageElement).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.MESSAGE_SEND });
      
      const sendTime = Date.now() - sendStartTime;
      expect(sendTime).toBeLessThan(3000);
      console.log(`✅ Message send time: ${sendTime}ms (should be < 3000ms)`);
    } else {
      console.log('ℹ️ Message input/send button not found, skipping message test');
    }
  });

  test('should maintain connection status indicators', async ({ page }) => {
    console.log('🔌 Testing connection status indicators...');
    
    // Navigate to homepage and open widget
    await page.goto(`${TEST_CONFIG.BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    
    const widgetButton = page.locator('[data-testid="widget-button"]');
    await widgetButton.click();
    
    // Wait for widget to open
    const widgetPanel = page.locator('[data-testid="widget-panel"]');
    await expect(widgetPanel).toBeVisible();
    
    // Look for connection status indicators
    const connectionIndicators = page.locator('[class*="connected"], [class*="connection"], text="connected", text="🟢"');
    
    // Wait for connection to establish
    await page.waitForTimeout(5000);
    
    // Should have some form of connection status indicator
    const indicatorCount = await connectionIndicators.count();
    expect(indicatorCount).toBeGreaterThan(0);
    console.log(`✅ Connection indicators found: ${indicatorCount}`);
  });
});
